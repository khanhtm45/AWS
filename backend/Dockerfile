FROM maven:3.9.4-eclipse-temurin-17 AS build

WORKDIR /app

# Copy only the files needed for a build to leverage Docker cache
COPY pom.xml ./
COPY src ./src

RUN mvn -B package -DskipTests

FROM eclipse-temurin:17-jre

WORKDIR /app

# Copy the built jar from the build stage
COPY --from=build /app/target/leaf-shop-0.0.1-SNAPSHOT.jar ./app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar", "--spring.profiles.active=prod"]
