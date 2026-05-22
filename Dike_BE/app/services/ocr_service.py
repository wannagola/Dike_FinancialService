import uuid
import httpx
import easyocr
from app.core.config import settings

_easyocr_reader: easyocr.Reader | None = None


def _get_easyocr_reader() -> easyocr.Reader:
    global _easyocr_reader
    if _easyocr_reader is None:
        _easyocr_reader = easyocr.Reader(["ko", "en"], gpu=False)
    return _easyocr_reader


async def run_clova_ocr(image_bytes: bytes, filename: str) -> tuple[str, float]:
    """Clova OCR API 호출. (추출 텍스트, 평균 신뢰도) 반환."""
    headers = {"X-OCR-SECRET": settings.CLOVA_OCR_SECRET_KEY}
    payload = {
        "version": "V2",
        "requestId": str(uuid.uuid4()),
        "timestamp": 0,
        "images": [{"format": filename.rsplit(".", 1)[-1].lower(), "name": "document"}],
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            settings.CLOVA_OCR_API_URL,
            headers=headers,
            data={"message": str(payload).replace("'", '"')},
            files={"file": (filename, image_bytes)},
        )
        response.raise_for_status()
        result = response.json()

    texts: list[str] = []
    confidences: list[float] = []

    for image in result.get("images", []):
        for field in image.get("fields", []):
            texts.append(field.get("inferText", ""))
            confidences.append(field.get("inferConfidence", 0.0))

    raw_text = " ".join(texts)
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
    return raw_text, avg_confidence


def run_easyocr(image_bytes: bytes) -> tuple[str, float]:
    """EasyOCR 로컬 실행 (Clova 실패 시 폴백)."""
    import numpy as np
    import cv2

    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    reader = _get_easyocr_reader()
    results = reader.readtext(img)

    texts: list[str] = []
    confidences: list[float] = []
    for _, text, conf in results:
        texts.append(text)
        confidences.append(conf)

    raw_text = " ".join(texts)
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
    return raw_text, avg_confidence


async def extract_text(image_bytes: bytes, filename: str) -> tuple[str, float]:
    """Clova OCR 시도 → 실패 시 EasyOCR 폴백."""
    if settings.CLOVA_OCR_API_URL and settings.CLOVA_OCR_SECRET_KEY:
        try:
            return await run_clova_ocr(image_bytes, filename)
        except Exception:
            pass  # 폴백으로 계속

    return run_easyocr(image_bytes)
