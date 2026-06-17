curl -k -X POST https://localhost:8003/api/bug \
-H "Content-Type: application/json" \
-d '{
  "name": "Login page crashes",
  "feature": "Authentication",
  "submitter_id": 1,
  "assignee_id": null,
  "creation_date": "2026-06-17T10:00:00",
  "estimated_fixed_date": "2026-06-20T10:00:00",
  "status": "OPEN",
  "project_id": 1
}'

curl -k https://localhost:8003/api/bug

curl -k https://localhost:8003/api/bug/1

curl -k -X PUT https://localhost:8003/api/bug/1 \
-H "Content-Type: application/json" \
-d '{
  "status": "IN_PROGRESS"
}'

curl -k -X PUT https://localhost:8003/api/bug/1 \
-H "Content-Type: application/json" \
-d '{
  "name": "Login page redirect issue",
  "feature": "Authentication",
  "assignee_id": 3,
  "status": "FIXED"
}'

curl -k -X POST https://localhost:8003/api/bug/archive/1 \
-H "Content-Type: application/json" \
-d '{
  "archiver_id": 1,
  "archive_reason": "Duplicate issue",
  "archived_date": "2026-06-17T15:00:00"
}'

curl -k -X POST https://localhost:8003/api/bug/search \
-H "Content-Type: application/json" \
-d '{
  "project_id": 1,
  "status": "OPEN",
  "feature": "Authentication"
}'
