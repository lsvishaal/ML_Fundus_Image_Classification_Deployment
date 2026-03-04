from pathlib import Path

model_settings: dict = {}

BASE_DIR = Path(__file__).resolve().parents[2]
FILES_DIR = BASE_DIR / "files"
INPUT_DIR = FILES_DIR / "input"
OUTPUT_DIR = FILES_DIR / "output"

DB_PATH = FILES_DIR / "ml_app.db"
ML_MODEL_DIR = BASE_DIR / "assets" / "models" / "FundusClassifier_v1.pth"