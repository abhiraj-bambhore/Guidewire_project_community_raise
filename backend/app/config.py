from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    database_url: str = ""

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    # MiroFish local sidecar — blank = always use Gemini fallback
    # Set to http://localhost:5001 once you've started the mirofish/backend server.
    mirofish_local_url: str = ""

    app_env: str = "development"
    secret_key: str = "change-me"
    backend_cors_origins: str = "http://localhost:5173,http://localhost:3000"

    checker_interval_seconds: int = 180

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.backend_cors_origins.split(",")]

    model_config = {"env_file": "../.env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
