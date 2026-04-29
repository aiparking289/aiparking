from ultralytics import YOLO
import json
import cv2
import os
import torch
import pickle

# Configure PyTorch to allow loading YOLO models (PyTorch 2.6+ security)
try:
    from ultralytics.nn.tasks import DetectionModel
    torch.serialization.add_safe_globals([DetectionModel])
except Exception:
    pass

# Get the directory where this file is located
current_dir = os.path.dirname(os.path.abspath(__file__))

# Load YOLO model
model_path = os.path.join(current_dir, "yolov8n.pt")
model = YOLO(model_path)

# Load parking slots
slots_path = os.path.join(current_dir, "slots.json")
with open(slots_path) as f:
    slots = json.load(f)

def detect_cars(frame):
    """Detect cars in a frame using YOLO"""
    results = model(frame)
    cars = []

    for r in results:
        for box in r.boxes:
            cls = int(box.cls[0])

            # Class 2 = car, 3 = motorcycle, 5 = bus, 7 = truck
            if cls in [2, 3, 5, 7]:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cars.append((x1, y1, x2, y2))

    return cars

def check_slots(cars, slots_config=None):
    """Check parking slots status based on detected cars"""
    status = []
    
    # If no config provided, load default from file
    if slots_config is None:
        slots_path = os.path.join(current_dir, "slots.json")
        with open(slots_path) as f:
            slots_config = json.load(f)

    for slot in slots_config:
        sx, sy, sw, sh = slot["x"], slot["y"], slot["w"], slot["h"]
        occupied = False

        for (x1, y1, x2, y2) in cars:
            # Calculate intersection
            overlap_x1 = max(x1, sx)
            overlap_y1 = max(y1, sy)
            overlap_x2 = min(x2, sx + sw)
            overlap_y2 = min(y2, sy + sh)
            
            if overlap_x1 < overlap_x2 and overlap_y1 < overlap_y2:
                overlap_area = (overlap_x2 - overlap_x1) * (overlap_y2 - overlap_y1)
                slot_area = sw * sh
                car_area = (x2 - x1) * (y2 - y1)
                
                # If the car covers at least 30% of the parking slot OR
                # the overlap is at least 30% of the car's area
                if overlap_area > (0.3 * slot_area) or overlap_area > (0.3 * car_area):
                    occupied = True
                    break

        status.append({
            "id": slot["id"],
            "status": "occupied" if occupied else "free"
        })

    return status

def process_video(video_path):
    """
    Process an entire video file and return parking slot statistics.
    Returns the number of free slots found in the video.
    """
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        raise ValueError("Could not open video file")
    
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    free_slot_counts = []
    occupied_slot_counts = []
    frame_count = 0
    
    while True:
        ret, frame = cap.read()
        
        if not ret:
            break
        
        frame_count += 1
        
        # Detect cars and check slots
        cars = detect_cars(frame)
        slot_status = check_slots(cars)
        
        # Count free and occupied slots
        free_count = sum(1 for slot in slot_status if slot["status"] == "free")
        occupied_count = sum(1 for slot in slot_status if slot["status"] == "occupied")
        
        free_slot_counts.append(free_count)
        occupied_slot_counts.append(occupied_count)
    
    cap.release()
    
    if frame_count == 0:
        raise ValueError("Video file is empty or corrupted")
    
    # Calculate statistics
    max_free_slots = max(free_slot_counts) if free_slot_counts else 0
    min_free_slots = min(free_slot_counts) if free_slot_counts else 0
    avg_free_slots = sum(free_slot_counts) / len(free_slot_counts) if free_slot_counts else 0
    
    max_occupied_slots = max(occupied_slot_counts) if occupied_slot_counts else 0
    min_occupied_slots = min(occupied_slot_counts) if occupied_slot_counts else 0
    avg_occupied_slots = sum(occupied_slot_counts) / len(occupied_slot_counts) if occupied_slot_counts else 0
    
    return {
        "total_frames_processed": frame_count,
        "total_slots": len(slots),
        "free_slots": {
            "max": max_free_slots,
            "min": min_free_slots,
            "average": round(avg_free_slots, 2)
        },
        "occupied_slots": {
            "max": max_occupied_slots,
            "min": min_occupied_slots,
            "average": round(avg_occupied_slots, 2)
        }
    }
