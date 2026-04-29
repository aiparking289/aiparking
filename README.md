# Smart Parking System

An AI-powered real-time parking management system that uses **YOLOv8 object detection** to monitor parking lot occupancy through live camera feeds. Users can view available slots, book parking spaces, and receive email & SMS confirmations — all through a modern web dashboard.

> Created by **Kairo Digital**

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                             │
│                                                                     │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────────────┐    │
│  │   Home Page   │  │   Dashboard   │  │   Admin Dashboard    │    │
│  │               │  │               │  │                      │    │
│  │  Landing &    │  │  Slot Grid    │  │  Camera 1 Live Feed  │    │
│  │  Navigation   │  │  Booking UI   │  │  Camera 2 Live Feed  │    │
│  │               │  │  Stats Bar    │  │  Booking Management  │    │
│  └───────────────┘  └───────┬───────┘  └──────────┬───────────┘    │
│                             │                      │                │
│                    ┌────────┴──────────────────────┘                │
│                    │  React + Vite + TailwindCSS                    │
│                    │  ShadCN UI Components                          │
│                    │  TanStack React Query                          │
│                    └────────┬───────────────────────────────────────┘
│                             │                                       │
└─────────────────────────────┼───────────────────────────────────────┘
                              │  HTTP / REST API
                              │  MJPEG Stream
                              │
┌─────────────────────────────┼───────────────────────────────────────┐
│                     BACKEND │(Flask Server)                         │
│                             │                                       │
│  ┌──────────────────────────▼──────────────────────────────────┐    │
│  │                    Flask REST API                           │    │
│  │                                                             │    │
│  │  /api/status ─────── Merged slot status (Camera 1+2 + DB)  │    │
│  │  /api/bookings ───── CRUD booking operations                │    │
│  │  /api/video_feed ─── MJPEG stream (Camera 1)               │    │
│  │  /api/video_feed_2 ─ MJPEG stream (Camera 2)               │    │
│  │  /api/upload ──────── Video file upload & analysis          │    │
│  └──────────┬────────────────────────────┬─────────────────────┘    │
│             │                            │                          │
│  ┌──────────▼──────────┐      ┌──────────▼──────────┐              │
│  │  Video Processing   │      │  Booking Service     │              │
│  │  Thread 1 (Cam 1)   │      │                      │              │
│  │  Thread 2 (Cam 2)   │      │  SQLAlchemy ORM      │──┐          │
│  │                     │      │  Auto-Expiry (2hrs)  │  │          │
│  │  ~8 FPS Processing  │      │  Twilio SMS          │  │          │
│  └──────────┬──────────┘      └──────────────────────┘  │          │
│             │                                            │          │
│  ┌──────────▼──────────┐      ┌──────────────────────┐  │          │
│  │  YOLOv8 Detector    │      │  SQLite Database     │◄─┘          │
│  │  (ultralytics)      │      │  parking_bookings.db │              │
│  │                     │      │                      │              │
│  │  Car Detection      │      │  ┌────────────────┐  │              │
│  │  Slot Overlap Calc  │      │  │ Booking Table  │  │              │
│  │  30% IoU Threshold  │      │  │ ─────────────  │  │              │
│  └─────────────────────┘      │  │ id (PK)       │  │              │
│                               │  │ slot_id       │  │              │
│                               │  │ user_name     │  │              │
│                               │  │ user_email    │  │              │
│                               │  │ user_phone    │  │              │
│                               │  │ booking_date  │  │              │
│                               │  │ is_active     │  │              │
│                               │  └────────────────┘  │              │
│                               └──────────────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
    ┌─────────▼─────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │   EmailJS     │ │   Twilio    │ │  Video      │
    │  (Frontend)   │ │   (Backend) │ │  Sources    │
    │               │ │             │ │             │
    │  Booking      │ │  SMS to     │ │ parking.mp4 │
    │  Confirmation │ │  Customer   │ │ parking2.mp4│
    │  Email        │ │  Phone      │ │ or Webcam   │
    └───────────────┘ └─────────────┘ └─────────────┘
