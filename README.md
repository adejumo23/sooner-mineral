# Sooner Mineral - Land Management Application

A comprehensive React-based land management application with ArcGIS mapping integration and MySQL database backend.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (for local development)
- **Docker & Docker Compose** (for containerized deployment)
- **Git** (for version control)

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit with your values
   nano .env
   ```

3. **Run the application:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Web app: http://localhost:5173

## 🐳 Docker Deployment

### Quick Start with Docker

1. **Set up environment variables:**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit with your values
   nano .env
   ```

2. **Build and start the services:**
   ```bash
   docker compose up --build
   ```

3. **Access the application:**
   - Web app: http://localhost:3050
   - MySQL: localhost:3359

4. **Stop the services:**
   ```bash
   docker compose down
   ```

### Development with Docker

For development with hot reloading:

```bash
# Start only the database
docker compose up db

# Run the React app locally
npm run dev
```

## ⚙️ Configuration

### Environment Variables

The application uses environment variables from a `.env` file. Copy the example file and customize it:

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your values
nano .env
```

The `.env` file should contain:

```env
# ArcGIS Configuration
REACT_APP_ARCGIS_API_KEY=your_arcgis_api_key

# MySQL Database Configuration
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_DATABASE=your_database_name
MYSQL_USER=your_username
MYSQL_PASSWORD=your_password
```

**Important:** Never commit the `.env` file to version control as it contains sensitive information.

### Database Configuration

- **Database Name:** soonermineraldb
- **Username:** soonermineral
- **Password:** soonermineralpass
- **Root Password:** rootpassword

### Database Initialization

The MySQL container will automatically:
1. Create the `soonermineraldb` database
2. Execute all SQL scripts in the `database/` folder
3. Set up tables, sample data, and relationships

## 🛠️ Useful Commands

### Docker Commands

```bash
# View logs
docker compose logs -f

# Access MySQL shell
docker compose exec db mysql -u soonermineral -p soonermineraldb

# Rebuild containers
docker compose up --build --force-recreate

# Remove all data (including database)
docker compose down -v

# Make changes and rebuild app
docker compose down && docker compose up --build
```

### Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🤖 Automated Deployment

### Push changes to prod
Run this command after commiting/merging into main branch. Checkout main branch on your local

```
git checkout main
git pull
docker compose -f docker-compose.build.yml build && docker compose -f docker-compose.build.yml push
```

### Auto-Deploy Script

For production servers, use the included auto-deploy script that monitors git changes and automatically rebuilds containers:

```bash
# Copy the configuration template
cp .envrc.example .envrc

# Edit configuration variables
nano .envrc

# Make the script executable
chmod +x auto-deploy.sh.example

# Copy to actual script name
cp auto-deploy.sh.example auto-deploy.sh

# Run the auto-deploy script
./auto-deploy.sh                    # Run in foreground
./auto-deploy.sh --daemon           # Run in background
./auto-deploy.sh --install-service  # Install as system service
```

### Auto-Deploy Options

- **Foreground Mode**: `./auto-deploy.sh` - Run with visible output
- **Daemon Mode**: `./auto-deploy.sh --daemon` - Run in background
- **System Service**: `./auto-deploy.sh --install-service` - Auto-start on boot
- **Help**: `./auto-deploy.sh --help` - Show all options

### SSH Setup for Auto-Deploy

1. **Generate SSH key:**
   ```bash
   ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
   ```

2. **Add public key to GitHub:**
   ```bash
   cat ~/.ssh/id_rsa.pub
   # Copy and add to GitHub → Settings → SSH and GPG keys
   ```

3. **Test SSH connection:**
   ```bash
   ssh -T git@github.com
   ```

4. **Update script configuration:**
   ```bash
   # Edit .envrc file
   export GIT_REPO_URL="git@github.com:your-username/sooner-mineral.git"
   export PROJECT_DIRECTORY="/path/to/your/project"
   ```

### System Service Management

For automatic startup after system reboot:

```bash
# Install as systemd service (requires sudo)
sudo ./auto-deploy.sh --install-service

# Start the service
sudo systemctl start sooner-mineral-deploy

# Check service status
sudo systemctl status sooner-mineral-deploy

# View service logs
sudo journalctl -u sooner-mineral-deploy -f

# Stop the service
sudo systemctl stop sooner-mineral-deploy

# Uninstall the service
sudo ./auto-deploy.sh --uninstall-service
```

## 🗺️ Features

- **Land Management Dashboard** - Comprehensive overview of land tracts and properties
- **ArcGIS Integration** - Interactive maps with satellite and street views
- **Contact Management** - Track landowners and stakeholders
- **Lead Tracking** - Manage acquisition opportunities
- **Unit Management** - Organize land into drilling units
- **Assignment Tracking** - Monitor buyer assignments and progress
- **Responsive Design** - Modern UI with orange/red/yellow color scheme

## 🏗️ Architecture

- **Frontend:** React with TypeScript
- **Styling:** Tailwind CSS with custom theme
- **Maps:** ArcGIS API for JavaScript
- **Database:** MySQL 8.0
- **Containerization:** Docker & Docker Compose
- **Build Tool:** Vite

## 📁 Project Structure

```
sooner-mineral/
├── components/          # React components
├── pages/              # Page components
├── services/           # API and external services
├── database/           # SQL scripts and schema
├── hooks/              # Custom React hooks
├── src/theme/          # Theme configuration
├── docker-compose.yml  # Docker configuration
├── auto-deploy.sh      # Automated deployment script
└── .env.example        # Environment variables template
```

## 🔧 Troubleshooting

### Common Issues

1. **Port conflicts:** If ports 3050 or 3359 are in use, modify the `docker-compose.yml` file
2. **Database connection issues:** Ensure the database container is fully started before accessing the web app
3. **Build issues:** Clear Docker cache with `docker system prune -a`
4. **Environment variables:** Make sure `.env` file exists and contains all required variables
5. **SSH authentication:** Verify SSH key is added to GitHub account for auto-deploy

### Getting Help

- Check the logs: `docker compose logs -f`
- Verify environment variables: `cat .env`
- Test database connection: `docker compose exec db mysql -u soonermineral -p soonermineraldb`

## 📄 License

This project is proprietary software for Sooner Capital land management operations.

---

**Note:** This application is designed for internal use by Sooner Capital for managing mineral rights, land tracts, and acquisition workflows.