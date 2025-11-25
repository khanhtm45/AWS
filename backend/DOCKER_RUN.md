# Docker/Docker Compose — backend

Tệp này mô tả nhanh cách chạy backend và các service phụ trợ bằng Docker / docker-compose.

## Files

- `Dockerfile` — xây image backend từ Maven + JRE.
- `docker-compose.yml` — định nghĩa `opensearch`, `backend`, `mailhog`.

## Chạy bằng docker-compose (đề xuất)

Mở PowerShell:

```powershell
cd D:\AWS-FCJ\leaf-shop\backend
# build backend image (tuỳ chọn)
docker compose build backend
# chạy tất cả service (backend, opensearch, mailhog)
docker compose up -d
```

Sau khi chạy, backend sẽ map cổng `8080` trên host. Kiểm tra bằng:

```powershell
docker compose ps
# xem logs
docker compose logs -f backend
```

## Chạy chỉ service phụ trợ

Nếu bạn muốn chạy OpenSearch & MailHog (backend chạy cục bộ):

```powershell
cd D:\AWS-FCJ\leaf-shop\backend
docker compose up -d opensearch mailhog
```

## Dừng / dọn dẹp

```powershell
# dừng và remove container, network
docker compose down
```

## Environment variables

- `OPENSEARCH_ENDPOINT` — khi chạy trong docker-compose, mặc định là `http://opensearch:9200`.
- `OPENSEARCH_SIGNING_ENABLED` — đặt `false` cho local OpenSearch.
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` — nếu backend cần truy cập AWS (DynamoDB/S3). Có thể truyền qua môi trường hoặc `.env`.

Ví dụ đặt env trước khi `docker compose up` (PowerShell):

```powershell
$env:AWS_ACCESS_KEY_ID='AKIA...'
$env:AWS_SECRET_ACCESS_KEY='...'
docker compose up -d
```

## Notes

- `docker-compose.yml` trong repo đã thiết lập `backend` để build từ `Dockerfile` và map cổng 8080.
- Nếu muốn chạy DynamoDB local, bạn có thể thêm service `amazon/dynamodb-local` vào `docker-compose.yml` và set `AWS_DYNAMODB_ENDPOINT=http://dynamodb:8000`.

Nếu bạn muốn mình thêm `scripts/docker-up.ps1` để tự động khởi động và kiểm tra trạng thái, mình sẽ tạo file đó và commit lên repo.