```

---

## Data Flow

### 1. Real-Time Slot Detection Flow

```
Video Source (MP4/Webcam)
        │
        ▼
┌─────────────────────┐
│  Background Thread   │  (runs continuously at ~8 FPS)
│  cv2.VideoCapture    │
└────────┬────────────┘
         │ frame
         ▼
┌─────────────────────┐
│  YOLOv8 Inference    │  Detects: cars, motorcycles, buses, trucks
│  (yolov8n.pt)        │  Returns: bounding boxes [(x1,y1,x2,y2), ...]
└────────┬────────────┘
         │ detected vehicles
         ▼
┌─────────────────────┐
│  Slot Overlap Check  │  Compares car boxes against slot boxes
│  (slots.json)        │  30% IoU threshold → occupied / free
└────────┬────────────┘
         │ slot_status[]
         ▼
┌─────────────────────┐
│  Shared Global State │  latest_frame, latest_slots_1, latest_slots_2
│  (thread-safe lock)  │  Updated every ~120ms per camera
└────────┬────────────┘
         │
    ┌────┴────┐
    ▼         ▼
 MJPEG     /api/status
 Stream    (JSON response)
```

### 2. Booking Flow

```
User clicks "Book Slot" on Dashboard
        │
        ▼
┌─────────────────────┐
│  BookingDialog       │  Collects: name, email, phone
│  (React Component)   │
└────────┬────────────┘
         │ POST /api/bookings
         ▼
┌─────────────────────┐
│  Flask Backend       │
│  create_booking()    │──────► SQLite DB (INSERT)
└────────┬────────────┘
         │
    ┌────┴─────────┐
    ▼              ▼
┌────────┐   ┌──────────┐
│ Twilio │   │ EmailJS  │
│  SMS   │   │  Email   │  (sent from frontend after
│(server)│   │(browser) │   successful API response)
└────────┘   └──────────┘
```

### 3. Status Merge Logic

```
Camera 1 Detection ──┐
                     ├──► Merge: occupied if EITHER camera says occupied
Camera 2 Detection ──┘
         │
         ▼
Database Bookings ────► Override: if slot has active booking → "booked"
         │
         ▼
Auto-Expiry ──────────► Bookings older than 2 hours → is_active = False
         │
         ▼
