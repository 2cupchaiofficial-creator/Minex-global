"""
Test suite for MINEX GLOBAL UI/UX Upgrade - Iteration 9
Tests all core functionality after visual upgrade to ensure business logic remains intact.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@minex.online"
ADMIN_PASSWORD = "password"
USER_EMAIL = "masteruser@gmail.com"
USER_PASSWORD = "password"


class TestAuthenticationFlows:
    """Test authentication endpoints work correctly after UI upgrade"""
    
    def test_user_login_success(self):
        """Test user can login successfully"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        assert response.status_code == 200, f"User login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Token not returned"
        assert "user" in data, "User data not returned"
        assert data["user"]["email"] == USER_EMAIL
        print(f"✓ User login successful: {USER_EMAIL}")
    
    def test_admin_login_success(self):
        """Test admin can login successfully"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Token not returned"
        assert "user" in data, "User data not returned"
        assert data["user"]["role"] == "admin" or data["user"]["role"] == "ADMIN"
        print(f"✓ Admin login successful: {ADMIN_EMAIL}")
    
    def test_login_invalid_credentials(self):
        """Test login fails with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, "Should return 401 for invalid credentials"
        print("✓ Invalid credentials correctly rejected")


class TestUserDashboard:
    """Test user dashboard API returns correct data"""
    
    @pytest.fixture
    def user_token(self):
        """Get user authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("User authentication failed")
    
    def test_dashboard_returns_balances(self, user_token):
        """Test dashboard returns wallet_balance, roi_balance, commission_balance"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/api/user/dashboard", headers=headers)
        
        assert response.status_code == 200, f"Dashboard API failed: {response.text}"
        data = response.json()
        
        # Check required balance fields exist
        assert "total_balance" in data, "total_balance missing"
        assert "roi_balance" in data, "roi_balance missing"
        assert "commission_balance" in data, "commission_balance missing"
        assert "deposited_capital" in data, "deposited_capital missing"
        
        # Verify data types
        assert isinstance(data["total_balance"], (int, float)), "total_balance should be numeric"
        assert isinstance(data["roi_balance"], (int, float)), "roi_balance should be numeric"
        assert isinstance(data["commission_balance"], (int, float)), "commission_balance should be numeric"
        
        print(f"✓ Dashboard balances: total={data['total_balance']}, roi={data['roi_balance']}, commission={data['commission_balance']}")
    
    def test_dashboard_returns_level_info(self, user_token):
        """Test dashboard returns current level and daily ROI"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/api/user/dashboard", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "current_level" in data, "current_level missing"
        assert "daily_roi_percentage" in data, "daily_roi_percentage missing"
        assert "direct_referrals" in data, "direct_referrals missing"
        assert "indirect_referrals" in data, "indirect_referrals missing"
        
        print(f"✓ Dashboard level info: level={data['current_level']}, daily_roi={data['daily_roi_percentage']}%")
    
    def test_user_profile(self, user_token):
        """Test user profile endpoint"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/api/user/profile", headers=headers)
        
        assert response.status_code == 200, f"Profile API failed: {response.text}"
        data = response.json()
        
        assert "email" in data, "email missing from profile"
        assert "full_name" in data, "full_name missing from profile"
        assert data["email"] == USER_EMAIL
        
        print(f"✓ User profile: {data['full_name']} ({data['email']})")


class TestAdminDashboard:
    """Test admin dashboard API returns correct stats"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin authentication failed")
    
    def test_admin_dashboard_stats(self, admin_token):
        """Test admin dashboard returns all required stats"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=headers)
        
        assert response.status_code == 200, f"Admin dashboard failed: {response.text}"
        data = response.json()
        
        # Check required fields
        assert "total_users" in data, "total_users missing"
        assert "total_deposits" in data, "total_deposits missing"
        assert "total_withdrawals" in data, "total_withdrawals missing"
        assert "pending_deposits" in data, "pending_deposits missing"
        assert "pending_withdrawals" in data, "pending_withdrawals missing"
        
        print(f"✓ Admin stats: users={data['total_users']}, deposits={data['total_deposits']}, withdrawals={data['total_withdrawals']}")
    
    def test_admin_users_list(self, admin_token):
        """Test admin can get users list"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        
        assert response.status_code == 200, f"Admin users list failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Users should be a list"
        assert len(data) > 0, "Should have at least one user"
        
        # Check user has required fields
        user = data[0]
        assert "email" in user, "User should have email"
        assert "full_name" in user, "User should have full_name"
        
        print(f"✓ Admin users list: {len(data)} users found")
    
    def test_admin_requires_auth(self):
        """Test admin endpoints require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard")
        assert response.status_code == 401, "Admin dashboard should require auth"
        print("✓ Admin endpoints correctly require authentication")


