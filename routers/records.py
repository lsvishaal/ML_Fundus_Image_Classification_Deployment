from fastapi import APIRouter, HTTPException, Depends, status
from utils import require_auth
from DBfunc import get_doctor_patient_transactions, get_image_from_transactions, get_all_records_of_all_patient, get_all_records_of_all_doctors

router= APIRouter(prefix="/records", tags=["Record searching"])

@router.get("/patients" )
async def get_all_patients_under_doctor(user=Depends(require_auth)):
    # doesnt have to get the doctor_id, wiill get from auth
    try:
        resultant= get_doctor_patient_transactions(doctor_id=user)
        return{"Message":"Successful", "Payload": resultant}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Problem with retrieving Pateint records {e}")
    pass

@router.get("/get_image")
async def get_image(image_name:str,user=Depends(require_auth)):
    try:
        base64_image= get_image_from_transactions(image_name=image_name)
        return {"Message":"Successful",
                "Image":base64_image}
    except ValueError as e:
        temp_e=str(e)
        if "Couldnt access file" in temp_e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error in getting picture {temp_e}")
        elif "Imagefile not in records" in temp_e:
            raise HTTPException(status_code=status.HTTP_204_NO_CONTENT, detail=f"Error in getting picture {temp_e}")
        elif "File name , not according to compliance" in temp_e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Error in getting picture {temp_e}")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error in getting picture {e}")

@router.get("/allpatients")
async def get_all_patients_id_name_and_email(user=Depends(require_auth)):
    try:
        resultant= get_all_records_of_all_patient()
        return {"Message":"Succesful", 
                "Payload":resultant}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error in getting all patients {e}")
    
@router.get("/alldoctors")
async def get_all_docotors_id_name_and_email(user=Depends(require_auth)):
    try:
        resultant= get_all_records_of_all_doctors()
        return {"Message":"Succesful", 
                "Payload":resultant}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error in getting all doctors {e}")
    

        
