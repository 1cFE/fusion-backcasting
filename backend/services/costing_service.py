"""Service layer wrapping 1costingfe for the dashboard API."""

from costingfe import CostModel, ConfinementConcept, Fuel
from costingfe.adapter import FusionTeaInput, run_costing
from costingfe.defaults import (
    CostingConstants,
    POWER_CYCLE_DEFAULTS,
    cc_float_fields,
    load_costing_constants,
    load_engineering_defaults,
)
from costingfe.types import CONCEPT_TO_FAMILY, PowerCycle


def get_concept_family(concept: str) -> str:
    """Get the family prefix for a concept's YAML file."""
    cc = ConfinementConcept(concept)
    family = CONCEPT_TO_FAMILY[cc]
    return f"{family.value}_{concept}"


def get_power_cycle_presets() -> dict[str, dict[str, float]]:
    """Return power cycle presets (eta_th + BOP coefficients) keyed by cycle name."""
    return {pc.value: vals for pc, vals in POWER_CYCLE_DEFAULTS.items()}


def get_defaults(concept: str, fuel: str) -> dict:
    """Return all default parameters for a concept/fuel combination.

    Returns a flat dict with:
    - customer params (availability, lifetime_yr, etc.)
    - engineering params (from concept YAML template)
    - costing constants (all CostingConstants float fields)
    """
    eng = load_engineering_defaults(get_concept_family(concept))
    cc = load_costing_constants()

    defaults = {
        # Customer params
        "concept": concept,
        "fuel": fuel,
        "net_electric_mw": 1000.0,
        "availability": 0.85,
        "lifetime_yr": 40.0,
        "n_mod": 1,
        "construction_time_yr": eng.get("construction_time_yr", 6.0),
        "interest_rate": 0.07,
        "inflation_rate": 0.02,
        "noak": True,
    }

    # Engineering defaults from YAML
    for k, v in eng.items():
        if k not in defaults:
            defaults[k] = v

    # Costing constants
    for name in cc_float_fields():
        defaults[f"cc_{name}"] = getattr(cc, name)

    return defaults


def calculate(params: dict) -> dict:
    """Run full LCOE calculation.

    Args:
        params: Flat dict of all parameters. Costing constant overrides
               are prefixed with "cc_" (e.g., "cc_blanket_unit_cost_dt").

    Returns:
        Dict with: lcoe, overnight_cost, total_capital, costs (CAS breakdown),
        power_table, sensitivity, cas22_detail.
    """
    concept = params.get("concept", "tokamak")
    fuel = params.get("fuel", "dt")

    # Separate costing constant overrides from engineering overrides
    costing_overrides = {}
    engineering_overrides = {}
    cost_overrides = {}

    power_cycle = params.get("power_cycle", "rankine")

    skip_keys = {
        "concept", "fuel", "net_electric_mw", "availability",
        "lifetime_yr", "n_mod", "construction_time_yr",
        "interest_rate", "inflation_rate", "noak", "power_cycle",
    }
    cc_fields = set(cc_float_fields())

    for k, v in params.items():
        if k in skip_keys:
            continue
        if k.startswith("cc_"):
            cc_name = k[3:]  # strip "cc_" prefix
            if cc_name in cc_fields:
                costing_overrides[cc_name] = v
        elif k.startswith("CAS") or k.startswith("C22"):
            cost_overrides[k] = v
        else:
            engineering_overrides[k] = v

    inp = FusionTeaInput(
        concept=concept,
        fuel=fuel,
        net_electric_mw=params.get("net_electric_mw", 1000.0),
        availability=params.get("availability", 0.85),
        lifetime_yr=params.get("lifetime_yr", 40.0),
        n_mod=params.get("n_mod", 1),
        construction_time_yr=params.get("construction_time_yr", 6.0),
        interest_rate=params.get("interest_rate", 0.07),
        inflation_rate=params.get("inflation_rate", 0.02),
        noak=params.get("noak", True),
        power_cycle=power_cycle,
        overrides=engineering_overrides,
        cost_overrides=cost_overrides,
        costing_overrides=costing_overrides,
    )

    result = run_costing(inp)

    return {
        "lcoe": result.lcoe,
        "overnight_cost": result.overnight_cost,
        "total_capital": result.total_capital,
        "costs": result.costs,
        "power_table": result.power_table,
        "sensitivity": result.sensitivity,
        "overridden": result.overridden,
    }
