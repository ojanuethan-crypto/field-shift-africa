from flask import Blueprint

from ..schemas import ProofResponse
from ..services import engine_client
from ._util import ok

bp = Blueprint("proof", __name__)


@bp.get("/proof")
def proof():
    """Backtest evidence (S21). Values stay null until a backtest has really been run."""
    return ok(ProofResponse, engine_client.get_proof())
