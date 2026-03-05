from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from src.core.metadata import APP_TITLE, APP_DESCRIPTION, APP_VERSION, OPENAPI_TAGS
from starlette.middleware.base import BaseHTTPMiddleware

from src.api.routers.authrouter import router as authrouter
from src.api.routers.modelrouter import router as modelrouter
from src.api.routers.registration import router as regrouter
from src.api.routers.records import router as recrouter

from src.ml.inference import load_model
from src.ml.preprocessing import inference_transforms
from src.core.config import model_settings, FILES_DIR, INPUT_DIR, OUTPUT_DIR

from contextlib import asynccontextmanager
from src.db.dbfunc import init_db


from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import time
import uuid

from src.core.logging import setup_logging, get_logger, request_id_ctx


logger = get_logger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request_id_ctx.set(request_id)

        start = time.perf_counter()

        try:
            response = await call_next(request)
        except Exception:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.exception(
                "request_failed",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": duration_ms,
                },
            )
            raise

        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        response.headers["X-Request-ID"] = request_id

        logger.info(
            "request_completed",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
            },
        )
        return response


load_dotenv()
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):

    FILES_DIR.mkdir(parents=True, exist_ok=True)
    INPUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    logger.info("storage_directories_ready")

    # Startup logic
    logger.info("database_initialization_start")
    init_db()
    logger.info("database_initialization_done")

    logger.info("model_initialization_start")
    model_temp, device_temp, gradcam_temp = load_model()
    logger.info("model_settings_update_start")
    model_settings["model"] = model_temp
    model_settings["device"] = device_temp
    model_settings["gradcam"] = gradcam_temp
    model_settings["transforms"] = inference_transforms
    model_settings["classnames"] = [
        "Diabetic Retinopathy",
        "Glaucoma",
        "Healthy",
        "Myopia",
    ]
    logger.info("model_settings_update_done")
    logger.info("model_initialization_done")

    yield

    logger.info("application_shutdown")


app = FastAPI(
    title=APP_TITLE,
    description=APP_DESCRIPTION,
    version=APP_VERSION,
    lifespan=lifespan,
    openapi_tags=OPENAPI_TAGS,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET", "RI1p!xu1a%YHWjJ"),
    max_age=3600,  # 1 hour (in seconds)
)
app.add_middleware(RequestLoggingMiddleware)


@app.get("/", include_in_schema=False, response_class=HTMLResponse)
async def home_page() -> str:
        return """<!doctype html>
<html lang=\"en\">
<head>
    <meta charset=\"utf-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <title>Fundus API</title>
    <style>
        :root {
            --bg: #f4f6f8;
            --card: #ffffff;
            --ink: #111827;
            --muted: #4b5563;
            --accent: #0f766e;
            --accent-2: #0d9488;
            --border: #d1d5db;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            min-height: 100vh;
            font-family: "Segoe UI", Tahoma, sans-serif;
            background: radial-gradient(circle at top right, #ccfbf1 0%, var(--bg) 42%);
            color: var(--ink);
            display: grid;
            place-items: center;
            padding: 24px;
        }
        .card {
            width: min(780px, 100%);
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 14px;
            box-shadow: 0 12px 28px rgba(17, 24, 39, 0.08);
            padding: 28px;
        }
        h1 {
            margin: 0 0 8px;
            font-size: clamp(1.4rem, 2.6vw, 2rem);
            letter-spacing: 0.2px;
        }
        p {
            margin: 8px 0;
            color: var(--muted);
            line-height: 1.55;
        }
        .cta {
            display: inline-block;
            margin-top: 14px;
            background: linear-gradient(90deg, var(--accent), var(--accent-2));
            color: #fff;
            text-decoration: none;
            padding: 10px 16px;
            border-radius: 10px;
            font-weight: 600;
        }
        .links {
            margin-top: 18px;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            font-size: 0.95rem;
        }
        .chip {
            border: 1px solid var(--border);
            border-radius: 999px;
            padding: 6px 10px;
            color: #0f172a;
            text-decoration: none;
            background: #f8fafc;
        }
        code {
            background: #f1f5f9;
            border-radius: 6px;
            padding: 2px 6px;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <main class=\"card\">
        <h1>Fundus Image Classification API</h1>
        <p>
            Backend service for doctor/patient registration, retinal image inference,
            and Grad-CAM generation.
        </p>
        <p>
            Start with the interactive API docs or check a quick health signal.
        </p>
        <a class=\"cta\" href=\"/docs\">Open Swagger Docs</a>
        <div class=\"links\">
            <a class=\"chip\" href=\"/docs\">/docs</a>
            <a class=\"chip\" href=\"/redoc\">/redoc</a>
            <a class=\"chip\" href=\"/records/allpatients\">/records/allpatients</a>
            <span class=\"chip\">Session auth required on protected routes</span>
        </div>
        <p>
            Tip: if this is your first call, create a doctor via
            <code>POST /registration/doctor</code> and login via
            <code>POST /auth/login</code>.
        </p>
    </main>
</body>
</html>
"""


app.include_router(regrouter)
app.include_router(authrouter)
app.include_router(modelrouter)
app.include_router(recrouter)
