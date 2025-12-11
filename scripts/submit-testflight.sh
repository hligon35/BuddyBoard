#!/usr/bin/env bash
set -euo pipefail

echo "Starting EAS iOS build and submit to TestFlight (non-interactive)..."

if ! command -v eas >/dev/null 2>&1; then
  echo "eas CLI not found - installing..."
  npm install -g eas-cli
fi

echo "Ensure you have set EXPO_TOKEN or run 'eas login' interactively before using this script."

echo "Running iOS production build (cloud)..."
eas build --platform ios --profile production --non-interactive

echo "Build complete. Submitting latest iOS build to TestFlight..."
eas submit --platform ios --latest --non-interactive

echo "Submission triggered. Monitor App Store Connect or eas dashboard for progress."
#!/usr/bin/env bash
set -euo pipefail

echo "Starting EAS iOS build and submit to TestFlight..."

if ! command -v eas >/dev/null 2>&1; then
  echo "eas CLI not found. Install with: npm install -g eas-cli" >&2
  exit 1
fi

echo "Make sure you are logged in: eas login"

echo "Running iOS production build (cloud)..."
eas build --platform ios --profile production

echo "Build complete. Submitting latest iOS build to TestFlight..."
# Submit the latest iOS build produced by EAS
eas submit --platform ios --latest

echo "Submission triggered. Monitor App Store Connect or eas dashboard for progress."
