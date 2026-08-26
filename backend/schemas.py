"""Pydantic 请求/响应模型"""

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    password: str = Field(..., min_length=6, max_length=128)
    email: str = Field(..., max_length=100)
    company: str = Field(default="", max_length=100)


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    company: str
    role: str
    quotaUsed: int
    quotaTotal: int
    apiKey: str


class TokenResponse(BaseModel):
    token: str
    user: UserResponse


class QuotaResponse(BaseModel):
    used: int
    total: int


class ApiResponse(BaseModel):
    code: int = 0
    message: str = "ok"
    data: dict | None = None
