from fastapi import APIRouter, HTTPException, status, Request, Depends, Response
from DBfunc import get_password_hash_for_matching_email
from Models import Login
from utils import verify_password, validate_email, require_auth

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login")
async def loginfunc(request:Request,input:Login):
    try:
        if not validate_email(input.email):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email invalid")
        hash_password, doctor_id= get_password_hash_for_matching_email(email=input.email)
        if not verify_password(plain_password=input.password, stored_hash= hash_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email or password incorrect")
        request.session["user_id"] = doctor_id
        return {"message": "Logged in"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail = f"Login function error {e}")

@router.post("/logout", dependencies=[Depends(require_auth)])
async def logoutfunc(request:Request, response:Response):
    request.session.clear()
    response.delete_cookie("session")
    return {"message": "Logged out"}