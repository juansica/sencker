
import sys
import asyncio
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# Add root dir to path
ROOT_DIR = Path(__file__).parent
sys.path.insert(0, str(ROOT_DIR))

async def migrate():
    print("Migrating Database...")
    engine = create_async_engine("sqlite+aiosqlite:///./sencker.db")
    
    async with engine.begin() as conn:
        try:
            print("Adding progress_message column...")
            await conn.execute(text("ALTER TABLE scraping_tasks ADD COLUMN progress_message VARCHAR(255)"))
            print("Column added successfully.")
        except Exception as e:
            print(f"Migration failed (maybe column exists?): {e}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate())
