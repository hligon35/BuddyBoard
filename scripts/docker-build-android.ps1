param(
  [string]$imageName = 'buddyboard-android-builder',
  [string]$containerName = 'buddyboard-android-build'
)

# Build Docker image
docker build -t $imageName .

# Run container, mount project, run gradle assembleRelease inside container
docker run --rm -it -v ${PWD}:/home/builder/app -w /home/builder/app $imageName /bin/bash -lc "yarn install --frozen-lockfile || npm install; cd android && ./gradlew bundleRelease"
