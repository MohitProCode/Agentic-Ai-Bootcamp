from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Personalized Learning Path API"
    app_version: str = "1.0.0"
    api_prefix: str = "/api/v1"

    ollama_model: str = Field(default="llama3.1:8b", description="Local model name in Ollama.")
    ollama_temperature: float = Field(default=0.2, ge=0.0, le=0.3)
    llm_max_retries: int = Field(default=2, ge=0, le=5)
    llm_request_timeout_seconds: int = Field(default=18, ge=3, le=120)

    quiz_llm_generation_enabled: bool = Field(
        default=False,
        description="When false, quiz generation is seed-bank first for speed and determinism.",
    )
    plan_llm_enrichment_enabled: bool = Field(
        default=False,
        description="When false, use deterministic planning/gap/resource logic without LLM enrichment.",
    )

    quiz_default_question_count: int = Field(default=8, ge=3, le=25)
    quiz_target_time_seconds: int = Field(default=45, ge=15, le=240)
    learning_plan_default_weeks: int = Field(default=4, ge=1, le=12)

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
