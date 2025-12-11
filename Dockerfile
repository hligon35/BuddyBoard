FROM ubuntu:22.04

# Build image that can compile Android (headless)
ENV DEBIAN_FRONTEND=noninteractive

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
  openjdk-11-jdk-headless curl wget unzip git python3 nodejs npm build-essential ca-certificates gnupg && \
  npm install -g yarn && \
  rm -rf /var/lib/apt/lists/*

# Android SDK
ENV ANDROID_SDK_ROOT=/opt/android-sdk
RUN mkdir -p ${ANDROID_SDK_ROOT}/cmdline-tools && mkdir -p /root/.android

WORKDIR /opt
RUN wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip -O cmdline-tools.zip \
  && unzip cmdline-tools.zip -d ${ANDROID_SDK_ROOT}/cmdline-tools \
  && mv ${ANDROID_SDK_ROOT}/cmdline-tools/cmdline-tools ${ANDROID_SDK_ROOT}/cmdline-tools/latest \
  && rm cmdline-tools.zip

ENV PATH="${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin:${ANDROID_SDK_ROOT}/platform-tools:${PATH}"

# Install required SDK packages (adjust platforms/build-tools as needed)
RUN yes | sdkmanager --sdk_root=${ANDROID_SDK_ROOT} --licenses
RUN sdkmanager --sdk_root=${ANDROID_SDK_ROOT} "platform-tools" "platforms;android-33" "build-tools;33.0.2" "build-tools;35.0.0"

# Create app user
RUN useradd -m -u 1000 builder
USER builder

WORKDIR /home/builder/app

# Project files will be mounted at runtime; Gradle wrapper will be used
CMD ["/bin/bash"]
