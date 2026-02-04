from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
import string
from pathlib import Path
from typing import Optional, List
import uuid
from datetime import datetime, timezone, timedelta
import base64

from models import (
    User, UserCreate, UserLogin, UserResponse, UserRole,
    MembershipPackage, StakingPackage, Deposit, DepositCreate, DepositStatus,
    Withdrawal, WithdrawalCreate, WithdrawalStatus, Staking, StakingCreate, StakingCreateLegacy, StakingStatus,
    Commission, ROITransaction, AdminSettings, DashboardStats, AdminDashboardStats,
    PaymentMethod, InvestmentPackage, EmailVerificationRequest, EmailVerificationVerify,
    Transaction, TransactionType, PasswordChangeRequest, ForgotPasswordRequest, ResetPasswordRequest, VerifyResetCodeRequest
)
from auth import verify_password, get_password_hash, create_access_token, decode_access_token
from email_service import email_service
from crypto_service import crypto_service
from roi_scheduler import roi_scheduler

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Set database reference for email service and ROI scheduler
email_service.set_db(db)
roi_scheduler.set_dependencies(db, email_service)

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Helper Functions
async def get_current_user(authorization: Optional[str] = Header(None)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"user_id": payload.get("user_id")}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user)

async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

def generate_referral_code() -> str:
    return str(uuid.uuid4())[:8].upper()

def generate_verification_code() -> str:
    return ''.join(random.choices(string.digits, k=6))

async def get_user_referral_tree(user_id: str, depth: int = 6) -> dict:
    """Get user's referral tree up to specified depth"""
    tree = {f"level_{i}": [] for i in range(1, depth + 1)}
    
    # Level 1: Direct referrals
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        return tree
    
    tree["level_1"] = user.get("direct_referrals", [])
    
    # Levels 2-6: Indirect referrals
    current_level_users = tree["level_1"]
    for level in range(2, depth + 1):
        next_level_users = []
        for ref_user_id in current_level_users:
            ref_user = await db.users.find_one({"user_id": ref_user_id}, {"_id": 0})
            if ref_user:
                next_level_users.extend(ref_user.get("direct_referrals", []))
        tree[f"level_{level}"] = next_level_users
        current_level_users = next_level_users
    
    return tree

async def calculate_user_level(user_id: str, total_investment: float) -> int:
    """Calculate user's level based on investment and referrals"""
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        return 1
    
    referral_tree = await get_user_referral_tree(user_id)
    
    # Get all active investment packages sorted by level (highest first)
    packages = await db.investment_packages.find({"is_active": True}, {"_id": 0}).sort("level", -1).to_list(10)
    
    if not packages:
        # Fallback to old membership packages
        packages = await db.membership_packages.find({"is_active": True}, {"_id": 0}).sort("level", -1).to_list(10)
        for pkg in packages:
            direct_count = len(referral_tree.get("level_1", []))
            indirect_count = sum(len(referral_tree.get(f"level_{i}", [])) for i in range(2, 7))
            
            if (total_investment >= pkg.get("min_investment", 0) and 
                direct_count >= pkg.get("direct_required", 0) and 
                indirect_count >= pkg.get("indirect_required", 0)):
                return pkg["level"]
        return 1
    
    # Check each package from highest to lowest
    for pkg in packages:
        # Check investment requirement
        if total_investment < pkg.get("min_investment", 0):
            continue
        
        # Check referral requirements for each level
        meets_requirements = True
        if pkg.get("direct_required", 0) > 0:
            if len(referral_tree.get("level_1", [])) < pkg.get("direct_required", 0):
                meets_requirements = False
        
        for level_num in range(2, 7):
            required = pkg.get(f"level_{level_num}_required", 0)
            if required > 0:
                if len(referral_tree.get(f"level_{level_num}", [])) < required:
                    meets_requirements = False
                    break
        
        if meets_requirements:
            return pkg["level"]
    
    return 1

