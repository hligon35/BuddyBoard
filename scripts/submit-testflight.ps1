Param()
Write-Host "Starting EAS iOS build and submit to TestFlight..."

if (-not (Get-Command eas -ErrorAction SilentlyContinue)) {
  Write-Error "eas CLI not found. Install with: npm install -g eas-cli"
  exit 1
}

Write-Host "Ensure you're logged in: eas login"
Write-Host "Running iOS production build (cloud)..."
eas build --platform ios --profile production

Write-Host "Build complete. Submitting latest iOS build to TestFlight..."
eas submit --platform ios --latest

Write-Host "Submission triggered. Monitor App Store Connect or eas dashboard for progress."
