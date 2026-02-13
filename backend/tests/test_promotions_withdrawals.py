"""
Test suite for Promotion System and Withdrawal Limits
Tests:
- Admin promotion CRUD operations
- Active promotion endpoint
- Withdrawal limits validation
- Promotion rewards distribution
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://capital-release.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@minex.online"
ADMIN_PASSWORD = "password"
USER_EMAIL = "masteruser@gmail.com"
USER_PASSWORD = "password"


class TestAuthentication:
    """Authentication tests"""
    
    def test_admin_login(self, api_client):
        """Test admin login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "admin"
        print(f"✓ Admin login successful")
        return data["token"]
    
    def test_user_login(self, api_client):
        """Test user login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        assert response.status_code == 200, f"User login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"✓ User login successful")
        return data["token"]


class TestPromotionEndpoints:
    """Promotion API tests"""
    
    def test_get_active_promotion_public(self, api_client):
        """Test public active promotion endpoint"""
        response = api_client.get(f"{BASE_URL}/api/promotions/active")
        assert response.status_code == 200, f"Failed to get active promotion: {response.text}"
        data = response.json()
        
        if data:
            assert "promotion_id" in data
            assert "name" in data
            assert "self_deposit_reward_percent" in data
            assert "direct_referral_reward_percent" in data
            assert "is_active" in data
            print(f"✓ Active promotion found: {data['name']}")
            print(f"  - Self reward: {data['self_deposit_reward_percent']}%")
            print(f"  - Referral reward: {data['direct_referral_reward_percent']}%")
        else:
            print("✓ No active promotion currently")
        return data
    
    def test_admin_get_all_promotions(self, admin_client):
        """Test admin get all promotions"""
        response = admin_client.get(f"{BASE_URL}/api/admin/promotions")
        assert response.status_code == 200, f"Failed to get promotions: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} promotions")
        return data
    
    def test_admin_create_promotion(self, admin_client):
        """Test admin create promotion"""
        # Create a test promotion
        promo_data = {
            "name": "TEST_Promotion_" + datetime.now().strftime("%Y%m%d%H%M%S"),
            "start_date": datetime.now().strftime("%Y-%m-%d"),
            "end_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            "self_deposit_reward_percent": 5.0,
            "direct_referral_reward_percent": 3.0,
            "is_active": False  # Keep inactive to not interfere with existing promotion
        }
        
        response = admin_client.post(f"{BASE_URL}/api/admin/promotions", json=promo_data)
        assert response.status_code == 200, f"Failed to create promotion: {response.text}"
        data = response.json()
        
        assert "promotion_id" in data
        assert data["name"] == promo_data["name"]
        assert data["self_deposit_reward_percent"] == promo_data["self_deposit_reward_percent"]
        assert data["direct_referral_reward_percent"] == promo_data["direct_referral_reward_percent"]
        print(f"✓ Created promotion: {data['name']}")
        return data
    
    def test_admin_update_promotion(self, admin_client):
        """Test admin update promotion"""
        # First create a promotion
        promo_data = {
            "name": "TEST_Update_" + datetime.now().strftime("%Y%m%d%H%M%S"),
            "start_date": datetime.now().strftime("%Y-%m-%d"),
            "end_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            "self_deposit_reward_percent": 2.0,
            "direct_referral_reward_percent": 1.0,
            "is_active": False
        }
        
        create_response = admin_client.post(f"{BASE_URL}/api/admin/promotions", json=promo_data)
        assert create_response.status_code == 200
        created = create_response.json()
        promotion_id = created["promotion_id"]
        
        # Update the promotion
        update_data = {
            "name": promo_data["name"] + "_UPDATED",
            "start_date": promo_data["start_date"],
            "end_date": promo_data["end_date"],
            "self_deposit_reward_percent": 6.0,
            "direct_referral_reward_percent": 4.0,
            "is_active": False
        }
        
        response = admin_client.put(f"{BASE_URL}/api/admin/promotions/{promotion_id}", json=update_data)
        assert response.status_code == 200, f"Failed to update promotion: {response.text}"
        data = response.json()
        
        assert data["self_deposit_reward_percent"] == 6.0
        assert data["direct_referral_reward_percent"] == 4.0
        print(f"✓ Updated promotion: {data['name']}")
        return data
    
    def test_admin_delete_promotion(self, admin_client):
        """Test admin delete promotion"""
        # First create a promotion
        promo_data = {
            "name": "TEST_Delete_" + datetime.now().strftime("%Y%m%d%H%M%S"),
            "start_date": datetime.now().strftime("%Y-%m-%d"),
            "end_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            "self_deposit_reward_percent": 1.0,
            "direct_referral_reward_percent": 0.5,
            "is_active": False
        }
        
        create_response = admin_client.post(f"{BASE_URL}/api/admin/promotions", json=promo_data)
        assert create_response.status_code == 200
        created = create_response.json()
        promotion_id = created["promotion_id"]
        
        # Delete the promotion
        response = admin_client.delete(f"{BASE_URL}/api/admin/promotions/{promotion_id}")
        assert response.status_code == 200, f"Failed to delete promotion: {response.text}"
        
        # Verify deletion
        get_response = admin_client.get(f"{BASE_URL}/api/admin/promotions")
        promotions = get_response.json()
        promotion_ids = [p["promotion_id"] for p in promotions]
        assert promotion_id not in promotion_ids
        print(f"✓ Deleted promotion successfully")
    
    def test_get_promotion_rewards(self, admin_client):
        """Test get promotion rewards"""
        # Get all promotions first
        promos_response = admin_client.get(f"{BASE_URL}/api/admin/promotions")
        promotions = promos_response.json()
        
        if promotions:
            promotion_id = promotions[0]["promotion_id"]
            response = admin_client.get(f"{BASE_URL}/api/admin/promotions/{promotion_id}/rewards")
            assert response.status_code == 200, f"Failed to get rewards: {response.text}"
            data = response.json()
            
            assert "rewards" in data
            assert "total_distributed" in data
            assert "total_count" in data
            print(f"✓ Promotion rewards: {data['total_count']} rewards, ${data['total_distributed']:.2f} distributed")
        else:
            print("✓ No promotions to check rewards for")


class TestWithdrawalLimits:
    """Withdrawal limits tests"""
    
    def test_get_settings_with_limits(self, api_client):
        """Test settings endpoint returns withdrawal limits"""
        response = api_client.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200, f"Failed to get settings: {response.text}"
        data = response.json()
        
        assert "min_withdrawal_amount" in data
        assert "max_withdrawal_amount" in data
        print(f"✓ Withdrawal limits: Min ${data['min_withdrawal_amount']}, Max ${data['max_withdrawal_amount']}")
        return data
    
    def test_admin_update_withdrawal_limits(self, admin_client):
        """Test admin can update withdrawal limits"""
        # Get current settings
        get_response = admin_client.get(f"{BASE_URL}/api/settings")
        current_settings = get_response.json()
        
        # Update with new limits
        update_data = {
            **current_settings,
            "settings_id": "default",
            "min_withdrawal_amount": 25.0,
            "max_withdrawal_amount": 5000.0
        }
        
        response = admin_client.put(f"{BASE_URL}/api/admin/settings", json=update_data)
        assert response.status_code == 200, f"Failed to update settings: {response.text}"
        
        # Verify update
        verify_response = admin_client.get(f"{BASE_URL}/api/settings")
        data = verify_response.json()
        assert data["min_withdrawal_amount"] == 25.0
        assert data["max_withdrawal_amount"] == 5000.0
        print(f"✓ Updated withdrawal limits: Min $25, Max $5000")
    
    def test_withdrawal_below_minimum_rejected(self, user_client):
        """Test withdrawal below minimum is rejected"""
        # Get settings to know the minimum
        settings_response = user_client.get(f"{BASE_URL}/api/settings")
        settings = settings_response.json()
        min_amount = settings.get("min_withdrawal_amount", 10)
        
        # Try to withdraw below minimum
        withdrawal_data = {
            "amount": min_amount - 5,  # Below minimum
            "wallet_address": "TTestWalletAddress123456789"
        }
        
        response = user_client.post(f"{BASE_URL}/api/withdrawals", json=withdrawal_data)
        # Should be rejected with 400
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        assert "minimum" in response.text.lower() or "min" in response.text.lower()
        print(f"✓ Withdrawal below minimum (${min_amount - 5}) correctly rejected")
    
    def test_withdrawal_above_maximum_rejected(self, user_client):
        """Test withdrawal above maximum is rejected"""
        # Get settings to know the maximum
        settings_response = user_client.get(f"{BASE_URL}/api/settings")
        settings = settings_response.json()
        max_amount = settings.get("max_withdrawal_amount", 10000)
        
        # Try to withdraw above maximum
        withdrawal_data = {
            "amount": max_amount + 1000,  # Above maximum
            "wallet_address": "TTestWalletAddress123456789"
        }
        
        response = user_client.post(f"{BASE_URL}/api/withdrawals", json=withdrawal_data)
        # Should be rejected with 400
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        assert "maximum" in response.text.lower() or "max" in response.text.lower() or "insufficient" in response.text.lower()
        print(f"✓ Withdrawal above maximum (${max_amount + 1000}) correctly rejected")


class TestUserDashboard:
    """User dashboard tests"""
    
    def test_user_dashboard_loads(self, user_client):
        """Test user dashboard endpoint"""
        response = user_client.get(f"{BASE_URL}/api/user/dashboard")
        assert response.status_code == 200, f"Failed to get dashboard: {response.text}"
        data = response.json()
        
        # Check required fields
        assert "total_balance" in data
        assert "roi_balance" in data
        assert "commission_balance" in data
        assert "current_level" in data
        print(f"✓ Dashboard loaded: Balance ${data['total_balance']:.2f}, Level {data['current_level']}")
        return data


# Fixtures
@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Admin authentication failed")


@pytest.fixture
def user_token(api_client):
    """Get user authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": USER_EMAIL,
        "password": USER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("User authentication failed")


@pytest.fixture
def admin_client(api_client, admin_token):
    """Session with admin auth header"""
    api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
    return api_client


@pytest.fixture
def user_client(api_client, user_token):
    """Session with user auth header"""
    api_client.headers.update({"Authorization": f"Bearer {user_token}"})
    return api_client


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