async def distribute_commissions(staking_entry_id: str, user_id: str, amount: float, background_tasks: BackgroundTasks = None):
    """
    Distribute DIRECT commission to Level 1 referrer only (on deposit/investment)
    Commission rate is based on the UPLINE's package level
    Level 2-6 profit share is handled by ROI scheduler during daily ROI distribution
    """
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user or not user.get("referred_by"):
        logger.info(f"No referrer found for user {user_id}")
        return
    
    # Get the referral code of the direct referrer
    referrer_code = user.get("referred_by")
    
    # Find the upline by their referral_code OR user_id (handle both formats)
    upline = await db.users.find_one({"referral_code": referrer_code}, {"_id": 0})
    if not upline:
        upline = await db.users.find_one({"user_id": referrer_code}, {"_id": 0})
    
    if not upline:
        logger.warning(f"Upline not found for referral code: {referrer_code}")
        return
    
    logger.info(f"Found upline: {upline.get('email')} for user {user.get('email')}")
    
    # Get the UPLINE's active staking to determine their package/level
    upline_stake = await db.staking.find_one(
        {"user_id": upline["user_id"], "status": StakingStatus.ACTIVE},
        {"_id": 0}
    )
    
    # Determine upline's package - from staking or by level
    upline_package = None
    if upline_stake:
        upline_package = await db.investment_packages.find_one(
            {"package_id": upline_stake.get("package_id")},
            {"_id": 0}
        )
    
    if not upline_package:
        # Fallback to upline's stored level
        upline_level = upline.get("level", 1)
        upline_package = await db.investment_packages.find_one(
            {"level": upline_level, "is_active": True},
            {"_id": 0}
        )
    
    if not upline_package:
        logger.warning(f"No package found for upline {upline.get('email')}")
        return
    
    logger.info(f"Upline package: {upline_package.get('name')} (Level {upline_package.get('level')})")
    
    # Check if Level 1 commission is enabled for upline's package
    levels_enabled = upline_package.get("levels_enabled", [1, 2, 3])
    if 1 not in levels_enabled and len(levels_enabled) > 0:
        logger.info(f"Level 1 not enabled for package {upline_package.get('name')}")
        return
    
    # Get direct commission percentage from the UPLINE's package
    commission_percentage = upline_package.get("commission_direct", 0.0)
    if commission_percentage == 0:
        commission_percentage = upline_package.get("commission_lv_a", 0.0)
    
    logger.info(f"Commission rate from upline's package: {commission_percentage}%")
    
    if commission_percentage > 0:
        commission_amount = amount * (commission_percentage / 100)
        
        commission_doc = {
            "commission_id": str(uuid.uuid4()),
            "user_id": upline["user_id"],
            "from_user_id": user_id,
            "from_user_name": user.get("full_name", "Unknown"),
            "amount": commission_amount,
            "commission_type": "DIRECT_DEPOSIT",
            "level_depth": 1,
            "percentage": commission_percentage,
            "source_type": "deposit_commission",
            "source_id": staking_entry_id,
            "package_name": upline_package.get("name", f"Level {upline_package.get('level')}"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.commissions.insert_one(commission_doc)
        
        # Update upline balances
        await db.users.update_one(
            {"user_id": upline["user_id"]},
            {"$inc": {"commission_balance": commission_amount, "wallet_balance": commission_amount}}
        )
        
        logger.info(f"Commission distributed: ${commission_amount:.2f} to {upline.get('email')}")
        
        # Send commission notification email
        try:
            updated_upline = await db.users.find_one({"user_id": upline["user_id"]}, {"_id": 0})
            total_commission = updated_upline.get("commission_balance", commission_amount) if updated_upline else commission_amount
            
            await email_service.send_commission_notification(
                upline["email"],
                upline["full_name"],
                commission_amount,
                user.get("full_name", "Team Member"),
                1,
                total_commission
            )
        except Exception as e:
            logger.warning(f"Failed to send commission notification: {e}")

# ============== EMAIL VERIFICATION ENDPOINTS ==============

@api_router.post("/auth/send-verification")
async def send_verification_email(request: EmailVerificationRequest, background_tasks: BackgroundTasks):
    """Send email verification code"""
    # Check if email already registered and verified
    existing_user = await db.users.find_one({"email": request.email, "is_email_verified": True}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate verification code
    code = generate_verification_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # Store verification record
    verification_doc = {
        "verification_id": str(uuid.uuid4()),
        "email": request.email,
        "code": code,
        "expires_at": expires_at.isoformat(),
        "is_used": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Remove old verifications for this email
    await db.email_verifications.delete_many({"email": request.email})
    await db.email_verifications.insert_one(verification_doc)
    
    # Send email in background
    background_tasks.add_task(email_service.send_verification_code, request.email, code)
    
    return {"message": "Verification code sent to your email", "email": request.email}

@api_router.post("/auth/verify-email")
async def verify_email(request: EmailVerificationVerify):
    """Verify email with code"""
    verification = await db.email_verifications.find_one({
        "email": request.email,
        "code": request.code,
        "is_used": False
    }, {"_id": 0})
    
    if not verification:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Check expiry
    expires_at = datetime.fromisoformat(verification["expires_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Verification code expired")
    
    # Mark as used
    await db.email_verifications.update_one(
        {"verification_id": verification["verification_id"]},
        {"$set": {"is_used": True}}
    )
    
    return {"message": "Email verified successfully", "verified": True}

# ============== PASSWORD RESET ENDPOINTS ==============

@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    """Send password reset code to email"""
    # Check if user exists
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    if not user:
        # Don't reveal if email exists or not for security
        return {"message": "If the email exists, a reset code has been sent", "email": request.email}
    
    # Generate reset code
    code = generate_verification_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    # Store reset record
    reset_doc = {
        "reset_id": str(uuid.uuid4()),
        "email": request.email,
        "code": code,
        "expires_at": expires_at.isoformat(),
        "is_used": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Remove old reset requests for this email
    await db.password_resets.delete_many({"email": request.email})
    await db.password_resets.insert_one(reset_doc)
    
    # Send email in background
    reset_link = f"/reset-password?email={request.email}"
    background_tasks.add_task(
        email_service.send_password_reset,
        request.email,
        user.get("full_name", "User"),
        code,
        reset_link
    )
    
    return {"message": "If the email exists, a reset code has been sent", "email": request.email}

@api_router.post("/auth/verify-reset-code")
async def verify_reset_code(request: VerifyResetCodeRequest):
    """Verify password reset code"""
    reset = await db.password_resets.find_one({
        "email": request.email,
        "code": request.code,
        "is_used": False
    }, {"_id": 0})
    
    if not reset:
        raise HTTPException(status_code=400, detail="Invalid reset code")
    
    # Check expiry
    expires_at = datetime.fromisoformat(reset["expires_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Reset code expired")
    
    return {"message": "Code verified successfully", "valid": True}

@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest, background_tasks: BackgroundTasks):
    """Reset password with verification code"""
    # Validate passwords match
    if request.new_password != request.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    # Validate password strength
    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Verify reset code
    reset = await db.password_resets.find_one({
        "email": request.email,
        "code": request.code,
        "is_used": False
    }, {"_id": 0})
    
    if not reset:
        raise HTTPException(status_code=400, detail="Invalid reset code")
    
    # Check expiry
    expires_at = datetime.fromisoformat(reset["expires_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Reset code expired")
    
    # Get user
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update password (use password_hash field to match login endpoint)
    hashed_password = get_password_hash(request.new_password)
    await db.users.update_one(
        {"email": request.email},
        {"$set": {"password_hash": hashed_password, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Mark reset code as used
    await db.password_resets.update_one(
        {"reset_id": reset["reset_id"]},
        {"$set": {"is_used": True}}
    )
    
    # Send confirmation email
    background_tasks.add_task(
        email_service.send_password_change_confirmation,
        request.email,
        user.get("full_name", "User")
    )
    
    return {"message": "Password reset successfully. You can now login with your new password."}

# ============== AUTH ENDPOINTS ==============

@api_router.post("/auth/register")
async def register(user_data: UserCreate, background_tasks: BackgroundTasks):
    # Check if email already registered
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Verify referral code (REQUIRED)
    referrer = await db.users.find_one({"referral_code": user_data.referral_code}, {"_id": 0})
    if not referrer:
        raise HTTPException(status_code=400, detail="Invalid referral code. Registration requires a valid referral link.")
    
    referred_by_id = referrer["user_id"]
    
    # Check email verification
    verification = await db.email_verifications.find_one({
        "email": user_data.email,
        "is_used": True
    }, {"_id": 0})
    
    is_verified = verification is not None
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "full_name": user_data.full_name,
        "password_hash": get_password_hash(user_data.password),
        "role": UserRole.USER,
        "level": 1,
        "total_investment": 0.0,
        "wallet_balance": 0.0,
        "roi_balance": 0.0,
        "commission_balance": 0.0,
        "referral_code": generate_referral_code(),
        "referred_by": referred_by_id,
        "direct_referrals": [],
        "indirect_referrals": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_roi_date": None,
        "is_active": True,
        "is_email_verified": is_verified
    }
    
    await db.users.insert_one(user_doc)
    user_doc.pop("_id", None)
    
    # Update referrer's direct referrals
    await db.users.update_one(
        {"user_id": referred_by_id},
        {"$push": {"direct_referrals": user_id}}
    )
    
    # Update referrer's referrer's indirect referrals
    if referrer.get("referred_by"):
        await db.users.update_one(
            {"user_id": referrer["referred_by"]},
            {"$push": {"indirect_referrals": user_id}}
        )
    
    token = create_access_token({"user_id": user_id, "email": user_data.email})
    user_doc.pop("password_hash")
    user_doc["role"] = user_doc["role"].value
    
    return {"token": token, "user": user_doc}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if email is verified
    if not user.get("is_email_verified", False):
        raise HTTPException(status_code=403, detail="Please verify your email before logging in")
    
    token = create_access_token({"user_id": user["user_id"], "email": user["email"]})
    user.pop("password_hash")
    
    if "role" in user and hasattr(user["role"], 'value'):
        user["role"] = user["role"].value
    
    return {"token": token, "user": user}

# ============== USER ENDPOINTS ==============

@api_router.get("/user/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.put("/user/password")
async def change_password(request: PasswordChangeRequest, current_user: User = Depends(get_current_user), background_tasks: BackgroundTasks = None):
    # Verify current password
    user = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not verify_password(request.current_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Validate new password
    if request.new_password != request.confirm_password:
        raise HTTPException(status_code=400, detail="New passwords do not match")
    
    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Update password
    new_hash = get_password_hash(request.new_password)
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {"password_hash": new_hash}}
    )
    
    # Send confirmation email
    if background_tasks:
        background_tasks.add_task(
            email_service.send_password_change_confirmation,
            current_user.email,
            current_user.full_name
        )
    
    return {"message": "Password changed successfully"}

@api_router.get("/user/dashboard")
async def get_dashboard(current_user: User = Depends(get_current_user)):
    # Get user's active staking to determine current package
    active_stake = await db.staking.find_one(
        {"user_id": current_user.user_id, "status": StakingStatus.ACTIVE},
        {"_id": 0}
    )
    
    # Get the package from active staking
    current_package = None
    actual_level = current_user.level
    daily_roi = 0.0
    
    if active_stake:
        current_package = await db.investment_packages.find_one(
            {"package_id": active_stake.get("package_id")}, {"_id": 0}
        )
        if current_package:
            actual_level = current_package.get("level", 1)
            daily_roi = current_package.get("daily_roi", active_stake.get("daily_roi", 0.0))
            
            # Update user level if it doesn't match the package level
            if current_user.level != actual_level:
                await db.users.update_one(
                    {"user_id": current_user.user_id},
                    {"$set": {"level": actual_level}}
                )
        else:
            daily_roi = active_stake.get("daily_roi", 0.0)
    else:
        # Fallback to user's stored level
        current_package = await db.investment_packages.find_one({"level": current_user.level, "is_active": True}, {"_id": 0})
        if current_package:
            daily_roi = current_package.get("daily_roi", 0.0)
    
    # Calculate total commissions
    total_commissions = 0.0
    async for comm in db.commissions.find({"user_id": current_user.user_id}, {"_id": 0}):
        total_commissions += comm.get("amount", 0.0)
    
    # Get pending withdrawals count
    pending_withdrawals = await db.withdrawals.count_documents({
        "user_id": current_user.user_id, 
        "status": WithdrawalStatus.PENDING
    })
    
    # Calculate active staking amount
    active_staking = 0.0
    async for stake in db.staking.find({"user_id": current_user.user_id, "status": StakingStatus.ACTIVE}, {"_id": 0}):
        active_staking += stake.get("amount", 0.0)
    
    # Total balance = ROI + Commission (withdrawable)
    total_balance = current_user.roi_balance + current_user.commission_balance
    
    # Get referral tree for level-wise counts
    referral_tree = await get_user_referral_tree(current_user.user_id)
    team_counts = {
        "level_1": len(referral_tree.get("level_1", [])),
        "level_2": len(referral_tree.get("level_2", [])),
        "level_3": len(referral_tree.get("level_3", [])),
        "level_4": len(referral_tree.get("level_4", [])),
        "level_5": len(referral_tree.get("level_5", [])),
        "level_6": len(referral_tree.get("level_6", []))
    }
    
    # Get next level package requirements (use actual_level from staking)
    next_level = actual_level + 1
    next_package = await db.investment_packages.find_one({"level": next_level, "is_active": True}, {"_id": 0})
    
    next_level_requirements = None
    promotion_progress = None
    
    if next_package:
        next_level_requirements = {
            "level": next_level,
            "name": next_package.get("name", f"Level {next_level}"),
            "min_investment": next_package.get("min_investment", 0),
            "direct_required": next_package.get("direct_required", 0),
            "level_2_required": next_package.get("level_2_required", 0),
            "level_3_required": next_package.get("level_3_required", 0),
            "level_4_required": next_package.get("level_4_required", 0),
            "level_5_required": next_package.get("level_5_required", 0),
            "level_6_required": next_package.get("level_6_required", 0)
        }
        
        # Calculate progress towards next level
        promotion_progress = {
            "investment_met": current_user.total_investment >= next_package.get("min_investment", 0),
            "investment_current": current_user.total_investment,
            "investment_required": next_package.get("min_investment", 0),
            "direct_met": team_counts["level_1"] >= next_package.get("direct_required", 0),
            "direct_current": team_counts["level_1"],
            "direct_required": next_package.get("direct_required", 0),
            "level_2_met": team_counts["level_2"] >= next_package.get("level_2_required", 0),
            "level_2_current": team_counts["level_2"],
            "level_2_required": next_package.get("level_2_required", 0),
            "level_3_met": team_counts["level_3"] >= next_package.get("level_3_required", 0),
            "level_3_current": team_counts["level_3"],
            "level_3_required": next_package.get("level_3_required", 0),
            "level_4_met": team_counts["level_4"] >= next_package.get("level_4_required", 0),
            "level_4_current": team_counts["level_4"],
            "level_4_required": next_package.get("level_4_required", 0),
            "level_5_met": team_counts["level_5"] >= next_package.get("level_5_required", 0),
            "level_5_current": team_counts["level_5"],
            "level_5_required": next_package.get("level_5_required", 0),
            "level_6_met": team_counts["level_6"] >= next_package.get("level_6_required", 0),
            "level_6_current": team_counts["level_6"],
            "level_6_required": next_package.get("level_6_required", 0),
        }
        
        # Check if all requirements met
        all_met = (
            promotion_progress["investment_met"] and
            promotion_progress["direct_met"] and
            promotion_progress["level_2_met"] and
            promotion_progress["level_3_met"] and
            promotion_progress["level_4_met"] and
            promotion_progress["level_5_met"] and
            promotion_progress["level_6_met"]
        )
        promotion_progress["all_requirements_met"] = all_met
    
    return DashboardStats(
        total_balance=total_balance,
        roi_balance=current_user.roi_balance,
        commission_balance=current_user.commission_balance,
        total_investment=current_user.total_investment,
        active_staking=active_staking,
        current_level=actual_level,  # Use actual level from active staking
        daily_roi_percentage=daily_roi,
        direct_referrals=len(current_user.direct_referrals),
        indirect_referrals=len(current_user.indirect_referrals),
        total_commissions=total_commissions,
        pending_withdrawals=pending_withdrawals,
        next_level_requirements=next_level_requirements,
        team_counts_by_level=team_counts,
        promotion_progress=promotion_progress
    )

@api_router.get("/user/team")
async def get_team(current_user: User = Depends(get_current_user)):
    referral_tree = await get_user_referral_tree(current_user.user_id)
    
    result = {}
    for level_key, user_ids in referral_tree.items():
        users = []
        for user_id in user_ids:
            user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
            if user:
                users.append(user)
        result[level_key] = users
    
    # Also provide direct and indirect for backward compatibility
    result["direct"] = result.get("level_1", [])
    result["indirect"] = []
    for i in range(2, 7):
        result["indirect"].extend(result.get(f"level_{i}", []))
    
    return result

@api_router.get("/user/transactions")
async def get_all_transactions(current_user: User = Depends(get_current_user)):
    """Get all transactions for the user"""
    transactions = []
    
    # Get deposits
    deposits = await db.deposits.find({"user_id": current_user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for d in deposits:
        transactions.append({
            "transaction_id": d["deposit_id"],
            "type": "deposit",
            "amount": d["amount"],
            "status": d["status"],
            "description": f"Deposit via {d.get('payment_method', 'USDT')}",
            "created_at": d["created_at"],
            "metadata": {"payment_method": d.get("payment_method")}
        })
    
    # Get withdrawals
    withdrawals = await db.withdrawals.find({"user_id": current_user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for w in withdrawals:
        transactions.append({
            "transaction_id": w["withdrawal_id"],
            "type": "withdrawal",
            "amount": -w["amount"],
            "status": w["status"],
            "description": f"Withdrawal to {w.get('wallet_address', '')[:10]}...",
            "created_at": w["created_at"],
            "metadata": {"wallet_address": w.get("wallet_address")}
        })
    
    # Get ROI transactions
    roi_txs = await db.roi_transactions.find({"user_id": current_user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for r in roi_txs:
        transactions.append({
            "transaction_id": r["transaction_id"],
            "type": "roi",
            "amount": r["amount"],
            "status": "completed",
            "description": f"Daily ROI ({r.get('roi_percentage', 0)}%)",
            "created_at": r["created_at"],
            "metadata": {"roi_percentage": r.get("roi_percentage")}
        })
    
    # Get commissions
    commissions = await db.commissions.find({"user_id": current_user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for c in commissions:
        level_name = c.get("commission_type", "LEVEL_1").replace("_", " ")
        transactions.append({
            "transaction_id": c["commission_id"],
            "type": "commission",
            "amount": c["amount"],
            "status": "completed",
            "description": f"{level_name} Commission ({c.get('percentage', 0)}%) from {c.get('from_user_name', 'team member')}",
            "created_at": c["created_at"],
            "metadata": {
                "from_user": c.get("from_user_name"),
                "level": c.get("level_depth"),
                "percentage": c.get("percentage")
            }
        })
    
    # Sort all by date
    transactions.sort(key=lambda x: x["created_at"], reverse=True)
    
    return transactions

# ============== DEPOSIT ENDPOINTS ==============

@api_router.post("/deposits")
async def create_deposit(deposit_data: DepositCreate, current_user: User = Depends(get_current_user)):
    deposit_doc = {
        "deposit_id": str(uuid.uuid4()),
        "user_id": current_user.user_id,
        "amount": deposit_data.amount,
        "payment_method": deposit_data.payment_method,
        "transaction_hash": deposit_data.transaction_hash,
        "screenshot_url": deposit_data.screenshot_url,
        "status": DepositStatus.PENDING,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "approved_at": None,
        "approved_by": None,
        "rejection_reason": None
    }
    
    await db.deposits.insert_one(deposit_doc)
    deposit_doc.pop("_id", None)
    deposit_doc["status"] = deposit_doc["status"].value
    deposit_doc["payment_method"] = deposit_doc["payment_method"].value
    
    return deposit_doc

@api_router.get("/deposits")
async def get_deposits(current_user: User = Depends(get_current_user)):
    deposits = await db.deposits.find({"user_id": current_user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return deposits

@api_router.post("/deposits/{deposit_id}/upload-screenshot")
async def upload_screenshot(deposit_id: str, file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    deposit = await db.deposits.find_one({"deposit_id": deposit_id, "user_id": current_user.user_id}, {"_id": 0})
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")
    
    contents = await file.read()
    screenshot_base64 = base64.b64encode(contents).decode('utf-8')
    screenshot_url = f"data:image/png;base64,{screenshot_base64}"
    
    await db.deposits.update_one(
        {"deposit_id": deposit_id},
        {"$set": {"screenshot_url": screenshot_url}}
    )
    
    return {"message": "Screenshot uploaded", "screenshot_url": screenshot_url}

# ============== WITHDRAWAL ENDPOINTS ==============

@api_router.post("/withdrawals")
async def create_withdrawal(withdrawal_data: WithdrawalCreate, current_user: User = Depends(get_current_user)):
    # Check withdrawable balance (ROI + Commission)
    withdrawable_balance = current_user.roi_balance + current_user.commission_balance
    
    if withdrawal_data.amount > withdrawable_balance:
        raise HTTPException(status_code=400, detail="Insufficient withdrawable balance")
    
    # Check if withdrawal is allowed today (based on admin settings)
    settings = await db.admin_settings.find_one({"settings_id": "default"}, {"_id": 0})
    if settings:
        withdrawal_dates = settings.get("withdrawal_dates", [1, 15])
        today = datetime.now(timezone.utc).day
        if today not in withdrawal_dates and withdrawal_dates:
            raise HTTPException(
                status_code=400, 
                detail=f"Withdrawals are only allowed on days: {', '.join(map(str, withdrawal_dates))}"
            )
    
    withdrawal_doc = {
        "withdrawal_id": str(uuid.uuid4()),
        "user_id": current_user.user_id,
        "amount": withdrawal_data.amount,
        "wallet_address": withdrawal_data.wallet_address,
        "status": WithdrawalStatus.PENDING,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "approved_at": None,
        "approved_by": None,
        "transaction_hash": None,
        "rejection_reason": None
    }
    
    await db.withdrawals.insert_one(withdrawal_doc)
    withdrawal_doc.pop("_id", None)
    withdrawal_doc["status"] = withdrawal_doc["status"].value
    
    # Deduct from balances (prefer commission first, then ROI)
    remaining = withdrawal_data.amount
    commission_deduct = min(remaining, current_user.commission_balance)
    remaining -= commission_deduct
    roi_deduct = min(remaining, current_user.roi_balance)
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$inc": {
            "commission_balance": -commission_deduct,
            "roi_balance": -roi_deduct,
            "wallet_balance": -withdrawal_data.amount
        }}
    )
    
    return withdrawal_doc

@api_router.get("/withdrawals")
async def get_withdrawals(current_user: User = Depends(get_current_user)):
    withdrawals = await db.withdrawals.find({"user_id": current_user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return withdrawals

# ============== STAKING/INVESTMENT ENDPOINTS ==============

@api_router.get("/staking/packages")
async def get_staking_packages():
    """Get all investment packages"""
    # Try new investment packages first
    packages = await db.investment_packages.find({"is_active": True}, {"_id": 0}).sort("level", 1).to_list(10)
    if packages:
        return packages
    
    # Fallback to old staking packages
    packages = await db.staking_packages.find({"is_active": True}, {"_id": 0}).sort("tier", 1).to_list(10)
    return packages

@api_router.get("/investment/packages")
async def get_investment_packages():
    """Get all investment packages (unified endpoint)"""
    packages = await db.investment_packages.find({"is_active": True}, {"_id": 0}).sort("level", 1).to_list(10)
    if not packages:
        # Convert membership packages to investment packages format
        membership_packages = await db.membership_packages.find({"is_active": True}, {"_id": 0}).sort("level", 1).to_list(10)
        for pkg in membership_packages:
            pkg["name"] = f"Level {pkg['level']} Package"
            pkg["max_investment"] = pkg.get("min_investment", 0) * 10
            pkg["commission_direct"] = pkg.get("commission_lv_a", 0)
            pkg["commission_level_2"] = pkg.get("commission_lv_b", 0)
            pkg["commission_level_3"] = pkg.get("commission_lv_c", 0)
        packages = membership_packages
    return packages

@api_router.post("/staking")
async def create_staking(staking_data: StakingCreate, current_user: User = Depends(get_current_user), background_tasks: BackgroundTasks = None):
    """Activate staking/investment"""
    # Check if user has deposit
    approved_deposits = await db.deposits.count_documents({
        "user_id": current_user.user_id,
        "status": DepositStatus.APPROVED
    })
    
    if approved_deposits == 0:
        raise HTTPException(status_code=400, detail="Please make a deposit first before staking")
    
    # Check balance
    if current_user.wallet_balance < staking_data.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance. Please deposit first.")
    
    # Get package
    package = await db.investment_packages.find_one({"package_id": staking_data.package_id, "is_active": True}, {"_id": 0})
    if not package:
        package = await db.membership_packages.find_one({"package_id": staking_data.package_id, "is_active": True}, {"_id": 0})
    
    if not package:
        raise HTTPException(status_code=404, detail="Investment package not found")
    
    # Validate amount
    min_amount = package.get("min_investment", package.get("min_amount", 0))
    max_amount = package.get("max_investment", package.get("max_amount", float('inf')))
    
    if staking_data.amount < min_amount:
        raise HTTPException(status_code=400, detail=f"Minimum investment is ${min_amount}")
    
    if staking_data.amount > max_amount:
        raise HTTPException(status_code=400, detail=f"Maximum investment is ${max_amount}")
    
    duration_days = package.get("duration_days", package.get("lock_period_days", 365))
    daily_roi = package.get("daily_roi", package.get("daily_yield", 0))
    end_date = datetime.now(timezone.utc) + timedelta(days=duration_days)
    
    staking_doc = {
        "staking_id": str(uuid.uuid4()),
        "user_id": current_user.user_id,
        "package_id": staking_data.package_id,
        "amount": staking_data.amount,
        "daily_roi": daily_roi,
        "duration_days": duration_days,
        "start_date": datetime.now(timezone.utc).isoformat(),
        "end_date": end_date.isoformat(),
        "status": StakingStatus.ACTIVE,
        "total_earned": 0.0,
        "last_yield_date": None,
        "capital_returned": False
    }
    
    await db.staking.insert_one(staking_doc)
    staking_doc.pop("_id", None)
    
    # Deduct from wallet balance
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$inc": {
            "wallet_balance": -staking_data.amount,
            "total_investment": staking_data.amount
        }}
    )
    
    # Distribute commissions to upline
    if background_tasks:
        background_tasks.add_task(distribute_commissions, staking_doc["staking_id"], current_user.user_id, staking_data.amount)
    else:
        await distribute_commissions(staking_doc["staking_id"], current_user.user_id, staking_data.amount)
    
    # Check for level upgrade
    user = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0})
    new_level = await calculate_user_level(current_user.user_id, user["total_investment"])
    if new_level > current_user.level:
        await db.users.update_one(
            {"user_id": current_user.user_id},
            {"$set": {"level": new_level}}
        )
        if background_tasks:
            background_tasks.add_task(
                email_service.send_level_promotion,
                current_user.email,
                current_user.full_name,
                current_user.level,
                new_level
            )
    
    return staking_doc

@api_router.get("/staking")
async def get_user_staking(current_user: User = Depends(get_current_user)):
    stakes = await db.staking.find({"user_id": current_user.user_id}, {"_id": 0}).sort("start_date", -1).to_list(100)
    return stakes

# ============== COMMISSION ENDPOINTS ==============

@api_router.get("/commissions")
async def get_commissions(current_user: User = Depends(get_current_user)):
    commissions = await db.commissions.find({"user_id": current_user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Summarize by level
    summary = {f"level_{i}": 0.0 for i in range(1, 7)}
    for c in commissions:
        level = c.get("level_depth", 1)
        summary[f"level_{level}"] += c.get("amount", 0.0)
    
    # Backward compatibility
    summary["lv_a"] = summary.get("level_1", 0)
    summary["lv_b"] = summary.get("level_2", 0)
    summary["lv_c"] = summary.get("level_3", 0)
    summary["total"] = sum(summary.get(f"level_{i}", 0) for i in range(1, 7))
    
    return {
        "commissions": commissions,
        "summary": summary
    }

# ============== MEMBERSHIP/PACKAGE ENDPOINTS ==============

@api_router.get("/membership/packages")
async def get_membership_packages():
    # Try investment packages first
    packages = await db.investment_packages.find({"is_active": True}, {"_id": 0}).sort("level", 1).to_list(10)
    if packages:
        # Convert to membership format for backward compatibility
        for pkg in packages:
            pkg["commission_lv_a"] = pkg.get("commission_direct", 0)
            pkg["commission_lv_b"] = pkg.get("commission_level_2", 0)
            pkg["commission_lv_c"] = pkg.get("commission_level_3", 0)
            pkg["direct_required"] = pkg.get("direct_required", 0)
            pkg["indirect_required"] = sum([
                pkg.get("level_2_required", 0),
                pkg.get("level_3_required", 0),
                pkg.get("level_4_required", 0),
                pkg.get("level_5_required", 0),
                pkg.get("level_6_required", 0)
            ])
        return packages
    
    # Fallback to old membership packages
    packages = await db.membership_packages.find({"is_active": True}, {"_id": 0}).sort("level", 1).to_list(10)
    return packages

# ============== SETTINGS ENDPOINTS ==============

@api_router.get("/settings")
async def get_settings():
    settings = await db.admin_settings.find_one({"settings_id": "default"}, {"_id": 0})
    if not settings:
        default_settings = {
            "settings_id": "default",
            "usdt_wallet_address": "",
            "qr_code_image": None,
            "withdrawal_dates": [1, 15],
            "community_star_target": 28.0,
            "community_star_bonus_min": 100.0,
            "community_star_bonus_max": 1000.0,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.admin_settings.insert_one(default_settings)
        return default_settings
    return settings

# ============== CRYPTO PRICE ENDPOINTS ==============

@api_router.get("/crypto/prices")
async def get_crypto_prices():
    """Get live cryptocurrency prices"""
    prices = await crypto_service.get_prices()
    return prices

# ============== ADMIN ENDPOINTS ==============

@api_router.get("/admin/dashboard")
async def get_admin_dashboard(admin: User = Depends(get_admin_user)):
    total_users = await db.users.count_documents({})
    
    deposits = await db.deposits.find({"status": DepositStatus.APPROVED}, {"_id": 0}).to_list(10000)
    total_deposits = sum(d.get("amount", 0) for d in deposits)
    
    withdrawals = await db.withdrawals.find({"status": WithdrawalStatus.APPROVED}, {"_id": 0}).to_list(10000)
    total_withdrawals = sum(w.get("amount", 0) for w in withdrawals)
    
    pending_deposits = await db.deposits.count_documents({"status": DepositStatus.PENDING})
    pending_withdrawals = await db.withdrawals.count_documents({"status": WithdrawalStatus.PENDING})
    
    total_active_stakes = await db.staking.count_documents({"status": StakingStatus.ACTIVE})
    
    commissions = await db.commissions.find({}, {"_id": 0}).to_list(10000)
    total_commissions_paid = sum(c.get("amount", 0) for c in commissions)
    
    roi_transactions = await db.roi_transactions.find({}, {"_id": 0}).to_list(10000)
    total_roi_paid = sum(r.get("amount", 0) for r in roi_transactions)
    
    return AdminDashboardStats(
        total_users=total_users,
        total_deposits=total_deposits,
        total_withdrawals=total_withdrawals,
        pending_deposits=pending_deposits,
        pending_withdrawals=pending_withdrawals,
        total_active_stakes=total_active_stakes,
        total_commissions_paid=total_commissions_paid,
        total_roi_paid=total_roi_paid
    )

@api_router.get("/admin/users")
async def get_all_users(admin: User = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(1000)
    return users

@api_router.get("/admin/deposits")
async def get_all_deposits(admin: User = Depends(get_admin_user)):
    deposits = await db.deposits.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    enriched_deposits = []
    for deposit in deposits:
        user = await db.users.find_one({"user_id": deposit["user_id"]}, {"_id": 0, "email": 1, "full_name": 1})
        deposit_with_user = {
            **deposit,
            "user_email": user.get("email") if user else "Unknown",
            "user_name": user.get("full_name") if user else "Unknown"
        }
        enriched_deposits.append(deposit_with_user)
    
    return enriched_deposits

@api_router.post("/admin/deposits/{deposit_id}/approve")
async def approve_deposit(deposit_id: str, admin: User = Depends(get_admin_user), background_tasks: BackgroundTasks = None):
    deposit = await db.deposits.find_one({"deposit_id": deposit_id}, {"_id": 0})
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")
    
    if deposit["status"] != DepositStatus.PENDING:
        raise HTTPException(status_code=400, detail="Deposit already processed")
    
    await db.deposits.update_one(
        {"deposit_id": deposit_id},
        {"$set": {
            "status": DepositStatus.APPROVED,
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "approved_by": admin.user_id
        }}
    )
    
    amount = deposit["amount"]
    user_id = deposit["user_id"]
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$inc": {"wallet_balance": amount}}
    )
    
    # Send notification email
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if user and background_tasks:
        background_tasks.add_task(
            email_service.send_deposit_approved,
            user["email"],
            user["full_name"],
            amount
        )
    
    return {"message": "Deposit approved"}

@api_router.post("/admin/deposits/{deposit_id}/reject")
async def reject_deposit(deposit_id: str, reason: str, admin: User = Depends(get_admin_user), background_tasks: BackgroundTasks = None):
    deposit = await db.deposits.find_one({"deposit_id": deposit_id}, {"_id": 0})
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")
    
    await db.deposits.update_one(
        {"deposit_id": deposit_id},
        {"$set": {
            "status": DepositStatus.REJECTED,
            "rejection_reason": reason,
            "approved_by": admin.user_id
        }}
    )
    
    # Send notification email
    user = await db.users.find_one({"user_id": deposit["user_id"]}, {"_id": 0})
    if user and background_tasks:
        background_tasks.add_task(
            email_service.send_deposit_rejected,
            user["email"],
            user["full_name"],
            deposit["amount"],
            reason
        )
    
    return {"message": "Deposit rejected"}

@api_router.get("/admin/withdrawals")
async def get_all_withdrawals(admin: User = Depends(get_admin_user)):
    withdrawals = await db.withdrawals.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    enriched = []
    for w in withdrawals:
        user = await db.users.find_one({"user_id": w["user_id"]}, {"_id": 0, "email": 1, "full_name": 1})
        enriched.append({
            **w,
            "user_email": user.get("email") if user else "Unknown",
            "user_name": user.get("full_name") if user else "Unknown"
        })
    
    return enriched

@api_router.post("/admin/withdrawals/{withdrawal_id}/approve")
async def approve_withdrawal(withdrawal_id: str, transaction_hash: str, admin: User = Depends(get_admin_user), background_tasks: BackgroundTasks = None):
    withdrawal = await db.withdrawals.find_one({"withdrawal_id": withdrawal_id}, {"_id": 0})
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    
    await db.withdrawals.update_one(
        {"withdrawal_id": withdrawal_id},
        {"$set": {
            "status": WithdrawalStatus.APPROVED,
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "approved_by": admin.user_id,
            "transaction_hash": transaction_hash
        }}
    )
    
    # Send notification email
    user = await db.users.find_one({"user_id": withdrawal["user_id"]}, {"_id": 0})
    if user and background_tasks:
        background_tasks.add_task(
            email_service.send_withdrawal_approved,
            user["email"],
            user["full_name"],
            withdrawal["amount"],
            transaction_hash
        )
    
    return {"message": "Withdrawal approved"}

@api_router.post("/admin/withdrawals/{withdrawal_id}/reject")
async def reject_withdrawal(withdrawal_id: str, reason: str, admin: User = Depends(get_admin_user), background_tasks: BackgroundTasks = None):
    withdrawal = await db.withdrawals.find_one({"withdrawal_id": withdrawal_id}, {"_id": 0})
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    
    await db.withdrawals.update_one(
        {"withdrawal_id": withdrawal_id},
        {"$set": {
            "status": WithdrawalStatus.REJECTED,
            "rejection_reason": reason,
            "approved_by": admin.user_id
        }}
    )
    
    # Restore balance
    await db.users.update_one(
        {"user_id": withdrawal["user_id"]},
        {"$inc": {
            "wallet_balance": withdrawal["amount"],
            "roi_balance": withdrawal["amount"]  # Restore to ROI balance
        }}
    )
    
    # Send notification email
    user = await db.users.find_one({"user_id": withdrawal["user_id"]}, {"_id": 0})
    if user and background_tasks:
        background_tasks.add_task(
            email_service.send_withdrawal_rejected,
            user["email"],
            user["full_name"],
            withdrawal["amount"],
            reason
        )
    
    return {"message": "Withdrawal rejected and balance restored"}

# Admin Package Management - Investment Packages (New Unified System)
@api_router.post("/admin/investment/packages")
async def create_investment_package(package: InvestmentPackage, admin: User = Depends(get_admin_user)):
    package_dict = package.model_dump()
    package_dict["created_at"] = package_dict["created_at"].isoformat()
    package_dict["annual_roi"] = package_dict["daily_roi"] * 365  # Auto-calculate
    await db.investment_packages.insert_one(package_dict)
    package_dict.pop("_id", None)
    return package_dict

@api_router.put("/admin/investment/packages/{package_id}")
async def update_investment_package(package_id: str, package: InvestmentPackage, admin: User = Depends(get_admin_user)):
    package_dict = package.model_dump()
    package_dict["created_at"] = package_dict["created_at"].isoformat()
    package_dict["annual_roi"] = package_dict["daily_roi"] * 365  # Auto-calculate
    await db.investment_packages.update_one({"package_id": package_id}, {"$set": package_dict})
    return package_dict

@api_router.delete("/admin/investment/packages/{package_id}")
async def delete_investment_package(package_id: str, admin: User = Depends(get_admin_user)):
    await db.investment_packages.update_one({"package_id": package_id}, {"$set": {"is_active": False}})
    return {"message": "Package deactivated"}

@api_router.patch("/admin/investment/packages/{package_id}/toggle")
async def toggle_package_status(package_id: str, admin: User = Depends(get_admin_user)):
    """Toggle package active/inactive status"""
    package = await db.investment_packages.find_one({"package_id": package_id}, {"_id": 0})
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    new_status = not package.get("is_active", True)
    await db.investment_packages.update_one(
        {"package_id": package_id},
        {"$set": {"is_active": new_status}}
    )
    
    return {"message": f"Package {'activated' if new_status else 'deactivated'}", "is_active": new_status}

@api_router.get("/admin/investment/packages")
async def get_all_investment_packages(admin: User = Depends(get_admin_user)):
    """Get all investment packages (including inactive) for admin"""
    packages = await db.investment_packages.find({}, {"_id": 0}).sort("level", 1).to_list(20)
    return packages

# Admin Package Management - Legacy Membership Packages
@api_router.post("/admin/membership/packages")
async def create_membership_package(package: MembershipPackage, admin: User = Depends(get_admin_user)):
    package_dict = package.model_dump()
    package_dict["created_at"] = package_dict["created_at"].isoformat()
    await db.membership_packages.insert_one(package_dict)
    package_dict.pop("_id", None)
    return package_dict

@api_router.put("/admin/membership/packages/{package_id}")
async def update_membership_package(package_id: str, package: MembershipPackage, admin: User = Depends(get_admin_user)):
    package_dict = package.model_dump()
    package_dict["created_at"] = package_dict["created_at"].isoformat()
    await db.membership_packages.update_one({"package_id": package_id}, {"$set": package_dict})
    return package_dict

# Admin Package Management - Legacy Staking Packages
@api_router.post("/admin/staking/packages")
async def create_staking_package(package: StakingPackage, admin: User = Depends(get_admin_user)):
    package_dict = package.model_dump()
    package_dict["created_at"] = package_dict["created_at"].isoformat()
    await db.staking_packages.insert_one(package_dict)
    package_dict.pop("_id", None)
    return package_dict

@api_router.put("/admin/staking/packages/{staking_id}")
async def update_staking_package(staking_id: str, package: StakingPackage, admin: User = Depends(get_admin_user)):
    package_dict = package.model_dump()
    package_dict["created_at"] = package_dict["created_at"].isoformat()
    await db.staking_packages.update_one({"staking_id": staking_id}, {"$set": package_dict})
    return package_dict

# Admin Settings
@api_router.put("/admin/settings")
async def update_settings(settings: AdminSettings, admin: User = Depends(get_admin_user)):
    settings_dict = settings.model_dump()
    settings_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.admin_settings.update_one(
        {"settings_id": "default"},
        {"$set": settings_dict},
        upsert=True
    )
    return settings_dict

@api_router.post("/admin/settings/qr-code")
async def upload_qr_code(file: UploadFile = File(...), admin: User = Depends(get_admin_user)):
    """Upload QR code image for deposit page"""
    contents = await file.read()
    qr_base64 = base64.b64encode(contents).decode('utf-8')
    qr_url = f"data:image/png;base64,{qr_base64}"
    
    await db.admin_settings.update_one(
        {"settings_id": "default"},
        {"$set": {"qr_code_image": qr_url, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"message": "QR code uploaded", "qr_code_image": qr_url}

# Admin ROI Calculation (Manual trigger)
@api_router.post("/admin/calculate-roi")
async def calculate_daily_roi(admin: User = Depends(get_admin_user)):
    """Manually trigger ROI distribution (also runs automatically daily)"""
    result = await roi_scheduler.distribute_daily_roi()
    return result

# ROI Scheduler Status
@api_router.get("/admin/roi-scheduler/status")
async def get_roi_scheduler_status(admin: User = Depends(get_admin_user)):
    """Get ROI scheduler status"""
    return roi_scheduler.get_status()

# Set ROI Schedule Time
@api_router.post("/admin/roi-scheduler/set-time")
async def set_roi_schedule_time(hour: int = 0, minute: int = 0, admin: User = Depends(get_admin_user)):
    """Set the daily ROI distribution time (UTC)"""
    if hour < 0 or hour > 23:
        raise HTTPException(status_code=400, detail="Hour must be between 0 and 23")
    if minute < 0 or minute > 59:
        raise HTTPException(status_code=400, detail="Minute must be between 0 and 59")
    
    roi_scheduler.set_schedule(hour, minute)
    
    # Save to settings
    await db.admin_settings.update_one(
        {"settings_id": "default"},
        {"$set": {
            "roi_distribution_hour": hour,
            "roi_distribution_minute": minute
        }},
        upsert=True
    )
    
    return {
        "message": f"ROI distribution scheduled for {hour:02d}:{minute:02d} UTC daily",
        "status": roi_scheduler.get_status()
    }

# Get Email Logs
@api_router.get("/admin/email-logs")
async def get_email_logs(admin: User = Depends(get_admin_user), limit: int = 100):
    """Get recent email logs"""
    logs = await db.email_logs.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return logs

# Get System Logs (ROI distributions, etc.)
@api_router.get("/admin/system-logs")
async def get_system_logs(admin: User = Depends(get_admin_user), limit: int = 50):
    """Get system logs including ROI distributions"""
    logs = await db.system_logs.find({}, {"_id": 0}).sort("run_time", -1).to_list(limit)
    return logs

# ============== INCLUDE ROUTER AND MIDDLEWARE ==============

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting MINEX GLOBAL application...")
    
    # Create/Update admin user
    admin_exists = await db.users.find_one({"email": "admin@minex.online"}, {"_id": 0})
    if not admin_exists:
        admin_doc = {
            "user_id": str(uuid.uuid4()),
            "email": "admin@minex.online",
            "full_name": "Admin",
            "password_hash": get_password_hash("password"),
            "role": UserRole.ADMIN,
            "level": 6,
            "total_investment": 0.0,
            "wallet_balance": 0.0,
            "roi_balance": 0.0,
            "commission_balance": 0.0,
            "referral_code": "ADMIN001",
            "referred_by": None,
            "direct_referrals": [],
            "indirect_referrals": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_roi_date": None,
            "is_active": True,
            "is_email_verified": True
        }
        await db.users.insert_one(admin_doc)
        logger.info("Admin user created: admin@minex.online / password")
    else:
        # Ensure admin is email verified
        await db.users.update_one(
            {"email": "admin@minex.online"},
            {"$set": {"is_email_verified": True}}
        )
        logger.info("Admin user email verification ensured")
    
    # Create/Update master user for testing referrals
    master_exists = await db.users.find_one({"email": "masteruser@gmail.com"}, {"_id": 0})
    if not master_exists:
        master_doc = {
            "user_id": str(uuid.uuid4()),
            "email": "masteruser@gmail.com",
            "full_name": "Master User",
            "password_hash": get_password_hash("password"),
            "role": UserRole.USER,
            "level": 1,
            "total_investment": 0.0,
            "wallet_balance": 0.0,
            "roi_balance": 0.0,
            "commission_balance": 0.0,
            "referral_code": "MASTER01",
            "referred_by": None,
            "direct_referrals": [],
            "indirect_referrals": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_roi_date": None,
            "is_active": True,
            "is_email_verified": True
        }
        await db.users.insert_one(master_doc)
        logger.info("Master user created: masteruser@gmail.com / password (Referral Code: MASTER01)")
    else:
        # Ensure master user is email verified
        await db.users.update_one(
            {"email": "masteruser@gmail.com"},
            {"$set": {"is_email_verified": True}}
        )
        logger.info("Master user email verification ensured")
    
    # Initialize default investment packages based on user's image
    # Check if investment packages need initialization
    # NOTE: Package initialization removed - Admin should create packages manually
    investment_count = await db.investment_packages.count_documents({})
    if investment_count == 0:
        logger.info("No investment packages found - Admin should create packages via dashboard")
    
    # Initialize default admin settings
    settings_exists = await db.admin_settings.find_one({"settings_id": "default"}, {"_id": 0})
    if not settings_exists:
        default_settings = {
            "settings_id": "default",
            "usdt_wallet_address": "",
            "qr_code_image": None,
            "withdrawal_dates": [1, 15],
            "community_star_target": 28.0,
            "community_star_bonus_min": 100.0,
            "community_star_bonus_max": 1000.0,
            "roi_distribution_hour": 0,
            "roi_distribution_minute": 0,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.admin_settings.insert_one(default_settings)
        logger.info("Admin settings initialized")
    else:
        # Load ROI schedule from settings
        roi_hour = settings_exists.get("roi_distribution_hour", 0)
        roi_minute = settings_exists.get("roi_distribution_minute", 0)
        roi_scheduler.set_schedule(roi_hour, roi_minute)
    
    # Start the automatic ROI scheduler
    roi_scheduler.start()
    logger.info("Automatic ROI scheduler started")

@app.on_event("shutdown")
async def shutdown_db_client():
    roi_scheduler.stop()
    client.close()
