"""
MINEX GLOBAL Platform - Iteration 4 Tests
Testing: ROI distribution, Profit share, Package management, Password reset, User dashboard
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://minex-platform.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@minex.online"
ADMIN_PASSWORD = "password"
MASTER_EMAIL = "masteruser@gmail.com"
MASTER_PASSWORD = "password"
TEST_USER_EMAIL = "testuser@example.com"
TEST_USER_PASSWORD = "password"


class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_admin_login(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "admin"
        assert data["user"]["is_email_verified"] == True
        print(f"✓ Admin login successful")
    
    def test_master_user_login(self):
        """Test master user login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MASTER_EMAIL,
            "password": MASTER_PASSWORD
        })
        assert response.status_code == 200, f"Master user login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["referral_code"] == "MASTER01"
        print(f"✓ Master user login successful")
    
    def test_test_user_login(self):
        """Test test user login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200, f"Test user login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["total_investment"] == 100.0
        print(f"✓ Test user login successful")


class TestROIDistribution:
    """Test ROI calculation and distribution"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    @pytest.fixture
    def test_user_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        return response.json()["token"]
    
    def test_roi_scheduler_status(self, admin_token):
        """Test ROI scheduler status endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/roi-scheduler/status",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "is_running" in data
        assert "last_run" in data
        assert "next_run" in data
        assert "schedule" in data
        print(f"✓ ROI scheduler status: running={data['is_running']}, schedule={data['schedule']}")
    
    def test_manual_roi_distribution(self, admin_token):
        """Test manual ROI distribution (Run Now button)"""
        # Get test user balance before
        test_user_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        before_roi = test_user_response.json()["user"]["roi_balance"]
        
        # Trigger manual ROI distribution
        response = requests.post(
            f"{BASE_URL}/api/admin/calculate-roi",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "stakes_processed" in data
        assert "total_roi_distributed" in data
        print(f"✓ Manual ROI distribution: {data['stakes_processed']} stakes, ${data['total_roi_distributed']} distributed")
        
        # Verify user balance updated
        test_user_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        after_roi = test_user_response.json()["user"]["roi_balance"]
        
        # ROI should have increased (or stayed same if already distributed today)
        assert after_roi >= before_roi, f"ROI balance should not decrease: before={before_roi}, after={after_roi}"
        print(f"✓ User ROI balance: before=${before_roi}, after=${after_roi}")
    
    def test_system_logs_show_roi_distribution(self, admin_token):
        """Test that system logs show ROI distribution history"""
        response = requests.get(
            f"{BASE_URL}/api/admin/system-logs",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        logs = response.json()
        
        # Should have at least one ROI distribution log
        roi_logs = [log for log in logs if log.get("type") == "auto_roi_distribution"]
        assert len(roi_logs) > 0, "No ROI distribution logs found"
        
        latest_log = roi_logs[0]
        assert "stakes_processed" in latest_log
        assert "total_roi_distributed" in latest_log
        assert "status" in latest_log
        print(f"✓ System logs show {len(roi_logs)} ROI distribution records")
    
    def test_user_dashboard_shows_roi_balance(self, test_user_token):
        """Test that user dashboard shows ROI balance"""
        response = requests.get(
            f"{BASE_URL}/api/user/dashboard",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "roi_balance" in data
        assert "total_balance" in data
        assert "daily_roi_percentage" in data
        assert data["roi_balance"] >= 0
        print(f"✓ User dashboard: ROI balance=${data['roi_balance']}, daily ROI={data['daily_roi_percentage']}%")


class TestPackageManagement:
    """Test admin package management"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_all_packages_admin(self, admin_token):
        """Test admin can get all packages including inactive"""
        response = requests.get(
            f"{BASE_URL}/api/admin/investment/packages",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        packages = response.json()
        assert isinstance(packages, list)
        print(f"✓ Admin can see {len(packages)} packages")
        
        # Verify package structure
        if packages:
            pkg = packages[0]
            assert "package_id" in pkg
            assert "level" in pkg
            assert "daily_roi" in pkg
            assert "is_active" in pkg
    
    def test_get_active_packages_user(self):
        """Test users only see active packages"""
        response = requests.get(f"{BASE_URL}/api/investment/packages")
        assert response.status_code == 200
        packages = response.json()
        
        # All returned packages should be active
        for pkg in packages:
            assert pkg.get("is_active", True) == True, f"Inactive package visible to users: {pkg['name']}"
        print(f"✓ Users see {len(packages)} active packages")
    
    def test_toggle_package_status(self, admin_token):
        """Test admin can toggle package active/inactive status"""
        # Get packages
        response = requests.get(
            f"{BASE_URL}/api/admin/investment/packages",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        packages = response.json()
        
        if not packages:
            pytest.skip("No packages to test toggle")
        
        # Find an active package to toggle
        active_pkg = next((p for p in packages if p.get("is_active", True)), None)
        if not active_pkg:
            pytest.skip("No active packages to toggle")
        
        package_id = active_pkg["package_id"]
        original_status = active_pkg.get("is_active", True)
        
        # Toggle status
        response = requests.patch(
            f"{BASE_URL}/api/admin/investment/packages/{package_id}/toggle",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] != original_status
        print(f"✓ Package toggled from {original_status} to {data['is_active']}")
        
        # Toggle back to original
        response = requests.patch(
            f"{BASE_URL}/api/admin/investment/packages/{package_id}/toggle",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        print(f"✓ Package toggled back to original status")
    
    def test_package_has_level_requirements(self, admin_token):
        """Test packages have level-wise team requirements"""
        response = requests.get(
            f"{BASE_URL}/api/admin/investment/packages",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        packages = response.json()
        
        # Find Silver package (Level 2) which should have requirements
        silver_pkg = next((p for p in packages if p.get("level") == 2), None)
        
        if silver_pkg:
            assert "direct_required" in silver_pkg
            assert "level_2_required" in silver_pkg
            print(f"✓ Silver package requirements: direct={silver_pkg['direct_required']}, level_2={silver_pkg['level_2_required']}")
        else:
            print("⚠ No Level 2 package found to verify requirements")


class TestUserDashboard:
    """Test user dashboard with promotion progress"""
    
    @pytest.fixture
    def test_user_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        return response.json()["token"]
    
    def test_dashboard_has_promotion_progress(self, test_user_token):
        """Test dashboard shows next level progress"""
        response = requests.get(
            f"{BASE_URL}/api/user/dashboard",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check for promotion progress fields
        assert "current_level" in data
        assert "team_counts_by_level" in data
        
        # If there's a next level, should have promotion_progress
        if data.get("next_level_requirements"):
            assert "promotion_progress" in data
            progress = data["promotion_progress"]
            assert "investment_met" in progress
            assert "direct_met" in progress
            print(f"✓ Dashboard shows promotion progress to Level {data['next_level_requirements']['level']}")
        else:
            print("✓ User at max level, no promotion progress needed")
    
    def test_dashboard_has_team_counts(self, test_user_token):
        """Test dashboard shows team counts by level"""
        response = requests.get(
            f"{BASE_URL}/api/user/dashboard",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        team_counts = data.get("team_counts_by_level", {})
        assert "level_1" in team_counts
        assert "level_2" in team_counts
        print(f"✓ Team counts: L1={team_counts['level_1']}, L2={team_counts['level_2']}")


class TestPasswordReset:
    """Test password reset flow"""
    
    def test_forgot_password_endpoint(self):
        """Test forgot password sends reset code"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": TEST_USER_EMAIL
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Forgot password endpoint works")
    
    def test_forgot_password_nonexistent_email(self):
        """Test forgot password doesn't reveal if email exists"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": "nonexistent@example.com"
        })
        # Should return 200 for security (don't reveal if email exists)
        assert response.status_code == 200
        print(f"✓ Forgot password doesn't reveal email existence")
    
    def test_verify_reset_code_invalid(self):
        """Test verify reset code rejects invalid codes"""
        response = requests.post(f"{BASE_URL}/api/auth/verify-reset-code", json={
            "email": TEST_USER_EMAIL,
            "code": "000000"
        })
        assert response.status_code == 400
        print(f"✓ Invalid reset code rejected")
    
    def test_reset_password_invalid_code(self):
        """Test reset password rejects invalid codes"""
        response = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "email": TEST_USER_EMAIL,
            "code": "000000",
            "new_password": "newpassword123",
            "confirm_password": "newpassword123"
        })
        assert response.status_code == 400
        print(f"✓ Reset password rejects invalid code")
    
    def test_reset_password_mismatch(self):
        """Test reset password rejects mismatched passwords"""
        response = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "email": TEST_USER_EMAIL,
            "code": "123456",
            "new_password": "newpassword123",
            "confirm_password": "differentpassword"
        })
        assert response.status_code == 400
        print(f"✓ Reset password rejects mismatched passwords")


