from pathlib import Path

model_settings={}

BASE_DIR = Path(__file__).resolve().parent
FILES_DIR = BASE_DIR / "files"
INPUT_DIR = FILES_DIR / "input"
OUTPUT_DIR = FILES_DIR / "output"


ML_MODEL_DIR = BASE_DIR / "MLmodel" /  "model_1_alt_phase3_training_partial_best.pth"