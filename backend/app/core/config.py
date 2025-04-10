from pydantic_settings import BaseSettings
from typing import List, Optional
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "ParkOS"
    DESCRIPTION: str = "Smart Parking System using OS Concepts"
    VERSION: str = "0.1.0"
    
    # CORS configuration - updated to allow all origins in development
    BACKEND_CORS_ORIGINS: List[str] = ["*"]
    
    # Database connection
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./parkos.db")
    
    # Parking system settings
    MAX_PARKING_CAPACITY: int = int(os.getenv("MAX_PARKING_CAPACITY", "64"))  # 8x8 grid default
    GRID_SIZE_PER_FLOOR: int = 8  # 8x8 grid
    FLOORS: List[str] = ["1", "2", "3"]
    VIP_SLOTS_PER_FLOOR: int = 5
    EMERGENCY_SLOTS_PER_FLOOR: int = 2
    
    # Time settings (in minutes)
    SHORT_TERM_THRESHOLD: int = 60  # 1 hour
    MEDIUM_TERM_THRESHOLD: int = 180  # 3 hours
    
    # Dynamic scheduling settings
    PRIORITY_WEIGHT_VIP: float = 2.0
    PRIORITY_WEIGHT_EMERGENCY: float = 3.0
    PRIORITY_WEIGHT_SHORT_TERM: float = 1.5
    
    # Compaction threshold
    FRAGMENTATION_THRESHOLD: float = 0.3  # 30% fragmentation triggers compaction

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
