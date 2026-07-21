FROM eclipse-temurin:21-jdk-alpine AS builder

RUN apk add --no-cache git

RUN git clone https://github.com/UNIVALI-LITE/Portugol-Studio.git /build

WORKDIR /build

RUN ./gradlew :portugol-console:jar

FROM eclipse-temurin:21-jdk-alpine

WORKDIR /portugol

COPY --from=builder /build/console/build/libs/portugol-console-2.7.5.jar /portugol/portugol-console.jar
COPY --from=builder /build/console/build/libs/lib/ /portugol/lib/
