Param()
if (-not $env:KEY_ID -or -not $env:ISSUER_ID -or -not $env:P8_FILE) {
  Write-Error "Usage: set KEY_ID, ISSUER_ID and P8_FILE environment variables and run this script"
  exit 1
}

if (-not (Test-Path $env:P8_FILE)) {
  Write-Error "p8 file not found: $($env:P8_FILE)"
  exit 1
}

$key = Get-Content -Raw -Path $env:P8_FILE
$obj = @{ keyId = $env:KEY_ID; issuerId = $env:ISSUER_ID; key = $key }
$json = $obj | ConvertTo-Json -Depth 10
Set-Content -Path .\appstore_connect.json -Value $json -Encoding UTF8
Write-Host "Wrote .\appstore_connect.json (add as APP_STORE_CONNECT_JSON secret if desired)"
