from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Find .env file — check current dir first, then parent (project root)
_env_path = Path(".env")
if not _env_path.exists():
    _env_path = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    app_secret_key: str
    app_env: str = "development"
    database_url: str
    github_pat: str
    github_username: str
    indeed_api_key: str = ""
    indeed_publisher_id: str = ""
    gemini_api_key: str
    gemini_model: str = "gemini-2.5-pro-preview-05-06"
    linkedin_export_webhook_secret: str = ""

    # API key for authenticating frontend requests (empty = auth disabled)
    api_auth_key: str = ""

    # n8n settings (loaded but not required for backend startup)
    n8n_basic_auth_user: str = ""
    n8n_basic_auth_password: str = ""
    n8n_webhook_url: str = "http://localhost:5678"

    model_config = SettingsConfigDict(
        env_file=str(_env_path),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
