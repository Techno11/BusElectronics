CALL npm run build-frontend

set DOCKER_BUILDKIT=1
docker build -f Dockerfile -o out . --no-cache