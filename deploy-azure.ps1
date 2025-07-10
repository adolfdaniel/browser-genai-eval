# Azure App Service deployment script for Edge Quality Evaluation (PowerShell)
# This script automates the deployment process to Azure

param(
    [string]$ResourceGroupName = "edge-quality-eval-rg",
    [string]$AppName = "browser-genai-eval",  # Clean, simple name
    [string]$Location = "Canada Central",  # Use a location close to your users
    [string]$Sku = "B2",  # Basic tier: B2 provides good performance for the app
    [string]$SecretKey = ""
)

Write-Host "=== Azure App Service Deployment Script ===" -ForegroundColor Blue

# Check if Azure CLI is installed
try {
    az --version | Out-Null
}
catch {
    Write-Host "Error: Azure CLI is not installed." -ForegroundColor Red
    Write-Host "Please install Azure CLI from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
}

# Check if user is logged in
try {
    az account show | Out-Null
    Write-Host "Already logged in to Azure." -ForegroundColor Green
}
catch {
    Write-Host "You are not logged in to Azure. Please log in first." -ForegroundColor Yellow
    
    # Try normal login first
    try {
        az login
    }
    catch {
        Write-Host "Standard login failed. Trying device code login..." -ForegroundColor Yellow
        Write-Host "If you have multiple tenants, you may need to specify tenant ID:" -ForegroundColor Cyan
        Write-Host "Example: az login --tenant YOUR_TENANT_ID" -ForegroundColor Cyan
        
        $useDeviceCode = Read-Host "Use device code login? (y/N)"
        if ($useDeviceCode -match "^[Yy]$") {
            az login --use-device-code
        }
        else {
            $tenantId = Read-Host "Enter your tenant ID (or press Enter to retry normal login)"
            if ($tenantId) {
                az login --tenant $tenantId
            }
            else {
                az login
            }
        }
    }
}

# Handle multiple subscriptions
$subscriptions = az account list --query "[].{Name:name, Id:id, IsDefault:isDefault}" --output table
Write-Host "Available Azure Subscriptions:" -ForegroundColor Blue
Write-Host $subscriptions

$currentSubscription = az account show --query "{Name:name, Id:id}" --output table
Write-Host "Currently selected subscription:" -ForegroundColor Green
Write-Host $currentSubscription

$changeSubscription = Read-Host "Do you want to change the subscription? (y/N)"
if ($changeSubscription -match "^[Yy]$") {
    $subscriptionId = Read-Host "Enter the Subscription ID you want to use"
    if ($subscriptionId) {
        Write-Host "Setting subscription to: $subscriptionId" -ForegroundColor Yellow
        az account set --subscription $subscriptionId
        Write-Host "Subscription changed successfully!" -ForegroundColor Green
    }
}

# Get user input if not provided as parameters
if (-not $ResourceGroupName) {
    $ResourceGroupName = Read-Host "Enter Resource Group name [edge-quality-eval-rg]"
    if (-not $ResourceGroupName) { $ResourceGroupName = "edge-quality-eval-rg" }
}

if (-not $AppName) {
    $defaultAppName = "browser-genai-eval"
    $AppName = Read-Host "Enter App Service name [$defaultAppName]"
    if (-not $AppName) { $AppName = $defaultAppName }
}

if (-not $Location) {
    $Location = Read-Host "Enter location [eastus]"
    if (-not $Location) { $Location = "eastus" }
}

if (-not $Sku) {
    $Sku = Read-Host "Enter SKU (F1=Free, B1=Basic, B2=Basic+, S1=Standard) [B2]"
    if (-not $Sku) { $Sku = "B2" }
}

if (-not $SecretKey) {
    $SecretKeySecure = Read-Host "Enter a secret key for Flask sessions" -AsSecureString
    $SecretKey = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecretKeySecure))
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
$rgExists = az group exists --name $ResourceGroupName
if ($rgExists -eq "true") {
    Write-Host "Resource group '$ResourceGroupName' already exists. Skipping creation." -ForegroundColor Cyan
}
else {
    az group create --name $ResourceGroupName --location $Location
}

Write-Host "Creating App Service Plan..." -ForegroundColor Yellow
$planExists = az appservice plan show --name "$AppName-plan" --resource-group $ResourceGroupName 2>$null
if ($planExists) {
    Write-Host "App Service Plan '$AppName-plan' already exists. Skipping creation." -ForegroundColor Cyan
}
else {
    az appservice plan create --name "$AppName-plan" --resource-group $ResourceGroupName --location $Location --sku $Sku --is-linux
}

Write-Host "Creating Web App..." -ForegroundColor Yellow
$webappExists = az webapp show --name $AppName --resource-group $ResourceGroupName 2>$null
if ($webappExists) {
    Write-Host "Web App '$AppName' already exists. Skipping creation." -ForegroundColor Cyan
}
else {
    $runtime = '"PYTHON|3.11"'
    az webapp create --name $AppName --resource-group $ResourceGroupName --plan "$AppName-plan" --runtime $runtime
}

Write-Host "Configuring app settings..." -ForegroundColor Yellow
az webapp config appsettings set --name $AppName --resource-group $ResourceGroupName --settings SECRET_KEY="$SecretKey" WEBSITE_TIME_ZONE="UTC" SCM_DO_BUILD_DURING_DEPLOYMENT="true" ENABLE_ORYX_BUILD="true"

Write-Host "Enabling HTTPS only..." -ForegroundColor Yellow
az webapp update --name $AppName --resource-group $ResourceGroupName --https-only true

Write-Host "Deploying application code..." -ForegroundColor Yellow
& az webapp up --name $AppName --resource-group $ResourceGroupName --location $Location --sku $Sku --runtime '"PYTHON|3.11"'

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
