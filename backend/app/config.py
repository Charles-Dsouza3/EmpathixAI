from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    huggingfacehub_api_token: str
    hf_model_repo_id: str = "Qwen/Qwen2.5-7B-Instruct"

    vectorstore_dir: str = "./vectorstore"
    docs_dir: str = "./data/medical_docs"
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    database_url: str = "sqlite:///./chat_history.db"

    cors_origins: str = "http://localhost:5173"

    app_timezone: str = "Asia/Kolkata"

    log_level: str = "INFO"

    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 10
    vision_model_repo_id: str = "google/gemma-3-27b-it"

    firebase_credentials_path: str = ""
    firebase_credentials_json: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
