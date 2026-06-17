curl -k -X POST https://localhost:8002/api/project \
-H "Content-Type: application/json" \
-d '{
  "owner_id": 1,
  "name": "Bug Tracker",
  "description": "Licenta project",
  "status": "ACTIVE"
}'

curl -k https://localhost:8002/api/project

curl -k https://localhost:8002/api/project/1

curl -k -X PUT https://localhost:8002/api/project/1 \
-H "Content-Type: application/json" \
-d '{
  "name": "Bug Tracker V2",
  "description": "Updated description"
}'

curl -k -X POST https://localhost:8002/api/project/archive/1 \
-H "Content-Type: application/json" \
-d '{
  "archiver_id": 1,
  "archive_reason": "Finished",
  "archived_date": "2026-06-17T12:00:00"
}'

curl -k -X POST https://localhost:8002/api/project/search \
-H "Content-Type: application/json" \
-d '{
  "name": "Bug"
}'
