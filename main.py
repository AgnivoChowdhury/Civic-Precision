# =========================
# IMPORTS
# =========================
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from datetime import datetime
from ultralytics import YOLO

# =========================
# LOAD MODEL
# =========================
model = YOLO("C:/Users/vaibh/Downloads/NEW MODEL Pipehole/best.pt")  # change path if needed

# =========================
# FASTAPI INIT
# =========================
app = FastAPI()

# Enable CORS (frontend connection)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# AREA FUNCTION
# =========================
def calculate_area(mask_np):
    if mask_np is None or mask_np.sum() == 0:
        return 0.0
    return float(np.sum(mask_np) / (mask_np.shape[0] * mask_np.shape[1]))

# =========================
# DEPTH FUNCTION
# =========================
def estimate_depth(image, mask_np):
    if mask_np.sum() == 0:
        return 0.0

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    pothole_pixels = gray[mask_np == 1]
    avg_intensity = np.mean(pothole_pixels)

    intensity_depth = 1 - (avg_intensity / 255.0)

    edges = cv2.Canny(gray, 50, 150)
    edge_density = np.sum(edges[mask_np == 1]) / (mask_np.sum() * 255.0 + 1e-6)

    depth = 0.6 * intensity_depth + 0.4 * edge_density
    return float(np.clip(depth, 0, 1))

# =========================
# SEVERITY FUNCTION
# =========================
def calculate_severity(area, depth):
    return float(np.clip(0.6 * area + 0.4 * depth, 0, 1))

# =========================
# PRIORITY FUNCTION
# =========================
def calculate_priority(severity):
    traffic = 0.8       # default (main road)
    location = 0.5      # default (residential)
    time = 0.3          # default (recent)

    priority = (
        0.4 * severity +
        0.3 * traffic +
        0.2 * location +
        0.1 * time
    )

    if priority < 0.4:
        label = "LOW"
    elif priority < 0.7:
        label = "MEDIUM"
    else:
        label = "HIGH"

    return float(np.clip(priority, 0, 1)), label

# =========================
# MASK EXTRACTION
# =========================
def get_mask_from_model(image):

    results = model(image)

    for r in results:
        if r.masks is None:
            return None

        masks = r.masks.data

        best_mask = None
        max_area = 0

        for mask in masks:
            mask_np = mask.cpu().numpy()

            mask_np = cv2.resize(
                mask_np,
                (image.shape[1], image.shape[0]),
                interpolation=cv2.INTER_LINEAR
            )

            mask_np = cv2.GaussianBlur(mask_np, (5, 5), 0)
            mask_np = (mask_np > 0.5).astype(np.uint8)

            kernel = np.ones((3, 3), np.uint8)
            mask_np = cv2.morphologyEx(mask_np, cv2.MORPH_OPEN, kernel)
            mask_np = cv2.morphologyEx(mask_np, cv2.MORPH_CLOSE, kernel)

            area = np.sum(mask_np)

            if area > max_area:
                max_area = area
                best_mask = mask_np

        return best_mask

# =========================
# MAIN PIPELINE
# =========================
def process_pothole(image, mask_np):

    area = calculate_area(mask_np)
    depth = estimate_depth(image, mask_np)
    severity = calculate_severity(area, depth)

    priority_score, priority_label = calculate_priority(severity)

    return {
        "area": area,
        "depth": depth,
        "severity": severity,
        "priority_score": priority_score,
        "priority_label": priority_label
    }

# =========================
# API ROUTES
# =========================

@app.get("/")
def home():
    return {"message": "Pothole Detection API Running"}

@app.post("/detect")
async def detect_pothole(file: UploadFile = File(...)):

    try:
        # --- Read image ---
        image_bytes = await file.read()
        np_arr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if image is None:
            return {"error": "Invalid image"}

        # --- Get mask ---
        mask_np = get_mask_from_model(image)

        if mask_np is None:
            return {"message": "No pothole detected"}

        # --- Process ---
        result = process_pothole(image, mask_np)

        return result

    except Exception as e:
        return {"error": str(e)}