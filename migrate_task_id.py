from sqlalchemy import create_engine, text
import os

# Configuración base de datos
DB_URL = os.getenv("DATABASE_URL", "sqlite:///./sencker.db")

def add_scraping_task_id_column():
    print(f"Connecting to {DB_URL}...")
    engine = create_engine(DB_URL)
    
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE sentencias ADD COLUMN scraping_task_id VARCHAR(36)"))
            conn.commit()
            print("Successfully added 'scraping_task_id' column to 'sentencias' table.")
        except Exception as e:
            print(f"Error adding column (might already exist): {e}")

if __name__ == "__main__":
    add_scraping_task_id_column()
