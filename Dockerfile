#To Build:
# docker build -t runner
# docker run -p 3080:3080 runner


FROM node:20

WORKDIR /app

COPY . .

# Update Ubuntu packages
RUN apt-get update && \
      apt-get -y install sudo

RUN sudo apt install -y default-jdk

RUN sudo apt-get install -y python3 python3-pip


# set JAVA_VERSION
# ARG JAVA_VERSION=openjdk-19-jre-headless
RUN java --version


# # Install Java
# RUN apt-get install -y $JAVA_VERSION

# # Setup JAVA_HOME
# ENV JAVA_HOME=/usr/lib/jvm/java-19-openjdk-amd64

# Set entry point to show Java version and environment variable $JAVA_HOME
# Set the entry point to the Node.js executable
# EXPOSE 3080
EXPOSE 3000
ENTRYPOINT ["node", "server.js"]



