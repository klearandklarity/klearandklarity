# Optional alternative to render.yaml's native runtime, for when you would rather
# pin the JDK and Maven versions. Render picks this up when a service's runtime is
# set to "Docker" and the context is ./backend.
#
# Note: written but not built locally, because Docker is not installed on the
# machine this was authored on. The native buildCommand path in render.yaml is the
# one that has been exercised.
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /build

# Copy the POM first so dependency resolution is cached until a dependency actually changes.
COPY pom.xml .
RUN mvn -q -B dependency:go-offline

COPY src ./src
RUN mvn -q -B -DskipTests package

# -------------------------------------------------------------------------------

FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Run as a non-root user.
RUN groupadd --system klarity && useradd --system --gid klarity klarity

COPY --from=build /build/target/*.jar app.jar
RUN chown klarity:klarity app.jar
USER klarity

# PaaS platforms (Zeabur, Render, Railway, Fly, ClawCloud) inject PORT, not
# SERVER_PORT. application.yml falls back to PORT, so the plain start command is
# enough; -Dserver.port is repeated here so a container that is run by hand with
# a custom PORT also lands on the right port.
ENV JAVA_OPTS="-Xmx320m -XX:MaxMetaspaceSize=128m -XX:+UseSerialGC -Djava.security.egd=file:/dev/./urandom"
ENV SERVER_PORT=8080

EXPOSE 8080

CMD ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT:-$SERVER_PORT} -jar app.jar"]
