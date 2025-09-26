# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release
- Docker-based static file server using BusyBox
- Environment variable configuration
- nginx proxy manager integration
- Health checks
- Multi-platform Docker images (amd64, arm64)
- GitHub Actions CI/CD pipeline

## [1.0.0] - 2025-09-26

### Added
- Ultra-lightweight static file server using BusyBox httpd
- Docker Compose configuration with environment variables
- Read-only file mounting for security
- Configurable port and directory settings
- Comprehensive documentation
- Examples and getting started guide
- MIT License

### Features
- Port mapping via `PORT` environment variable (default: 8080)
- Custom directory mounting via `SERVER_ROOT` (default: ./www)
- Auto-restart policy
- Health check endpoint
- nginx proxy manager ready configuration