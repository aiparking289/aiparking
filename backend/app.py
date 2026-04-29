from flask import Flask, render_template, jsonify, request, Response
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import cv2
import os
import time
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from config import config
from detector import detect_cars, check_slots, process_video, slots
from twilio.rest import Client

# Get configuration
env = os.getenv('FLASK_ENV', 'development')
app = Flask(__name__, template_folder='templates')
app.config.from_object(config[env])

# Enable CORS for frontend communication
CORS(app, resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}})

# Initialize Database
db = SQLAlchemy(app)

# Initialize Twilio Client
twilio_client = None
if app.config.get('TWILIO_ACCOUNT_SID') and app.config.get('TWILIO_AUTH_TOKEN'):
    try:
        twilio_client = Client(app.config['TWILIO_ACCOUNT_SID'], app.config['TWILIO_AUTH_TOKEN'])
        print(f"Twilio initialized with Account SID: {app.config['TWILIO_ACCOUNT_SID'][:5]}...")
    except Exception as e:
        print(f"Failed to initialize Twilio client: {e}")
else:
    print("Twilio credentials missing in configuration")

# Create uploads folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Database Models
class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    slot_id = db.Column(db.Integer, nullable=False)
    user_name = db.Column(db.String(100), nullable=False)
    user_email = db.Column(db.String(100), nullable=False)
    user_phone = db.Column(db.String(20), nullable=True)
    booking_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'slot_id': self.slot_id,
            'user_name': self.user_name,
            'user_email': self.user_email,
            'user_phone': self.user_phone,
            'booking_date': self.booking_date.strftime('%Y-%m-%d %H:%M:%S'),
            'is_active': self.is_active
        }

# Create database tables
with app.app_context():
    db.create_all()

import threading

# Use webcam (0) OR video file
video_source = app.config['VIDEO_SOURCE']
if not os.path.isabs(video_source) and str(video_source) != '0':
    video_source = os.path.join(os.path.dirname(os.path.abspath(__file__)), video_source)

# Shared global state for the video readers
latest_frame = None
latest_frame_2 = None
latest_cars = []
latest_slots_1 = [] # Results from Camera 1
latest_slots_2 = [] # Results from Camera 2
lock = threading.Lock()
lock_2 = threading.Lock()

