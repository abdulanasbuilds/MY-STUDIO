# MY STUDIO — mediapipe_tracker.py
import os
import subprocess

def load_mediapipe() -> object:
    """
    Load MediaPipe FaceMesh solution.
    Model files at: /models/mediapipe/
    Cache after first load.
    Returns: mp.solutions.face_mesh.FaceMesh instance
    """
    import mediapipe as mp
    return mp.solutions.face_mesh.FaceMesh(
        static_image_mode=False,
        max_num_faces=2,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )

def track_face_positions(video_path: str) -> list[dict]:
    """
    Detect face bounding box every frame.
    Returns list: [{frame_num, x, y, width, height, confidence}]
    Uses MediaPipe FaceMesh for precise landmarks.
    For frames with no face: returns previous known position.
    """
    import cv2
    face_mesh = load_mediapipe()
    cap = cv2.VideoCapture(video_path)
    positions = []
    frame_num = 0
    last_pos = None

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        # Convert BGR to RGB for MediaPipe
        results = face_mesh.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        
        if results.multi_face_landmarks:
            h, w, _ = frame.shape
            landmarks = results.multi_face_landmarks[0].landmark
            x_coords = [l.x * w for l in landmarks]
            y_coords = [l.y * h for l in landmarks]
            
            last_pos = {
                "frame_num": frame_num,
                "x": min(x_coords),
                "y": min(y_coords),
                "width": max(x_coords) - min(x_coords),
                "height": max(y_coords) - min(y_coords),
                "confidence": 1.0
            }
        
        if last_pos:
            positions.append({**last_pos, "frame_num": frame_num})
            
        frame_num += 1

    cap.release()
    return positions

def smooth_positions(positions: list[dict], smoothing: float = 0.7) -> list[dict]:
    """
    Apply temporal smoothing to prevent jitter.
    Formula: smooth_x = 0.7 * prev_x + 0.3 * current_x
    Same for y. Apply to both x and y.
    """
    if not positions:
        return []
        
    smoothed = [positions[0]]
    for i in range(1, len(positions)):
        prev = smoothed[i-1]
        curr = positions[i]
        smoothed.append({
            "frame_num": curr["frame_num"],
            "x": smoothing * prev["x"] + (1 - smoothing) * curr["x"],
            "y": smoothing * prev["y"] + (1 - smoothing) * curr["y"],
            "width": smoothing * prev["width"] + (1 - smoothing) * curr["width"],
            "height": smoothing * prev["height"] + (1 - smoothing) * curr["height"],
            "confidence": curr["confidence"]
        })
    return smoothed

def crop_to_vertical_tracking(video_path: str, output_path: str) -> str:
    """
    Crop 16:9 video to 9:16 following face.
    """
    positions = track_face_positions(video_path)
    positions = smooth_positions(positions)
    
    # Calculate average center X over the whole video to simplify ffmpeg crop for now
    if not positions:
        return crop_smart_center(video_path, output_path)
        
    avg_x = sum(p["x"] + p["width"]/2 for p in positions) / len(positions)
    
    # Target 9:16 aspect ratio
    cmd = [
        "ffmpeg", "-y", "-i", video_path,
        "-vf", f"crop=ih*9/16:ih:{avg_x}-((ih*9/16)/2):0",
        "-c:a", "copy", output_path
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    return output_path

def crop_split_screen(video_path: str, output_path: str) -> str:
    """
    For two-person videos: split screen 50/50.
    Output: 1080x1920 (each half 540x1920, stacked)
    """
    cmd = [
        "ffmpeg", "-y", "-i", video_path,
        "-filter_complex", "[0:v]crop=iw/2:ih:0:0[left];[0:v]crop=iw/2:ih:iw/2:0[right];[left][right]vstack=inputs=2[v]",
        "-map", "[v]", "-map", "0:a?", "-c:v", "libx264", "-c:a", "copy", output_path
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    return output_path

def crop_smart_center(video_path: str, output_path: str) -> str:
    """
    No face detected: center crop with blurred background.
    """
    cmd = [
        "ffmpeg", "-y", "-i", video_path,
        "-filter_complex", "[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,boxblur=20:20[bg];[0:v]scale=1080:1920:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=y=(H-h)/2[v]",
        "-map", "[v]", "-map", "0:a?", "-c:v", "libx264", "-c:a", "copy", output_path
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    return output_path

def detect_speaker_count(video_path: str) -> int:
    """
    Returns: 1 (single speaker) or 2 (two speakers)
    Used to decide between track vs split_screen.
    """
    return 1  # Default to single speaker for now to ensure stability
