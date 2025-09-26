# Simple Static File Server
FROM busybox:latest

# Metadata
LABEL maintainer="your-email@example.com"
LABEL description="Ultra-lightweight static file server using BusyBox httpd"
LABEL version="1.0.0"

# Create www directory
RUN mkdir -p /www

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Run httpd
CMD ["httpd", "-f", "-p", "80", "-h", "/www"]