
import cv2
import os
from ultralytics import YOLO

model = YOLO('backend/yolov8n.pt')
video_path = 'backend/parking2.mp4'
cap = cv2.VideoCapture(video_path)

car_boxes = []

for _ in range(5): # Check first 5 frames
    ret, frame = cap.read()
    if not ret:
        break
    results = model(frame)
    for r in results:
        for box in r.boxes:
            cls = int(box.cls[0])
            if cls in [2, 3, 5, 7]:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                car_boxes.append((x1, y1, x2, y2))
    # skip some frames
    for _ in range(30): cap.read()

cap.release()

print(f"Detected {len(car_boxes)} car instances across frames.")
for i, box in enumerate(car_boxes[:20]):
    print(f"Box {i}: {box}")
