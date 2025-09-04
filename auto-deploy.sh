#!/bin/bash

# =============================================================================
# Auto-Deploy Script for Sooner Mineral Application
# =============================================================================
# This script monitors the git repository for changes and automatically
# rebuilds the Docker containers when updates are detected.
#
# Usage: ./auto-deploy.sh
#
# SSH SETUP INSTRUCTIONS:
# 1. Generate SSH key: ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
# 2. Add public key to GitHub: cat ~/.ssh/id_rsa.pub (copy and add to GitHub)
# 3. Test connection: ssh -T git@github.com
# 4. Update GIT_REPO_URL below to use SSH format
# =============================================================================

# =============================================================================
# CONFIGURATION VARIABLES - CUSTOMIZE THESE VALUES
# =============================================================================

# Git Configuration
GIT_REPO_URL="git@github.com:your-username/sooner-mineral.git"       # Replace with your actual SSH repo URL
GIT_BRANCH="main"                                                    # Branch to monitor
SSH_KEY_PATH=""                                                      # Path to your SSH private key (optional, uses default ~/.ssh/id_rsa)
SSH_KEY_PASSPHRASE=""                                                # SSH key passphrase (if your key is encrypted)

# Docker Configuration
DOCKER_COMPOSE_FILE="docker-compose.yml"                            # Docker compose file to use
PROJECT_DIRECTORY="sooner-mineral"               # Full path to your project directory
SLEEP_INTERVAL=300                                                   # Sleep interval in seconds (300 = 5 minutes)

# Logging Configuration
LOG_FILE="/var/log/sooner-mineral-deploy.log"                       # Log file path
MAX_LOG_SIZE=10485760                                               # Max log size in bytes (10MB)

# Notification Configuration (Optional)
WEBHOOK_URL=""                                                       # Discord/Slack webhook URL for notifications
NOTIFICATION_ENABLED=false                                          # Set to true to enable notifications

# =============================================================================
# SCRIPT CONFIGURATION - DO NOT MODIFY
# =============================================================================

SCRIPT_NAME="$(basename "$0")"
CURRENT_DIR="$(pwd)"
LAST_COMMIT_FILE="$PROJECT_DIRECTORY/.last_commit"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        "DEBUG")
            echo -e "${BLUE}[DEBUG]${NC} $message"
            ;;
    esac
    
    # Write to log file
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

rotate_log() {
    if [ -f "$LOG_FILE" ] && [ $(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null) -gt $MAX_LOG_SIZE ]; then
        log "INFO" "Rotating log file (size exceeded $MAX_LOG_SIZE bytes)"
        mv "$LOG_FILE" "${LOG_FILE}.old"
        touch "$LOG_FILE"
    fi
}

