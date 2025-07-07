import pytest
import requests

BASE_URL = "http://localhost:3000/api/admin/csrf-token"


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