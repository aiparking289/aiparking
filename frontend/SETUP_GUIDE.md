# Techno Slot Seeker Dashboard - YOLO Integration

This dashboard now uses real YOLO object detection instead of simulation to track parking slot availability.

## Setup Instructions

### 1. Start the Flask Backend
From the main `asystem` directory:

```bash
cd c:\Users\91735\Desktop\r\asystem
python app.py
```

The Flask server will start on `http://localhost:5000`

### 2. Start the Dashboard Frontend
From the dashboard directory:

```bash
cd c:\Users\91735\Desktop\r\asystem\smart-park-dashboard-main
npm install
npm run dev
```

The dashboard will start on `http://localhost:8080`

## Features

### Real-Time Parking Detection
- Uses YOLOv8 model to detect cars in real-time
- Auto-refreshes every 5 seconds
- Shows live slot status: **Available** (green), **Occupied** (red), **Booked** (yellow)

### Booking System
- Click on available slots to book them
- Enter your name and email to confirm
- Booked slots are saved to SQLite database
- Cancel bookings anytime

### Statistics
- Total slots
- Available slots
- Occupied slots
- Booked slots (live count)

### Video Analysis
- Upload parking videos to analyze free/occupied patterns
- Get statistics on slot availability trends

## Backend API Endpoints

The dashboard communicates with these Flask endpoints:

- `GET /available-slots` - Get all slots with real-time detection status
- `GET /status` - Get current status (legacy)
- `POST /book` - Book a parking slot
- `GET /bookings` - Get all active bookings
- `DELETE /booking/<id>` - Cancel a booking
- `GET /booked-slots` - Get only booked slot IDs

## Configuration

The API URL is configured in `.env.local`:

```
VITE_API_URL=/api
```

During development, Vite proxies `/api/*` calls to `http://localhost:5000/*`

## Technology Stack

### Frontend
- React + TypeScript
- Vite (bundler)
- Tailwind CSS
- Shadcn UI components
- React Query (data fetching)

### Backend
- Flask (Python web framework)
- Flask-SQLAlchemy (database ORM)
- YOLOv8 (object detection)
- OpenCV (video processing)

## Removing Simulation

✅ Removed all simulation code:
- No more random slot generation
- No more mock data
- All data comes from real YOLO detection

✅ Added real-time features:
- Live YOLO detection every 5 seconds
- Database-backed bookings
- User information storage
- Booking management

## Troubleshooting

### "Connection Error" on Dashboard

If you see a connection error, make sure:

1. Flask backend is running: `python app.py` in the `asystem` folder
2. Flask is on `http://localhost:5000`
3. No port conflicts (Flask: 5000, Dashboard: 8080)

### YOLO Model Not Loading

Ensure `yolov8n.pt` is in the `asystem` folder. If not:

```bash
pip install ultralytics
# Then in Python:
from ultralytics import YOLO
model = YOLO('yolov8n.pt')
```

### Database Issues

If bookings aren't persisting:

1. Delete `parking_bookings.db` file
2. Restart Flask server
3. Database will be recreated automatically

## Next Steps

Possible enhancements:
- Add user authentication
- Implement booking time limits
- Add SMS/email notifications
- Create admin dashboard
- Add payment integration
