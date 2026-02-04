# MINEX GLOBAL - Crypto Investment Platform

## Product Requirements Document

### Original Problem Statement
Build a production-ready crypto investment platform called "MINEX GLOBAL" with:
- Unified Investment Package system (merged Membership + Staking)
- Two-tiered commission system (Direct commission on deposits, Profit share from ROI)
- Email verification with SendGrid
- Admin-configurable packages with ROI, commissions, and level promotions
- User referral system with up to 6 levels
- Automatic daily ROI distribution
- Live crypto price ticker

---

## What's Been Implemented

### Phase 1 - Core Platform (Completed)
- [x] FastAPI backend with MongoDB database
- [x] React frontend with Tailwind CSS
- [x] JWT-based authentication
- [x] User registration with referral code requirement
- [x] Email verification system (SendGrid with DB fallback)
- [x] Admin and Master user accounts

### Phase 2 - Investment System (Completed)
- [x] Unified Investment Packages (6 levels with configurable ROI, commissions)
- [x] Deposit system with screenshot upload
- [x] Withdrawal system with balance validation
- [x] Staking/Investment activation
- [x] Automatic daily ROI scheduler (roi_scheduler.py)
- [x] Capital return after package duration

### Phase 3 - Commission System (Completed - Jan 30, 2026)
- [x] Two-tiered commission model:
  - Level 1: Direct commission on deposits only
  - Levels 2-6: Profit share from daily ROI (handled by ROI scheduler)
- [x] Admin package form updated with "Profit Share" labels
- [x] Commission distribution to direct referrer only on deposits

### Phase 4 - UI/UX Enhancements (Completed - Jan 30, 2026)
- [x] Landing page FAQ section (6 questions)
- [x] Landing page Testimonials section (4 reviews)
- [x] Landing page Active Packages slider
- [x] Footer year updated to 2026
- [x] User dashboard "Cash Wallet" label (was "Withdrawable")
- [x] User dashboard card hover animations
- [x] Admin deposits modal scrollable with close button
- [x] Admin packages "Direct Comm. / Profit Share" labels

### Phase 5 - Email Integration (Completed - Jan 30, 2026)
- [x] Resend API integration (replaced SendGrid)
- [x] Graceful fallback to DB logging if Resend fails
- [x] Email templates for:
  - Verification codes
  - Password reset codes
  - Deposit approved/rejected
  - Withdrawal approved/rejected
  - Daily ROI notifications
  - Commission notifications
  - Level promotions
  - Password changes

### Phase 6 - Password Reset (Completed - Jan 30, 2026)
- [x] Forgot password endpoint (sends reset code)
- [x] Verify reset code endpoint
- [x] Reset password endpoint
- [x] Frontend ForgotPasswordPage with 3-step flow
- [x] "Forgot Password?" link on login page

---

## Architecture

### Tech Stack
- **Backend**: FastAPI, Motor (async MongoDB), Pydantic, APScheduler
- **Frontend**: React, Tailwind CSS, Framer Motion, React Router
- **Database**: MongoDB
- **Email**: SendGrid (with DB fallback)
- **External APIs**: CoinGecko (crypto prices)

### Key Files
```
/app/
├── backend/
│   ├── server.py          # Main FastAPI application
│   ├── models.py          # Pydantic models
│   ├── auth.py            # JWT authentication
│   ├── email_service.py   # SendGrid email service
│   ├── crypto_service.py  # CoinGecko price fetcher
│   ├── roi_scheduler.py   # Automatic daily ROI distribution
│   └── .env               # Environment variables
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.js
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.js
│   │   │   │   ├── AdminDeposits.js
│   │   │   │   ├── AdminPackages.js
│   │   │   │   └── AdminWithdrawals.js
│   │   │   └── user/
│   │   │       ├── UserDashboard.js
│   │   │       ├── TransactionsPage.js
│   │   │       └── ...
│   │   └── api.js         # API client
│   └── .env               # Frontend environment
```

### Database Collections
- `users` - User accounts and balances
- `investment_packages` - Package configurations
- `staking` - Active user investments
- `deposits` - Deposit requests
- `withdrawals` - Withdrawal requests
- `commissions` - Commission/profit share records
- `roi_transactions` - Daily ROI distributions
- `admin_settings` - Platform settings (QR codes, withdrawal dates)
- `email_logs` - Email delivery logs
- `system_logs` - ROI scheduler logs

