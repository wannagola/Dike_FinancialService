import json
from datetime import datetime
from google import genai
from google.genai import types
from app.core.config import settings

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


SYSTEM_PROMPT = """당신은 한국 금융 문서를 분석하는 전문가입니다.
OCR로 추출된 텍스트를 보고 다음을 JSON으로 반환하세요.

반환 형식:
{
  "category_code": "CAT_01~CAT_07 또는 CAT_99",
  "title": "문서 제목 (간결하게)",
  "amount": 숫자 또는 null,
  "due_date": "YYYY-MM-DD" 또는 null,
  "partner_name": "거래처/기관명" 또는 null
}

카테고리 코드:
CAT_01: 정기지출 및 납부 (고지서, 청구서, 공과금 등)
CAT_02: 송장/세금계산서
CAT_03: 이체/송금전표
CAT_04: 은행거래내역서
CAT_05: 카드명세서
CAT_06: 보험 관련 서류
CAT_07: 의료비 영수증
CAT_99: 기타

JSON만 반환하세요. 설명 없이."""


async def parse_document(raw_text: str) -> dict:
    """Gemini 1.5 Flash로 문서 분류 + 핵심 정보 추출."""
    client = _get_client()

    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"{SYSTEM_PROMPT}\n\n다음 문서 텍스트를 분석해주세요:\n\n{raw_text[:3000]}",
        config=types.GenerateContentConfig(
            temperature=0,
            response_mime_type="application/json",
        ),
    )

    result = json.loads(response.text)

    if result.get("due_date"):
        try:
            result["due_date"] = datetime.strptime(result["due_date"], "%Y-%m-%d")
        except ValueError:
            result["due_date"] = None

    return result