Final JSON Response ──► [{ id: 1, status: "free"|"occupied"|"booked" }, ...]
```

---

## Project Structure

```
asystem/
│
├── backend/                          # Python Flask Backend
│   ├── app.py                        # Main Flask application & API routes
│   ├── config.py                     # Environment-based configuration
│   ├── detector.py                   # YOLOv8 detection & slot overlap logic
│   ├── requirements.txt              # Python dependencies
│   ├── .env                          # Environment variables (not committed)
│   ├── .env.example                  # Environment variable template
│   ├── yolov8n.pt                    # YOLOv8 Nano pre-trained model weights
│   ├── slots.json                    # Camera 1 parking slot coordinates
│   ├── slots_2.json                  # Camera 2 parking slot coordinates
│   ├── parking.mp4                   # Sample video feed (Camera 1)
│   ├── parking2.mp4                  # Sample video feed (Camera 2)
│   ├── uploads/                      # Temporary video upload storage
│   └── instance/
│       └── parking_bookings.db       # SQLite database (auto-created)
│
├── frontend/                         # React + Vite Frontend
│   ├── index.html                    # HTML entry point
│   ├── package.json                  # Node.js dependencies & scripts
│   ├── vite.config.ts                # Vite bundler configuration
│   ├── tailwind.config.ts            # TailwindCSS configuration
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── .env.local                    # Frontend environment variables
│   ├── .env.example                  # Frontend env template
│   └── src/
│       ├── main.tsx                  # React entry point
│       ├── App.tsx                   # Router & layout
│       ├── index.css                 # Global styles
│       ├── pages/
│       │   ├── Home.tsx              # Landing page
│       │   ├── Dashboard.tsx         # User-facing slot grid & booking
│       │   ├── AdminDashboard.tsx    # Admin panel with live feeds
│       │   └── NotFound.tsx          # 404 page
│       ├── components/
│       │   ├── Navbar.tsx            # Navigation bar
│       │   ├── ParkingSlotCard.tsx   # Individual slot card component
│       │   ├── BookingDialog.tsx     # Booking form modal
│       │   ├── StatsBar.tsx          # Occupancy statistics bar
│       │   ├── StatusLegend.tsx      # Color legend (free/occupied/booked)
│       │   ├── LoadingSkeleton.tsx   # Loading placeholder
│       │   └── ui/                   # ShadCN UI primitives
│       ├── hooks/
│       │   ├── useParkingSlots.ts    # Polling hook for slot status
│       │   ├── use-toast.ts          # Toast notification hook
│       │   └── use-mobile.tsx        # Mobile detection hook
│       └── lib/
│           ├── api.ts               # API client (fetch wrappers)
│           ├── emailService.ts       # EmailJS integration
│           └── utils.ts              # Utility functions
│
└── README.md                         # This file
```

---

## Tech Stack

| Layer          | Technology              | Purpose                                    |
| -------------- | ----------------------- | ------------------------------------------ |
| **Frontend**   | React 18                | UI framework                               |
|                | TypeScript              | Type-safe JavaScript                       |
|                | Vite 5                  | Build tool & dev server                    |
|                | TailwindCSS 3           | Utility-first CSS framework                |
|                | ShadCN UI + Radix       | Accessible component library               |
|                | TanStack React Query    | Server state management & polling          |
|                | React Router DOM 6      | Client-side routing                        |
|                | Recharts                | Data visualization charts                  |
|                | EmailJS                 | Client-side booking confirmation emails    |
|                | Lucide React            | Icon library                               |
|                | Sonner                  | Toast notifications                        |
| **Backend**    | Flask 2.3               | Python web framework                       |
|                | Flask-SQLAlchemy 3      | ORM for database operations                |
|                | Flask-CORS              | Cross-origin request handling              |
|                | Ultralytics YOLOv8      | Real-time object detection (Nano model)    |
|                | OpenCV (cv2)            | Video capture & frame processing           |
|                | PyTorch 2.3             | Deep learning runtime for YOLO             |
|                | Twilio                  | SMS booking notifications                  |
|                | python-dotenv           | Environment variable management            |
| **Database**   | SQLite                  | Serverless, file-based relational database |
| **AI Model**   | YOLOv8n (Nano)          | Lightweight object detection (~6.5 MB)     |

---

## Database Schema

The system uses a single **SQLite** database file (`parking_bookings.db`) that is auto-created on first run. No external database server is required.

### `Booking` Table

| Column         | Type         | Constraints               | Description                        |
| -------------- | ------------ | ------------------------- | ---------------------------------- |
| `id`           | INTEGER      | PRIMARY KEY, AUTO_INCREMENT | Unique booking identifier         |
| `slot_id`      | INTEGER      | NOT NULL                  | Parking slot number (1–26)         |
| `user_name`    | VARCHAR(100) | NOT NULL                  | Name of the person booking         |
| `user_email`   | VARCHAR(100) | NOT NULL                  | Email for confirmation             |
| `user_phone`   | VARCHAR(20)  | NULLABLE                  | Phone for SMS notification         |
| `booking_date` | DATETIME     | NOT NULL, DEFAULT utcnow  | When the booking was made          |
| `is_active`    | BOOLEAN      | DEFAULT True              | Active status (auto-expires in 2h) |

---

## Installation Guide

### Prerequisites

| Tool       | Version  | Required |
| ---------- | -------- | -------- |
| Python     | 3.9+     | Yes      |
| Node.js    | 18+      | Yes      |
| Git        | Any      | Optional |

### Step 0 — Install Node.js (if not installed)

If you don't have Node.js on your Windows machine, run this in **PowerShell (Admin)**:

```powershell
# Option 1: Download and install from the official website
# Visit https://nodejs.org and download the LTS installer