---

## Test Credentials
- **Admin**: admin@minex.online / password
- **Master User**: masteruser@gmail.com / password (Referral: MASTER01)

---

## API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/send-verification
- POST /api/auth/verify-email

### User
- GET /api/user/profile
- GET /api/user/dashboard
- GET /api/user/team
- GET /api/user/transactions
- PUT /api/user/password

### Deposits & Withdrawals
- POST /api/deposits
- GET /api/deposits
- POST /api/withdrawals
- GET /api/withdrawals

### Staking/Investment
- GET /api/investment/packages
- POST /api/staking
- GET /api/staking

### Admin
- GET /api/admin/dashboard
- GET /api/admin/users
- GET /api/admin/deposits
- POST /api/admin/deposits/{id}/approve
- POST /api/admin/deposits/{id}/reject
- GET /api/admin/withdrawals
- POST /api/admin/withdrawals/{id}/approve
- POST /api/admin/withdrawals/{id}/reject
- POST /api/admin/investment/packages
- PUT /api/admin/investment/packages/{id}
- PUT /api/admin/settings
- POST /api/admin/settings/qr-code
- POST /api/admin/calculate-roi
- GET /api/admin/roi-scheduler/status

---

## Backlog / Future Tasks

### P1 - High Priority
- [ ] Full mobile responsiveness review
- [ ] Comprehensive error handling & loading states
- [ ] Security hardening (XSS, CSRF protection)
- [ ] Rate limiting on API endpoints

### P2 - Medium Priority
- [ ] Two-factor authentication
- [ ] Admin user management (add/edit/delete)
- [ ] Export transaction history (CSV/PDF)

### P3 - Nice to Have
- [ ] Dark/Light theme toggle
- [ ] Multi-language support
- [ ] Push notifications
- [ ] Advanced analytics dashboard

---

## Known Issues
1. **Resend Email Test Mode**: The Resend API key is in test mode - emails can only be sent to verified addresses. For production, verify a domain at resend.com/domains. Emails are logged to the database as a fallback.

---

## Changelog

### Jan 31, 2026 (Critical Bug Fixes)
- **FIXED: User level display** - Dashboard now shows correct level based on active staking package, not user's stored level
- **FIXED: Commission distribution** - Commission rate now based on INVESTOR'S package (not upline's), and properly finds upline by referral_code
- **FIXED: ROI scheduler field names** - Standardized to use `staking_id` throughout
- **FIXED: Next Level Progress** - Now shows actual level-wise team requirements from database
- Verified all flows working:
  - Amina (aminanaaz813@gmail.com) - Level 2, $1000 investment
  - Nexo (nexotech813@gmail.com) - Received $100 commission (10% of $1000)

### Jan 31, 2026 (Final Pre-Deployment)
- Fixed ROI scheduler field name issue (staking_id vs staking_entry_id)
- Updated InvestmentPackage model with auto-generated package_id and default values
- Enhanced User Dashboard with detailed promotion progress (level-wise team requirements)
- Added package active/inactive toggle in Admin Packages
- Cleaned database - removed sample packages and test data
- Verified all critical flows working:
  - ROI distribution (manual + automatic)
  - Profit share from downline ROI
  - Direct commission on deposits
  - Password reset
  - Email notifications via Resend

### Jan 30, 2026 (Session 2)
- Replaced SendGrid with Resend for email sending
- Implemented password reset functionality:
  - POST /api/auth/forgot-password - sends reset code
  - POST /api/auth/verify-reset-code - validates code
  - POST /api/auth/reset-password - updates password
- Created ForgotPasswordPage with 3-step flow (email → code → new password → success)
- Added "Forgot Password?" link to login page
- Emails logged to database as fallback when Resend fails

### Jan 30, 2026 (Session 1)
- Completed commission system refactor (two-tiered model)
- Added landing page FAQ, Testimonials, Active Packages slider
- Updated footer year to 2026
- Renamed "Withdrawable" to "Cash Wallet" on dashboard
- Added hover animations to dashboard cards
- Fixed admin deposits modal (scrollable with close button)
- Updated admin packages form with "Profit Share" labels
- Configured SendGrid API with fallback mechanism

### Previous
- Initial platform setup
- User authentication and registration
- Investment package system
- Deposit/withdrawal flows
- Automatic ROI scheduler
- Email notification system
