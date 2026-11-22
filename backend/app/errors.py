from typing import Any


class ApiError(Exception):
    """An error the app shows to the person: `message` is user-facing copy."""

    def __init__(self, status: int, code: str, message: str, extra: dict[str, Any] | None = None):
        self.status = status
        self.code = code
        self.message = message
        self.extra = extra or {}


def not_found(what: str = "That") -> ApiError:
    return ApiError(404, "not_found", f"{what} wasn't found.")