# Option 2: Install via winget (Windows Package Manager)
winget install OpenJS.NodeJS.LTS

# Option 3: Install via Chocolatey (if you have it)
choco install nodejs-lts
```

After installation, **restart your terminal** and verify:

```powershell
node --version
npm --version
```

### Step 1 — Clone the Repository

```bash
git clone https://github.com/aiparking289/aiparking.git
cd asystem
```

### Step 2 — Backend Setup

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Create environment file
copy .env.example .env        # Windows
# cp .env.example .env        # Linux/Mac
```

Edit `backend/.env` and configure your settings:

```env
FLASK_ENV=development
FLASK_DEBUG=True
FLASK_PORT=5000
DATABASE_URL=sqlite:///parking_bookings.db
VIDEO_SOURCE=parking.mp4
VIDEO_SOURCE_2=parking2.mp4
CORS_ORIGINS=http://localhost:5173

# Optional: Twilio SMS (leave defaults to skip)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

Start the backend:

```bash
python app.py
```

The API will be available at **http://localhost:5000/api**

### Step 3 — Frontend Setup

Open a **new terminal**:

```bash
cd frontend

# Install Node.js dependencies
npm install

# Create environment file
copy .env.example .env.local       # Windows
# cp .env.example .env.local       # Linux/Mac
```

Edit `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:5000/api

# Optional: EmailJS (leave defaults to skip)
VITE_EMAILJS_SERVICE_ID=your_service_id_here
VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

Start the frontend:

```bash
npm run dev
```

The app will be available at **http://localhost:5173**

---

## API Endpoints

| Method   | Endpoint                    | Description                        |
| -------- | --------------------------- | ---------------------------------- |
| `GET`    | `/api/status`               | Get all slot statuses (merged)     |
| `GET`    | `/api/bookings`             | List all active bookings           |
| `POST`   | `/api/bookings`             | Create a new booking               |
| `DELETE` | `/api/bookings/:id`         | Delete a booking                   |
| `GET`    | `/api/video_feed`           | MJPEG stream from Camera 1        |
| `GET`    | `/api/video_feed_2`         | MJPEG stream from Camera 2        |
| `POST`   | `/api/upload`               | Upload a video file for analysis   |

---

## Configuration Reference

### Backend (`backend/.env`)

| Variable              | Default                         | Description                          |
| --------------------- | ------------------------------- | ------------------------------------ |
| `FLASK_ENV`           | `development`                   | Environment mode                     |
| `FLASK_PORT`          | `5000`                          | Server port                          |
| `DATABASE_URL`        | `sqlite:///parking_bookings.db` | Database connection string           |
| `VIDEO_SOURCE`        | `parking.mp4`                   | Camera 1 video source                |
| `VIDEO_SOURCE_2`      | `parking.mp4`                   | Camera 2 video source                |
| `CORS_ORIGINS`        | `http://localhost:5173`         | Allowed frontend origins (CSV)       |
| `TWILIO_ACCOUNT_SID`  | —                               | Twilio account SID (optional)        |
| `TWILIO_AUTH_TOKEN`   | —                               | Twilio auth token (optional)         |
| `TWILIO_PHONE_NUMBER` | —                               | Twilio sender phone number (optional)|

### Frontend (`frontend/.env.local`)

| Variable                   | Default                          | Description                    |
| -------------------------- | -------------------------------- | ------------------------------ |
| `VITE_API_URL`             | `http://localhost:5000/api`      | Backend API base URL           |
| `VITE_EMAILJS_SERVICE_ID`  | —                                | EmailJS service ID (optional)  |
| `VITE_EMAILJS_TEMPLATE_ID` | —                                | EmailJS template ID (optional) |
| `VITE_EMAILJS_PUBLIC_KEY`  | —                                | EmailJS public key (optional)  |

---

## License

This project is proprietary software developed by **Kairo Digital**. All rights reserved.
