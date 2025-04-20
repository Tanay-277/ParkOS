# ParkOS - Smart Parking System

ParkOS is a modern parking management system that applies operating system concepts to efficiently manage parking resources. It provides real-time allocation of parking spaces, waitlist management, and dynamic optimization of parking spots.

## Features

- **Dynamic slot allocation** based on vehicle size and type
- **Intelligent parking algorithms** using operating system concepts
- **Automatic waitlist management** for full parking lots
- **Vehicle type and size support**: Bikes, Cars (small/medium/large), EVs, Trucks
- **Priority-based scheduling** for VIP and emergency vehicles
- **Automatic compaction** to optimize parking space utilization
- **Real-time status monitoring** and visualization

## Quick Start

The easiest way to run ParkOS is using the included run script:

```bash
run_dev.bat
```

This will start both the backend and frontend in separate windows.

### Manual Setup

#### Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000 with documentation at http://localhost:8000/docs

#### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:3000

## Project Structure

```
├── backend/           # FastAPI backend
│   ├── app/           # Application code
│   │   ├── api/       # API endpoints and models
│   │   ├── core/      # Core configuration
│   │   ├── database/  # Database models and connection
│   │   ├── models/    # Data models
│   │   ├── services/  # Business logic services
│   │   └── main.py    # Application entry point
│   ├── scripts/       # Database migration scripts
│   └── tests/         # Test cases
│
├── frontend/          # Next.js frontend
│   ├── app/           # Next.js app directory
│   ├── components/    # React components
│   │   ├── parking/   # Parking-specific components
│   │   └── ui/        # Shared UI components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility functions
│   ├── public/        # Static assets
│   ├── services/      # API services
│   └── utils/         # Helper functions
│
└── run_dev.bat        # Development startup script
```

## How Vehicle Sizes Map to Parking Slots

ParkOS intelligently allocates parking slots based on vehicle type and size:

| Vehicle Type | Size   | Slots Required |
|--------------|--------|---------------|
| Bike         | N/A    | 1 slot        |
| Car          | Small  | 2 slots       |
| Car          | Medium | 3 slots       |
| Car          | Large  | 4 slots       |
| EV           | N/A    | 2 slots       |
| Truck        | N/A    | 6 slots       |

## Operating System Concepts Implemented

| OS Concept | Implementation in ParkOS |
|------------|--------------------------|
| Dynamic Memory Allocation | Parking slots are assigned dynamically based on vehicle size requirements and real-time availability |
| Paging | Floors/zones are divided like memory pages, optimizing space allocation |
| Process Scheduling | Priority-based scheduling for different vehicle types (VIP, emergency, regular) |
| Compaction | When fragmentation reaches a threshold, vehicles are rearranged for better space utilization |
| Swapping | Waitlist system for "swapping in" vehicles when slots become available |
| Deadlock Prevention | Ensures slots are available before allocation to prevent resource conflicts |
| Multi-level Queue Scheduling | Different priority queues for different vehicle types |

## API Endpoints

### Vehicle Management
- `POST /api/v1/arrive` - Register a new vehicle arrival
- `POST /api/v1/depart` - Register a vehicle departure
- `POST /api/v1/extend` - Extend a vehicle's parking duration

### Parking Status
- `GET /api/v1/status` - Get current parking status
- `GET /api/v1/slots` - Get all parking slots
- `GET /api/v1/waitlist` - Get current waitlist

### System Management
- `POST /api/v1/initialize` - Initialize parking system
- `GET /api/v1/health` - API health check
- `GET /api/v1/debug` - Debug information (development only)

## License

This project is licensed under the MIT License - see the LICENSE file for details.