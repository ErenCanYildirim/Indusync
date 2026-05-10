#!/bin/sh
set -e

echo "Starting Indusync Backend Application..."
echo "Current directory: $(pwd)"
echo "Files in current directory:"
ls -la

echo "Checking if app.jar exists:"
if [ -f "app.jar" ]; then
    echo "app.jar found"
else
    echo "ERROR: app.jar not found!"
    exit 1
fi

echo "Starting Java application with PORT=${PORT:-8080} and PROFILE=${SPRING_PROFILES_ACTIVE:-prod}"
exec java -Dserver.port=${PORT:-8080} -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-prod} -jar app.jar 