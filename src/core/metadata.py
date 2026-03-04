APP_TITLE = "Fundus Image Classification API"
APP_DESCRIPTION = (
    "API for doctor/patient registration, authentication, retinal image inference, "
    "and records retrieval."
)
APP_VERSION = "1.0.0"

OPENAPI_TAGS = [
    {
        "name": "Registration",
        "description": "Create doctor and patient records.",
    },
    {
        "name": "Authentication",
        "description": "Login and logout operations for doctor sessions.",
    },
    {
        "name": "ML Inference",
        "description": "Upload a fundus image and run disease classification with Grad-CAM.",
    },
    {
        "name": "Records",
        "description": "Fetch patients, doctors, and stored inference images.",
    },
]
