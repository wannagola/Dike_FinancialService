# 디케 백엔드 API 명세서

## 공통

**Base URL:** `http://localhost:8000` (ngrok 사용 시 ngrok URL로 교체)

**인증:** `Authorization: Bearer <access_token>` (아래 🔒 표시된 엔드포인트)

**공통 응답 형식:**
```json
{ "data": { ... }, "tts": "음성 안내 텍스트" }
```

**에러 응답 형식:**
```json
{ "code": "AUTH_001", "message": "오류 메시지", "tts": "음성 안내" }
```

---

## 인증 `/auth`

### POST `/auth/register` — 회원가입
```json
// Request
{ "login_id": "user01", "password": "1234", "name": "홍길동" }

// Response 201
{ "data": { "id": 1, "login_id": "user01", "name": "홍길동", "is_locked": false, "created_at": "..." }, "tts": "..." }
```

### POST `/auth/login` — 로그인
```json
// Request
{ "login_id": "user01", "password": "1234" }

// Response 200
{ "data": { "access_token": "...", "refresh_token": "...", "token_type": "bearer" }, "tts": "..." }
```
> 5회 실패 시 계정 잠금 (AUTH_006)

### POST `/auth/biometric/login` — 생체인증 로그인
```json
// Request
{ "device_id": "device-uuid-string" }

// Response 200
{ "data": { "access_token": "...", "refresh_token": "...", "token_type": "bearer" }, "tts": "..." }
```

### POST `/auth/biometric/register` 🔒 — 생체인증 기기 등록
```json
// Request
{ "device_id": "device-uuid-string" }

// Response 200
{ "data": {}, "tts": "생체 인증이 등록되었습니다." }
```

### POST `/auth/refresh` — 토큰 갱신
```json
// Request
{ "refresh_token": "..." }

// Response 200
{ "data": { "access_token": "...", "refresh_token": "...", "token_type": "bearer" }, "tts": "..." }
```

### POST `/auth/unlock` — 계정 잠금 해제
```json
// Request
{ "login_id": "user01", "password": "1234" }

// Response 200
{ "data": {}, "tts": "계정 잠금이 해제되었습니다. 다시 로그인해주세요." }
```

### POST `/auth/logout` 🔒 — 로그아웃
```json
// Request
{ "refresh_token": "..." }

// Response 200
{ "data": {}, "tts": "로그아웃되었습니다." }
```

---

## 사용자 `/users` 🔒

### GET `/users/me` — 내 정보 조회
```json
// Response 200
{ "data": { "id": 1, "login_id": "user01", "name": "홍길동", "is_locked": false, "created_at": "..." }, "tts": "..." }
```

### PUT `/users/me` — 내 정보 수정
```json
// Request (변경할 필드만)
{ "name": "홍길동", "password": "newpassword" }

// Response 200
{ "data": { ... }, "tts": "회원 정보가 수정되었습니다." }
```

### POST `/users/me/fcm-token` — FCM 토큰 등록
```json
// Request
{ "fcm_token": "fcm-device-token-string" }

// Response 200
{ "data": {}, "tts": "푸시 알림이 등록되었습니다." }
```

### DELETE `/users/me/fcm-token` — FCM 토큰 해제
```json
// Response 200
{ "data": {}, "tts": "푸시 알림이 해제되었습니다." }
```

### DELETE `/users/me` — 회원 탈퇴
```json
// Response 200
{ "data": {}, "tts": "회원 탈퇴가 완료되었습니다." }
```

---

## 문서 `/documents` 🔒

**카테고리 코드:**

| 코드   | 분류                    |
|--------|-------------------------|
| CAT_01 | 정기지출 및 납부 (고지서, 공과금) |
| CAT_02 | 송장/세금계산서          |
| CAT_03 | 이체/송금전표            |
| CAT_04 | 은행거래내역서           |
| CAT_05 | 카드명세서               |
| CAT_06 | 보험 관련 서류           |
| CAT_07 | 의료비 영수증            |
| CAT_99 | 기타                    |

