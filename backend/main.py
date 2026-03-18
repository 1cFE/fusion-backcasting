"""FastAPI entry point for Fusion LCOE Dashboard."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes.costing import router as costing_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warmup: run one calculation to trigger JAX compilation (5-30s)
    # so the first user request is fast
    from backend.services.costing_service import calculate, get_defaults
    print("Warming up JAX (first calculation triggers XLA compilation)...")
    defaults = get_defaults("tokamak", "dt")
    calculate(defaults)
    print("Warmup complete.")
    yield


app = FastAPI(title="Fusion LCOE Dashboard", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(costing_router)


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}
