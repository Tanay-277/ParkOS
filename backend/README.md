# ParkOS Backend

The backend system for ParkOS, implementing parking management with algorithms inspired by operating system concepts.

## Features

1. **Dynamic Memory Allocation**: Parking slots are assigned dynamically based on availability and vehicle requirements.
2. **Paging**: Floors are divided like memory pages, optimizing for specific vehicle types.
3. **Process Scheduling**: Uses priority-based scheduling for vehicle allocation.
4. **Compaction**: Reorganizes vehicles to optimize space utilization.
5. **Swapping**: Manages waitlists when parking is full.
6. **Deadlock Prevention**: Efficient slot allocation to prevent blocking.
7. **Multi-level Queue**: Different priority levels for different vehicle types.

## Setup and Installation

### Prerequisites

- Python 3.8+
- FastAPI
- SQLAlchemy
- Uvicorn

### Installation

1. Create and activate a virtual environment:
   ```bash
   # On Windows
   python -m venv venv
   venv\Scripts\activate

   # On macOS/Linux
   python -m venv venv
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment variables by creating a `.env` file:
   ```
   DATABASE_URL=sqlite:///./parkos.db
   MAX_PARKING_CAPACITY=64
   ```

### Running the Server

Development mode with auto-reload:
```bash
uvicorn app.main:app --reload
```

For production:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

This starts the server at http://localhost:8000.

## Project Structure

