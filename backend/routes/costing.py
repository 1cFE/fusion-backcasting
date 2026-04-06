"""API routes for 1costingfe LCOE dashboard."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services.costing_service import calculate, get_defaults, get_power_cycle_presets
from costingfe.types import ConfinementConcept, Fuel

router = APIRouter(prefix="/api/costing", tags=["costing"])


class CalculateRequest(BaseModel):
    """All parameters for LCOE calculation. Flat dict."""
    params: dict


class DefaultsRequest(BaseModel):
    concept: str = "tokamak"
    fuel: str = "dt"


@router.get("/concepts")
def list_concepts():
    """Return available concepts and fuels."""
    return {
        "concepts": [c.value for c in ConfinementConcept],
        "fuels": [f.value for f in Fuel],
        "concept_labels": {
            "tokamak": "Tokamak",
            "stellarator": "Stellarator",
            "mirror": "Mirror",
            "laser_ife": "Laser IFE",
            "zpinch": "Z-Pinch",
            "heavy_ion": "Heavy Ion",
            "mag_target": "Mag. Target",
            "plasma_jet": "Plasma Jet",
            "pulsed_frc": "Pulsed FRC",
        },
        "fuel_labels": {
            "dt": "D-T",
            "dd": "D-D",
            "dhe3": "D-He3",
            "pb11": "p-B11",
        },
    }


@router.get("/power-cycles")
def list_power_cycles():
    """Return power cycle presets (eta_th + BOP coefficients)."""
    return {"presets": get_power_cycle_presets()}


@router.post("/defaults")
def get_param_defaults(req: DefaultsRequest):
    """Get all default parameters for a concept/fuel combination."""
    try:
        defaults = get_defaults(req.concept, req.fuel)
        return {"defaults": defaults}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/calculate")
def calculate_lcoe(req: CalculateRequest):
    """Calculate LCOE from parameters."""
    try:
        result = calculate(req.params)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
