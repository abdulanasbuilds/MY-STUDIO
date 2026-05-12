# MY STUDIO — security.py
# PURPOSE: Request authentication, CORS headers, and auth decorators
# CONNECTS TO: main.py (all endpoints), db.py

import os
import time
import functools
from typing import Any, Callable


def verify_request(data: dict[str, Any]) -> bool:
    """Verify request authenticity and freshness.
    
    Checks:
    1. API_SECRET_TOKEN matches
    2. Timestamp is within 5-minute window (replay attack prevention)
    
    Args:
        data: Request data containing api_token and timestamp.
    
    Returns:
        True if request is valid, False otherwise.
    """
    token = data.get("api_token")
    timestamp = data.get("timestamp", 0)
    
    expected_token = os.environ.get("API_SECRET_TOKEN", "")
    if not expected_token or token != expected_token:
        return False
    
    # Reject requests older than 5 minutes
    if abs(time.time() - float(timestamp)) > 300:
        return False
    
    return True


def get_cors_headers() -> dict[str, str]:
    """Return CORS headers for Modal web endpoints.
    
    Returns:
        Dictionary of CORS headers.
    """
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
    }


def require_auth(func: Callable[..., Any]) -> Callable[..., Any]:
    """Decorator to require authentication on Modal endpoints.
    
    Wraps a function to verify the request before processing.
    Returns 401 if authentication fails.
    """
    @functools.wraps(func)
    def wrapper(data: dict[str, Any], *args: Any, **kwargs: Any) -> Any:
        if not verify_request(data):
            return {"error": "Unauthorized"}, 401
        return func(data, *args, **kwargs)
    return wrapper
