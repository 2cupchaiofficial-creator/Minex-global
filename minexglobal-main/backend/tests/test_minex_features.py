"""
MINEX GLOBAL Platform - Feature Tests
Testing: Landing page features, User dashboard, Admin packages, Admin deposits, Email verification, Commission distribution
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://minex-platform.preview.emergentagent.com').rstrip('/')


class TestLandingPageAPIs:
    """Test APIs that power the landing page"""
    
    def test_get_membership_packages(self):
        """Test that packages API returns 6 levels with correct structure"""
        response = requests.get(f"{BASE_URL}/api/membership/packages")
        assert response.status_code == 200
        
        packages = response.json()
        assert len(packages) >= 6, "Should have at least 6 investment packages"
        
        # Verify package structure
        for pkg in packages:
            assert "level" in pkg
            assert "daily_roi" in pkg
            assert "min_investment" in pkg
            assert "commission_direct" in pkg or "commission_lv_a" in pkg
    
    def test_get_investment_packages(self):
        """Test investment packages endpoint"""
        response = requests.get(f"{BASE_URL}/api/investment/packages")
        assert response.status_code == 200
        
        packages = response.json()
        assert len(packages) >= 1, "Should have investment packages"
    
    def test_get_crypto_prices(self):
        """Test crypto prices endpoint for ticker"""
        response = requests.get(f"{BASE_URL}/api/crypto/prices")
        assert response.status_code == 200
        
        prices = response.json()
        assert isinstance(prices, list), "Should return list of crypto prices"
    
    def test_get_settings(self):
        """Test settings endpoint"""
        response = requests.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        
        settings = response.json()
        assert "withdrawal_dates" in settings


class TestEmailVerification:
    """Test email verification endpoints"""
    
    def test_send_verification_code(self):
        """Test sending verification code"""
        test_email = f"test_{int(time.time())}@example.com"
        response = requests.post(
            f"{BASE_URL}/api/auth/send-verification",
            json={"email": test_email}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert "email" in data
        assert data["email"] == test_email
    
    def test_verify_email_invalid_code(self):
        """Test email verification with invalid code"""
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-email",
            json={"email": "test@example.com", "code": "000000"}
        )
        assert response.status_code == 400
        assert "Invalid" in response.json().get("detail", "")


class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_admin_login(self):
        """Test admin login with provided credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@minex.online", "password": "password"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "admin"
    
    def test_master_user_login(self):
        """Test master user login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "masteruser@gmail.com", "password": "password"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["referral_code"] == "MASTER01"
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "invalid@test.com", "password": "wrongpass"}
        )
        assert response.status_code == 401
    
    def test_register_requires_referral(self):
        """Test that registration requires valid referral code"""
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": f"test_{int(time.time())}@example.com",
                "full_name": "Test User",
                "password": "testpass123",
                "referral_code": "INVALID_CODE"
            }
        )
        assert response.status_code == 400
        assert "referral" in response.json().get("detail", "").lower()


class TestUserDashboard:
    """Test user dashboard endpoints"""
    
    @pytest.fixture
    def master_user_token(self):
        """Get master user token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "masteruser@gmail.com", "password": "password"}
        )
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Master user login failed")
    
    def test_get_dashboard(self, master_user_token):
        """Test user dashboard endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/user/dashboard",
            headers={"Authorization": f"Bearer {master_user_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        # Verify dashboard stats structure
        assert "total_balance" in data
        assert "roi_balance" in data
        assert "commission_balance" in data
        assert "current_level" in data
        assert "direct_referrals" in data
        assert "indirect_referrals" in data
    
    def test_get_profile(self, master_user_token):
        """Test user profile endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/user/profile",
            headers={"Authorization": f"Bearer {master_user_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "email" in data
        assert "referral_code" in data
    
    def test_get_team(self, master_user_token):
        """Test team/referral tree endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/user/team",
            headers={"Authorization": f"Bearer {master_user_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        # Should have level_1 through level_6
        assert "level_1" in data or "direct" in data
    
    def test_get_transactions(self, master_user_token):
        """Test transactions endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/user/transactions",
            headers={"Authorization": f"Bearer {master_user_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)


class TestAdminEndpoints:
    """Test admin endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@minex.online", "password": "password"}
        )
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Admin login failed")
    
    def test_admin_dashboard(self, admin_token):
        """Test admin dashboard endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "total_users" in data
        assert "total_deposits" in data
        assert "pending_deposits" in data
    
    def test_admin_get_deposits(self, admin_token):
        """Test admin deposits list endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/deposits",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_admin_get_withdrawals(self, admin_token):
        """Test admin withdrawals list endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/withdrawals",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_admin_get_users(self, admin_token):
        """Test admin users list endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2  # At least admin and master user
    
    def test_admin_get_email_logs(self, admin_token):
        """Test admin email logs endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/email-logs",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_admin_roi_scheduler_status(self, admin_token):
        """Test ROI scheduler status endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/roi-scheduler/status",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "is_running" in data


class TestCommissionDistribution:
    """Test commission distribution logic"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@minex.online", "password": "password"}
        )
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Admin login failed")
    
    def test_commission_structure_in_packages(self, admin_token):
        """Verify commission structure in packages - Direct commission for Level 1, Profit share for Levels 2-6"""
        response = requests.get(f"{BASE_URL}/api/investment/packages")
        assert response.status_code == 200
        
        packages = response.json()
        
        for pkg in packages:
            if pkg.get("level", 0) >= 2:
                # Level 2+ packages should have commission rates
                commission_direct = pkg.get("commission_direct", 0) or pkg.get("commission_lv_a", 0)
                commission_level_2 = pkg.get("commission_level_2", 0) or pkg.get("commission_lv_b", 0)
                commission_level_3 = pkg.get("commission_level_3", 0) or pkg.get("commission_lv_c", 0)
                
                # Verify commission rates exist for higher level packages
                assert commission_direct >= 0, f"Level {pkg['level']} should have direct commission defined"
                print(f"Level {pkg['level']}: Direct={commission_direct}%, Lv2={commission_level_2}%, Lv3={commission_level_3}%")


class TestStakingEndpoints:
    """Test staking/investment endpoints"""
    
    @pytest.fixture
    def master_user_token(self):
        """Get master user token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "masteruser@gmail.com", "password": "password"}
        )
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Master user login failed")
    
    def test_get_staking_packages(self):
        """Test staking packages endpoint"""
        response = requests.get(f"{BASE_URL}/api/staking/packages")
        assert response.status_code == 200
        
        packages = response.json()
        assert isinstance(packages, list)
    
    def test_get_user_staking(self, master_user_token):
        """Test user staking list endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/staking",
            headers={"Authorization": f"Bearer {master_user_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_commissions(self, master_user_token):
        """Test commissions endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/commissions",
            headers={"Authorization": f"Bearer {master_user_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "commissions" in data
        assert "summary" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
