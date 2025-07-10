#!/bin/bash

# Azure App Service deployment script for Edge Quality Evaluation
# This script automates the deployment process to Azure

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Azure App Service Deployment Script ===${NC}"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is not installed.${NC}"
    echo "Please install Azure CLI from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if user is logged in
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}You are not logged in to Azure. Please log in first.${NC}"
    az login
fi

# Default values
RESOURCE_GROUP_NAME="edge-quality-eval-rg"
APP_NAME="edge-quality-eval-$(date +%s)"
LOCATION="eastus"
SKU="F1"

# Get user input
read -p "Enter Resource Group name [${RESOURCE_GROUP_NAME}]: " input_rg
RESOURCE_GROUP_NAME=${input_rg:-$RESOURCE_GROUP_NAME}

read -p "Enter App Service name [${APP_NAME}]: " input_app
APP_NAME=${input_app:-$APP_NAME}

read -p "Enter location [${LOCATION}]: " input_location
LOCATION=${input_location:-$LOCATION}

read -p "Enter SKU (F1=Free, B1=Basic, S1=Standard) [${SKU}]: " input_sku
SKU=${input_sku:-$SKU}

read -s -p "Enter a secret key for Flask sessions: " SECRET_KEY
echo

if [ -z "$SECRET_KEY" ]; then
    echo -e "${RED}Error: Secret key cannot be empty${NC}"
    exit 1
fi

echo -e "${BLUE}Deployment Configuration:${NC}"
echo "Resource Group: $RESOURCE_GROUP_NAME"
echo "App Name: $APP_NAME"
echo "Location: $LOCATION"
echo "SKU: $SKU"
echo

read -p "Continue with deployment? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo -e "${YELLOW}Creating resource group...${NC}"
az group create --name $RESOURCE_GROUP_NAME --location $LOCATION

echo -e "${YELLOW}Creating App Service Plan...${NC}"
az appservice plan create \
    --name "${APP_NAME}-plan" \
    --resource-group $RESOURCE_GROUP_NAME \
    --location $LOCATION \
    --sku $SKU \
    --is-linux

echo -e "${YELLOW}Creating Web App...${NC}"
az webapp create \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --plan "${APP_NAME}-plan" \
    --runtime "PYTHON|3.11"

echo -e "${YELLOW}Configuring app settings...${NC}"
az webapp config appsettings set \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --settings \
        SECRET_KEY="$SECRET_KEY" \
        WEBSITE_TIME_ZONE="UTC" \
        SCM_DO_BUILD_DURING_DEPLOYMENT="true" \
        ENABLE_ORYX_BUILD="true"

echo -e "${YELLOW}Enabling HTTPS only...${NC}"
az webapp update \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --https-only true

echo -e "${YELLOW}Deploying application code...${NC}"
az webapp up \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --location $LOCATION \
    --sku $SKU \
    --runtime "PYTHON|3.11"

APP_URL="https://${APP_NAME}.azurewebsites.net"

echo -e "${GREEN}=== Deployment Complete! ===${NC}"
echo -e "${GREEN}Your application is available at: ${APP_URL}${NC}"
echo
echo -e "${BLUE}Management Commands:${NC}"
echo "View logs: az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP_NAME"
echo "Stop app:  az webapp stop --name $APP_NAME --resource-group $RESOURCE_GROUP_NAME"
echo "Start app: az webapp start --name $APP_NAME --resource-group $RESOURCE_GROUP_NAME"
echo "Delete:    az group delete --name $RESOURCE_GROUP_NAME --yes --no-wait"
echo
echo -e "${YELLOW}Note: It may take a few minutes for the application to start up completely.${NC}"
