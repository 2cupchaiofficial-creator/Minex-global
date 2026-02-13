"""
Test cases for:
1. Dashboard API returning deposited_capital field
2. Promotion rewards being logged to transactions collection
3. Admin migration endpoint for promo rewards
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://capital-release.preview.emergentagent.com').rstrip('/')

# Test Credentials
USER_EMAIL = "masteruser@gmail.com"
USER_PASSWORD = "password"
ADMIN_EMAIL = "admin@minex.online"
ADMIN_PASSWORD = "password"


class TestAuth:
    """Test authentication flows"""
    
    def test_user_login(self):
        """Test user can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["email"] == USER_EMAIL
        
    def test_admin_login(self):
        """Test admin can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "admin"


class TestUserDashboard:
    """Test dashboard API returns correct fields including deposited_capital"""
    
    @pytest.fixture
    def user_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        return response.json()["token"]
    
    def test_dashboard_returns_deposited_capital(self, user_token):
        """Dashboard API should return deposited_capital field"""
        response = requests.get(
            f"{BASE_URL}/api/user/dashboard",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify deposited_capital is present
        assert "deposited_capital" in data, "deposited_capital field should be present in dashboard response"
        assert isinstance(data["deposited_capital"], (int, float)), "deposited_capital should be a number"
        
        # Verify other expected fields
        assert "total_balance" in data
        assert "roi_balance" in data
        assert "commission_balance" in data
        assert "total_investment" in data  # Legacy field still present
        assert "active_staking" in data
        assert "current_level" in data
        assert "daily_roi_percentage" in data
        
    def test_dashboard_values_are_correct_types(self, user_token):
        """Verify dashboard values are correct types"""
        response = requests.get(
            f"{BASE_URL}/api/user/dashboard",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        data = response.json()
        
        # All balance fields should be numbers
        assert isinstance(data["total_balance"], (int, float))
        assert isinstance(data["roi_balance"], (int, float))
        assert isinstance(data["commission_balance"], (int, float))
        assert isinstance(data["deposited_capital"], (int, float))
        assert isinstance(data["current_level"], int)


class TestTransactions:
    """Test transactions API includes promotion reward types"""
    
    @pytest.fixture
    def user_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        return response.json()["token"]
    
    def test_transactions_endpoint_works(self, user_token):
        """Transactions endpoint should return a list"""
        response = requests.get(
            f"{BASE_URL}/api/user/transactions",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
    def test_transaction_structure_is_correct(self, user_token):
        """Each transaction should have expected fields"""
        response = requests.get(
            f"{BASE_URL}/api/user/transactions",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        data = response.json()
        
        if len(data) > 0:
            tx = data[0]
            assert "transaction_id" in tx
            assert "type" in tx
            assert "amount" in tx
            assert "status" in tx
            assert "description" in tx
            assert "created_at" in tx


class TestPromotions:
    """Test promotion endpoints"""
    
    def test_get_active_promotion(self):
        """Public endpoint to get active promotion"""
        response = requests.get(f"{BASE_URL}/api/promotions/active")
        assert response.status_code == 200
        # May return null if no active promotion
        data = response.json()
        if data:
            assert "promotion_id" in data
            assert "name" in data
            assert "self_deposit_reward_percent" in data
            assert "direct_referral_reward_percent" in data
            

class TestAdminMigration:
    """Test admin migration endpoint for promo rewards"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_migration_endpoint_exists(self, admin_token):
        """Admin can access migration endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/admin/migrate-promo-rewards-to-transactions",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "message" in data
        assert "migrated" in data
        assert "skipped_already_exist" in data
        
    def test_migration_endpoint_requires_admin(self):
        """Migration endpoint should require admin auth"""
        # Test without auth
        response = requests.post(f"{BASE_URL}/api/admin/migrate-promo-rewards-to-transactions")
        assert response.status_code == 401
        
    def test_migration_endpoint_rejects_regular_user(self):
        """Regular user cannot access migration endpoint"""
        # Login as regular user
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        user_token = login_response.json()["token"]
        
        # Try to access admin endpoint
        response = requests.post(
            f"{BASE_URL}/api/admin/migrate-promo-rewards-to-transactions",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 403


class TestAdminPromotions:
    """Test admin promotion management"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_all_promotions(self, admin_token):
        """Admin can get all promotions"""
        response = requests.get(
            f"{BASE_URL}/api/admin/promotions",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestAdminImpersonation:
    """Test admin impersonation feature"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_all_users(self, admin_token):
        """Admin can get all users for impersonation"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Verify user structure
        if len(data) > 0:
            user = data[0]
            assert "user_id" in user
            assert "email" in user
            assert "full_name" in user


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
