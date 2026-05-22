from fastapi import APIRouter, Depends, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas import ApiResponse
from app.schemas.document import (
    DocumentCreateRequest,
    DocumentUpdateRequest,
    DocumentResponse,
    OCRUploadResponse,
)
from app.services import document_service

router = APIRouter()

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "pdf"}


def _check_extension(filename: str) -> None:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "DOC_002", "message": "지원하지 않는 파일 형식입니다.", "tts": "JPG, PNG, PDF 파일만 업로드할 수 있습니다."},
        )


@router.post("/ocr", response_model=ApiResponse[OCRUploadResponse])
async def ocr_upload(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """이미지 업로드 → OCR → 분류. 저장은 하지 않고 파싱 결과만 반환."""
    _check_extension(file.filename or "")
    image_bytes = await file.read()

    result = await document_service.process_ocr(image_bytes, file.filename or "document.jpg")

    parsed = DocumentCreateRequest(
        title=result["title"],
        category_code=result["category_code"],
        amount=result["amount"],
        due_date=result["due_date"],
        partner_name=result["partner_name"],
        raw_text=result["raw_text"],
    )

    return ApiResponse(
        data=OCRUploadResponse(
            raw_text=result["raw_text"],
            category_code=result["category_code"],
            confidence_score=result["confidence_score"],
            parsed=parsed,
        ),
        tts=f"문서 인식이 완료되었습니다. {parsed.title} 문서로 분류되었습니다. 내용을 확인하고 저장해주세요.",
    )


@router.post("", response_model=ApiResponse[DocumentResponse], status_code=status.HTTP_201_CREATED)
async def create_document(
    req: DocumentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doc = await document_service.create_document(req, current_user, db)
    return ApiResponse(
        data=DocumentResponse.model_validate(doc),
        tts=f"{doc.title} 문서가 저장되었습니다.",
    )


@router.post("/ocr/save", response_model=ApiResponse[DocumentResponse], status_code=status.HTTP_201_CREATED)
async def ocr_upload_and_save(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """이미지 업로드 → OCR → 분류 → 즉시 저장."""
    _check_extension(file.filename or "")
    image_bytes = await file.read()
    filename = file.filename or "document.jpg"

    result = await document_service.process_ocr(image_bytes, filename)
    s3_url = await document_service.upload_to_r2(image_bytes, filename)

    req = DocumentCreateRequest(
        title=result["title"],
        category_code=result["category_code"],
        amount=result["amount"],
        due_date=result["due_date"],
        partner_name=result["partner_name"],
        raw_text=result["raw_text"],
    )
    doc = await document_service.create_document(req, current_user, db, s3_url=s3_url)

    return ApiResponse(
        data=DocumentResponse.model_validate(doc),
        tts=f"{doc.title} 문서가 저장되었습니다.",
    )


@router.get("", response_model=ApiResponse[list[DocumentResponse]])
async def list_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    docs = await document_service.get_documents(current_user, db)
    count = len(docs)
    return ApiResponse(
        data=[DocumentResponse.model_validate(d) for d in docs],
        tts=f"총 {count}개의 문서가 있습니다." if count > 0 else "저장된 문서가 없습니다.",
    )


@router.get("/{document_id}", response_model=ApiResponse[DocumentResponse])
async def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doc = await document_service.get_document(document_id, current_user, db)
    amount_text = f"{doc.amount:,}원" if doc.amount else "금액 정보 없음"
    return ApiResponse(
        data=DocumentResponse.model_validate(doc),
        tts=f"{doc.title}. {amount_text}.",
    )


@router.put("/{document_id}", response_model=ApiResponse[DocumentResponse])
async def update_document(
    document_id: int,
    req: DocumentUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doc = await document_service.update_document(document_id, req, current_user, db)
    return ApiResponse(
        data=DocumentResponse.model_validate(doc),
        tts=f"{doc.title} 문서가 수정되었습니다.",
    )


@router.delete("/{document_id}", response_model=ApiResponse[dict])
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await document_service.delete_document(document_id, current_user, db)
    return ApiResponse(data={}, tts="문서가 삭제되었습니다.")
