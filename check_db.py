
import sys
import asyncio
from pathlib import Path
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Add root dir to path
ROOT_DIR = Path(__file__).parent
sys.path.insert(0, str(ROOT_DIR))

from src.database.models import User, Organization, ScrapingTask, Sentencia

async def check_db():
    print("Checking Database...")
    engine = create_async_engine("sqlite+aiosqlite:///./sencker.db")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Check Users and Orgs
        print("\n=== USERS ===")
        result = await session.execute(select(User))
        users = result.scalars().all()
        for u in users:
            print(f"User: {u.email} | ID: {u.id} | OrgID: {u.organization_id}")
            
        print("\n=== ORGANIZATIONS ===")
        result = await session.execute(select(Organization))
        orgs = result.scalars().all()
        for o in orgs:
            print(f"Org: {o.name} | ID: {o.id}")
            
        # Check Tasks
        print("\n=== RECENT TASKS ===")
        result = await session.execute(select(ScrapingTask).order_by(ScrapingTask.created_at.desc()).limit(5))
        tasks = result.scalars().all()
        for t in tasks:
            print(f"Task: {t.id} | Status: {t.status} | Query: {t.search_query}")
            print(f"Result Preview: {str(t.result)[:100] if t.result else 'None'}")
            print(f"Error: {t.error}")
            
        # Check Sentencias
        print("\n=== SENTENCIAS ===")
        result = await session.execute(select(Sentencia))
        sentencias = result.scalars().all()
        print(f"Total Sentencias: {len(sentencias)}")
        for s in sentencias:
            print(f" - {s.rol} ({s.tribunal})")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_db())