### POST `/documents/ocr` — OCR 미리보기 (저장 안 함)
```
// Request: multipart/form-data
file: (이미지 파일 — jpg, jpeg, png, pdf)

// Response 200
{
  "data": {
    "raw_text": "추출된 텍스트",
    "category_code": "CAT_01",
    "confidence_score": 0.87,
    "parsed": {
      "title": "전기요금 고지서",
      "category_code": "CAT_01",
      "amount": 45000,
      "due_date": "2024-06-30T00:00:00",
      "partner_name": "한국전력공사",
      "account_number": null,
      "raw_text": "..."
    }
  },
  "tts": "문서 인식이 완료되었습니다. ..."
}
```

### POST `/documents/ocr/save` — OCR 후 즉시 저장
```
// Request: multipart/form-data
file: (이미지 파일)

// Response 201 — DocumentResponse
```

### POST `/documents` — 문서 직접 저장
```json
// Request
{
  "title": "전기요금 고지서",
  "category_code": "CAT_01",
  "amount": 45000,
  "due_date": "2024-06-30T00:00:00",
  "partner_name": "한국전력공사",
  "account_number": null,
  "raw_text": null
}

// Response 201 — DocumentResponse
```

### GET `/documents` — 문서 목록
```json
// Response 200
{ "data": [ DocumentResponse, ... ], "tts": "총 3개의 문서가 있습니다." }
```

### GET `/documents/{document_id}` — 문서 상세
```json
// Response 200
{
  "data": {
    "id": 1, "user_id": 1, "category_code": "CAT_01",
    "title": "전기요금 고지서", "amount": 45000,
    "due_date": "2024-06-30T00:00:00", "partner_name": "한국전력공사",
    "account_number": null, "s3_url": "https://...", "confidence_score": 0.87,
    "created_at": "..."
  },
  "tts": "..."
}
```

### PUT `/documents/{document_id}` — 문서 수정
```json
// Request (변경할 필드만)
{ "title": "수정된 제목", "amount": 50000 }

// Response 200 — DocumentResponse
```

### DELETE `/documents/{document_id}` — 문서 삭제
```json
// Response 200
{ "data": {}, "tts": "문서가 삭제되었습니다." }
```

---

## 계좌 `/accounts` 🔒

**은행 코드:**

| 코드 | 은행 |
|------|------|
| 004  | 국민은행 |
| 020  | 우리은행 |
| 088  | 신한은행 |
| 081  | 하나은행 |
| 003  | 기업은행 |
| 011  | 농협은행 |
| 089  | 케이뱅크 |
| 090  | 카카오뱅크 |
| 092  | 토스뱅크 |

### GET `/accounts` — 계좌 목록
```json
// Response 200
{ "data": [ AccountResponse, ... ], "tts": "등록된 계좌가 2개 있습니다." }
```

### POST `/accounts` — 계좌 등록
```json
// Request
{ "bank_code": "090", "account_number": "1234567890", "is_primary": false }

// Response 201
{
  "data": {
    "id": 1, "user_id": 1, "bank_code": "090",
    "account_number": "1234****7890",
    "balance_cache": 0, "is_primary": true, "connected_at": "..."
  },
  "tts": "카카오뱅크 계좌가 등록되었습니다."
}
```
> 계좌번호는 마스킹 처리(앞4+****+뒤4)되어 응답  
> 첫 번째 계좌는 자동으로 대표계좌 설정

### GET `/accounts/{account_id}` — 계좌 상세
```json
// Response 200
{ "data": { AccountResponse }, "tts": "카카오뱅크 계좌입니다. 잔액은 100,000원입니다." }
```

### PATCH `/accounts/{account_id}/primary` — 대표계좌 설정
```json
// Response 200
{ "data": { AccountResponse }, "tts": "카카오뱅크 계좌가 대표계좌로 설정되었습니다." }
```

### DELETE `/accounts/{account_id}` — 계좌 삭제
```json
// Response 200
{ "data": {}, "tts": "계좌가 삭제되었습니다." }
```

---

## 거래 `/transactions` 🔒

### GET `/transactions` — 거래 목록
```json
// Response 200
{ "data": [ TransactionResponse, ... ], "tts": "거래 내역이 5건 있습니다." }
```

### POST `/transactions` — 송금
```json
// Request
{
  "from_account_id": 1,
  "to_account_number": "9876543210",
  "amount": 50000,
  "memo": "점심값"
}

// Response 201
{
  "data": {
    "id": 1, "user_id": 1, "from_account_id": 1,
    "to_account_number": "9876543210",
    "amount": 50000, "memo": "점심값",
    "status": "completed", "created_at": "..."
  },
  "tts": "50,000원 송금이 완료되었습니다. 메모: 점심값"
}
```
> 잔액 부족 시 400 (TX_003)  
> 출금 계좌 미소유 시 404 (TX_002)

### GET `/transactions/{transaction_id}` — 거래 상세
```json
// Response 200
{ "data": { TransactionResponse }, "tts": "50,000원 송금 내역입니다. 상태는 completed입니다." }
```

### DELETE `/transactions/{transaction_id}` — 거래 내역 삭제
```json
// Response 200
{ "data": {}, "tts": "거래 내역이 삭제되었습니다." }
```

---

## 알림 `/reminders` 🔒

### GET `/reminders` — 알림 목록
```json
// Response 200
{ "data": [ ReminderResponse, ... ], "tts": "대기 중인 알림이 2개 있습니다." }
```

### POST `/reminders` — 알림 생성
```json
// Request
{
  "document_id": 1,
  "title": "전기요금 납부",
  "due_at": "2024-06-30T00:00:00",
  "notify_at": "2024-06-23T09:00:00"
}

// Response 201
{
  "data": {
    "id": 1, "user_id": 1, "document_id": 1,
    "title": "전기요금 납부",
    "due_at": "2024-06-30T00:00:00",
    "notify_at": "2024-06-23T09:00:00",
    "status": "pending", "created_at": "..."
  },
  "tts": "전기요금 납부 알림이 등록되었습니다."
}
```
> `document_id` 없어도 됨 (독립 알림 가능)  
> `notify_at` 미입력 시 자동 계산 (D-7 → D-1 → 당일 오전 9시)

### GET `/reminders/{reminder_id}` — 알림 상세
```json
// Response 200
{ "data": { ReminderResponse }, "tts": "..." }
```

### PATCH `/reminders/{reminder_id}` — 알림 수정
```json
// Request (변경할 필드만)
{ "title": "수정된 제목", "notify_at": "2024-06-24T09:00:00" }

// Response 200 — ReminderResponse
```

### DELETE `/reminders/{reminder_id}` — 알림 삭제
```json
// Response 200
{ "data": {}, "tts": "알림이 삭제되었습니다." }
```

---

## 에러 코드 목록

| 코드      | 상황                          |
|-----------|-------------------------------|
| AUTH_001  | 로그인 정보 불일치             |
| AUTH_005  | 계정 잠금 상태                 |
| AUTH_006  | 5회 초과로 계정 잠김           |
| AUTH_007  | 미등록 기기 (생체인증)         |
| AUTH_008  | 유효하지 않은 refresh token    |
| AUTH_009  | 이미 사용된 refresh token      |
| AUTH_010  | 중복 아이디                    |
| DOC_001   | 문서 없음                      |
| DOC_002   | 지원하지 않는 파일 형식        |
| TX_001    | 거래 내역 없음                 |
| TX_002    | 출금 계좌 없음                 |
| TX_003    | 잔액 부족                      |
| REM_001   | 알림 없음                      |