send_notification() {
    local message="$1"
    if [ "$NOTIFICATION_ENABLED" = true ] && [ -n "$WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🤖 Sooner Mineral Auto-Deploy: $message\"}" \
            "$WEBHOOK_URL" 2>/dev/null || log "WARN" "Failed to send notification"
    fi
}

check_dependencies() {
    log "INFO" "Checking dependencies..."
    
    # Check if git is installed
    if ! command -v git &> /dev/null; then
        log "ERROR" "Git is not installed. Please install git first."
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        log "ERROR" "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if docker-compose is installed
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log "ERROR" "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    log "INFO" "All dependencies are available."
}

setup_ssh_auth() {
    log "INFO" "Setting up SSH authentication..."
    
    # Set SSH key path if not specified
    if [ -z "$SSH_KEY_PATH" ]; then
        SSH_KEY_PATH="$HOME/.ssh/id_rsa"
    fi
    
    # Check if SSH key exists
    if [ ! -f "$SSH_KEY_PATH" ]; then
        log "ERROR" "SSH key not found at: $SSH_KEY_PATH"
        log "ERROR" "Please generate an SSH key or specify the correct path in SSH_KEY_PATH"
        log "INFO" "To generate a new SSH key: ssh-keygen -t rsa -b 4096 -C 'your_email@example.com'"
        exit 1
    fi
    
    # Set proper permissions for SSH key
    chmod 600 "$SSH_KEY_PATH"
    
    # Start SSH agent if not running
    if [ -z "$SSH_AUTH_SOCK" ]; then
        log "INFO" "Starting SSH agent..."
        eval "$(ssh-agent -s)"
    fi
    
    # Add SSH key to agent
    if [ -n "$SSH_KEY_PASSPHRASE" ]; then
        log "INFO" "Adding SSH key with passphrase..."
        echo "$SSH_KEY_PASSPHRASE" | ssh-add "$SSH_KEY_PATH"
    else
        log "INFO" "Adding SSH key without passphrase..."
        ssh-add "$SSH_KEY_PATH"
    fi
    
    # Test SSH connection to GitHub
    log "INFO" "Testing SSH connection to GitHub..."
    if ssh -T -o StrictHostKeyChecking=no git@github.com 2>&1 | grep -q "successfully authenticated"; then
        log "INFO" "SSH authentication successful!"
    else
        log "WARN" "SSH authentication test failed, but continuing..."
        log "INFO" "Make sure your SSH key is added to your GitHub account"
    fi
    
    # Configure git to use SSH
    git config --global url."git@github.com:".insteadOf "https://github.com/"
}

setup_project_directory() {
    log "INFO" "Setting up project directory: $PROJECT_DIRECTORY"
    
    # Create project directory if it doesn't exist
    if [ ! -d "$PROJECT_DIRECTORY" ]; then
        log "INFO" "Creating project directory..."
        mkdir -p "$PROJECT_DIRECTORY"
    fi
    
    # Change to project directory
    cd "$PROJECT_DIRECTORY" || {
        log "ERROR" "Failed to change to project directory: $PROJECT_DIRECTORY"
        exit 1
    }
    
    # Clone repository if it doesn't exist
    if [ ! -d ".git" ]; then
        log "INFO" "Cloning repository from $GIT_REPO_URL..."
        git clone "$GIT_REPO_URL" . || {
            log "ERROR" "Failed to clone repository"
            exit 1
        }
    fi
    
    # Set up git config
    git config pull.rebase false
    
    log "INFO" "Project directory setup complete."
}

get_current_commit() {
    git rev-parse HEAD 2>/dev/null || echo "unknown"
}

get_last_commit() {
    if [ -f "$LAST_COMMIT_FILE" ]; then
        cat "$LAST_COMMIT_FILE"
    else
        echo "unknown"
    fi
}

save_current_commit() {
    local commit_hash="$1"
    echo "$commit_hash" > "$LAST_COMMIT_FILE"
}

check_for_updates() {
    log "DEBUG" "Checking for updates..."
    
    # Fetch latest changes
    git fetch origin "$GIT_BRANCH" || {
        log "ERROR" "Failed to fetch from origin"
        return 1
    }
    
    # Get current and last commit hashes
    local current_commit=$(get_current_commit)
    local last_commit=$(get_last_commit)
    
    log "DEBUG" "Current commit: $current_commit"
    log "DEBUG" "Last commit: $last_commit"
    
    # Check if there are new commits
    if [ "$current_commit" != "$last_commit" ] && [ "$current_commit" != "unknown" ]; then
        log "INFO" "New commits detected! Current: $current_commit, Last: $last_commit"
        return 0
    else
        log "DEBUG" "No new commits detected."
        return 1
    fi
}

pull_and_deploy() {
    log "INFO" "Pulling latest changes and deploying..."
    
    # Pull latest changes
    git pull origin "$GIT_BRANCH" || {
        log "ERROR" "Failed to pull latest changes"
        return 1
    }
    
    # Get the new commit hash
    local new_commit=$(get_current_commit)
    log "INFO" "Pulled to commit: $new_commit"
    
    # Stop existing containers
    log "INFO" "Stopping existing containers..."
    docker-compose down || docker compose down || {
        log "WARN" "Failed to stop containers (they might not be running)"
    }
    
    # Build and start containers
    log "INFO" "Building and starting containers..."
    if docker-compose up --build -d; then
        log "INFO" "Successfully deployed to commit: $new_commit"
        save_current_commit "$new_commit"
        send_notification "Successfully deployed to commit: $new_commit"
        return 0
    else
        log "ERROR" "Failed to build and start containers"
        send_notification "Failed to deploy commit: $new_commit"
        return 1
    fi
}

cleanup() {
    log "INFO" "Cleaning up and exiting..."
    # Kill SSH agent if we started it
    if [ -n "$SSH_AGENT_PID" ]; then
        ssh-agent -k
    fi
    exit 0
}

# =============================================================================
# MAIN SCRIPT LOGIC
# =============================================================================

main() {
    log "INFO" "Starting Sooner Mineral Auto-Deploy Script"
    log "INFO" "Monitoring repository: $GIT_REPO_URL (branch: $GIT_BRANCH)"
    log "INFO" "Check interval: $SLEEP_INTERVAL seconds"
    log "INFO" "Project directory: $PROJECT_DIRECTORY"
    
    # Set up signal handlers
    trap cleanup SIGINT SIGTERM
    
    # Initial setup
    check_dependencies
    setup_ssh_auth
    setup_project_directory
    
    # Save initial commit
    local initial_commit=$(get_current_commit)
    save_current_commit "$initial_commit"
    log "INFO" "Initial commit saved: $initial_commit"
    
    # Main monitoring loop
    while true; do
        rotate_log
        
        if check_for_updates; then
            log "INFO" "Changes detected, deploying..."
            if pull_and_deploy; then
                log "INFO" "Deployment successful"
            else
                log "ERROR" "Deployment failed"
            fi
        else
            log "DEBUG" "No changes detected, sleeping for $SLEEP_INTERVAL seconds..."
        fi
        
        sleep "$SLEEP_INTERVAL"
    done
}

# =============================================================================
# SCRIPT EXECUTION
# =============================================================================

# Check if script is being run directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi
