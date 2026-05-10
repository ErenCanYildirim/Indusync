FROM eclipse-temurin:24-jdk-alpine AS build
WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Make the Maven wrapper executable
RUN chmod +x ./mvnw

# Download dependencies
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application (skip tests to speed up CI images)
RUN ./mvnw -Dmaven.test.skip=true clean package

# Runtime image
FROM eclipse-temurin:24-jre-alpine
WORKDIR /app

# Copy the built artifact
COPY --from=build /app/target/*.jar app.jar

# Copy entrypoint script and ensure it is executable (also fix Windows line endings)
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x /app/entrypoint.sh \
  && sed -i 's/\r$//' /app/entrypoint.sh

# Set JVM options for containers, optimized for 512MB environments
# These can be overridden at runtime via environment variables
ENV JAVA_TOOL_OPTIONS="-XX:+UseG1GC -XX:MaxRAMPercentage=70 -XX:InitialRAMPercentage=30 -XX:+ExitOnOutOfMemoryError -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp -XX:ActiveProcessorCount=2 -Djava.security.egd=file:/dev/./urandom"

# Use exec-form to ensure proper signal handling; script expands env vars and starts the app
ENTRYPOINT ["/app/entrypoint.sh"]