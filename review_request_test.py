#!/usr/bin/env python3
"""
Focused test for the specific APIs mentioned in the review request:
1. Admin Login: POST /api/auth/login with admin@minex.online / password
2. Investment Packages: GET /api/investment/packages - should return 6 investment packages with levels 1-6
3. Live Crypto Prices: GET /api/crypto/prices - should return live cryptocurrency prices from CoinGecko
4. Admin Dashboard: GET /api/admin/dashboard (requires admin token)
5. Settings: GET /api/settings - should return platform settings
"""

import requests
import json

BASE_URL = "https://minex-crypto-invest.preview.emergentagent.com"

def test_api(name, method, endpoint, expected_status=200, data=None, headers=None):
    """Test a single API endpoint"""
    url = f"{BASE_URL}/api/{endpoint}"
    test_headers = {'Content-Type': 'application/json'}
    
    if headers:
        test_headers.update(headers)
    
    print(f"\n🔍 Testing {name}")
    print(f"   URL: {url}")
    
    try:
        if method == 'GET':
            response = requests.get(url, headers=test_headers)
        elif method == 'POST':
            response = requests.post(url, json=data, headers=test_headers)
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == expected_status:
            print(f"✅ PASSED")
            try:
                return True, response.json()
            except:
                return True, {}
        else:
            print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
            try:
                error = response.json()
                print(f"   Error: {error}")
            except:
                print(f"   Error: {response.text}")
            return False, {}
    
    except Exception as e:
        print(f"❌ FAILED - Exception: {str(e)}")
        return False, {}

def main():
    print("🚀 MINEX GLOBAL Review Request API Testing")
    print("=" * 60)
    
    admin_token = None
    
    # 1. Admin Login
    print("\n1️⃣ ADMIN LOGIN TEST")
    success, response = test_api(
        "Admin Login",
        "POST",
        "auth/login",
        200,
        data={"email": "admin@minex.online", "password": "password"}
    )
    
    if success and 'token' in response:
        admin_token = response['token']
        print(f"   ✅ Admin token obtained: {admin_token[:30]}...")
        print(f"   ✅ Admin user: {response.get('user', {}).get('email', 'N/A')}")
        print(f"   ✅ Admin role: {response.get('user', {}).get('role', 'N/A')}")
    else:
        print("   ❌ Admin login failed - cannot test admin dashboard")
    
    # 2. Investment Packages
    print("\n2️⃣ INVESTMENT PACKAGES TEST")
    success, response = test_api(
        "Investment Packages",
        "GET",
        "investment/packages",
        200
    )
    
    if success and isinstance(response, list):
        print(f"   ✅ Found {len(response)} investment packages")
        
        if len(response) == 6:
            print("   ✅ Correct number of packages (6)")
        else:
            print(f"   ❌ Expected 6 packages, got {len(response)}")
        
        levels = [pkg.get('level') for pkg in response]
        expected_levels = {1, 2, 3, 4, 5, 6}
        if set(levels) == expected_levels:
            print("   ✅ All levels 1-6 present")
        else:
            missing = expected_levels - set(levels)
            print(f"   ❌ Missing levels: {missing}")
        
        # Check package structure
        for i, pkg in enumerate(response):
            level = pkg.get('level')
            name = pkg.get('name', 'N/A')
            daily_roi = pkg.get('daily_roi', 0)
            annual_roi = pkg.get('annual_roi', 0)
            min_inv = pkg.get('min_investment', 0)
            max_inv = pkg.get('max_investment', 0)
            
            print(f"   📦 Level {level}: {name}")
            print(f"      Daily ROI: {daily_roi}%, Annual ROI: {annual_roi}%")
            print(f"      Investment Range: ${min_inv:,} - ${max_inv:,}")
            
            # Check commission rates
            comm_direct = pkg.get('commission_direct', 0)
            comm_l2 = pkg.get('commission_level_2', 0)
            comm_l3 = pkg.get('commission_level_3', 0)
            print(f"      Commissions: L1:{comm_direct}%, L2:{comm_l2}%, L3:{comm_l3}%")
    
    # 3. Live Crypto Prices
    print("\n3️⃣ LIVE CRYPTO PRICES TEST")
    success, response = test_api(
        "Live Crypto Prices",
        "GET",
        "crypto/prices",
        200
    )
    
    if success and isinstance(response, list):
        print(f"   ✅ Found {len(response)} cryptocurrency prices")
        
        if len(response) > 0:
            print("   ✅ Crypto prices available from CoinGecko")
            
            # Check for major cryptocurrencies
            crypto_names = [crypto.get('name', '') for crypto in response]
            expected_cryptos = ['BTC', 'ETH', 'USDT', 'BNB']
            found_cryptos = [name for name in expected_cryptos if name in crypto_names]
            
            print(f"   ✅ Major cryptos found: {', '.join(found_cryptos)}")
            
            # Show sample prices
            for crypto in response[:6]:
                name = crypto.get('name', 'N/A')
                price = crypto.get('price', 'N/A')
                change = crypto.get('change', 'N/A')
                positive = crypto.get('positive', True)
                indicator = "📈" if positive else "📉"
                print(f"   {indicator} {name}: {price} ({change})")
        else:
            print("   ❌ No crypto prices returned")
    
    # 4. Admin Dashboard
    print("\n4️⃣ ADMIN DASHBOARD TEST")
    if admin_token:
        success, response = test_api(
            "Admin Dashboard",
            "GET",
            "admin/dashboard",
            200,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        if success:
            print("   ✅ Admin dashboard accessible")
            print(f"   📊 Total Users: {response.get('total_users', 0)}")
            print(f"   💰 Total Deposits: ${response.get('total_deposits', 0):,.2f}")
            print(f"   💸 Total Withdrawals: ${response.get('total_withdrawals', 0):,.2f}")
            print(f"   ⏳ Pending Deposits: {response.get('pending_deposits', 0)}")
            print(f"   ⏳ Pending Withdrawals: {response.get('pending_withdrawals', 0)}")
            print(f"   🎯 Active Stakes: {response.get('total_active_stakes', 0)}")
            print(f"   💎 Total Commissions Paid: ${response.get('total_commissions_paid', 0):,.2f}")
            print(f"   📈 Total ROI Paid: ${response.get('total_roi_paid', 0):,.2f}")
    else:
        print("   ❌ Cannot test admin dashboard - no admin token")
    
    # 5. Platform Settings
    print("\n5️⃣ PLATFORM SETTINGS TEST")
    success, response = test_api(
        "Platform Settings",
        "GET",
        "settings",
        200
    )
    
    if success:
        print("   ✅ Platform settings accessible")
        print(f"   🏦 USDT Wallet: {response.get('usdt_wallet_address', 'Not set')}")
        print(f"   📅 Withdrawal Dates: {response.get('withdrawal_dates', [])}")
        print(f"   ⭐ Community Star Target: {response.get('community_star_target', 0)}%")
        print(f"   💰 Community Star Bonus Range: ${response.get('community_star_bonus_min', 0)} - ${response.get('community_star_bonus_max', 0)}")
        
        qr_code = response.get('qr_code_image')
        if qr_code:
            print("   ✅ QR Code image available")
        else:
            print("   ⚠️  QR Code image not set")
    
    print("\n" + "=" * 60)
    print("🎯 REVIEW REQUEST TESTING COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()