# Docker Setup for Sooner Mineral

This Docker Compose setup includes:
- React web application (port 3000)
- MySQL database (port 3306)

## Prerequisites

- Docker
- Docker Compose

## Quick Start

1. **Build and start the services:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Web app: http://localhost:3000
   - MySQL: localhost:3306

3. **Stop the services:**
   ```bash
   docker-compose down
   ```

## Database Configuration

- **Database Name:** soonermineraldb
- **Username:** soonermineral
- **Password:** soonermineralpass
- **Root Password:** rootpassword

## Database Initialization

The MySQL container will automatically:
1. Create the `soonermineraldb` database
2. Execute all SQL scripts in the `database/` folder
3. Set up tables, sample data, and relationships

## Development

For development with hot reloading:

```bash
# Start only the database
docker-compose up db

# Run the React app locally
npm run dev
```

## Useful Commands

```bash
# View logs
docker-compose logs -f

# Access MySQL shell
docker-compose exec db mysql -u soonermineral -p soonermineraldb

# Rebuild containers
docker-compose up --build --force-recreate

# Remove all data (including database)
docker-compose down -v
```

## Environment Variables

You can customize the setup by creating a `.env` file:

```env
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_DATABASE=your_database_name
MYSQL_USER=your_username
MYSQL_PASSWORD=your_password
```

## Troubleshooting

1. **Port conflicts:** If ports 3000 or 3306 are in use, modify the `docker-compose.yml` file
2. **Database connection issues:** Ensure the database container is fully started before accessing the web app
3. **Build issues:** Clear Docker cache with `docker system prune -a` 