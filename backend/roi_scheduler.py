"""
ROI Scheduler Service for MINEX GLOBAL Platform
Automatically distributes daily ROI to all active stakers
Also distributes profit share bonuses to uplines
"""
import logging
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid

logger = logging.getLogger(__name__)

class ROIScheduler:
    def __init__(self):
        self.db = None
        self.email_service = None
        self.is_running = False
        self.last_run = None
        self.next_run = None
        self.run_hour = 0  # Default: Run at midnight UTC
        self.run_minute = 0
        
    def set_dependencies(self, db, email_service):
        """Set database and email service references"""
        self.db = db
        self.email_service = email_service
        
    def set_schedule(self, hour: int = 0, minute: int = 0):
        """Set the daily run time (UTC)"""
        self.run_hour = hour
        self.run_minute = minute
        self._calculate_next_run()
        
    def _calculate_next_run(self):
        """Calculate the next scheduled run time"""
        now = datetime.now(timezone.utc)
        next_run = now.replace(hour=self.run_hour, minute=self.run_minute, second=0, microsecond=0)
        
        # If time has passed today, schedule for tomorrow
        if next_run <= now:
            next_run += timedelta(days=1)
        
        self.next_run = next_run
        return next_run
    
    async def distribute_profit_share(self, user_id: str, roi_amount: float, staking_entry_id: str):
        """
        Distribute profit share bonuses to uplines (Level 2-6)
        This is based on ROI earnings, not deposits
        """
        user = await self.db.users.find_one({"user_id": user_id}, {"_id": 0})
        if not user or not user.get("referred_by"):
            return
        
        # Walk up the referral chain starting from Level 2 (skip direct referrer for profit share)
        current_ref = user.get("referred_by")
        
        # First, get the direct referrer
        direct_referrer = await self.db.users.find_one({"user_id": current_ref}, {"_id": 0})
        if not direct_referrer:
            return
        
        # Now start from Level 2 (the referrer of the direct referrer)
        current_ref = direct_referrer.get("referred_by")
        
        for level_depth in range(2, 7):  # Levels 2-6 for profit share
            if not current_ref:
                break
            
            upline = await self.db.users.find_one({"user_id": current_ref}, {"_id": 0})
            if not upline:
                break
            
            upline_level = upline.get("level", 1)
            
            # Get upline's package to determine profit share rates
            package = await self.db.investment_packages.find_one({"level": upline_level, "is_active": True}, {"_id": 0})
            if not package:
                current_ref = upline.get("referred_by")
                continue
            
            # Check if this level is enabled
            levels_enabled = package.get("levels_enabled", [1, 2, 3])
            if level_depth not in levels_enabled:
                current_ref = upline.get("referred_by")
                continue
            
            # Get profit share percentage for this level
            profit_share_key = f"profit_share_level_{level_depth}"
            profit_share_percentage = package.get(profit_share_key, 0.0)
            
            # Fallback to old commission keys
            if profit_share_percentage == 0:
                old_key = f"commission_level_{level_depth}"
                profit_share_percentage = package.get(old_key, 0.0)
            
            if profit_share_percentage > 0:
                profit_share_amount = roi_amount * (profit_share_percentage / 100)
                
                # Create profit share commission record
                commission_doc = {
                    "commission_id": str(uuid.uuid4()),
                    "user_id": upline["user_id"],
                    "from_user_id": user_id,
                    "from_user_name": user.get("full_name", "Unknown"),
                    "amount": profit_share_amount,
                    "commission_type": f"PROFIT_SHARE_L{level_depth}",
                    "level_depth": level_depth,
                    "percentage": profit_share_percentage,
                    "source_type": "roi_profit_share",
                    "source_id": staking_entry_id,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await self.db.commissions.insert_one(commission_doc)
                
                # Update upline balances
                await self.db.users.update_one(
                    {"user_id": upline["user_id"]},
                    {"$inc": {"commission_balance": profit_share_amount, "wallet_balance": profit_share_amount}}
                )
                
                # Send notification
                if self.email_service:
                    try:
                        updated_upline = await self.db.users.find_one({"user_id": upline["user_id"]}, {"_id": 0})
                        total_commission = updated_upline.get("commission_balance", profit_share_amount) if updated_upline else profit_share_amount
                        
                        await self.email_service.send_commission_notification(
                            upline["email"],
                            upline["full_name"],
                            profit_share_amount,
                            user.get("full_name", "Team Member"),
                            level_depth,
                            total_commission
                        )
                    except Exception as e:
                        logger.warning(f"Failed to send profit share notification: {e}")
            
            # Move to next level
            current_ref = upline.get("referred_by")
    
    async def process_expired_stakes(self) -> dict:
        """
        Process all expired stakes that haven't had capital returned yet.
        This handles any stakes that were missed or need to be retroactively processed.
        """
        if self.db is None:
            logger.error("Database not configured for ROI scheduler")
            return {"error": "Database not configured"}
        
        logger.info("Processing expired stakes for capital return...")
        
        # Find ALL stakes that are not yet marked as capital_returned
        all_stakes = await self.db.staking.find({
            "capital_returned": {"$ne": True}
        }).to_list(10000)
        
        processed = 0
        total_capital_returned = 0.0
        errors = []
        already_has_txn = 0
        
        now = datetime.now(timezone.utc)
        
        for stake in all_stakes:
            try:
                stake_id = stake.get("staking_id") or stake.get("staking_entry_id")
                user_id = stake.get("user_id")
                amount = stake.get("amount", 0)
                end_date_str = stake.get("end_date", "")
                status = stake.get("status", "")
                
                if not user_id or amount <= 0:
                    continue
                
                # Parse end date
                end_date = None
                if end_date_str:
                    try:
                        if isinstance(end_date_str, str):
                            end_date = datetime.fromisoformat(end_date_str.replace("Z", "+00:00"))
                        else:
                            end_date = end_date_str
                    except Exception as e:
                        logger.warning(f"Error parsing end date for stake {stake_id}: {e}")
                
                # Check if expired (either by end_date or status is already completed)
                is_expired = (end_date and now >= end_date) or status == "completed"
                
                if is_expired:
                    # CHECK IF CAPITAL RETURN TRANSACTION ALREADY EXISTS - PREVENT DOUBLE CAPITAL
                    existing_txn = await self.db.transactions.find_one({
                        "staking_id": stake_id,
                        "type": "capital_return"
                    })
                    
                    if existing_txn:
                        # Transaction exists, just mark stake as completed
                        logger.info(f"Capital txn exists for stake {stake_id}, marking completed only")
                        await self.db.staking.update_one(
                            {"staking_id": stake_id},
                            {"$set": {"status": "completed", "capital_returned": True}}
                        )
                        already_has_txn += 1
                        continue
                    
                    # DOUBLE CHECK: Also verify the stake itself is not already marked as capital_returned
                    fresh_stake = await self.db.staking.find_one({"staking_id": stake_id}, {"_id": 0})
                    if fresh_stake and fresh_stake.get("capital_returned") == True:
                        logger.info(f"Stake {stake_id} already marked as capital_returned, skipping")
                        already_has_txn += 1
                        continue
                    
                    logger.info(f"Processing expired stake {stake_id} for user {user_id}, amount ${amount}")
                    
                    # Get current user to verify
                    user = await self.db.users.find_one({"user_id": user_id}, {"_id": 0})
                    if not user:
                        logger.warning(f"User {user_id} not found for stake {stake_id}")
                        continue
                    
                    # SAFEGUARD: Check if staked_amount would go negative
                    current_staked = user.get("staked_amount", 0)
                    if current_staked < amount:
                        logger.warning(f"User {user_id} staked_amount ({current_staked}) < capital to return ({amount}). Adjusting to prevent negative.")
                        # Only reduce by what's available to prevent negative
                        actual_deduct = max(0, current_staked)
                    else:
                        actual_deduct = amount
                    
                    # Mark stake as completed with capital returned FIRST (atomic operation)
                    result = await self.db.staking.update_one(
                        {"staking_id": stake_id, "capital_returned": {"$ne": True}},  # Only if not already returned
                        {"$set": {
                            "status": "completed",
                            "capital_returned": True,
                            "completed_at": now.isoformat()
                        }}
                    )
                    
                    # If no document was modified, skip (already processed by another run)
                    if result.modified_count == 0:
                        logger.info(f"Stake {stake_id} was already processed by another run, skipping")
                        already_has_txn += 1
                        continue
                    
                    # Transfer capital to cash wallet and reduce staked_amount
                    await self.db.users.update_one(
                        {"user_id": user_id},
                        {"$inc": {
                            "wallet_balance": amount,
                            "staked_amount": -actual_deduct
                        }}
                    )
                    
                    # SAFEGUARD: Ensure staked_amount is not negative after update
                    await self.db.users.update_one(
                        {"user_id": user_id, "staked_amount": {"$lt": 0}},
                        {"$set": {"staked_amount": 0}}
                    )
                    
                    # Create transaction record
                    capital_return_doc = {
                        "transaction_id": str(uuid.uuid4()),
                        "user_id": user_id,
                        "staking_id": stake_id,
                        "type": "capital_return",
                        "amount": amount,
                        "description": "Staking package completed - Capital returned to cash wallet",
                        "created_at": now.isoformat()
                    }
                    await self.db.transactions.insert_one(capital_return_doc)
                    
                    # Send notification email
                    if self.email_service:
                        try:
                            await self.email_service.send_staking_completed_notification(
                                user["email"],
                                user["full_name"],
                                amount,
                                stake.get("total_earned", 0)
                            )
                        except Exception as e:
                            logger.warning(f"Failed to send staking completion email: {e}")
                    
                    processed += 1
                    total_capital_returned += amount
                    logger.info(f"Successfully processed stake {stake_id} - ${amount} returned to user {user.get('email', user_id)}")
                    
            except Exception as e:
                error_msg = f"Error processing stake {stake.get('staking_id', 'unknown')}: {str(e)}"
                logger.error(error_msg)
                errors.append(error_msg)
        
        result = {
            "message": "Expired stakes processed",
            "stakes_processed": processed,
            "already_had_transaction": already_has_txn,
            "total_capital_returned": total_capital_returned,
            "errors": errors
        }
        
        logger.info(f"Expired stakes processing complete: {result}")
        return result

    async def distribute_daily_roi(self) -> dict:
        """
        Distribute daily ROI to all active stakers
        Also distributes profit share bonuses to uplines
        Returns summary of the distribution
        """
        if self.db is None:
            logger.error("Database not configured for ROI scheduler")
            return {"error": "Database not configured"}
        
        logger.info("Starting automatic daily ROI distribution...")
        self.last_run = datetime.now(timezone.utc)
        today_date = datetime.now(timezone.utc).date()
        
        # Get all active stakes
        active_stakes = await self.db.staking.find({"status": "active"}).to_list(10000)
        
        roi_count = 0
        total_roi_distributed = 0.0
        total_profit_share_distributed = 0.0
        users_notified = 0
        completed_stakes = 0
        capital_returned_total = 0.0
        skipped_already_paid = 0
        
        for stake in active_stakes:
            try:
                user_id = stake["user_id"]
                amount = stake["amount"]
                daily_roi = stake.get("daily_roi", 0)
                stake_id = stake.get("staking_id") or stake.get("staking_entry_id")
                
                # CHECK IF ROI ALREADY DISTRIBUTED TODAY - PREVENT DOUBLE ROI
                last_yield_str = stake.get("last_yield_date", "")
                if last_yield_str:
                    try:
                        if isinstance(last_yield_str, str):
                            last_yield = datetime.fromisoformat(last_yield_str.replace("Z", "+00:00"))
                        else:
                            last_yield = last_yield_str
                        
                        if last_yield.date() == today_date:
                            skipped_already_paid += 1
                            logger.debug(f"Skipping stake {stake_id} - ROI already distributed today")
                            continue
                    except Exception as e:
                        logger.warning(f"Error parsing last_yield_date for stake {stake_id}: {e}")
                
                # Check if package duration completed
                end_date_str = stake.get("end_date", "")
                package_expired = False
                
                if end_date_str:
                    try:
                        if isinstance(end_date_str, str):
                            end_date = datetime.fromisoformat(end_date_str.replace("Z", "+00:00"))
                        else:
                            end_date = end_date_str
                            
                        if datetime.now(timezone.utc) >= end_date:
                            package_expired = True
                    except Exception as e:
                        logger.warning(f"Error parsing end date for stake {stake_id}: {e}")
                
                # If package expired, return capital to cash wallet
                if package_expired and not stake.get("capital_returned", False):
                    # Check if capital return transaction already exists (PREVENT DOUBLE CAPITAL)
                    existing_capital_txn = await self.db.transactions.find_one({
                        "staking_id": stake_id,
                        "type": "capital_return"
                    })
                    
                    if existing_capital_txn:
                        logger.warning(f"Capital return txn exists for stake {stake_id}, just marking as completed")
                        await self.db.staking.update_one(
                            {"staking_id": stake_id},
                            {"$set": {"status": "completed", "capital_returned": True}}
                        )
                        continue
                    
                    # Mark stake as completed
                    await self.db.staking.update_one(
                        {"staking_id": stake_id},
                        {"$set": {
                            "status": "completed",
                            "capital_returned": True,
                            "completed_at": datetime.now(timezone.utc).isoformat()
                        }}
                    )
                    
                    # Transfer capital to cash wallet (wallet_balance) and reduce staked_amount
                    await self.db.users.update_one(
                        {"user_id": user_id},
                        {"$inc": {
                            "wallet_balance": amount,  # Add to cash wallet
                            "staked_amount": -amount   # Reduce staked amount
                        }}
                    )
                    
                    # Create transaction record for capital return
                    capital_return_doc = {
                        "transaction_id": str(uuid.uuid4()),
                        "user_id": user_id,
                        "staking_id": stake_id,
                        "type": "capital_return",
                        "amount": amount,
                        "description": f"Staking package completed - Capital returned to cash wallet",
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                    await self.db.transactions.insert_one(capital_return_doc)
                    
                    completed_stakes += 1
                    capital_returned_total += amount
                    logger.info(f"Stake {stake_id} completed, capital ${amount} returned to user {user_id}")
                    
                    # Send notification email
                    if self.email_service:
                        user = await self.db.users.find_one({"user_id": user_id}, {"_id": 0})
                        if user:
                            try:
                                await self.email_service.send_staking_completed_notification(
                                    user["email"],
                                    user["full_name"],
                                    amount,
                                    stake.get("total_earned", 0)
                                )
                            except Exception as e:
                                logger.warning(f"Failed to send staking completion email: {e}")
                    
                    continue  # Don't distribute ROI for completed stakes
                
                # Skip if already completed
                if stake.get("status") == "completed" or stake.get("capital_returned", False):
                    continue
                
                if daily_roi <= 0:
                    continue
                
                # Calculate and distribute ROI
                roi_amount = amount * (daily_roi / 100)
                
                # Create ROI transaction
                roi_doc = {
                    "transaction_id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "staking_id": stake_id,
                    "amount": roi_amount,
                    "roi_percentage": daily_roi,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "auto_distributed": True
                }
                await self.db.roi_transactions.insert_one(roi_doc)
                
                # Update user balances
                await self.db.users.update_one(
                    {"user_id": user_id},
                    {"$inc": {
                        "roi_balance": roi_amount,
                        "wallet_balance": roi_amount
                    },
                    "$set": {
                        "last_roi_date": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                # Update staking entry
                await self.db.staking.update_one(
                    {"staking_id": stake_id},
                    {"$inc": {"total_earned": roi_amount},
                     "$set": {"last_yield_date": datetime.now(timezone.utc).isoformat()}}
                )
                
                roi_count += 1
                total_roi_distributed += roi_amount
                
                # Distribute profit share bonuses to uplines (Level 2-6)
                await self.distribute_profit_share(user_id, roi_amount, stake_id)
                
                # Send email notification to user
                if self.email_service:
                    user = await self.db.users.find_one({"user_id": user_id}, {"_id": 0})
                    if user:
                        # Get package info
                        package = await self.db.investment_packages.find_one({"package_id": stake.get("package_id")}, {"_id": 0})
                        package_name = package.get("name", "Investment Package") if package else "Investment Package"
                        
                        # Get total ROI
                        updated_user = await self.db.users.find_one({"user_id": user_id}, {"_id": 0})
                        total_roi = updated_user.get("roi_balance", 0) if updated_user else roi_amount
                        
                        try:
                            await self.email_service.send_roi_notification(
                                user["email"],
                                user["full_name"],
                                roi_amount,
                                total_roi,
                                package_name
                            )
                            users_notified += 1
                        except Exception as e:
                            logger.warning(f"Failed to send ROI notification to {user['email']}: {e}")
                
            except Exception as e:
                logger.error(f"Error processing stake {stake.get('staking_id', 'unknown')}: {e}")
                continue
        
        # Log the distribution run
        distribution_log = {
            "log_id": str(uuid.uuid4()),
            "type": "auto_roi_distribution",
            "run_time": datetime.now(timezone.utc).isoformat(),
            "stakes_processed": roi_count,
            "total_roi_distributed": total_roi_distributed,
            "users_notified": users_notified,
            "stakes_completed": completed_stakes,
            "capital_returned_total": capital_returned_total,
            "skipped_already_paid_today": skipped_already_paid,
            "status": "success"
        }
        await self.db.system_logs.insert_one(distribution_log)
        
        # Calculate next run
        self._calculate_next_run()
        
        result = {
            "message": f"Daily ROI distributed successfully",
            "stakes_processed": roi_count,
            "total_roi_distributed": total_roi_distributed,
            "users_notified": users_notified,
            "stakes_completed": completed_stakes,
            "capital_returned_total": capital_returned_total,
            "skipped_already_paid_today": skipped_already_paid,
            "run_time": self.last_run.isoformat(),
            "next_run": self.next_run.isoformat() if self.next_run else None
        }
        
        logger.info(f"ROI Distribution complete: {result}")
        return result
    
    async def _scheduler_loop(self):
        """Background loop that runs ROI distribution at scheduled time"""
        logger.info(f"ROI Scheduler started. Next run: {self.next_run}")
        
        while self.is_running:
            try:
                now = datetime.now(timezone.utc)
                
                if self.next_run and now >= self.next_run:
                    logger.info("Scheduled ROI distribution triggered")
                    
                    # Step 1: Distribute daily ROI
                    await self.distribute_daily_roi()
                    
                    # Step 2: Process expired stakes and release capital
                    logger.info("Processing expired stakes for capital release...")
                    expired_result = await self.process_expired_stakes()
                    logger.info(f"Expired stakes result: {expired_result}")
                
                # Sleep for 1 minute before checking again
                await asyncio.sleep(60)
                
            except Exception as e:
                logger.error(f"Error in ROI scheduler loop: {e}")
                await asyncio.sleep(60)
    
    async def _capital_release_loop(self):
        """
        Background loop that checks for expired stakes every 5 minutes.
        This ensures capital is released promptly when packages complete.
        """
        logger.info("Capital release loop started - checking every 5 minutes")
        
        while self.is_running:
            try:
                # Process expired stakes
                result = await self.process_expired_stakes()
                
                if result.get("stakes_processed", 0) > 0:
                    logger.info(f"Capital release: {result['stakes_processed']} stakes processed, ${result['total_capital_returned']} returned")
                
                # Check every 5 minutes
                await asyncio.sleep(300)  # 5 minutes
                
            except Exception as e:
                logger.error(f"Error in capital release loop: {e}")
                await asyncio.sleep(300)
    
    def start(self):
        """Start the scheduler"""
        if not self.is_running:
            self.is_running = True
            self._calculate_next_run()
            
            # Start ROI distribution loop (runs at scheduled time)
            asyncio.create_task(self._scheduler_loop())
            
            # Start capital release loop (checks every 5 minutes)
            asyncio.create_task(self._capital_release_loop())
            
            logger.info(f"ROI Scheduler started. Will run daily at {self.run_hour:02d}:{self.run_minute:02d} UTC")
            logger.info("Capital release loop started - checking every 5 minutes for expired packages")
    
    def stop(self):
        """Stop the scheduler"""
        self.is_running = False
        logger.info("ROI Scheduler stopped")
    
    def get_status(self) -> dict:
        """Get scheduler status"""
        return {
            "is_running": self.is_running,
            "last_run": self.last_run.isoformat() if self.last_run else None,
            "next_run": self.next_run.isoformat() if self.next_run else None,
            "schedule": f"{self.run_hour:02d}:{self.run_minute:02d} UTC"
        }


# Global instance
roi_scheduler = ROIScheduler()
