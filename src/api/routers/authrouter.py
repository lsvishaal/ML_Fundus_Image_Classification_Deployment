from fastapi import APIRouter, HTTPException, status, Request, Depends, Response
from src.db.dbfunc import get_password_hash_for_matching_email
from src.schemas.models import Login
from src.shared.utils import verify_password, validate_email, require_auth
from src.core.logging import get_logger

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = get_logger(__name__)


@router.post(
    "/login",
    name="doctor_login",
    summary="Login doctor",
    description="Authenticate a doctor and create a session cookie.",
    response_description="Login result with session creation status.",
)
async def login_doctor(request: Request, input: Login):
    try:
        validate_email(input.email)
        hash_password, doctor_id = get_password_hash_for_matching_email(
            email=input.email
        )
        if not verify_password(
            plain_password=input.password, stored_hash=hash_password
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email or password incorrect",
            )
        request.session["user_id"] = doctor_id
        logger.info("doctor_login_success", extra={"doctor_id": doctor_id})
        return {"message": "Logged in"}
    except ValueError as e:
        logger.warning("doctor_login_validation_failed", extra={"reason": str(e)})
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except HTTPException:
        raise
    except Exception:
        logger.exception("doctor_login_unexpected_error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Login failed"
        )


@router.post(
    "/logout",
    name="doctor_logout",
    summary="Logout doctor",
    description="Clear the active session cookie for the authenticated doctor.",
    response_description="Logout confirmation.",
    dependencies=[Depends(require_auth)],
)
async def logout_doctor(request: Request, response: Response):
    doctor_id = request.session.get("user_id", "unknown")
    request.session.clear()
    response.delete_cookie("session")
    logger.info("doctor_logout_success", extra={"doctor_id": doctor_id})
    return {"message": "Logged out"}
