import pytest
import requests

BASE_URL = "http://localhost:3000/api/admin/csrf-token"
ADMIN_POST_URL = "http://localhost:3000/api/admin/save-package"


def test_csrf_token_success():
    """
    Test that the /api/admin/csrf-token endpoint returns a CSRF token.
    """
    resp = requests.get(BASE_URL, cookies={})
    assert resp.status_code == 200
    data = resp.json()
    assert "csrfToken" in data
    assert isinstance(data["csrfToken"], str) or data["csrfToken"] is None


def test_csrf_token_with_cookies():
    """
    Test that the endpoint works when cookies are sent (simulate browser session).
    """
    cookies = {"session": "dummy"}
    resp = requests.get(BASE_URL, cookies=cookies)
    assert resp.status_code == 200
    data = resp.json()
    assert "csrfToken" in data


def test_csrf_token_method_not_allowed():
    """
    Test that POST is not allowed on the CSRF token endpoint.
    """
    resp = requests.post(BASE_URL)
    assert resp.status_code in (404, 405)


def test_admin_post_missing_csrf():
    """
    Test that POST to admin endpoint without CSRF token fails.
    """
    payload = {"name": "Test", "country_name": "Greece", "country_code": "GR", "data_amount": 5, "days": 30, "base_price": 10}
    resp = requests.post(ADMIN_POST_URL, json=payload)
    assert resp.status_code in (403, 401, 400)


def test_admin_post_invalid_csrf():
    """
    Test that POST to admin endpoint with invalid CSRF token fails.
    """
    payload = {"name": "Test", "country_name": "Greece", "country_code": "GR", "data_amount": 5, "days": 30, "base_price": 10}
    headers = {"X-CSRF-Token": "invalidtoken"}
    resp = requests.post(ADMIN_POST_URL, json=payload, headers=headers)
    assert resp.status_code in (403, 401, 400) 