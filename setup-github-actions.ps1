# Setup script for GitHub Actions Azure deployment
# This script creates a service principal for GitHub Actions to deploy to Azure

param(
    [string]$ResourceGroupName = "edge-quality-eval-rg",
    [string]$AppName = "browser-genai-eval",
    [string]$ServicePrincipalName = "github-actions-sp-browser-genai-eval"
)

Write-Host "=== GitHub Actions Azure Setup ===" -ForegroundColor Blue

# Check if user is logged in to Azure
try {
    $currentAccount = az account show | ConvertFrom-Json
    Write-Host "Currently logged in as: $($currentAccount.user.name)" -ForegroundColor Green
    Write-Host "Subscription: $($currentAccount.name) ($($currentAccount.id))" -ForegroundColor Green
} catch {
    Write-Host "Error: You are not logged in to Azure. Please run 'az login' first." -ForegroundColor Red
    exit 1
}

# Get subscription ID
$subscriptionId = $currentAccount.id

# Get resource group ID
Write-Host "Getting resource group information..." -ForegroundColor Yellow
try {
    $resourceGroup = az group show --name $ResourceGroupName | ConvertFrom-Json
    Write-Host "Resource Group: $($resourceGroup.name)" -ForegroundColor Green
    Write-Host "Location: $($resourceGroup.location)" -ForegroundColor Green
} catch {
    Write-Host "Error: Resource group '$ResourceGroupName' not found." -ForegroundColor Red
    Write-Host "Please run the deployment script first: .\deploy-azure.ps1" -ForegroundColor Yellow
    exit 1
}

# Create service principal
Write-Host "Creating service principal for GitHub Actions..." -ForegroundColor Yellow
try {
    $spOutput = az ad sp create-for-rbac `
        --name $ServicePrincipalName `
        --role contributor `
        --scopes "/subscriptions/$subscriptionId/resourceGroups/$ResourceGroupName" `
        --sdk-auth

    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create service principal"
    }

    Write-Host "Service principal created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "=== IMPORTANT: GitHub Secret Configuration ===" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Go to your GitHub repository: https://github.com/adolfdaniel/browser-genai-eval" -ForegroundColor Cyan
    Write-Host "2. Navigate to Settings > Secrets and variables > Actions" -ForegroundColor Cyan
    Write-Host "3. Click 'New repository secret'" -ForegroundColor Cyan
    Write-Host "4. Create a secret named: AZURE_CREDENTIALS" -ForegroundColor Cyan
    Write-Host "5. Copy and paste the following JSON as the value:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "--- COPY THE JSON BELOW ---" -ForegroundColor Red
    Write-Host $spOutput -ForegroundColor White
    Write-Host "--- END OF JSON ---" -ForegroundColor Red
    Write-Host ""
    Write-Host "6. Save the secret" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After adding the secret, push your changes to trigger the GitHub Actions workflow:" -ForegroundColor Yellow
    Write-Host "git add ." -ForegroundColor White
    Write-Host "git commit -m `"Fix GitHub Actions Azure login`"" -ForegroundColor White
    Write-Host "git push origin main" -ForegroundColor White
    Write-Host ""
    Write-Host "Note: Keep this JSON secure and do not share it publicly!" -ForegroundColor Red

} catch {
    Write-Host "Error creating service principal: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common solutions:" -ForegroundColor Yellow
    Write-Host "- Make sure you have Owner or Contributor role on the subscription" -ForegroundColor Cyan
    Write-Host "- Try with a different service principal name" -ForegroundColor Cyan
    Write-Host "- Check if you have permission to create service principals" -ForegroundColor Cyan
    exit 1
}
