# ParkOS - Smart Parking System

ParkOS is a modern parking management system that applies operating system concepts to efficiently manage parking resources. It provides real-time allocation of parking spaces, waitlist management, and dynamic optimization of parking spots.

## Project Structure

## Architecture Overview

### Frontend (Next.js)
- Interactive 3D parking visualization with real-time updates
- Vehicle type selection and registration
- Departure time estimation
- Responsive design for all device sizes
- Keyboard shortcuts for quick operation

### Backend (FastAPI)
- Implements parking management algorithms using OS concepts
- RESTful API for vehicle arrivals, departures, and status updates
- SQLite database for persistent storage
- Priority-based scheduling for optimal slot allocation
- Dynamic slot allocation based on vehicle size and type

## Operating System Concepts Applied

| OS Concept | Implementation in ParkOS |
|------------|--------------------------|
| Dynamic Memory Allocation | Parking slots are assigned dynamically based on real-time availability and departure time. Vehicles of different sizes require different numbers of slots (bikes=1, small cars=2, medium cars=3, large cars=4, trucks=6, EVs=2). |
| Paging | Floors/zones are divided like memory pages, optimizing space based on vehicle stay duration. |
| Segmentation | Different sections for short-term, long-term, VIP, and emergency vehicles. |
| Process Scheduling | Vehicles are scheduled based on priority and exit times to minimize congestion. |
| Compaction | If empty spaces are scattered, ParkOS reorganizes cars for efficient utilization. |
| Swapping | If the parking is full, ParkOS maintains a waitlist to allocate slots as they free up. |
| Deadlock Prevention | Ensures that no car gets stuck due to inefficient slot assignment. |
| Multilevel Queue Scheduling | Different queues for VIP, regular, and short-term vehicles. |

## Vehicle Sizing

ParkOS intelligently allocates parking slots based on vehicle type and size:
- Bikes: 1 slot
- Small Cars: 2 slots
- Medium Cars: 3 slots
- Large Cars: 4 slots
- Trucks: 6 slots
- Electric Vehicles: 2 slots

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:3000

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000 with documentation at http://localhost:8000/docs

## System Flow

1. **Car Arrival**: Vehicle enters the parking area and provides an estimated departure time.
2. **Slot Allocation**: ParkOS assigns an optimal slot based on availability, departure time, and congestion.
3. **Waitlist Handling**: If the parking is full, a queue system ensures smooth allocation when a slot becomes available.
4. **Car Parked**: The vehicle is parked in the assigned slot.
5. **Dynamic Management**: If congestion increases, the system dynamically reallocates vehicles for better efficiency.
6. **Stay Extension**: If a car extends its stay, ParkOS reallocates nearby slots accordingly.
7. **Car Exit**: Upon departure, the slot is freed and optimized for the next vehicle.
8. **Slot Optimization**: If needed, ParkOS reorganizes vehicles for better space utilization.