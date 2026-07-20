"""Auth request/response schemas (camelCase where FE-facing)."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CamelModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, ser_json_by_alias=True)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserOut(CamelModel):
    id: str
    email: EmailStr
    full_name: str = Field(serialization_alias="fullName")
    role: str
    is_active: bool = Field(serialization_alias="isActive")


class AuthSessionOut(CamelModel):
    """Login/refresh body. Tokens also set as HttpOnly cookies."""

    user: UserOut
    access_token: str | None = Field(default=None, serialization_alias="accessToken")
    token_type: str = Field(default="bearer", serialization_alias="tokenType")
    # refresh is cookie-only by design (not returned in JSON)
    auth_via: str = Field(
        default="cookie",
        serialization_alias="authVia",
        description="Primary transport: cookie (browser) or bearer (scripts)",
    )


class MessageOut(CamelModel):
    status: str
    detail: str | None = None


class AdminPingOut(CamelModel):
    status: str
    user_id: str = Field(serialization_alias="userId")
    role: str
    message: str
