from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str
    APP_ENV: str
    SECRET_KEY: str

    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_DAYS: int

    DATABASE_URL: str
    REDIS_URL: str

    CLOVA_OCR_API_URL: str = ""
    CLOVA_OCR_SECRET_KEY: str = ""

    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    R2_ENDPOINT_URL: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = ""

    OPENBANKING_CLIENT_ID: str = ""
    OPENBANKING_CLIENT_SECRET: str = ""

    FCM_CREDENTIALS_PATH: str = ""

    class Config:
        env_file = ".env"

settings = Settings()