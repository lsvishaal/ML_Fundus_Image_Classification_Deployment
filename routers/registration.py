from fastapi import APIRouter,HTTPException, Depends,status
from DBfunc import create_new_doctor, create_new_patient
from Models import RegisterDoctor, RegisterPatient
from utils import validate_email, generate_unique_id, hash_password, require_auth


router= APIRouter(prefix="/registration", tags=["Registration"])

@router.post("/doctor")
async def register_new_doctor(input:RegisterDoctor):
    doctor_id = generate_unique_id(entity_type="doctor")
    try:
        if not validate_email(input.email):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid Input params")
        hashed_password= hash_password(input.password)
        create_new_doctor(
            doctor_id=doctor_id, 
            name=input.name,
            email=input.email,
            age=input.age,
            gender=input.gender, 
            password_hash=hashed_password)
        return {"Message":"Record Created Succesfully", "doctor_id":doctor_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Could not create new record in DB : {e}")
    pass

@router.post("/patient", dependencies=[Depends(require_auth)])
async def register_new_patient(input:RegisterPatient):
    patient_id= generate_unique_id(entity_type="patient")
    try:
        if not validate_email(input.email):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Input params")

        create_new_patient(
            patient_id=patient_id,
            name=input.name,
            email=input.email,
            age=input.age,
            gender=input.gender
        )
        return {"Message":"Record Created Succesfully", "patient_id":patient_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error occured while creating patient registration : {e}")
    pass

