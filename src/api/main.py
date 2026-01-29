"""
PJUD Sencker - FastAPI Application.

Main application entry point with CORS and routing.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from dotenv import load_dotenv

load_dotenv()

# Import database
from src.database.database import init_db, close_db

# Import routers
from src.api.auth_routes import router as auth_router
from src.api.scraper_routes import router as scraper_router
from src.api.admin_routes import router as admin_router
from src.api.webhook_routes import router as webhook_router
from src.api.organization_routes import router as organization_router
from src.api.sentencia_routes import router as sentencia_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Application lifespan handler."""
    # Startup: Initialize database
    await init_db()
    print("✓ Database initialized")
    
    yield
    
    # Shutdown: Close connections
    await close_db()
    print("✓ Database connections closed")


# Create FastAPI app
app = FastAPI(
    title="Sencker API",
    description="PJUD Web Scraper API - Scraping del Poder Judicial de Chile",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS Configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
ALLOWED_ORIGINS = [
    FRONTEND_URL,
    "http://localhost:5173",  # Vite default
    "http://localhost:3000",  # Alternative
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(scraper_router)
app.include_router(admin_router)
app.include_router(webhook_router)
app.include_router(organization_router)
app.include_router(sentencia_router)


# ============ Health Check ============

@app.get("/api/health", tags=["Health"])
async def health_check() -> dict:
    """Check if the API is running."""
    return {
        "status": "healthy",
        "version": "0.1.0",
        "service": "sencker-api"
    }


# ============ Static Files (for production) ============

# Serve React build in production
import pathlib

STATIC_DIR = pathlib.Path(__file__).parent.parent / "static"
WEB_DIST = pathlib.Path(__file__).parent.parent.parent / "web" / "dist"

# Try to serve built React app
if WEB_DIST.exists():
    app.mount("/assets", StaticFiles(directory=WEB_DIST / "assets"), name="assets")
    
    @app.get("/", tags=["Frontend"])
    async def serve_frontend():
        """Serve the React frontend."""
        return FileResponse(WEB_DIST / "index.html")
    
    @app.get("/{path:path}", tags=["Frontend"])
    async def serve_frontend_routes(path: str):
        """Serve React for client-side routing."""
        file_path = WEB_DIST / path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(WEB_DIST / "index.html")


# ============ Development Info ============

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("API_PORT", "8000"))
    
    print(f"""
    ╔═══════════════════════════════════════════════════╗
    ║           🚀 Sencker API Server                   ║
    ╠═══════════════════════════════════════════════════╣
    ║  API Docs:    http://localhost:{port}/api/docs      ║
    ║  Health:      http://localhost:{port}/api/health    ║
    ║  Frontend:    {FRONTEND_URL}             ║
    ╚═══════════════════════════════════════════════════╝
    """)
    
    uvicorn.run(
        "src.api.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
    )
