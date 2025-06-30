import requests
import pytest

API_URL = 'http://localhost:3000/api'

@pytest.mark.parametrize('country_code', ['DE', 'AL'])
def test_packages_country_filter(country_code):
    resp = requests.get(f'{API_URL}/packages', params={'country_code': country_code})
    assert resp.status_code == 200
    data = resp.json()['data']
    assert all(pkg['country_code'] == country_code for pkg in data)

def test_checkout_country_package_success():
    # Assume AL package exists with id 'albania-1gb'
    payload = {
        'packageId': 'albania-1gb',
        'country_code': 'AL',
        'email': 'test@example.com',
        'name': 'Test',
        'surname': 'User'
    }
    resp = requests.post(f'{API_URL}/checkout', json=payload)
    assert resp.status_code == 200

def test_checkout_country_package_fail():
    # Try to buy DE package on AL country
    payload = {
        'packageId': 'germany-1gb',
        'country_code': 'AL',
        'email': 'test@example.com',
        'name': 'Test',
        'surname': 'User'
    }
    resp = requests.post(f'{API_URL}/checkout', json=payload)
    assert resp.status_code == 400 