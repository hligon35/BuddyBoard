if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Host "npm not found. Please install Node.js and npm first." -ForegroundColor Yellow
  exit 1
}

Write-Host "Installing dependencies..."
npm install

if (-not (Get-Command expo -ErrorAction SilentlyContinue)) {
  Write-Host "Installing expo CLI globally..."
  npm install -g expo-cli
}

Write-Host "Done. Run 'npm start' or 'expo start' to launch the app."