import logging

from flask import jsonify
from pydantic import ValidationError
from werkzeug.exceptions import HTTPException

log = logging.getLogger("fieldshift")


class ApiError(Exception):
    """Raise anywhere in a route. Rendered as {error, message} with the given status."""

    def __init__(self, status: int, code: str, message: str):
        super().__init__(message)
        self.status, self.code, self.message = status, code, message


class EngineNotConnected(ApiError):
    def __init__(self, what: str):
        super().__init__(501, "engine_not_connected", f"{what} is not available: the real engine is not connected yet.")


class SchemaPending(ApiError):
    """Real mode, but the database schema from Okani is not integrated yet. `needs` says exactly what is missing."""

    def __init__(self, what: str, needs: str):
        super().__init__(501, "schema_pending", f"{what} is not available yet: waiting for the database schema ({needs}).")


class NoData(ApiError):
    """The place is valid but the data source has nothing for it. Honest 404, never a guess."""

    def __init__(self, what: str):
        super().__init__(404, "no_data", f"No {what} for this place yet.")


class OutsideCoverage(ApiError):
    def __init__(self):
        super().__init__(422, "outside_coverage", "This place is outside the farmland we cover.")


class ContractError(Exception):
    """A response did not match its schema. A bug on our side (or a bad provider), so it surfaces as a 500."""


def _body(code: str, message: str, status: int):
    return jsonify({"error": code, "message": message}), status


def register_error_handlers(app):
    """Make EVERY failure return the same JSON, {error, message}, never an HTML page or a stack trace."""

    @app.errorhandler(ApiError)  # our own deliberate errors (custom status + code)
    def _api(e: ApiError):
        return _body(e.code, e.message, e.status)

    @app.errorhandler(ValidationError)  # pydantic: bad input -> 422 naming the first wrong field
    def _validation(e: ValidationError):
        first = e.errors()[0]
        field = ".".join(str(p) for p in first["loc"]) or "request"
        return _body("invalid_request", f"{field}: {first['msg']}", 422)

    @app.errorhandler(HTTPException)  # Flask's built-ins (404, 405, ...) in the same JSON shape
    def _http(e: HTTPException):
        return _body(e.name.lower().replace(" ", "_"), e.description or e.name, e.code or 500)

    @app.errorhandler(Exception)  # anything unexpected: generic 500, real detail only in the server log
    def _unexpected(e: Exception):
        log.exception("unhandled error")
        return _body("internal", "Please try again.", 500)