def video_processing_thread():
    global latest_frame, latest_cars, latest_slots
    cap = cv2.VideoCapture(video_source)
    while True:
        ret, frame = cap.read()
        if not ret:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ret, frame = cap.read()
            if not ret:
                time.sleep(1)
                continue
                
        # Detect cars
        try:
            cars = detect_cars(frame)
            slot_status = check_slots(cars)
            
            import json
            slots_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "slots.json")
            with open(slots_path) as f:
                latest_slots_config = json.load(f)
                
            # Optionally draw directly on the frame here for the feed
            display_frame = frame.copy()
            for (x1, y1, x2, y2) in cars:
                cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                
            for sl, s in zip(latest_slots_config, slot_status):
                sx, sy, sw, sh = sl["x"], sl["y"], sl["w"], sl["h"]
                color = (0, 0, 255) if s["status"] == "occupied" else (0, 255, 0)
                cv2.rectangle(display_frame, (sx, sy), (sx+sw, sy+sh), color, 2)
                cv2.putText(display_frame, f"P{sl['id']}", (sx, sy - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
                
            with lock:
                latest_frame = display_frame
                latest_cars = cars
                latest_slots_1 = slot_status
        except Exception as e:
            print(f"Frame processing error: {e}")
            
        time.sleep(0.12) # ~8 FPS throttle to significantly lower CPU usage and slow down the video

def video_processing_thread_2():
    global latest_frame_2, latest_slots_2
    video_source_2 = app.config['VIDEO_SOURCE_2']
    
    # Improved path handling
    if not os.path.isabs(video_source_2) and str(video_source_2) != '0':
        if video_source_2.startswith('backend\\') or video_source_2.startswith('backend/'):
            video_source_2 = video_source_2.replace('backend\\', '').replace('backend/', '')
        video_source_2 = os.path.join(os.path.dirname(os.path.abspath(__file__)), video_source_2)
    
    cap = cv2.VideoCapture(video_source_2)
    while True:
        ret, frame = cap.read()
        if not ret:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ret, frame = cap.read()
            if not ret:
                time.sleep(1)
                continue
                
        try:
            # Load Camera 2 specific slots
            import json
            s2_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "slots_2.json")
            if os.path.exists(s2_path):
                with open(s2_path) as f:
                    s2_config = json.load(f)
            else:
                # Fallback to default if _2 doesn't exist
                with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "slots.json")) as f:
                    s2_config = json.load(f)

            # Detect cars on Camera 2
            cars = detect_cars(frame)
            slot_status = check_slots(cars, s2_config)

            display_frame = frame.copy()
            
            # Draw detected cars
            for (x1, y1, x2, y2) in cars:
                cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 255, 255), 2)
            
            # Draw slot boxes on Camera 2 Feed (using S2 coordinates)
            for sl, s in zip(s2_config, slot_status):
                sx, sy, sw, sh = sl["x"], sl["y"], sl["w"], sl["h"]
                color = (0, 0, 255) if s["status"] == "occupied" else (0, 255, 0)
                cv2.rectangle(display_frame, (sx, sy), (sx+sw, sy+sh), color, 2)
                cv2.putText(display_frame, f"P{sl['id']}", (sx, sy - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

            cv2.putText(display_frame, "CAMERA 02 - BACK ENTRANCE (LIVE AI)", (20, 50), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            
            with lock_2:
                latest_frame_2 = display_frame
                latest_slots_2 = slot_status
        except Exception as e:
            print(f"Frame 2 processing error: {e}")
            
        time.sleep(0.12)

# Start the background video processing threads
threading.Thread(target=video_processing_thread, daemon=True).start()
threading.Thread(target=video_processing_thread_2, daemon=True).start()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/status")
@app.route("/available-slots")
@app.route("/api/available-slots")
def status():
    with lock:
        slots1 = {s['id']: s['status'] for s in latest_slots_1}
    with lock_2:
        slots2 = {s['id']: s['status'] for s in latest_slots_2}

    # Merge logic: A slot is occupied if either camera says it is
    merged_status = []
    
    # Load configs from both files
    import json
    base_path = os.path.dirname(os.path.abspath(__file__))
    
    with open(os.path.join(base_path, "slots.json")) as f:
        slots_config_1 = json.load(f)
    
    s2_path = os.path.join(base_path, "slots_2.json")
    if os.path.exists(s2_path):
        with open(s2_path) as f:
            slots_config_2 = json.load(f)
    else:
        slots_config_2 = []
        
    all_slots_config = {s['id']: s for s in slots_config_1}
    # If there are overlaps, slots_config_2 will overwrite or we can merge.
    # Since they are now distinct (1-13 and 14-26), we just add them.
    for s in slots_config_2:
        all_slots_config[s['id']] = s

    merged_status = []
    for sid, config in all_slots_config.items():
        s1 = slots1.get(sid, 'free')
        s2 = slots2.get(sid, 'free')
        
        final_status = 'occupied' if (s1 == 'occupied' or s2 == 'occupied') else 'free'
        merged_status.append({'id': sid, 'status': final_status})

    # Sort by ID for consistency
    merged_status.sort(key=lambda x: x['id'])

    # Merge database bookings with YOLO detection AND Auto-expire old bookings
    active_bookings = Booking.query.filter_by(is_active=True).all()
    current_time = datetime.utcnow()
    
    booked_slot_ids = set()
    for booking in active_bookings:
        if current_time - booking.booking_date > timedelta(hours=2):
            booking.is_active = False # Expire booking after 2 hours
        else:
            booked_slot_ids.add(booking.slot_id)
            
    db.session.commit()

    for slot in merged_status:
        # If the slot is booked in the database, override status to 'booked'
        if slot['id'] in booked_slot_ids:
            slot['status'] = 'booked'

    return jsonify(merged_status)

def generate_video_feed():
    while True:
        with lock:
            if latest_frame is None:
                time.sleep(0.1)
                continue
            ret, buffer = cv2.imencode('.jpg', latest_frame)
            
        if not ret:
            time.sleep(0.1)
            continue
            
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        # Adjust FPS to ~20FPS streaming
        time.sleep(0.05)

def generate_video_feed_2():
    while True:
        with lock_2:
            if latest_frame_2 is None:
                time.sleep(0.1)
                continue
            ret, buffer = cv2.imencode('.jpg', latest_frame_2)
            
        if not ret:
            time.sleep(0.1)
            continue
            
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        time.sleep(0.05)

@app.route('/api/video_feed')
@app.route('/video_feed')
def video_feed():
    return Response(generate_video_feed(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/video_feed_2')
@app.route('/video_feed_2')
def video_feed_2():
    return Response(generate_video_feed_2(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route("/api/upload", methods=['POST'])
def upload_video():
    # Check if file is in request
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400
    
    file = request.files['video']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': f'Invalid file type. Allowed: {", ".join(app.config["ALLOWED_EXTENSIONS"])}'}), 400
    
    try:
        # Save the uploaded file
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Process the video
        results = process_video(filepath)
        
        # Clean up the file after processing
        if os.path.exists(filepath):
            os.remove(filepath)
        
        return jsonify({'success': True, 'results': results})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/api/bookings", methods=['GET'])
@app.route("/bookings", methods=['GET'])
def get_bookings():
    bookings = Booking.query.filter_by(is_active=True).all()
    return jsonify([booking.to_dict() for booking in bookings])

@app.route("/api/bookings", methods=['POST'])
@app.route("/api/book", methods=['POST'])
@app.route("/bookings", methods=['POST'])
@app.route("/book", methods=['POST'])
def create_booking():
    data = request.get_json()
    
    try:
        booking = Booking(
            slot_id=data['slot_id'],
            user_name=data['user_name'],
            user_email=data['user_email'],
            user_phone=data.get('user_phone')
        )
        db.session.add(booking)
        db.session.commit()

        print(f"Booking created for {booking.user_name} (Slot: {booking.slot_id})")

        # Send SMS via Twilio if phone number is provided and Twilio is configured
        if twilio_client:
            if booking.user_phone:
                try:
                    # Map slot ID to label (A1, A2, etc.) for the SMS
                    row = chr(65 + (booking.slot_id - 1) // 6)
                    col = ((booking.slot_id - 1) % 6) + 1
                    slot_label = f"{row}{col}"
                    
                    # Normalize phone number (E.164 format)
                    phone = booking.user_phone.strip().replace(" ", "")
                    if not phone.startswith('+'):
                        if len(phone) == 10:
                            phone = f"+91{phone}"
                        else:
                            print(f"Warning: Phone number {phone} might be missing country code.")

                    print(f"Attempting to send SMS to {phone} using Twilio number {app.config['TWILIO_PHONE_NUMBER']}...")
                    
                    message = (
                        f"Hi {booking.user_name}, your booking for Slot {slot_label} is confirmed!\n\n"
                        f"Rules: Park within lines, lock your vehicle, and follow the 10km/h speed limit.\n\n"
                        f"Thanks, The Techno Slot Seeker Team"
                    )
                    
                    twilio_client.messages.create(
                        body=message,
                        from_=app.config['TWILIO_PHONE_NUMBER'],
                        to=phone
                    )
                    print(f"SMS sent successfully to {phone}")
                except Exception as sms_error:
                    print(f"Twilio SMS Error for {booking.user_phone}: {sms_error}")
            else:
                print("No phone number provided for booking, skipping SMS.")
        else:
            print("Twilio client not initialized, skipping SMS.")
        
        return jsonify({'booking': booking.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route("/api/bookings/<int:booking_id>", methods=['DELETE'])
@app.route("/api/booking/<int:booking_id>", methods=['DELETE'])
@app.route("/bookings/<int:booking_id>", methods=['DELETE'])
@app.route("/booking/<int:booking_id>", methods=['DELETE'])
def delete_booking(booking_id):
    try:
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        db.session.delete(booking)
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

if __name__ == "__main__":
    app.run(
        host='0.0.0.0',
        port=app.config['FLASK_PORT'],
        debug=app.config['FLASK_DEBUG']
    )
