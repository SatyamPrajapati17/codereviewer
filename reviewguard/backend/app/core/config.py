from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str = "sqlite+aiosqlite:///./reviewguard.db"
    SECRET_KEY: str = "dev-secret-change-in-production"
    GITHUB_WEBHOOK_SECRET: str = ""
    GITLAB_WEBHOOK_SECRET: str = ""
    BOB_API_KEY: str = ""
    BOB_WORKFLOW_NAME: str = "reviewguard"


@lru_cache
def get_settings() -> Settings:
    return Settings()