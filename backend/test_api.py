import requests
import json

BASE_URL = "http://localhost:8000"

def test_api():
    print("Testing ShapeFit API...")
    
    # Test health
    print("\n1. Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")
        return
    
    # Test register
    print("\n2. Testing user registration...")
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": "Test User",
                "email": "test@example.com",
                "password": "test123"
            }
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test login
    print("\n3. Testing user login...")
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            data={
                "username": "test@example.com",
                "password": "test123"
            }
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            token = response.json()["access_token"]
            
            # Test protected endpoint
            print("\n4. Testing protected endpoint (get user info)...")
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
            print(f"   Status: {response.status_code}")
            print(f"   Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print("\n✅ API tests completed!")

if __name__ == "__main__":
    test_api()
