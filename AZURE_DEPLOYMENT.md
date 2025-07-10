# Azure Deployment Guide

This guide will help you deploy the Edge Quality Evaluation application to Azure App Service.

## Prerequisites

1. **Azure Account**: You need an active Azure subscription
2. **Azure CLI**: Install from [here](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
3. **Git**: For version control and GitHub Actions (optional)

## Deployment Options

### Option 1: Automated Script Deployment (Recommended)

#### For Windows (PowerShell):
```powershell
# Run from the project root directory
.\deploy-azure.ps1
```

#### For Linux/macOS (Bash):
```bash
# Make script executable
chmod +x deploy-azure.sh

# Run the script
./deploy-azure.sh
```

The script will:
- Prompt you for configuration details
- Create Azure resources
- Deploy your application
- Provide the application URL

### Option 2: Manual Azure CLI Deployment

#### Step 1: Login to Azure
```bash
az login
```

#### Step 2: Create Resource Group
```bash
az group create --name edge-quality-eval-rg --location eastus
```

#### Step 3: Create App Service Plan
```bash
az appservice plan create \
    --name edge-quality-eval-plan \
    --resource-group edge-quality-eval-rg \
    --location eastus \
    --sku F1 \
    --is-linux
```

#### Step 4: Create Web App
```bash
az webapp create \
    --name edge-quality-eval-$(date +%s) \
    --resource-group edge-quality-eval-rg \
    --plan edge-quality-eval-plan \
    --runtime "PYTHON|3.11"
```

#### Step 5: Configure App Settings
```bash
az webapp config appsettings set \
    --name YOUR_APP_NAME \
    --resource-group edge-quality-eval-rg \
    --settings \
        SECRET_KEY="your-secure-secret-key" \
        WEBSITE_TIME_ZONE="UTC" \
        SCM_DO_BUILD_DURING_DEPLOYMENT="true" \
        ENABLE_ORYX_BUILD="true"
```

#### Step 6: Deploy Code
```bash
az webapp up \
    --name YOUR_APP_NAME \
    --resource-group edge-quality-eval-rg \
    --location eastus \
    --sku F1 \
    --runtime "PYTHON|3.11"
```

### Option 3: GitHub Actions CI/CD

#### Step 1: Fork or Clone Repository
Make sure your code is in a GitHub repository.

#### Step 2: Create Azure App Service
Use either the script or manual method above to create the App Service.

#### Step 3: Get Publish Profile
```bash
az webapp deployment list-publishing-profiles \
    --name YOUR_APP_NAME \
    --resource-group edge-quality-eval-rg \
    --xml
```

#### Step 4: Add GitHub Secret
1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Create a new secret named `AZUREAPPSERVICE_PUBLISHPROFILE`
4. Paste the XML content from step 3

#### Step 5: Update Workflow
Edit `.github/workflows/azure-deploy.yml` and update:
```yaml
env:
  AZURE_WEBAPP_NAME: YOUR_APP_NAME    # Your actual app name
```

#### Step 6: Push to Main Branch
The workflow will automatically deploy when you push to the main branch.

## Configuration

### Environment Variables
The following environment variables are automatically set in production:

- `WEBSITE_SITE_NAME`: Azure sets this automatically
- `SECRET_KEY`: Set during deployment
- `PORT`: Azure sets this automatically

### Production vs Development
The application automatically detects Azure environment and uses `config_production.py`:

- Reduced resource limits for free tier
- Uses sample dataset by default
- Disabled debug mode
- Optimized for cloud deployment

## Monitoring and Management

### View Application Logs
```bash
az webapp log tail --name YOUR_APP_NAME --resource-group edge-quality-eval-rg
```

### Stream Live Logs
```bash
az webapp log config --name YOUR_APP_NAME --resource-group edge-quality-eval-rg --web-server-logging filesystem
```

### Restart Application
```bash
az webapp restart --name YOUR_APP_NAME --resource-group edge-quality-eval-rg
```

### Stop Application
```bash
az webapp stop --name YOUR_APP_NAME --resource-group edge-quality-eval-rg
```

### Start Application
```bash
az webapp start --name YOUR_APP_NAME --resource-group edge-quality-eval-rg
```

## Scaling Options

### Upgrade to Paid Tier
```bash
az appservice plan update \
    --name edge-quality-eval-plan \
    --resource-group edge-quality-eval-rg \
    --sku B1
```

### Scale Out (Multiple Instances)
```bash
az appservice plan update \
    --name edge-quality-eval-plan \
    --resource-group edge-quality-eval-rg \
    --number-of-workers 2
```

## Cost Optimization

### Free Tier Limitations
- 60 CPU minutes per day
- 1 GB storage
- Custom domain not supported
- Always On not available

### Basic Tier Benefits (B1)
- No CPU time limitations
- 10 GB storage
- Custom domains supported
- SSL certificates
- Always On feature

## Troubleshooting

### Common Issues

1. **Application won't start**
   - Check logs: `az webapp log tail`
   - Verify Python version: Should be 3.11
   - Check requirements.txt compatibility

2. **502 Bad Gateway**
   - Usually indicates startup failure
   - Check startup.py file
   - Verify SECRET_KEY is set

3. **High memory usage**
   - Consider upgrading to B1 tier
   - Reduce MAX_ARTICLES in production config

4. **Slow performance**
   - Enable "Always On" (requires Basic tier or higher)
   - Consider upgrading SKU

### Getting Help
- Check Azure portal for detailed error messages
- Use Application Insights for advanced monitoring
- Review deployment logs in Azure portal

## Security Considerations

1. **Secret Key**: Always use a strong, unique secret key
2. **HTTPS**: Application is configured for HTTPS only
3. **Environment Variables**: Sensitive data stored as app settings
4. **Dependencies**: Keep requirements.txt updated

## Cleanup

### Delete All Resources
```bash
az group delete --name edge-quality-eval-rg --yes --no-wait
```

This will delete the entire resource group and all associated resources.

## Next Steps

1. **Custom Domain**: Configure a custom domain name
2. **SSL Certificate**: Add SSL certificate for custom domain
3. **Application Insights**: Add monitoring and analytics
4. **Azure Storage**: Use Azure Blob Storage for file uploads
5. **Azure Database**: Integrate with Azure Database for persistent storage