class TestDirectCommission:
    """Test direct commission on deposit to Level 1 referrer"""
    
    @pytest.fixture
    def master_user_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MASTER_EMAIL,
            "password": MASTER_PASSWORD
        })
        return response.json()["token"]
    
    def test_master_user_has_test_user_as_referral(self, master_user_token):
        """Test master user has test user as direct referral"""
        response = requests.get(
            f"{BASE_URL}/api/user/team",
            headers={"Authorization": f"Bearer {master_user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        direct_referrals = data.get("level_1", data.get("direct", []))
        assert len(direct_referrals) > 0, "Master user should have direct referrals"
        
        # Check if test user is in direct referrals
        test_user_found = any(
            ref.get("email") == TEST_USER_EMAIL 
            for ref in direct_referrals
        )
        assert test_user_found, "Test user should be in master user's direct referrals"
        print(f"✓ Master user has {len(direct_referrals)} direct referrals including test user")
    
    def test_commissions_endpoint(self, master_user_token):
        """Test commissions endpoint returns commission data"""
        response = requests.get(
            f"{BASE_URL}/api/commissions",
            headers={"Authorization": f"Bearer {master_user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "commissions" in data
        assert "summary" in data
        print(f"✓ Commissions endpoint works, total: ${data['summary'].get('total', 0)}")


class TestEmailVerification:
    """Test email verification flow"""
    
    def test_send_verification_endpoint(self):
        """Test send verification code endpoint"""
        response = requests.post(f"{BASE_URL}/api/auth/send-verification", json={
            "email": "newuser_test@example.com"
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Send verification endpoint works")
    
    def test_verify_email_invalid_code(self):
        """Test verify email rejects invalid codes"""
        response = requests.post(f"{BASE_URL}/api/auth/verify-email", json={
            "email": "newuser_test@example.com",
            "code": "000000"
        })
        assert response.status_code == 400
        print(f"✓ Invalid verification code rejected")


class TestAdminDashboard:
    """Test admin dashboard endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_admin_dashboard_stats(self, admin_token):
        """Test admin dashboard returns stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "total_users" in data
        assert "total_deposits" in data
        assert "total_withdrawals" in data
        assert "total_roi_paid" in data
        print(f"✓ Admin dashboard: {data['total_users']} users, ${data['total_roi_paid']} ROI paid")
    
    def test_admin_users_list(self, admin_token):
        """Test admin can list all users"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        users = response.json()
        assert isinstance(users, list)
        assert len(users) >= 3  # admin, master, test user
        print(f"✓ Admin can see {len(users)} users")
    
    def test_admin_email_logs(self, admin_token):
        """Test admin can view email logs"""
        response = requests.get(
            f"{BASE_URL}/api/admin/email-logs",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        logs = response.json()
        assert isinstance(logs, list)
        print(f"✓ Admin can see {len(logs)} email logs")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
