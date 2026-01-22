"""
ReLocal Feature Tests - Testing 4 key features:
1. QR code redirect to product page
2. Product page accessible without login
3. Registration with optional full_name
4. Shopkeeper QR code generation
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://shoplocal-28.preview.emergentagent.com')

class TestQRCodeRedirect:
    """Test QR code scanning redirects to product page"""
    
    def test_qr_scan_returns_303_redirect(self):
        """QR scan should return 303 redirect"""
        response = requests.get(
            f"{BASE_URL}/api/qr/scan/test_qr_001",
            allow_redirects=False
        )
        assert response.status_code == 303, f"Expected 303, got {response.status_code}"
        
    def test_qr_scan_redirects_to_correct_url(self):
        """QR scan should redirect to frontend product page"""
        response = requests.get(
            f"{BASE_URL}/api/qr/scan/test_qr_001",
            allow_redirects=False
        )
        location = response.headers.get('Location', '')
        assert '/products/test_product_001' in location, f"Expected redirect to product page, got: {location}"
        
    def test_qr_scan_invalid_code_returns_404(self):
        """Invalid QR code should return 404"""
        response = requests.get(
            f"{BASE_URL}/api/qr/scan/invalid_qr_code_xyz",
            allow_redirects=False
        )
        assert response.status_code == 404


class TestProductAccessWithoutLogin:
    """Test product page is accessible without authentication"""
    
    def test_product_endpoint_accessible_without_auth(self):
        """Product endpoint should work without auth header"""
        response = requests.get(f"{BASE_URL}/api/products/test_product_001")
        assert response.status_code == 200
        
    def test_product_returns_correct_data(self):
        """Product endpoint should return product details"""
        response = requests.get(f"{BASE_URL}/api/products/test_product_001")
        data = response.json()
        
        assert data['product_id'] == 'test_product_001'
        assert data['name'] == 'Handcrafted Ceramic Bowl'
        assert 'shop' in data
        assert data['shop']['name'] == 'Barcelona Pottery Studio'
        
    def test_product_not_found_returns_404(self):
        """Non-existent product should return 404"""
        response = requests.get(f"{BASE_URL}/api/products/nonexistent_product")
        assert response.status_code == 404


class TestRegistrationWithFullName:
    """Test registration API with optional full_name field"""
    
    def test_register_with_full_name(self):
        """Registration with full_name should use that name"""
        test_email = f"test_fullname_{int(time.time())}@test.com"
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": test_email,
                "password": "testpass123",
                "full_name": "John Test User"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data['name'] == 'John Test User'
        assert data['email'] == test_email
        assert data['role'] == 'tourist'
        
    def test_register_without_full_name(self):
        """Registration without full_name should derive name from email"""
        test_email = f"test_nofullname_{int(time.time())}@test.com"
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": test_email,
                "password": "testpass123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        # Name should be derived from email prefix
        assert 'test_nofullname' in data['name'].lower() or 'Test_Nofullname' in data['name']
        
    def test_register_duplicate_email_fails(self):
        """Registration with existing email should fail"""
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": "test.tourist1@relocal.com",
                "password": "testpass123"
            }
        )
        assert response.status_code == 400
        assert 'already registered' in response.json().get('detail', '').lower()


class TestLoginFlow:
    """Test login functionality"""
    
    def test_login_tourist_success(self):
        """Tourist login should succeed with correct credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "test.tourist1@relocal.com",
                "password": "password123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data['user_id'] == 'test_tourist_001'
        assert data['role'] == 'tourist'
        
    def test_login_shopkeeper_success(self):
        """Shopkeeper login should succeed with correct credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "test.seller2@relocal.com",
                "password": "password123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data['user_id'] == 'test_shopkeeper_002'
        assert data['role'] == 'shopkeeper'
        
    def test_login_invalid_credentials_fails(self):
        """Login with wrong password should fail"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "test.tourist1@relocal.com",
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401


class TestShopkeeperQRGeneration:
    """Test shopkeeper QR code generation"""
    
    @pytest.fixture
    def shopkeeper_session(self):
        """Get shopkeeper session token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "test.seller2@relocal.com",
                "password": "password123"
            }
        )
        cookies = response.cookies
        return cookies
        
    def test_qr_generate_requires_auth(self):
        """QR generation should require authentication"""
        response = requests.get(f"{BASE_URL}/api/qr/generate/test_product_001")
        assert response.status_code == 401
        
    def test_qr_generate_returns_image(self, shopkeeper_session):
        """QR generation should return PNG image"""
        response = requests.get(
            f"{BASE_URL}/api/qr/generate/test_product_001",
            cookies=shopkeeper_session
        )
        assert response.status_code == 200
        assert response.headers.get('content-type') == 'image/png'
        # Check it's a valid PNG (starts with PNG signature)
        assert response.content[:8] == b'\x89PNG\r\n\x1a\n'


class TestShopProducts:
    """Test shop products endpoint"""
    
    def test_get_shop_products_public(self):
        """Shop products should be publicly accessible"""
        response = requests.get(f"{BASE_URL}/api/shops/test_shop_001/products")
        assert response.status_code == 200
        products = response.json()
        assert isinstance(products, list)
        assert len(products) > 0
        
    def test_shop_products_contain_test_product(self):
        """Shop products should include test product"""
        response = requests.get(f"{BASE_URL}/api/shops/test_shop_001/products")
        products = response.json()
        product_ids = [p['product_id'] for p in products]
        assert 'test_product_001' in product_ids


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