class TestInvestmentPackages:
    """Test investment packages display correctly"""
    
    def test_membership_packages_public(self):
        """Test membership packages are publicly accessible"""
        response = requests.get(f"{BASE_URL}/api/membership/packages")
        
        assert response.status_code == 200, f"Packages API failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Packages should be a list"
        assert len(data) > 0, "Should have at least one package"
        
        # Check package structure
        pkg = data[0]
        assert "level" in pkg, "Package should have level"
        assert "min_investment" in pkg, "Package should have min_investment"
        assert "daily_roi" in pkg, "Package should have daily_roi"
        
        print(f"✓ Investment packages: {len(data)} packages available")
        for p in data[:3]:
            print(f"  - Level {p.get('level')}: ${p.get('min_investment')} min, {p.get('daily_roi')}% daily ROI")
    
    def test_investment_packages_endpoint(self):
        """Test investment packages endpoint"""
        response = requests.get(f"{BASE_URL}/api/investment/packages")
        
        assert response.status_code == 200, f"Investment packages API failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Packages should be a list"
        print(f"✓ Investment packages endpoint: {len(data)} packages")


class TestDepositWithdrawalFlows:
    """Test deposit and withdrawal endpoints"""
    
    @pytest.fixture
    def user_token(self):
        """Get user authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("User authentication failed")
    
    def test_get_deposits(self, user_token):
        """Test user can get their deposits"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/api/deposits", headers=headers)
        
        assert response.status_code == 200, f"Get deposits failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Deposits should be a list"
        print(f"✓ User deposits: {len(data)} deposits found")
    
    def test_get_withdrawals(self, user_token):
        """Test user can get their withdrawals"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/api/withdrawals", headers=headers)
        
        assert response.status_code == 200, f"Get withdrawals failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Withdrawals should be a list"
        print(f"✓ User withdrawals: {len(data)} withdrawals found")
    
    def test_get_settings(self):
        """Test settings endpoint for deposit/withdrawal info"""
        response = requests.get(f"{BASE_URL}/api/settings")
        
        assert response.status_code == 200, f"Settings API failed: {response.text}"
        data = response.json()
        
        # Check for wallet addresses
        assert "usdt_wallet_address" in data or "usdt_trc20_address" in data, "Wallet address missing"
        print(f"✓ Settings endpoint working")


class TestStakingFunctionality:
    """Test staking/investment functionality"""
    
    @pytest.fixture
    def user_token(self):
        """Get user authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("User authentication failed")
    
    def test_get_staking_packages(self):
        """Test staking packages endpoint"""
        response = requests.get(f"{BASE_URL}/api/staking/packages")
        
        assert response.status_code == 200, f"Staking packages failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Packages should be a list"
        print(f"✓ Staking packages: {len(data)} packages available")
    
    def test_get_user_staking(self, user_token):
        """Test user can get their staking entries"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/api/staking", headers=headers)
        
        assert response.status_code == 200, f"Get staking failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Staking should be a list"
        print(f"✓ User staking: {len(data)} staking entries found")


class TestNavigationEndpoints:
    """Test all navigation-related endpoints work"""
    
    @pytest.fixture
    def user_token(self):
        """Get user authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("User authentication failed")
    
    def test_user_team(self, user_token):
        """Test team endpoint"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/api/user/team", headers=headers)
        
        assert response.status_code == 200, f"Team API failed: {response.text}"
        data = response.json()
        assert "level_1" in data or "direct" in data, "Team data structure incorrect"
        print(f"✓ Team endpoint working")
    
    def test_user_commissions(self, user_token):
        """Test commissions endpoint"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/api/commissions", headers=headers)
        
        assert response.status_code == 200, f"Commissions API failed: {response.text}"
        data = response.json()
        assert "commissions" in data, "Commissions data missing"
        assert "summary" in data, "Summary data missing"
        print(f"✓ Commissions endpoint working")
    
    def test_user_transactions(self, user_token):
        """Test transactions endpoint"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/api/user/transactions", headers=headers)
        
        assert response.status_code == 200, f"Transactions API failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Transactions should be a list"
        print(f"✓ Transactions endpoint: {len(data)} transactions found")


class TestPromotions:
    """Test promotions functionality"""
    
    def test_active_promotion_public(self):
        """Test active promotion endpoint is public"""
        response = requests.get(f"{BASE_URL}/api/promotions/active")
        
        # Can be 200 with data or 200 with null (no active promotion)
        assert response.status_code == 200, f"Active promotion API failed: {response.text}"
        print(f"✓ Active promotion endpoint working")
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin authentication failed")
    
    def test_admin_promotions_list(self, admin_token):
        """Test admin can get promotions list"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/promotions", headers=headers)
        
        assert response.status_code == 200, f"Admin promotions failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Promotions should be a list"
        print(f"✓ Admin promotions: {len(data)} promotions found")


class TestCryptoPrices:
    """Test crypto prices endpoint"""
    
    def test_crypto_prices(self):
        """Test crypto prices endpoint returns data"""
        response = requests.get(f"{BASE_URL}/api/crypto/prices")
        
        assert response.status_code == 200, f"Crypto prices API failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Prices should be a list"
        print(f"✓ Crypto prices: {len(data)} prices returned")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
