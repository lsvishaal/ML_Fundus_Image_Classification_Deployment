import asyncio
import base64
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from src.db.dbfunc import doctor_exists, new_transaction, patient_exists
from src.ml.inference import infer_with_gradcam
from src.core.logging import get_logger
from src.core.config import INPUT_DIR, OUTPUT_DIR, model_settings
from src.shared.utils import generate_file_names, generate_unique_id, require_auth

router = APIRouter(prefix="/model", tags=["ML Inference"])
logger = get_logger(__name__)


@router.post(
    "/",
    name="classify_fundus_image",
    summary="Classify fundus image",
    description="Upload a fundus image and patient_id to get predicted class, confidence, and Grad-CAM image.",
    response_description="Inference result with prediction and Grad-CAM image in base64.",
)
async def call_model(
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    doctor_id: str = Depends(require_auth),
):
    try:
        if not (
            doctor_exists(doctor_id=doctor_id) and patient_exists(patient_id=patient_id)
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="wrong patient id or doctor id",
            )

        original_extension = Path(file.filename).suffix if file.filename else ".jpg"
        input_file_name, output_file_name = generate_file_names(patient_id=patient_id)
        input_file_name = f"{input_file_name}{original_extension}"
        output_file_name = f"{output_file_name}.png"

        input_file_path = INPUT_DIR / input_file_name
        output_file_path = OUTPUT_DIR / output_file_name

        with open(input_file_path, "wb") as buffer:
            buffer.write(await file.read())

        result = await asyncio.to_thread(
            infer_with_gradcam,
            image_path=input_file_path,
            model=model_settings["model"],
            gradcam=model_settings["gradcam"],
            transform=model_settings["transforms"],
            device=model_settings["device"],
            class_names=model_settings["classnames"],
            save_path=str(output_file_path),
        )

        transaction_id = generate_unique_id(entity_type="transaction")
        new_transaction(
            transaction_id=transaction_id,
            doctor_id=doctor_id,
            patient_id=patient_id,
            patient_inference=result["predicted_class"],
            fundus_input_path=str(input_file_name),
            fundus_output_path=str(output_file_name),
        )

        with open(output_file_path, "rb") as buffer:
            gradcam_image = base64.b64encode(buffer.read()).decode("utf-8")

        payload = {
            "predicted_class": result["predicted_class"],
            "confidence": result["confidence"],
            "gradcam_img_base64": gradcam_image,
        }

        logger.info(
            "fundus_inference_success",
            extra={
                "doctor_id": doctor_id,
                "patient_id": patient_id,
                "predicted_class": result["predicted_class"],
            },
        )
        return {"Message": "succesful", "Payload": payload}

    except ValueError as e:
        logger.warning(
            "fundus_inference_validation_failed",
            extra={"reason": str(e), "doctor_id": doctor_id, "patient_id": patient_id},
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except HTTPException:
        raise
    except Exception:
        logger.exception(
            "fundus_inference_unexpected_error",
            extra={"doctor_id": doctor_id, "patient_id": patient_id},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Inference failed"
        )
