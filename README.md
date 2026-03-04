# ML Fundus Image Classification Deployment

FastAPI backend for retinal fundus image classification with Grad-CAM visualization, plus doctor/patient management and record retrieval.

This project provides:
- Session-based authentication for doctors.
- Doctor and patient registration.
- Model inference on uploaded fundus images.
- Grad-CAM output generation and storage.
- Persistent transaction history (SQLite) for uploaded images and predictions.

## Table of Contents

1. [What This Project Does](#what-this-project-does)
2. [Core Features](#core-features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Runtime Flow](#runtime-flow)
6. [Storage and File Paths](#storage-and-file-paths)
7. [Prerequisites](#prerequisites)
8. [Local Development (uv)](#local-development-uv)
9. [Docker Compose](#docker-compose)
10. [Makefile Commands](#makefile-commands)
11. [API Reference](#api-reference)
12. [Environment Variables](#environment-variables)
13. [Troubleshooting](#troubleshooting)
14. [Current Quality Status](#current-quality-status)

## What This Project Does

The application accepts retinal fundus images, runs a trained PyTorch model to predict one of four classes, generates a Grad-CAM heatmap, and stores both metadata and resulting images for later retrieval.

Primary user journey:
1. Register doctor.
2. Login (session cookie).
3. Register patient.
4. Upload fundus image for inference.
5. Retrieve records and generated images.

Predicted classes:
- `Diabetic Retinopathy`
- `Glaucoma`
- `Healthy`
- `Myopia`

## Core Features

- Clean `src/`-based architecture with compatibility entrypoint at root.
- FastAPI OpenAPI docs available at `/docs`.
- SQLite schema with doctors, patients, and transactions.
- Request-scoped structured logging with request IDs.
- Session middleware for auth-protected endpoints.
- Dockerized deployment with CUDA runtime image.
- Makefile-based developer and operations workflow.

## Tech Stack

- Python 3.12
- FastAPI + Uvicorn
- SQLite3
- PyTorch + torchvision + timm
- OpenCV + Pillow + NumPy
- `uv` for dependency and environment management
- Docker + Docker Compose
- Ruff (lint/format)

## Project Structure

```text
.
|-- main.py                     # compatibility entrypoint (exports src app)
|-- pyproject.toml
|-- uv.lock
|-- Dockerfile
|-- docker-compose.yml
|-- Makefile
|-- assets/
|   `-- models/
|       `-- FundusClassifier_v1.pth
|-- files/                      # runtime data (db/input/output)
`-- src/
		|-- app/
		|   `-- main.py             # FastAPI app creation + lifespan setup
		|-- api/
		|   `-- routers/
		|       |-- authrouter.py
		|       |-- registration.py
		|       |-- modelrouter.py
		|       `-- records.py
		|-- core/
		|   |-- config.py           # canonical paths/settings
		|   |-- logging.py          # structured logging utilities
		|   `-- metadata.py         # app metadata/openapi tags
		|-- db/
		|   `-- dbfunc.py           # database and query layer
		|-- ml/
		|   |-- inference.py
		|   |-- model_definitions.py
		|   |-- preprocessing.py
		|   `-- gradcam.py
		|-- schemas/
		|   `-- models.py           # request schemas
		`-- shared/
				`-- utils.py            # auth, id, validation helpers
```

## Runtime Flow

On startup (`src/app/main.py`):
1. Creates runtime directories (`files/`, `files/input`, `files/output`).
2. Initializes SQLite tables/indexes.
3. Loads model and inference transforms into `model_settings`.
4. Serves API with middleware:
	 - `SessionMiddleware`
	 - request logging middleware (`X-Request-ID` support)

On inference (`POST /model/`):
1. Validates doctor and patient IDs.
2. Saves uploaded image to `files/input`.
3. Runs Grad-CAM inference in worker thread.
4. Saves output image to `files/output`.
5. Stores transaction in SQLite.
6. Returns class/confidence plus output image as base64.

## Storage and File Paths

Canonical paths are defined in `src/core/config.py`:
- Database: `files/ml_app.db`
- Input images: `files/input/`
- Output images: `files/output/`
- Model weight: `assets/models/FundusClassifier_v1.pth`

Notes:
- Root-level `ml_app.db` is intentionally not used anymore.
- Docker compose mounts `fundus_files` volume at `/app/files` for persistence.

## Prerequisites

- Linux environment recommended for CUDA/GPU flow.
- Python 3.12
- `uv` installed
- Docker + Docker Compose (for containerized run)
- NVIDIA drivers/runtime if using GPU in container

## Local Development (uv)

1. Install dependencies:

```bash
uv sync
```

2. Run API locally:

```bash
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

3. Open docs:

```text
http://localhost:8000/docs
```

## Docker Compose

Build and run:

```bash
docker compose build
docker compose up -d
```

Check service status:

```bash
docker compose ps
```

Stop:

```bash
docker compose down
```

## Makefile Commands

Use `make help` to list targets.

Common commands:

```bash
make install      # uv sync
make run          # local uvicorn
make lint         # ruff check
make format       # ruff format
make build        # docker compose build
make fresh-build  # docker compose build --no-cache
make up           # docker compose up -d
make down         # docker compose down
make logs         # docker compose logs -f --tail=200
make ps           # docker compose ps
make restart      # docker compose restart
make clean        # docker compose down -v --remove-orphans
```

## API Reference

Base URL: `http://localhost:8000`

### Authentication

- `POST /auth/login`
	- Body: `{"email":"...","password":"..."}`
	- Sets session cookie on success.
- `POST /auth/logout`
	- Requires authenticated session.

### Registration

- `POST /registration/doctor`
	- Public endpoint.
	- Creates doctor record.
- `POST /registration/patient`
	- Requires authenticated session.
	- Creates patient record.

### Inference

- `POST /model/`
	- Multipart form:
		- `file` (fundus image)
		- `patient_id`
	- Requires authenticated session.
	- Returns prediction, confidence, and base64 Grad-CAM.

### Records

- `GET /records/patients`
	- Returns grouped patient transactions for logged-in doctor.
- `GET /records/get_image?image_name=...`
	- Returns base64 for stored input/output image.
- `GET /records/allpatients`
- `GET /records/alldoctors`

## Environment Variables

Loaded from `.env` via `python-dotenv`.

- `SESSION_SECRET`
	- Secret for session cookie signing.
	- If absent, fallback default is used in code (recommended to override in production).
- `LOG_LEVEL`
	- Logging level (for example: `INFO`, `WARNING`, `DEBUG`).

Example `.env`:

```env
SESSION_SECRET=change-this-in-production
LOG_LEVEL=INFO
```

## Troubleshooting

### `/docs` not reachable

- Check service status: `make ps`
- Check logs: `make logs`
- Verify port `8000` is free.

### Model or CUDA issues in container

- Ensure NVIDIA runtime and drivers are correctly installed.
- Confirm image uses CUDA-compatible base and torch index.

### Database/path issues

- Confirm `files/` exists and is writable.
- Confirm DB is at `files/ml_app.db`.

### Authentication errors

- Ensure login is successful before protected endpoints.
- Send returned session cookie for protected requests.

## Current Quality Status

Validated in this repository:
- `make help`, `make lint`, `make ps`, `make down`, `make up` all execute correctly.
- `/docs` endpoint resolves correctly after restart.
- Full end-to-end flow validated:
	- doctor registration
	- login
	- patient registration
	- inference upload
	- records fetch
	- stored image fetch
- Storage paths verified:
	- DB at `files/ml_app.db`
	- no root-level `ml_app.db` in active use

