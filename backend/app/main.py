from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import traceback
import importlib.util
import sys
import os
from pathlib import Path

from app.api.routes import router
from app.core.config import settings
from app.database.db import engine, Base

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

# Run database migrations
try:
    logger.info("Running database migrations...")
    scripts_dir = Path(__file__).parent.parent / "scripts"
    
    # Create scripts directory if it doesn't exist
    if not scripts_dir.exists():
        os.makedirs(scripts_dir)
        logger.info(f"Created scripts directory: {scripts_dir}")
        
    migration_script_path = scripts_dir / "migrate_db.py"
    
    # Create migration script if it doesn't exist
    if not migration_script_path.exists():
        logger.info(f"Creating migration script at {migration_script_path}")
        with open(migration_script_path, 'w') as f:
            f.write('''import sys
import os
import sqlite3
from pathlib import Path

# Add the parent directory to the path
sys.path.append(str(Path(__file__).parent.parent))

def migrate_database():
    """
    Update the database schema when needed.
    This script handles migrations for SQLite databases.
    """
    try:
        from app.core.config import settings
        
        # Remove file:// prefix if it exists
        db_url = settings.DATABASE_URL
        if db_url.startswith('sqlite:///'):
            db_path = db_url[10:]
        else:
            print(f"Unsupported database URL: {db_url}")
            return
        
        # Check if the database file exists
        if not os.path.exists(db_path):
            print(f"Database file {db_path} not found.")
            return
        
        print(f"Migrating database: {db_path}")
        
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        try:
            # Check if the slots_occupied column exists in the vehicles table
            cursor.execute("PRAGMA table_info(vehicles)")
            columns = cursor.fetchall()
            column_names = [col[1] for col in columns]
            
            # Add slots_occupied column if it doesn't exist
            if 'slots_occupied' not in column_names:
                print("Adding slots_occupied column to vehicles table")
                cursor.execute("ALTER TABLE vehicles ADD COLUMN slots_occupied INTEGER DEFAULT 1")
                conn.commit()
                print("Migration completed successfully!")
            else:
                print("slots_occupied column already exists.")
                
        except Exception as e:
            print(f"Migration failed: {str(e)}")
            conn.rollback()
            
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        print(f"Migration error: {str(e)}")

if __name__ == "__main__":
    migrate_database()
''')
    
    if migration_script_path.exists():
        # Import and run the migration script
        spec = importlib.util.spec_from_file_location("migrate_db", migration_script_path)
        migrate_module = importlib.util.module_from_spec(spec)
        sys.modules["migrate_db"] = migrate_module
        spec.loader.exec_module(migrate_module)
        
        # Run the migration
        migrate_module.migrate_database()
    else:
        logger.warning(f"Migration script not found: {migration_script_path}")
except Exception as e:
    logger.error(f"Migration error: {str(e)}")
    logger.error(traceback.format_exc())

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.DESCRIPTION,
    version=settings.VERSION,
)

# Set up CORS middleware with more permissive settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_detail = f"{str(exc)}\n{traceback.format_exc()}"
    logger.error(f"Global exception: {error_detail}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "path": request.url.path},
    )

# Include API routes
app.include_router(router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    """Root endpoint with API information"""
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "description": settings.DESCRIPTION,
        "api_path": settings.API_V1_STR,
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok"}
