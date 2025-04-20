import sys
import os
import sqlite3
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from app.core.config import settings


def migrate_database():
    """
    Update the database schema when needed.
    This script handles migrations for SQLite databases.
    """
    # Remove file:// prefix if it exists
    db_url = settings.DATABASE_URL
    if db_url.startswith("sqlite:///"):
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
        cursor.execute("PRAGMA table_info(vehicles)")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]

        if "slots_occupied" not in column_names:
            print("Adding slots_occupied column to vehicles table")
            cursor.execute(
                "ALTER TABLE vehicles ADD COLUMN slots_occupied INTEGER DEFAULT 1"
            )
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


if __name__ == "__main__":
    migrate_database()
