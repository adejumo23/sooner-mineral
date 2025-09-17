# =============================================================================
# Sooner Mineral Application - Docker Compose Commands
# =============================================================================
# This Makefile provides convenient commands for managing the application
# =============================================================================

.PHONY: help build up down restart logs clean test-db test-app status

# Default target
help:
	@echo "Sooner Mineral Application - Available Commands:"
	@echo ""
	@echo "  make build          - Build the application Docker image"
	@echo "  make up             - Start all services (database + web app)"
	@echo "  make down           - Stop all services"
	@echo "  make restart        - Restart all services"
	@echo "  make logs           - Show logs for all services"
	@echo "  make logs-db        - Show database logs only"
	@echo "  make logs-web       - Show web application logs only"
	@echo "  make status         - Show status of all services"
	@echo "  make clean          - Stop services and remove volumes"
	@echo "  make test-db        - Test database connection and data"
	@echo "  make test-app       - Test web application accessibility"
	@echo "  make shell-db       - Open MySQL shell in database container"
	@echo "  make shell-web      - Open shell in web application container"
	@echo ""

# Build the application
build:
	@echo "🔨 Building application Docker image..."
	docker-compose build

# Start all services
up:
	@echo "🚀 Starting all services..."
	docker-compose up -d
	@echo "✅ Services started. Web app: http://localhost:3050"

# Stop all services
down:
	@echo "🛑 Stopping all services..."
	docker-compose down

# Restart all services
restart: down up
	@echo "🔄 Services restarted"

# Show logs
logs:
	@echo "📋 Showing logs for all services..."
	docker-compose logs -f

# Show database logs only
logs-db:
	@echo "📋 Showing database logs..."
	docker-compose logs -f db

# Show web application logs only
logs-web:
	@echo "📋 Showing web application logs..."
	docker-compose logs -f web

# Show service status
status:
	@echo "📊 Service status:"
	docker-compose ps

# Clean up (stop services and remove volumes)
clean:
	@echo "🧹 Cleaning up services and volumes..."
	docker-compose down -v
	@echo "✅ Cleanup complete"

# Test database connection and data
test-db:
	@echo "🧪 Testing database connection..."
	@node -e "import('./test-integration.js').then(() => console.log('✅ Database test completed')).catch(err => console.error('❌ Database test failed:', err.message))"

# Test web application accessibility
test-app:
	@echo "🧪 Testing web application..."
	@curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3050 || echo "❌ Web application not accessible"

# Open MySQL shell
shell-db:
	@echo "🐚 Opening MySQL shell..."
	docker-compose exec db mysql -u soonermineral -psoonermineralpass soonermineraldb

# Open shell in web container
shell-web:
	@echo "🐚 Opening shell in web container..."
	docker-compose exec web sh

# Development commands
dev-setup: build up
	@echo "🔧 Development environment setup complete"
	@echo "Web app: http://localhost:3050"
	@echo "Database: localhost:3359"

# Production deployment
deploy: build up
	@echo "🚀 Production deployment complete"
	@echo "Web app: http://localhost:3050"
