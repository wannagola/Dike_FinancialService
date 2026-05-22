import boto3
import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from app.core.config import settings
from app.models.document import Document
from app.models.user import User
from app.schemas.document import DocumentCreateRequest, DocumentUpdateRequest
from app.services import ocr_service, llm_service
from app.utils.classifier import classify


def _get_r2_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.R2_ENDPOINT_URL,
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
    )


async def upload_to_r2(image_bytes: bytes, filename: str) -> str | None:
    """이미지를 Cloudflare R2에 업로드하고 URL 반환. 설정 없으면 None."""
    if not settings.R2_ENDPOINT_URL:
        return None

    key = f"documents/{uuid.uuid4()}/{filename}"
    client = _get_r2_client()
    client.put_object(
        Bucket=settings.R2_BUCKET_NAME,
        Key=key,
        Body=image_bytes,
        ContentType="image/jpeg",
    )
    return f"{settings.R2_ENDPOINT_URL}/{settings.R2_BUCKET_NAME}/{key}"


async def process_ocr(image_bytes: bytes, filename: str) -> dict:
    """OCR 파이프라인: 텍스트 추출 → 분류 → (필요시) LLM 파싱."""
    raw_text, confidence = await ocr_service.extract_text(image_bytes, filename)

    # 1차: 키워드 분류
    classification = classify(raw_text)

    if classification:
        parsed = {
            "category_code": classification.category_code,
            "title": filename.rsplit(".", 1)[0],
            "amount": None,
            "due_date": None,
            "partner_name": None,
        }
    else:
        # 2차: LLM 분류 + 파싱
        parsed = await llm_service.parse_document(raw_text)
        classification_confidence = 0.5  # LLM은 고정 신뢰도

    return {
        "raw_text": raw_text,
        "confidence_score": confidence,
        "category_code": parsed.get("category_code", "CAT_99"),
        "title": parsed.get("title") or filename.rsplit(".", 1)[0],
        "amount": parsed.get("amount"),
        "due_date": parsed.get("due_date"),
        "partner_name": parsed.get("partner_name"),
    }


async def create_document(
    req: DocumentCreateRequest,
    user: User,
    db: AsyncSession,
    s3_url: str | None = None,
) -> Document:
    doc = Document(
        user_id=user.id,
        category_code=req.category_code,
        title=req.title,
        amount=req.amount,
        due_date=req.due_date,
        partner_name=req.partner_name,
        account_number=req.account_number,
        raw_text=req.raw_text,
        s3_url=s3_url,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc


async def get_documents(user: User, db: AsyncSession) -> list[Document]:
    result = await db.execute(
        select(Document).where(Document.user_id == user.id).order_by(Document.created_at.desc())
    )
    return list(result.scalars().all())


async def get_document(document_id: int, user: User, db: AsyncSession) -> Document:
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "DOC_001", "message": "문서를 찾을 수 없습니다.", "tts": "해당 문서를 찾을 수 없습니다."},
        )
    return doc


async def update_document(
    document_id: int,
    req: DocumentUpdateRequest,
    user: User,
    db: AsyncSession,
) -> Document:
    doc = await get_document(document_id, user, db)

    values = {k: v for k, v in req.model_dump().items() if v is not None}
    if values:
        await db.execute(update(Document).where(Document.id == doc.id).values(**values))
        await db.commit()
        await db.refresh(doc)

    return doc


async def delete_document(document_id: int, user: User, db: AsyncSession) -> None:
    doc = await get_document(document_id, user, db)
    await db.execute(delete(Document).where(Document.id == doc.id))
    await db.commit()
