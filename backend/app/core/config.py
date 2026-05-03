from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Personalized Learning Path API"
    APP_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"

    OLLAMA_MODEL: str = "llama3:latest"
    OLLAMA_TEMPERATURE: float = 0.2
    LLM_MAX_RETRIES: int = 2
    LLM_REQUEST_TIMEOUT_SECONDS: int = 18

    QUIZ_LLM_GENERATION_ENABLED: bool = False
    PLAN_LLM_ENRICHMENT_ENABLED: bool = False

    QUIZ_DEFAULT_QUESTION_COUNT: int = 8
    QUIZ_TARGET_TIME_SECONDS: int = 45
    LEARNING_PLAN_DEFAULT_WEEKS: int = 4

    class Config:
        env_file = ".env"

settings = Settings()
