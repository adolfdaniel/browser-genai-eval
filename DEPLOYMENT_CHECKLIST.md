# Azure Deployment Checklist

## Pre-Deployment Checklist

### ✅ Azure Prerequisites
- [ ] Azure subscription is active
- [ ] Azure CLI is installed and updated
- [ ] Logged into Azure CLI (`az login`)
- [ ] Sufficient Azure credits/budget available

### ✅ Application Readiness
- [ ] Application works correctly in local environment
- [ ] All dependencies are listed in `requirements.txt`
- [ ] Configuration files are properly set up
- [ ] Secret key is generated (strong, random string)
- [ ] Application handles production environment variables

### ✅ Deployment Files Created
- [ ] `startup.py` - Azure App Service entry point
- [ ] `config_production.py` - Production configuration
- [ ] `Procfile` - Process file for deployment
- [ ] `.deployment` - Azure deployment config
- [ ] `azure.toml` - Azure build configuration
- [ ] `deploy-azure.ps1` / `deploy-azure.sh` - Deployment scripts

## Deployment Steps

### Option 1: Automated Deployment Script

#### Windows PowerShell:
```powershell
# Navigate to project directory
cd d:\edge-quality-eval

# Run deployment script
.\deploy-azure.ps1
```

#### Linux/macOS Bash:
```bash
# Navigate to project directory
cd /path/to/edge-quality-eval

# Make script executable
chmod +x deploy-azure.sh

# Run deployment script
./deploy-azure.sh
```

### Option 2: Manual Deployment
Follow the steps in `AZURE_DEPLOYMENT.md`

### Option 3: GitHub Actions
1. Push code to GitHub repository
2. Set up publish profile secret
3. Trigger workflow from GitHub Actions

## Post-Deployment Checklist

### ✅ Verify Deployment
- [ ] Application URL is accessible
- [ ] Homepage loads correctly
- [ ] All static files (CSS, JS) are loading
- [ ] SocketIO connections work
- [ ] Summarizer API detection works
- [ ] Sample articles load properly

### ✅ Test Core Functionality
- [ ] Can start evaluation with sample dataset
- [ ] Progress updates work correctly
- [ ] Results are displayed properly
- [ ] Export functionality works
- [ ] Tooltips and accessibility features work
- [ ] Copy-to-clipboard functionality works

### ✅ Monitor Performance
- [ ] Check application logs for errors
- [ ] Monitor memory usage
- [ ] Monitor response times
- [ ] Verify HTTPS is working

### ✅ Security Verification
- [ ] Application uses HTTPS only
- [ ] Secret key is properly set
- [ ] No sensitive data exposed in logs
- [ ] Environment variables are secure

## Application URLs and Resources

After deployment, you'll have:

- **Application URL**: `https://YOUR_APP_NAME.azurewebsites.net`
- **Resource Group**: Contains all Azure resources
- **App Service**: The main web application
- **App Service Plan**: Defines compute resources

## Management Commands

### View Live Logs
```bash
az webapp log tail --name YOUR_APP_NAME --resource-group edge-quality-eval-rg
```

### Restart Application
```bash
az webapp restart --name YOUR_APP_NAME --resource-group edge-quality-eval-rg
```

### Update Application Settings
```bash
az webapp config appsettings set \
    --name YOUR_APP_NAME \
    --resource-group edge-quality-eval-rg \
    --settings KEY="VALUE"
```

### Scale Application
```bash
# Upgrade to Basic tier
az appservice plan update \
    --name YOUR_APP_NAME-plan \
    --resource-group edge-quality-eval-rg \
    --sku B1
```

## Cost Management

### Free Tier (F1)
- **Cost**: Free
- **Limitations**: 60 CPU minutes/day, 1GB storage
- **Best for**: Testing, demos, low-traffic applications

### Basic Tier (B1)
- **Cost**: ~$13/month
- **Benefits**: No CPU limitations, 10GB storage, custom domains
- **Best for**: Production applications, regular use

### Monitoring Costs
- Check Azure portal billing section
- Set up billing alerts
- Use Azure Cost Management tools

## Troubleshooting

### Common Issues and Solutions

1. **502 Bad Gateway**
   - Check startup.py configuration
   - Verify SECRET_KEY is set
   - Review application logs

2. **Application won't start**
   - Check Python version (should be 3.11)
   - Verify requirements.txt
   - Check for missing dependencies

3. **Static files not loading**
   - Verify static folder structure
   - Check Flask static_folder configuration
   - Ensure files are included in deployment

4. **SocketIO not working**
   - Check CORS configuration
   - Verify WebSocket support
   - Test with different browsers

5. **Memory issues**
   - Upgrade to Basic tier (B1)
   - Optimize application memory usage
   - Reduce MAX_ARTICLES in production config

## Getting Support

### Microsoft Azure Support
- Azure Portal Help + Support
- Azure documentation
- Azure community forums

### Application-Specific Issues
- Check application logs first
- Review deployment configuration
- Test locally with production config

## Cleanup (When No Longer Needed)

### Delete All Resources
```bash
az group delete --name edge-quality-eval-rg --yes --no-wait
```

**Warning**: This permanently deletes all resources and cannot be undone.

## Next Steps After Deployment

1. **Custom Domain**: Set up a custom domain name
2. **SSL Certificate**: Configure SSL for custom domain
3. **Monitoring**: Set up Application Insights
4. **Backup**: Configure backup policies
5. **Scaling**: Set up auto-scaling rules
6. **CI/CD**: Implement continuous deployment

## Success Criteria

Your deployment is successful when:
- ✅ Application loads at Azure URL
- ✅ All functionality works correctly
- ✅ No errors in application logs
- ✅ Performance is acceptable
- ✅ Security requirements are met

## Deployment Status

- [ ] Pre-deployment checks completed
- [ ] Deployment method selected
- [ ] Azure resources created
- [ ] Application deployed
- [ ] Post-deployment testing completed
- [ ] Production monitoring enabled
