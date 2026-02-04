from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List, Dict
from datetime import datetime, timezone
from enum import Enum
import uuid

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"

class DepositStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class WithdrawalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class StakingStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"

class PaymentMethod(str, Enum):
    USDT = "usdt"
    BANK = "bank"

class TransactionType(str, Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    ROI = "roi"
    COMMISSION = "commission"
    STAKING = "staking"

# Email Verification Model
class EmailVerification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    verification_id: str
    email: EmailStr
    code: str
    expires_at: datetime
    is_used: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmailVerificationRequest(BaseModel):
    email: EmailStr

class EmailVerificationVerify(BaseModel):
    email: EmailStr
    code: str

# User Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str
    email: EmailStr
    full_name: str
    password_hash: str
    role: UserRole = UserRole.USER
    level: int = 1  # Package level (1-6)
    total_investment: float = 0.0
    wallet_balance: float = 0.0  # Available balance for staking/withdrawal
    roi_balance: float = 0.0
    commission_balance: float = 0.0
    referral_code: str
    referred_by: Optional[str] = None
    direct_referrals: List[str] = Field(default_factory=list)
    indirect_referrals: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_roi_date: Optional[datetime] = None
    is_active: bool = True
    is_email_verified: bool = False

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    referral_code: str  # Required - must have referral

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str
    email: str
    full_name: str
    role: str
    level: int
    total_investment: float
    wallet_balance: float
    roi_balance: float
    commission_balance: float
    referral_code: str
    referred_by: Optional[str]
    direct_referrals: List[str]
    indirect_referrals: List[str]
    created_at: datetime
    is_email_verified: bool = True

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str
    confirm_password: str

class VerifyResetCodeRequest(BaseModel):
    email: EmailStr
    code: str

# Unified Investment Package Model (formerly MembershipPackage + StakingPackage combined)
class InvestmentPackage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    package_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""  # e.g., "Gold NFT", "Platinum NFT"
    level: int  # 1-6
    min_investment: float  # Minimum investment amount
    max_investment: float = 0.0  # Maximum investment amount
    daily_roi: float  # Daily ROI percentage
    annual_roi: float = 0.0  # Auto-calculated from daily_roi
    duration_days: int = 365  # Investment duration
    
    # Level requirements for promotion
    direct_required: int = 0  # Direct referrals needed
    level_2_required: int = 0  # Level 2 referrals needed
    level_3_required: int = 0  # Level 3 referrals needed
    level_4_required: int = 0  # Level 4 referrals needed
    level_5_required: int = 0  # Level 5 referrals needed
    level_6_required: int = 0  # Level 6 referrals needed
    
    # Commission rates for each level (when user is at this package level)
    # Level 1: Direct commission on DEPOSIT
    commission_direct: float = 0.0  # Direct commission % on deposit
    
    # Level 2-6: Profit Share on ROI (not deposit)
    profit_share_level_2: float = 0.0  # Level 2 profit share %
    profit_share_level_3: float = 0.0  # Level 3 profit share %
    profit_share_level_4: float = 0.0  # Level 4 profit share %
    profit_share_level_5: float = 0.0  # Level 5 profit share %
    profit_share_level_6: float = 0.0  # Level 6 profit share %
    
    # Legacy fields for backward compatibility
    commission_level_2: float = 0.0
    commission_level_3: float = 0.0
    commission_level_4: float = 0.0
    commission_level_5: float = 0.0
    commission_level_6: float = 0.0
    
    # Levels enabled for commissions (checkboxes)
    levels_enabled: List[int] = Field(default_factory=lambda: [1, 2, 3])  # Which levels earn commission
    
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Keep old models for backward compatibility
class MembershipPackage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    package_id: str
    level: int
    min_investment: float
    daily_roi: float
    annual_roi: float
    duration_days: int = 365
    direct_required: int = 0
    indirect_required: int = 0
    commission_lv_a: float = 0.0
    commission_lv_b: float = 0.0
    commission_lv_c: float = 0.0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StakingPackage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    staking_id: str
    tier: int
    min_amount: float
    max_amount: float
    daily_yield: float
    total_supply: int
    remaining_supply: int
    lock_period_days: int
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Deposit(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    deposit_id: str
    user_id: str
    amount: float
    payment_method: PaymentMethod
    transaction_hash: Optional[str] = None
    screenshot_url: Optional[str] = None
    status: DepositStatus = DepositStatus.PENDING
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    rejection_reason: Optional[str] = None

class DepositCreate(BaseModel):
    amount: float
    payment_method: PaymentMethod
    transaction_hash: Optional[str] = None
    screenshot_url: Optional[str] = None

class Withdrawal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    withdrawal_id: str
    user_id: str
    amount: float
    wallet_address: str
    status: WithdrawalStatus = WithdrawalStatus.PENDING
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    transaction_hash: Optional[str] = None
    rejection_reason: Optional[str] = None

class WithdrawalCreate(BaseModel):
    amount: float
    wallet_address: str

# User Staking (when user activates staking)
class Staking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    staking_entry_id: str
    user_id: str
    package_id: str  # Reference to InvestmentPackage
    amount: float
    daily_roi: float
    duration_days: int
    start_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    end_date: datetime
    status: StakingStatus = StakingStatus.ACTIVE
    total_earned: float = 0.0
    last_yield_date: Optional[datetime] = None
    capital_returned: bool = False  # Whether capital was returned after completion

class StakingCreate(BaseModel):
    package_id: str  # ID of the investment package
    amount: float

class StakingCreateLegacy(BaseModel):
    staking_id: str
    amount: float
    lock_period_days: int

class Commission(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    commission_id: str
    user_id: str
    from_user_id: str
    from_user_name: Optional[str] = None
    amount: float
    commission_type: str  # "LEVEL_1", "LEVEL_2", etc.
    level_depth: int  # 1-6
    percentage: float
    source_type: str = "staking"  # "staking" or "deposit"
    source_id: str  # staking_entry_id or deposit_id
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ROITransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    transaction_id: str
    user_id: str
    staking_entry_id: Optional[str] = None
    amount: float
    roi_percentage: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdminSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    settings_id: str = "default"
    usdt_wallet_address: str = ""
    qr_code_image: Optional[str] = None  # Base64 encoded QR code
    withdrawal_dates: List[int] = Field(default_factory=lambda: [1, 15])  # Days of month when withdrawal allowed
    community_star_target: float = 28.0
    community_star_bonus_min: float = 100.0
    community_star_bonus_max: float = 1000.0
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DashboardStats(BaseModel):
    total_balance: float  # Total withdrawable (roi + commission)
    roi_balance: float
    commission_balance: float
    total_investment: float
    active_staking: float  # Currently staked amount
    current_level: int
    daily_roi_percentage: float
    direct_referrals: int
    indirect_referrals: int
    total_commissions: float
    pending_withdrawals: int
    # Promotion progress fields
    next_level_requirements: Optional[dict] = None
    team_counts_by_level: Optional[dict] = None
    promotion_progress: Optional[dict] = None

class AdminDashboardStats(BaseModel):
    total_users: int
    total_deposits: float
    total_withdrawals: float
    pending_deposits: int
    pending_withdrawals: int
    total_active_stakes: int
    total_commissions_paid: float
    total_roi_paid: float

# Transaction History for unified view
class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    transaction_id: str
    user_id: str
    type: TransactionType
    amount: float
    status: str
    description: str
    reference_id: Optional[str] = None  # deposit_id, withdrawal_id, etc.
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: Dict = Field(default_factory=dict)
