from fastapi import APIRouter,UploadFile, File, Form, HTTPException, Depends,status
from gloabal_vars import model_settings, INPUT_DIR, OUTPUT_DIR
from MLmodel.Inference import infer_with_gradcam
from DBfunc import new_transaction, doctor_exists, patient_exists
from Models import InferenceInput
from utils import generate_file_names,generate_unique_id, require_auth
import asyncio
from pathlib import Path
import base64

router = APIRouter(prefix="/model", tags=["ML Model"])

@router.post("/")
async def call_model(
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    doctor_id: str = Depends(require_auth)
):
    try:
        # print(doctor_id, patient_id)
        if not (doctor_exists(doctor_id=doctor_id) and patient_exists(patient_id=patient_id)):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="wrong patient id or doctor id")
        
        original_extension = Path(file.filename).suffix #type:ignore

        inputFileName, outputFileName= generate_file_names(patient_id=patient_id)

        inputFileName = f"{inputFileName}{original_extension}"
        outputFileName = f"{outputFileName}.png"


        input_file_path = INPUT_DIR / inputFileName
        output_file_path = OUTPUT_DIR /outputFileName
        # save the uploaded file in a directory
        with open(input_file_path, "wb") as buffer:
            buffer.write(await file.read())
        
        resultant = await asyncio.to_thread(infer_with_gradcam,
                                            image_path=input_file_path,
                                            model= model_settings["model"],
                                            gradcam= model_settings["gradcam"],
                                            transform= model_settings["transforms"],
                                            device= model_settings["device"],
                                            class_names=model_settings["classnames"],
                                            save_path=str(output_file_path)
                                            )
        transaction_id:str= generate_unique_id(entity_type="transaction")
        new_transaction(transaction_id=transaction_id, 
                        doctor_id=doctor_id, 
                        patient_id=patient_id, 
                        patient_inference=resultant["predicted_class"],
                        fundus_input_path=str(inputFileName),
                        fundus_output_path=str(outputFileName) )
        # print(resultant)
        with open(output_file_path,"rb") as buffer:
            buffer_bytes= buffer.read()
        gradcam_image= base64.b64encode(buffer_bytes).decode("utf-8")

        payload ={"predicted_class": resultant["predicted_class"],
                  "confidence":resultant["confidence"],
                  "gradcam_img_base64":gradcam_image}
        return {"Message":"succesful",
                "Payload":payload}
    except HTTPException:
        raise 
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"ML model function failed {e}")
    
    pass