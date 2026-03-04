SHELL := /bin/bash

.PHONY: help install run lint format build fresh-build up down logs ps restart clean

help:
	@echo "Available targets:"
	@echo "  make install      - install Python dependencies using uv"
	@echo "  make run          - run API locally with uvicorn"
	@echo "  make lint         - run Ruff lint checks"
	@echo "  make format       - format Python files with Ruff"
	@echo "  make build        - build docker compose images"
	@echo "  make fresh-build  - rebuild docker compose images without cache"
	@echo "  make up           - start docker compose services"
	@echo "  make down         - stop docker compose services"
	@echo "  make logs         - tail compose logs"
	@echo "  make ps           - show compose service status"
	@echo "  make restart      - restart compose services"
	@echo "  make clean        - remove compose services, orphans, and volumes"

install:
	uv sync

run:
	uv run uvicorn main:app --host 0.0.0.0 --port 8000

lint:
	uv run ruff check .

format:
	uv run ruff format .

build:
	docker compose build

fresh-build:
	docker compose build --no-cache

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f --tail=200

ps:
	docker compose ps

restart:
	docker compose restart

clean:
	docker compose down -v --remove-orphans