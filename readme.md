# Simple Static File Server

[![Docker Build](https://github.com/yourusername/simple-fileserver/actions/workflows/docker.yml/badge.svg)](https://github.com/yourusername/simple-fileserver/actions/workflows/docker.yml)
[![Docker Pulls](https://img.shields.io/docker/pulls/yourusername/simple-fileserver)](https://hub.docker.com/r/yourusername/simple-fileserver)
[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/yourusername/simple-fileserver)](https://github.com/yourusername/simple-fileserver/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A minimal Docker-based static file server using BusyBox httpd, perfect for serving static files and integrating with reverse proxies like nginx proxy manager.

## Features

- 🚀 **Ultra-lightweight**: Uses BusyBox (< 5MB)
- 📁 **Simple**: Serve any directory as static files
- 🔧 **Configurable**: Easy port and directory configuration
- 🔒 **Read-only**: Files are mounted read-only for security
- 📦 **Docker**: Ready-to-use with Docker Compose
- 🌐 **Proxy-friendly**: Perfect for nginx proxy manager integration

## Quick Start

### Option 1: Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/simple-fileserver.git
   cd simple-fileserver
   ```

2. **Start the server**
   ```bash
   docker-compose up -d
   ```

3. **Access your files**
   Open http://localhost:8080 in your browser

### Option 2: Using Docker directly

```bash
docker run -d \
  --name simple-fileserver \
  -p 8080:80 \
  -v $(pwd)/www:/www:ro \
  lordcraymen/simple-fileserver:latest
```

### Option 3: Using Makefile

```bash
make run      # Start server
make logs     # View logs  
make stop     # Stop server
make help     # See all commands
```

## Configuration

### Environment Variables

Create a `.env` file to customize the server:

```env
# Port to expose the server on (default: 8080)
PORT=8080

# Directory to serve files from (default: ./www)
SERVER_ROOT=./www
```

### Docker Compose

The `docker-compose.yml` uses these defaults:
- **Port**: 8080 (configurable via `PORT` env var)
- **Directory**: `./www` (configurable via `SERVER_ROOT` env var)
- **Container**: Auto-restarts unless stopped

## nginx proxy manager Integration

This server works perfectly with nginx proxy manager:

1. **Start the file server**
   ```bash
   docker-compose up -d
   ```

2. **In nginx proxy manager**, create a new proxy host:
   - **Domain**: your-domain.com
   - **Forward Hostname/IP**: `simple-fileserver` (container name)
   - **Forward Port**: `80`
   - **Enable**: Websockets Support (if needed)

3. **For SSL**: Enable "Force SSL" and configure your certificates

## Use Cases

- 📖 **Documentation hosting**: Serve static documentation sites
- 🎨 **Asset server**: Host images, CSS, JS files
- 📱 **SPA hosting**: Serve single-page applications
- 🔧 **Development**: Quick local file sharing
- 📦 **Build artifacts**: Serve compiled applications

## Directory Structure

```
.
├── docker-compose.yml    # Main Docker Compose configuration
├── .env                  # Environment variables (create this)
├── www/                  # Your static files go here
│   └── index.html        # Example file
└── README.md            # This file
```

## Advanced Configuration

### Custom Port and Directory

```yaml
# docker-compose.override.yml
services:
  fileserver:
    ports:
      - "3000:80"
    volumes:
      - "/path/to/your/files:/www:ro"
```

### Multiple File Servers

```yaml
# docker-compose.yml
services:
  docs:
    image: busybox:latest
    command: ["httpd", "-f", "-p", "80", "-h", "/www"]
    volumes:
      - "./docs:/www:ro"
    ports:
      - "8080:80"
    restart: unless-stopped

  assets:
    image: busybox:latest
    command: ["httpd", "-f", "-p", "80", "-h", "/www"]
    volumes:
      - "./assets:/www:ro"
    ports:
      - "8081:80"
    restart: unless-stopped
```

## Security Notes

- Files are mounted **read-only** (`ro`) for security
- BusyBox httpd is minimal and secure
- No server-side scripting (PHP, etc.) - pure static files only
- Consider using HTTPS via nginx proxy manager for production

## Troubleshooting

### Container won't start
- Check if the `SERVER_ROOT` directory exists
- Verify port `8080` (or your custom port) is not in use
- Run `docker-compose logs` for error details

### Files not updating
- Restart the container: `docker-compose restart`
- Files are cached in browser - try hard refresh (Ctrl+F5)

### Permission issues
- Ensure the `SERVER_ROOT` directory is readable
- On Linux/Mac: `chmod -R 755 ./www`

## Releases & Versioning

This project follows [Semantic Versioning](https://semver.org/). 

### Creating a Release

```bash
# Using Makefile
make release TAG=1.0.1

# Manual process
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin v1.0.1
```

### Available Tags
- `latest` - Latest stable release
- `v1.0.x` - Specific version tags
- `main` - Development branch builds

## Docker Hub

Pre-built images are available on Docker Hub:
- `yourusername/simple-fileserver:latest`
- `yourusername/simple-fileserver:v1.0.0`

Multi-architecture support: `linux/amd64`, `linux/arm64`

## License

MIT License - feel free to use this for any purpose!

## Contributing

PRs welcome! This project aims to stay minimal and focused.
