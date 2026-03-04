from fastapi import APIRouter, HTTPException, Depends, status
from src.shared.utils import require_auth
from src.db.dbfunc import (
    get_doctor_patient_transactions,
    get_image_from_transactions,
    get_all_records_of_all_patient,
    get_all_records_of_all_doctors,
)
from src.core.logging import get_logger

router = APIRouter(prefix="/records", tags=["Records"])
logger = get_logger(__name__)


@router.get(
    "/patients",
    name="list_doctor_patient_transactions",
    summary="List my patient transactions",
    description="Return all patients and related inference transactions for the logged-in doctor.",
    response_description="Grouped patient transaction records.",
)
async def get_all_patients_under_doctor(user=Depends(require_auth)):
    try:
        resultant = get_doctor_patient_transactions(doctor_id=user)
        logger.info(
            "doctor_patient_records_fetched",
            extra={"doctor_id": user, "patients": len(resultant)},
        )
        return {"Message": "Successful", "Payload": resultant}
    except Exception:
        logger.exception("doctor_patient_records_failed", extra={"doctor_id": user})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve patient records",
        )


@router.get(
    "/get_image",
    name="get_stored_image",
    summary="Get stored image",
    description="Fetch a stored input/output image by filename and return it as base64.",
    response_description="Requested image encoded in base64.",
)
async def get_image(image_name: str, user=Depends(require_auth)):
    try:
        base64_image = get_image_from_transactions(image_name=image_name)
        logger.info(
            "record_image_fetched", extra={"doctor_id": user, "image_name": image_name}
        )
        return {"Message": "Successful", "Image": base64_image}
    except ValueError as e:
        temp_e = str(e)
        logger.warning(
            "record_image_validation_failed",
            extra={"doctor_id": user, "image_name": image_name, "reason": temp_e},
        )
        if "Couldnt access file" in temp_e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Image file could not be read",
            )
        elif "Imagefile not in records" in temp_e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image not found in records",
            )
        elif "File name , not according to compliance" in temp_e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image name format",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image request"
        )
    except Exception:
        logger.exception(
            "record_image_unexpected_error",
            extra={"doctor_id": user, "image_name": image_name},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get image",
        )


@router.get(
    "/allpatients",
    name="list_all_patients",
    summary="List all patients",
    description="Return all patient records across the system.",
    response_description="List of patients.",
)
async def get_all_patients_id_name_and_email(user=Depends(require_auth)):
    try:
        resultant = get_all_records_of_all_patient()
        logger.info(
            "all_patients_fetched", extra={"doctor_id": user, "count": len(resultant)}
        )
        return {"Message": "Succesful", "Payload": resultant}
    except Exception:
        logger.exception("all_patients_fetch_failed", extra={"doctor_id": user})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve patients",
        )


@router.get(
    "/alldoctors",
    name="list_all_doctors",
    summary="List all doctors",
    description="Return all doctor records across the system.",
    response_description="List of doctors.",
)
async def get_all_docotors_id_name_and_email(user=Depends(require_auth)):
    try:
        resultant = get_all_records_of_all_doctors()
        logger.info(
            "all_doctors_fetched", extra={"doctor_id": user, "count": len(resultant)}
        )
        return {"Message": "Succesful", "Payload": resultant}
    except Exception:
        logger.exception("all_doctors_fetch_failed", extra={"doctor_id": user})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve doctors",
        )
