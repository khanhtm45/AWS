FROM openjdk:17-jdk-slim

WORKDIR /app

RUN apt-get update && apt-get install -y maven

COPY backend ./backend

WORKDIR /app/backend

RUN mvn clean install -DskipTests

EXPOSE 8080

CMD ["java", "-jar", "target/dna-testing-service-0.0.1-SNAPSHOT.jar", "--spring.profiles.active=prod"]
