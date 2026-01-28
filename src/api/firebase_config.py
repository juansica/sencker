"""
PJUD Sencker - Firebase Admin Configuration.

Initialize Firebase Admin SDK for token verification.
"""

from __future__ import annotations

import os
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, auth as firebase_auth

from dotenv import load_dotenv

load_dotenv()

# Firebase initialization flag
_firebase_initialized = False


def initialize_firebase() -> None:
    """Initialize Firebase Admin SDK."""
    global _firebase_initialized
    
    if _firebase_initialized:
        return
    
    # Path to service account key
    service_account_path = os.getenv(
        "FIREBASE_SERVICE_ACCOUNT_PATH",
        str(Path(__file__).parent.parent.parent / "firebase-service-account.json")
    )
    
    if not os.path.exists(service_account_path):
        raise FileNotFoundError(
            f"Firebase service account not found: {service_account_path}\n"
            "Please set FIREBASE_SERVICE_ACCOUNT_PATH in .env"
        )
    
    cred = credentials.Certificate(service_account_path)
    firebase_admin.initialize_app(cred)
    
    _firebase_initialized = True
    print("✓ Firebase Admin SDK initialized")


def verify_firebase_token(id_token: str) -> dict:
    """
    Verify a Firebase ID token.
    
    Args:
        id_token: Firebase ID token from client
    
    Returns:
        Decoded token with user info (uid, email, etc.)
    
    Raises:
        firebase_admin.auth.InvalidIdTokenError: If token is invalid
    """
    initialize_firebase()
    return firebase_auth.verify_id_token(id_token)


def get_firebase_user(uid: str) -> firebase_auth.UserRecord:
    """Get Firebase user by UID."""
    initialize_firebase()
    return firebase_auth.get_user(uid)
