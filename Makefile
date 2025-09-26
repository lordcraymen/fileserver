# Simple Static File Server - Makefile
# This provides convenient commands similar to npm scripts

# Default values
IMAGE_NAME ?= simple-fileserver
TAG ?= latest
PORT ?= 8080

# Help command (default)
.PHONY: help
help:
	@echo "Simple Static File Server - Available Commands:"
	@echo ""
	@echo "  make build          Build the Docker image"
	@echo "  make run            Run the server (detached)"
	@echo "  make run-fg         Run the server (foreground)"
	@echo "  make stop           Stop the server"
	@echo "  make restart        Restart the server"
	@echo "  make logs           Show server logs"
	@echo "  make clean          Stop and remove containers/images"
	@echo "  make test           Test if server is responding"
	@echo "  make shell          Open shell in running container"
	@echo ""
	@echo "  make publish        Build and push to Docker Hub"
	@echo "  make release        Create a new release (requires TAG=x.x.x)"
	@echo ""
	@echo "Variables:"
	@echo "  IMAGE_NAME=simple-fileserver"
	@echo "  TAG=latest"
	@echo "  PORT=8080"

# Development commands
.PHONY: build
build:
	@echo "Building Docker image: $(IMAGE_NAME):$(TAG)"
	docker build -t $(IMAGE_NAME):$(TAG) .

.PHONY: run
run:
	@echo "Starting server on port $(PORT)..."
	docker-compose up -d

.PHONY: run-fg
run-fg:
	@echo "Starting server on port $(PORT) (foreground)..."
	docker-compose up

.PHONY: stop
stop:
	@echo "Stopping server..."
	docker-compose down

.PHONY: restart
restart: stop run
	@echo "Server restarted"

.PHONY: logs
logs:
	docker-compose logs -f

.PHONY: test
test:
	@echo "Testing server response..."
	@curl -f http://localhost:$(PORT) > /dev/null && echo "✅ Server is responding" || echo "❌ Server not responding"

.PHONY: shell
shell:
	docker-compose exec fileserver sh

# Cleanup commands
.PHONY: clean
clean:
	@echo "Cleaning up containers and images..."
	docker-compose down --rmi all --volumes --remove-orphans
	docker image prune -f

# Release commands
.PHONY: publish
publish: build
	@echo "Publishing $(IMAGE_NAME):$(TAG) to Docker Hub..."
	docker push $(IMAGE_NAME):$(TAG)

.PHONY: release
release:
	@if [ "$(TAG)" = "latest" ]; then \
		echo "❌ Please specify a version: make release TAG=1.0.0"; \
		exit 1; \
	fi
	@echo "Creating release $(TAG)..."
	@git tag -a v$(TAG) -m "Release v$(TAG)"
	@git push origin v$(TAG)
	@make build TAG=$(TAG)
	@make publish TAG=$(TAG)
	@echo "✅ Release v$(TAG) created and published"

# Docker Hub login (call manually when needed)
.PHONY: login
login:
	docker login