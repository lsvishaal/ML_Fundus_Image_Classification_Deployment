import re
import uuid
from datetime import datetime

import bcrypt
from fastapi import HTTPException, Request, status

from src.core.logging import get_logger

logger = get_logger(__name__)


def generate_unique_id(entity_type: str) -> str:
    entity_type = entity_type.lower()

    prefix_map = {
        "doctor": "DOC",
        "patient": "PAT",
        "transaction": "TRX",
    }

    if entity_type not in prefix_map:
        raise ValueError("entity_type must be 'doctor', 'patient', or 'transaction'")

    prefix = prefix_map[entity_type]

    date_part = datetime.now().strftime("%Y%m")

    unique_part = uuid.uuid4().hex[:6].upper()

    return f"{prefix}{date_part}{unique_part}"


def generate_file_names(patient_id: str) -> tuple[str, str]:
    if not patient_id or not isinstance(patient_id, str):
        raise ValueError("patient_id must be a non-empty string")

    unique_part = uuid.uuid4().hex[:6].upper()

    shared_part = f"{patient_id}{unique_part}"

    input_filename = f"INPUT{shared_part}"
    output_filename = f"OUTPUT{shared_part}"

    return input_filename, output_filename


EMAIL_REGEX = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")


def validate_email(email: str) -> bool:
    if not isinstance(email, str):
        raise ValueError("Email is not string")
    if bool(EMAIL_REGEX.fullmatch(email.strip())):
        return True
    raise ValueError("Email in invalid fomrat")


def hash_password(password: str) -> str:
    if not isinstance(password, str):
        raise ValueError("Password must be string")

    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)

    return hashed.decode("utf-8")


def verify_password(plain_password: str, stored_hash: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), stored_hash.encode("utf-8"))


def require_auth(request: Request):
    user = request.session.get("user_id")

    if not user:
        logger.warning("authentication required", extra={"path": str(request.url.path)})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    return user
