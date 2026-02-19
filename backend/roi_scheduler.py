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
        self.run_hour = 0
        self.run_minute = 0
        self.has_run_today = False

    def set_dependencies(self, db, email_service):
        self.db = db
        self.email_service = email_service

    def set_schedule(self, hour: int = 0, minute: int = 0):
        self.run_hour = hour
        self.run_minute = minute
        self._calculate_next_run()

    def _calculate_next_run(self):
        now = datetime.now(timezone.utc)
        next_run = now.replace(hour=self.run_hour, minute=self.run_minute, second=0, microsecond=0)
        if next_run <= now:
            next_run += timedelta(days=1)
        self.next_run = next_run
        return next_run

    async def distribute_profit_share(self, user_id: str, roi_amount: float, staking_entry_id: str):
        user = await self.db.users.find_one({"user_id": user_id}, {"_id": 0})
        if not user or not user.get("referred_by"):
            return
        
        current_ref = user.get("referred_by")
        direct_referrer = await self.db.users.find_one({"user_id": current_ref}, {"_id": 0})
        if not direct_referrer:
            return
        
        current_ref = direct_referrer.get("referred_by")
        
        for level_depth in range(2, 7):
            if not current_ref:
                break
            
            upline = await self.db.users.find_one({"user_id": current_ref}, {"_id": 0})
            if not upline:
                break
            
            upline_level = upline.get("level", 1)
            package = await self.db.investment_packages.find_one({"level": upline_level, "is_active": True}, {"_id": 0})
            if not package:
                current_ref = upline.get("referred_by")
                continue
            
            levels_enabled = package.get("levels_enabled", [1, 2, 3])
            if level_depth not in levels_enabled:
                current_ref = upline.get("referred_by")
                continue
            
            profit_share_key = f"profit_share_level_{level_depth}"
            profit_share_percentage = package.get(profit_share_key, 0.0)
            
            if profit_share_percentage == 0:
                old_key = f"commission_level_{level_depth}"
                profit_share_percentage = package.get(old_key, 0.0)
            
            if profit_share_percentage > 0:
                profit_share_amount = roi_amount * (profit_share_percentage / 100)
                
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
                
                await self.db.users.update_one(
                    {"user_id": upline["user_id"]},
                    {"$inc": {"commission_balance": profit_share_amount, "wallet_balance": profit_share_amount}}
                )
            
            current_ref = upline.get("referred_by")

    async def process_expired_stakes(self) -> dict:
        if self.db is None:
            logger.error("Database not configured")
            return {"error": "Database not configured"}
        
        logger.info("Processing expired stakes for capital return...")
        all_stakes = await self.db.staking.find({"capital_returned": {"$ne": True}}).to_list(10000)
        
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
                
                end_date = None
                if end_date_str:
                    try:
                        if isinstance(end_date_str, str):
                            end_date = datetime.fromisoformat(end_date_str.replace("Z", "+00:00"))
                        else:
                            end_date = end_date_str
                    except:
                        pass
                
                is_expired = (end_date and now >= end_date) or status == "completed"
                
                if is_expired:
                    existing_txn = await self.db.transactions.find_one({
                        "staking_id": stake_id,
                        "type": "capital_return"
                    })
                    
                    if existing_txn:
                        await self.db.staking.update_one(
                            {"staking_id": stake_id},
                            {"$set": {"status": "completed", "capital_returned": True}}
                        )
                        already_has_txn += 1
                        continue
                    
                    result = await self.db.staking.update_one(
                        {"staking_id": stake_id, "capital_returned": {"$ne": True}},
                        {"$set": {"status": "completed", "capital_returned": True, "completed_at": now.isoformat()}}
                    )
                    
                    if result.modified_count == 0:
                        already_has_txn += 1
                        continue
                    
                    await self.db.users.update_one(
                        {"user_id": user_id},
                        {"$inc": {"wallet_balance": amount, "staked_amount": -amount}}
                    )
                    
                    capital_return_doc = {
                        "transaction_id": str(uuid.uuid4()),
                        "user_id": user_id,
                        "staking_id": stake_id,
                        "type": "capital_return",
                        "amount": amount,
                        "description": "Staking package completed - Capital returned",
                        "created_at": now.isoformat()
                    }
                    await self.db.transactions.insert_one(capital_return_doc)
                    
                    processed += 1
                    total_capital_returned += amount
                    
            except Exception as e:
                errors.append(str(e))
        
        return {
            "message": "Expired stakes processed",
            "stakes_processed": processed,
            "already_had_transaction": already_has_txn,
            "total_capital_returned": total_capital_returned,
            "errors": errors
        }

    async def distribute_daily_roi(self) -> dict:
        if self.db is None:
            return {"error": "Database not configured"}
        
        logger.info("Starting automatic daily ROI distribution...")
        self.last_run = datetime.now(timezone.utc)
        today_date = datetime.now(timezone.utc).date()
        
        active_stakes = await self.db.staking.find({"status": "active"}).to_list(10000)
        
        roi_count = 0
        total_roi_distributed = 0.0
        completed_stakes = 0
        capital_returned_total = 0.0
        skipped_already_paid = 0
        
        for stake in active_stakes:
            try:
                user_id = stake["user_id"]
                amount = stake["amount"]
                daily_roi = stake.get("daily_roi", 0)
                stake_id = stake.get("staking_id") or stake.get("staking_entry_id")
                
                last_yield_str = stake.get("last_yield_date", "")
                if last_yield_str:
                    try:
                        if isinstance(last_yield_str, str):
                            last_yield = datetime.fromisoformat(last_yield_str.replace("Z", "+00:00"))
                        else:
                            last_yield = last_yield_str
                        if last_yield.date() == today_date:
                            skipped_already_paid += 1
                            continue
                    except:
                        pass
                
                if daily_roi <= 0:
                    continue
                
                roi_amount = amount * (daily_roi / 100)
                
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
                
                await self.db.users.update_one(
                    {"user_id": user_id},
                    {"$inc": {"roi_balance": roi_amount, "wallet_balance": roi_amount},
                     "$set": {"last_roi_date": datetime.now(timezone.utc).isoformat()}}
                )
                
                await self.db.staking.update_one(
                    {"staking_id": stake_id},
                    {"$inc": {"total_earned": roi_amount},
                     "$set": {"last_yield_date": datetime.now(timezone.utc).isoformat()}}
                )
                
                roi_count += 1
                total_roi_distributed += roi_amount
                
                await self.distribute_profit_share(user_id, roi_amount, stake_id)
                
            except Exception as e:
                logger.error(f"Error processing stake {stake_id}: {e}")
                continue
        
        self._calculate_next_run()
        
        return {
            "message": "Daily ROI distributed",
            "stakes_processed": roi_count,
            "total_roi_distributed": total_roi_distributed,
            "stakes_completed": completed_stakes,
            "capital_returned_total": capital_returned_total,
            "skipped_already_paid_today": skipped_already_paid
        }

    async def _scheduler_loop(self):
        logger.info(f"ROI Scheduler started. Next run: {self.next_run}")
        last_run_date = None
        
        while self.is_running:
            try:
                now = datetime.now(timezone.utc)
                today = now.date()
                
                if last_run_date != today:
                    self.has_run_today = False
                    last_run_date = today
                
                if self.next_run and now >= self.next_run and not self.has_run_today:
                    logger.info("Scheduled ROI distribution triggered")
                    self.has_run_today = True
                    await self.distribute_daily_roi()
                    await self.process_expired_stakes()
                    self._calculate_next_run()
                
                await asyncio.sleep(60)
                
            except Exception as e:
                logger.error(f"Error in ROI scheduler loop: {e}")
                await asyncio.sleep(60)

    async def _capital_release_loop(self):
        logger.info("Capital release loop started - checking every 5 minutes")
        while self.is_running:
            try:
                result = await self.process_expired_stakes()
                if result.get("stakes_processed", 0) > 0:
                    logger.info(f"Capital release: {result['stakes_processed']} stakes processed")
                await asyncio.sleep(300)
            except Exception as e:
                logger.error(f"Error in capital release loop: {e}")
                await asyncio.sleep(300)

    def start(self):
        if not self.is_running:
            self.is_running = True
            self._calculate_next_run()
            asyncio.create_task(self._scheduler_loop())
            asyncio.create_task(self._capital_release_loop())
            logger.info(f"ROI Scheduler started. Will run daily at {self.run_hour:02d}:{self.run_minute:02d} UTC")

    def stop(self):
        self.is_running = False
        logger.info("ROI Scheduler stopped")

    def get_status(self) -> dict:
        return {
            "is_running": self.is_running,
            "last_run": self.last_run.isoformat() if self.last_run else None,
            "next_run": self.next_run.isoformat() if self.next_run else None,
            "schedule": f"{self.run_hour:02d}:{self.run_minute:02d} UTC"
        }

roi_scheduler = ROIScheduler()