"""Helpers shared by the route modules."""
import logging

from flask import jsonify, request
from pydantic import ValidationError

from ..errors import ApiError, ContractError

log = logging.getLogger("fieldshift")


def query(model):
    """Validate the query string against a request model (bad input -> 422 via the error handler)."""
    return model.parse_obj(request.args.to_dict())


def body(model):
    """Validate the JSON body against a request model."""
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ApiError(422, "invalid_request", "request body must be a JSON object")
    return model.parse_obj(data)


def ok(model, data, status: int = 200):
    """Check the answer against its schema BEFORE sending it, so a wrong shape can never reach the frontend.
    Sends `data` as is (not the model's re-serialisation) so key order and extra metadata are preserved."""
    try:
        if isinstance(data, list):
            for item in data:
                model.parse_obj(item)
        else:
            model.parse_obj(data)
    except ValidationError as e:
        log.error("response failed its contract (%s): %s", model.__name__, e.errors()[:3])
        raise ContractError(model.__name__) from e
    return jsonify(data), status
