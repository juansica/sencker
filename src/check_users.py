
"""
PJUD Sencker - User Verification Script.

Run this script to check if users exist in both Firebase Auth and the local Database.
Usage: python src/check_users.py
"""

import sys
import asyncio
from pathlib import Path

# Add root directory to path
ROOT_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT_DIR))

from sqlalchemy import select
from firebase_admin import auth as firebase_auth

from src.database.database import AsyncSessionLocal
from src.database.models import User
from src.api.firebase_config import initialize_firebase


async def get_db_users():
    """Fetch all users from local SQL database."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User))
        return result.scalars().all()


def get_firebase_users():
    """Fetch all users from Firebase Auth."""
    initialize_firebase()
    # List users (batches of 1000)
    page = firebase_auth.list_users()
    users = []
    while page:
        users.extend(page.users)
        page = page.get_next_page()
    return users


async def main():
    print("=" * 60)
    print("USER VERIFICATION TOOL")
    print("=" * 60)
    
    # 1. Fetch Local Users
    print("\n[Local Database]")
    try:
        db_users = await get_db_users()
        print(f"Found {len(db_users)} users in local SQL DB.")
    except Exception as e:
        print(f"❌ Error fetching local users: {e}")
        db_users = []

    # 2. Fetch Firebase Users
    print("\n[Firebase Auth]")
    try:
        fb_users = get_firebase_users()
        print(f"Found {len(fb_users)} users in Firebase Auth.")
    except Exception as e:
        print(f"❌ Error fetching Firebase users: {e}")
        fb_users = []
        
    # 3. Compare
    print("\n" + "=" * 60)
    print(f"{'UID':<30} | {'Email':<30} | {'Local DB':<10} | {'Firebase':<10}")
    print("-" * 60)
    
    # Create a map of all UIDs
    all_uids = set([u.id for u in db_users]) | set([u.uid for u in fb_users])
    
    db_map = {u.id: u for u in db_users}
    fb_map = {u.uid: u for u in fb_users}
    
    for uid in all_uids:
        in_db = "✅" if uid in db_map else "❌"
        in_fb = "✅" if uid in fb_map else "❌"
        
        email = "Unknown"
        if uid in fb_map:
            email = fb_map[uid].email
        elif uid in db_map:
            email = db_map[uid].email
            
        print(f"{uid[:28]:<30} | {email[:28]:<30} | {in_db:<10} | {in_fb:<10}")
    
    print("=" * 60)
    
    # Summary
    only_db = [uid for uid in all_uids if uid in db_map and uid not in fb_map]
    only_fb = [uid for uid in all_uids if uid not in db_map and uid in fb_map]
    
    if only_db:
        print(f"\n⚠️  WARNING: {len(only_db)} users exists ONLY in Local DB (Data sync issue?)")
    if only_fb:
        print(f"\nℹ️  NOTE: {len(only_fb)} users exists ONLY in Firebase (Signed up but never logged in?)")
        
    if not only_db and not only_fb:
        print("\n✅ All users are synced correctly!")


if __name__ == "__main__":
    asyncio.run(main())
