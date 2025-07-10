# Azure App Service deployment script for Edge Quality Evaluation (PowerShell)
# This script automates the deployment process to Azure

param(
    [string]$ResourceGroupName = "edge-quality-eval-rg",
    [string]$AppName = "edge-quality-eval-$(Get-Date -Format 'yyyyMMddHHmmss')",
    [string]$Location = "eastus", 
    [string]$Sku = "F1",
    [string]$SecretKey = ""
)

Write-Host "=== Azure App Service Deployment Script ===" -ForegroundColor Blue

# Check if Azure CLI is installed
try {
    az --version | Out-Null
} catch {
    Write-Host "Error: Azure CLI is not installed." -ForegroundColor Red
    Write-Host "Please install Azure CLI from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
}

# Check if user is logged in
try {
    az account show | Out-Null
} catch {
    Write-Host "You are not logged in to Azure. Please log in first." -ForegroundColor Yellow
    az login
}

# Get user input if not provided as parameters
if (-not $ResourceGroupName) {
    $ResourceGroupName = Read-Host "Enter Resource Group name [edge-quality-eval-rg]"
    if (-not $ResourceGroupName) { $ResourceGroupName = "edge-quality-eval-rg" }
}

if (-not $AppName) {
    $defaultAppName = "edge-quality-eval-$(Get-Date -Format 'yyyyMMddHHmmss')"
    $AppName = Read-Host "Enter App Service name [$defaultAppName]"
    if (-not $AppName) { $AppName = $defaultAppName }
}

if (-not $Location) {
    $Location = Read-Host "Enter location [eastus]"
    if (-not $Location) { $Location = "eastus" }
}

if (-not $Sku) {
    $Sku = Read-Host "Enter SKU (F1=Free, B1=Basic, S1=Standard) [F1]"
    if (-not $Sku) { $Sku = "F1" }
}

if (-not $SecretKey) {
    $SecretKey = Read-Host "Enter a secret key for Flask sessions" -AsSecureString
    $SecretKey = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecretKey))
}

if (-not $SecretKey) {
    Write-Host "Error: Secret key cannot be empty" -ForegroundColor Red
    exit 1
}

Write-Host "Deployment Configuration:" -ForegroundColor Blue
Write-Host "Resource Group: $ResourceGroupName"
Write-Host "App Name: $AppName"
Write-Host "Location: $Location"
Write-Host "SKU: $Sku"
Write-Host ""

$confirm = Read-Host "Continue with deployment? (y/N)"
if ($confirm -notmatch "^[Yy]$") {
    Write-Host "Deployment cancelled."
    exit 0
}

Write-Host "Creating resource group..." -ForegroundColor Yellow
az group create --name $ResourceGroupName --location $Location

Write-Host "Creating App Service Plan..." -ForegroundColor Yellow
az appservice plan create `
    --name "$AppName-plan" `
    --resource-group $ResourceGroupName `
    --location $Location `
    --sku $Sku `
    --is-linux

Write-Host "Creating Web App..." -ForegroundColor Yellow
az webapp create `
    --name $AppName `
    --resource-group $ResourceGroupName `
    --plan "$AppName-plan" `
    --runtime "PYTHON|3.11"

Write-Host "Configuring app settings..." -ForegroundColor Yellow
az webapp config appsettings set `
    --name $AppName `
    --resource-group $ResourceGroupName `
    --settings `
        SECRET_KEY="$SecretKey" `
        WEBSITE_TIME_ZONE="UTC" `
        SCM_DO_BUILD_DURING_DEPLOYMENT="true" `
        ENABLE_ORYX_BUILD="true"

Write-Host "Enabling HTTPS only..." -ForegroundColor Yellow
az webapp update `
    --name $AppName `
    --resource-group $ResourceGroupName `
    --https-only true

Write-Host "Deploying application code..." -ForegroundColor Yellow
az webapp up `
    --name $AppName `
    --resource-group $ResourceGroupName `
    --location $Location `
    --sku $Sku `
    --runtime "PYTHON|3.11"

$AppUrl = "https://$AppName.azurewebsites.net"

Write-Host "=== Deployment Complete! ===" -ForegroundColor Green
Write-Host "Your application is available at: $AppUrl" -ForegroundColor Green
Write-Host ""
Write-Host "Management Commands:" -ForegroundColor Blue
Write-Host "View logs: az webapp log tail --name $AppName --resource-group $ResourceGroupName"
Write-Host "Stop app:  az webapp stop --name $AppName --resource-group $ResourceGroupName"
Write-Host "Start app: az webapp start --name $AppName --resource-group $ResourceGroupName"
Write-Host "Delete:    az group delete --name $ResourceGroupName --yes --no-wait"
Write-Host ""
Write-Host "Note: It may take a few minutes for the application to start up completely." -ForegroundColor Yellow
