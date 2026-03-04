from fastapi import APIRouter, HTTPException, Depends, status
from src.db.dbfunc import create_new_doctor, create_new_patient
from src.schemas.models import RegisterDoctor, RegisterPatient
from src.shared.utils import (
    validate_email,
    generate_unique_id,
    hash_password,
    require_auth,
)
from src.core.logging import get_logger


router = APIRouter(prefix="/registration", tags=["Registration"])
logger = get_logger(__name__)


@router.post(
    "/doctor",
    name="register_doctor",
    summary="Register doctor",
    description="Create a new doctor account. This endpoint does not require authentication.",
    response_description="Created doctor identifier.",
)
async def register_new_doctor(input: RegisterDoctor):
    doctor_id = generate_unique_id(entity_type="doctor")
    try:
        validate_email(input.email)
        hashed_password = hash_password(input.password)
        create_new_doctor(
            doctor_id=doctor_id,
            name=input.name,
            email=input.email,
            age=input.age,
            gender=input.gender,
            password_hash=hashed_password,
        )
        logger.info(
            "doctor_registered", extra={"doctor_id": doctor_id, "email": input.email}
        )
        return {"Message": "Record Created Succesfully", "doctor_id": doctor_id}
    except ValueError as e:
        logger.warning(
            "doctor_registration_validation_failed",
            extra={"reason": str(e), "email": input.email},
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except HTTPException:
        raise
    except Exception:
        logger.exception(
            "doctor_registration_unexpected_error", extra={"email": input.email}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Doctor registration failed",
        )


@router.post(
    "/patient",
    name="register_patient",
    summary="Register patient",
    description="Create a new patient record under an authenticated doctor session.",
    response_description="Created patient identifier.",
    dependencies=[Depends(require_auth)],
)
async def register_new_patient(input: RegisterPatient):
    patient_id = generate_unique_id(entity_type="patient")
    try:
        validate_email(input.email)

        create_new_patient(
            patient_id=patient_id,
            name=input.name,
            email=input.email,
            age=input.age,
            gender=input.gender,
        )
        logger.info(
            "patient_registered", extra={"patient_id": patient_id, "email": input.email}
        )
        return {"Message": "Record Created Succesfully", "patient_id": patient_id}
    except ValueError as e:
        logger.warning(
            "patient_registration_validation_failed",
            extra={"reason": str(e), "email": input.email},
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except HTTPException:
        raise
    except Exception:
        logger.exception(
            "patient_registration_unexpected_error", extra={"email": input.email}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Patient registration failed",
        )
