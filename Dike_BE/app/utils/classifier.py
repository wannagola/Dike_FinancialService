from dataclasses import dataclass

CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "CAT_01": ["납부일", "고지서", "청구금액", "등록금", "납부", "고지", "청구서", "공과금", "수도", "전기", "가스", "통신", "관리비"],
    "CAT_02": ["세금계산서", "공급가액", "부가세", "공급받는자", "사업자등록번호", "합계금액", "세액"],
    "CAT_03": ["이체확인서", "송금", "출금", "이체", "계좌이체", "무통장", "입금확인"],
    "CAT_04": ["거래내역", "잔액", "입금", "출금일", "거래일", "통장", "은행거래", "계좌번호"],
    "CAT_05": ["카드명세서", "결제일", "한도", "카드사", "신용카드", "체크카드", "이용대금"],
    "CAT_06": ["보험증권", "보험료", "만기일", "피보험자", "보험사", "보장", "특약", "갱신"],
    "CAT_07": ["진료비", "약제비", "의료기관", "병원", "의원", "처방", "진료", "수납", "영수증"],
}


@dataclass
class ClassificationResult:
    category_code: str
    confidence: float  # 0.0 ~ 1.0


def classify(text: str) -> ClassificationResult | None:
    """키워드 매칭으로 문서 분류. 신뢰도가 낮으면 None 반환 → LLM으로 넘김."""
    if not text:
        return None

    text_lower = text.lower()
    scores: dict[str, int] = {}

    for code, keywords in CATEGORY_KEYWORDS.items():
        hit = sum(1 for kw in keywords if kw in text_lower)
        if hit > 0:
            scores[code] = hit

    if not scores:
        return None

    best_code = max(scores, key=lambda c: scores[c])
    best_hits = scores[best_code]
    total_keywords = len(CATEGORY_KEYWORDS[best_code])
    confidence = min(best_hits / total_keywords * 2, 1.0)  # 절반 이상 매칭이면 1.0

    # 신뢰도 0.3 미만이면 LLM으로 넘김
    if confidence < 0.3:
        return None

    return ClassificationResult(category_code=best_code, confidence=confidence)
