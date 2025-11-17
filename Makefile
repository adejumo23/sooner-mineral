# Sooner Mineral - Local Development Makefile
# This Makefile helps you run the app locally while using Docker for database services

.PHONY: help install dev db-up db-down db-logs db-reset start stop clean logs test-health

# Default target
help: ## Show this help message
	@echo "Sooner Mineral - Local Development Commands"
	@echo "==========================================="
	@echo ""
	@echo "Database Commands:"
	@echo "  db-up       Start MySQL and phpMyAdmin containers"
	@echo "  db-down     Stop database containers"
	@echo "  db-logs     Show database container logs"
	@echo "  db-reset    Reset database (removes all data)"
	@echo ""
	@echo "Development Commands:"
	@echo "  install     Install all dependencies"
	@echo "  dev         Start development server (frontend + backend)"
	@echo "  start       Start development server with health checks"
	@echo ""
	@echo "Utility Commands:"
	@echo "  stop        Stop all running processes"
	@echo "  clean       Clean up node_modules and build artifacts"
	@echo "  logs        Show application logs"
	@echo "  test-health Test if services are running correctly"
	@echo ""

# Health check functions
check-port = @echo "🔍 Checking port $(1)..." && \
	for i in $$(seq 1 30); do \
		if curl -s http://localhost:$(1) >/dev/null 2>&1; then \
			echo "✅ Port $(1) is responding"; \
			break; \
		elif [ $$i -eq 30 ]; then \
			echo "❌ Port $(1) failed to respond after 30 seconds"; \
			exit 1; \
		else \
			echo "⏳ Waiting for port $(1)... ($$i/30)"; \
			sleep 1; \
		fi; \
	done

check-db = @echo "🔍 Checking database connection..." && \
	for i in $$(seq 1 30); do \
		if docker exec sooner-mineral-mysql-1 mysqladmin ping -h localhost -u root -prootpassword >/dev/null 2>&1; then \
			echo "✅ Database is responding"; \
			break; \
		elif [ $$i -eq 30 ]; then \
			echo "❌ Database failed to respond after 30 seconds"; \
			exit 1; \
		else \
			echo "⏳ Waiting for database... ($$i/30)"; \
			sleep 1; \
		fi; \
	done

# Database commands
db-up: ## Start MySQL and phpMyAdmin containers
	@echo "🚀 Starting database services..."
	docker-compose -f docker-compose.dev.yml up -d
	@echo "⏳ Waiting for database to be ready..."
	$(call check-db)
	@echo "✅ Database services started!"
	@echo "   MySQL: localhost:3359"
	@echo "   phpMyAdmin: http://localhost:3360"

db-down: ## Stop database containers
	@echo "🛑 Stopping database services..."
	docker-compose -f docker-compose.dev.yml down
	@echo "✅ Database services stopped!"

db-logs: ## Show database container logs
	docker-compose -f docker-compose.dev.yml logs -f

db-reset: ## Reset database (removes all data)
	@echo "⚠️  This will remove all database data. Are you sure? [y/N]"
	@read -r confirm && [ "$$confirm" = "y" ] || exit 1
	docker-compose -f docker-compose.dev.yml down -v
	docker volume rm sooner-mineral_mysql_data 2>/dev/null || true
	@echo "✅ Database reset complete!"

# Development commands
install: ## Install all dependencies
	@echo "📦 Installing dependencies..."
	npm install
	@echo "✅ Dependencies installed!"

dev: install ## Start development server (frontend + backend)
	@echo "🚀 Starting development server..."
	@echo "   Frontend: http://localhost:3050"
	@echo "   Backend API: http://localhost:3051"
	@echo "   phpMyAdmin: http://localhost:3360"
	@echo ""
	@echo "Press Ctrl+C to stop"
	@echo "Starting backend server..."
	npx tsx server.ts &
	@echo "Starting frontend server..."
	npm run dev

start: install db-up ## Start development server with health checks
	@echo "🚀 Starting development environment with health checks..."
	@echo "   Frontend: http://localhost:3050"
	@echo "   Backend API: http://localhost:3051"
	@echo "   phpMyAdmin: http://localhost:3360"
	@echo ""
	@echo "⏳ Waiting for database services..."
	$(call check-db)
	@echo "⏳ Waiting for phpMyAdmin..."
	$(call check-port,3360)
	@echo ""
	@echo "Starting backend server..."
	npx tsx server.ts &
	@echo "⏳ Waiting for backend to start..."
	$(call check-port,3051)
	@echo ""
	@echo "Starting frontend server..."
	npm run dev &
	@echo "⏳ Waiting for frontend to start..."
	$(call check-port,3050)
	@echo ""
	@echo "🎉 Development environment is ready!"
	@echo "   Frontend: http://localhost:3050"
	@echo "   Backend API: http://localhost:3051"
	@echo "   phpMyAdmin: http://localhost:3360"
	@echo ""
	@echo "Press Ctrl+C to stop all services"

# Utility commands
stop: ## Stop all running processes
	@echo "🛑 Stopping all processes..."
	@echo "Stopping database containers..."
	docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
	@echo "Killing any running Node processes on ports 3050-3051..."
	@lsof -ti:3050,3051 | xargs kill -9 2>/dev/null || true
	@busybox lsof -ti:3050,3051 | xargs kill -9 2>/dev/null || true
	for i in $$(seq 3050 3060); do \
		npx kill-port $$i; \
	done
	@echo "✅ All processes stopped!"

clean: ## Clean up node_modules and build artifacts
	@echo "🧹 Cleaning up..."
	rm -rf node_modules
	rm -rf .vite
	@echo "✅ Cleanup complete!"

logs: ## Show application logs
	@echo "📋 Application logs:"
	@echo "Database logs:"
	docker-compose -f docker-compose.dev.yml logs --tail=20
	@echo ""
	@echo "To see real-time logs, run: make db-logs"

test-health: ## Test if services are running correctly
	@echo "🔍 Testing service health..."
	@echo ""
	@echo "Testing database connection..."
	$(call check-db)
	@echo ""
	@echo "Testing phpMyAdmin..."
	$(call check-port,3360)
	@echo ""
	@echo "Testing backend API..."
	$(call check-port,3051)
	@echo ""
	@echo "Testing frontend..."
	$(call check-port,3050)
	@echo ""
	@echo "✅ All services are healthy!"

# Quick setup for new developers
setup: install db-up ## Complete setup for new developers
	@echo "🎉 Setup complete!"
	@echo ""
	@echo "Next steps:"
	@echo "1. Run 'make start' to start development with health checks"
	@echo "2. Or run 'make dev' for simple development mode"
	@echo "3. Open http://localhost:3050 in your browser"
	@echo "4. Use http://localhost:3360 for database management (phpMyAdmin)"

# Build application for production
build-prod: ## Build application for production
	@echo "🔍 Building application for production..."
	docker compose -f docker-compose.build.yml build
	@echo "✅ Application built for production!"
	docker compose -f docker-compose.build.yml push
	git push
	@echo "✅ Application pushed to production!"