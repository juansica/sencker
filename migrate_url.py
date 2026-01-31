from sqlalchemy import create_engine, text
import os

# Configuración base de datos (usando SQLite por defecto para desarrollo local)
# Asegúrate de usar la misma URL que en tu .env o hardcodeada si es necesario para este script
DB_URL = os.getenv("DATABASE_URL", "sqlite:///./sencker.db")

def add_url_column():
    print(f"Connecting to {DB_URL}...")
    engine = create_engine(DB_URL)
    
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE sentencias ADD COLUMN url VARCHAR(500)"))
            conn.commit()
            print("Successfully added 'url' column to 'sentencias' table.")
        except Exception as e:
            print(f"Error adding column (might already exist): {e}")

if __name__ == "__main__":
    add_url_column()
