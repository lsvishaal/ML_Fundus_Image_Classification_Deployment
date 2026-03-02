from fastapi import FastAPI

from routers.authrouter import router as authrouter
from routers.modelrouter import router as modelrouter
from routers.registration import router as regrouter
from routers.records import router as recrouter

from MLmodel.Inference import load_model
from MLmodel.PreProcessing import inference_transforms
from gloabal_vars import model_settings, FILES_DIR,INPUT_DIR, OUTPUT_DIR

from contextlib import asynccontextmanager
from DBfunc import init_db


from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
import os

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):

    FILES_DIR.mkdir(exist_ok=True)
    INPUT_DIR.mkdir(exist_ok=True)
    OUTPUT_DIR.mkdir(exist_ok=True)

    print("Folders ready.")

    # Startup logic
    print("Database initialization starting")
    init_db()
    print("Database initialized")

    print("ML Model intialization starting")
    model_temp, device_temp,gradcam_temp= load_model()
    print("Model settings getting updated")
    model_settings["model"]=model_temp
    model_settings["device"]=device_temp
    model_settings["gradcam"]=gradcam_temp
    model_settings["transforms"]=inference_transforms
    model_settings["classnames"] = [
    "Diabetic Retinopathy",
    "Glaucoma",
    "Healthy",
    "Myopia"
    ]
    print("Model settings updated")
    print("ML Model intialized")

    yield 

    print("Application shutting down")

app= FastAPI(title="ML_MODEL", lifespan=lifespan)

app.add_middleware(
    SessionMiddleware,
    secret_key= os.getenv("SESSION_SECRET","RI1p!xu1a%YHWjJ"),
    max_age=3600  # 1 hour (in seconds)
)

app.include_router(authrouter)
app.include_router(modelrouter)
app.include_router(regrouter)
app.include_router(recrouter)