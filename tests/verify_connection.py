
import asyncio
import sys
import os
import uuid
from datetime import datetime

# Add project root to path
sys.path.append(os.getcwd())

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

# Import models to ensure they are registered with Base
from src.database.models import Base, User, Organization, ScrapingTask, Sentencia, TaskStatus, UserRole
from src.api.scraper_routes import run_scraper_task

TEST_DB_NAME = "sencker_test.db"
DB_URL = f"sqlite+aiosqlite:///./{TEST_DB_NAME}"

async def main():
    # Clean up old test db
    if os.path.exists(TEST_DB_NAME):
        os.remove(TEST_DB_NAME)

    print(f"Connecting to {DB_URL}...")
    engine = create_async_engine(DB_URL)
    
    # Initialize DB (Create Tables)
    async with engine.begin() as conn:
        print("Creating tables...")
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    task_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    org_id = str(uuid.uuid4())
    
    async with async_session() as session:
        # 1. Create Data
        print("Creating test organization and user...")
        org = Organization(
            id=org_id, 
            name="Test Org", 
            slug=f"test-org-{uuid.uuid4()}", 
            subdomain=f"test-{uuid.uuid4()}"
        )
        session.add(org)
        
        user = User(
            id=user_id,
            email=f"tester-{uuid.uuid4()}@example.com",
            hashed_password="hash",
            organization_id=org_id,
            role=UserRole.ADMIN
        )
        session.add(user)
        
        task = ScrapingTask(
            id=task_id,
            user_id=user_id,
            task_type="civil",
            search_query="TEST_SEARCH",
            status=TaskStatus.PENDING
        )
        session.add(task)
        await session.commit()
        
    print(f"Task created: {task_id}. Running scraper...")
    
    # 2. Run Scraper Logic
    try:
        # Pass the TEST DB URL to the function
        await run_scraper_task(task_id, DB_URL)
        print("Scraper finished.")
    except Exception as e:
        print(f"Scraper failed: {e}")
        import traceback
        traceback.print_exc()

    # 3. Verify Results
    async with async_session() as session:
        print("Verifying task status...")
        task_res = await session.execute(select(ScrapingTask).where(ScrapingTask.id == task_id))
        task_end = task_res.scalar_one()
        
        print(f"Task Status: {task_end.status}")
        
        print("Verifying Sentencias...")
        sentencias_res = await session.execute(
            select(Sentencia).where(Sentencia.organization_id == org_id)
        )
        sentencias = sentencias_res.scalars().all()
        
        print(f"Found {len(sentencias)} sentencias for org {org_id}:")
        for s in sentencias:
            print(f" - {s.rol}: {s.caratula} ({s.tribunal})")
            
        if len(sentencias) > 0:
            print("SUCCESS: Sentencias created.")
        else:
            print("FAILURE: No sentencias created.")

    await engine.dispose()
    
    # Clean up
    if os.path.exists(TEST_DB_NAME):
        os.remove(TEST_DB_NAME)

if __name__ == "__main__":
    asyncio.run(main())
