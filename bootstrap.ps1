#!/usr/bin/env pwsh

# Bootstrap script for Windows (PowerShell)
Write-Host "🚀 Starting Browser Summarization Quality Evaluation Setup" -ForegroundColor Green

# Check if Python is installed
Write-Host "📦 Checking Python installation..." -ForegroundColor Yellow
$pythonCommand = $null
$pythonVersion = $null

# Try different Python commands
$pythonCommands = @("python", "python3", "py")
foreach ($cmd in $pythonCommands) {
    try {
        $version = & $cmd --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $pythonCommand = $cmd
            $pythonVersion = $version
            break
        }
    } catch {
        # Continue to next command
    }
}

if ($pythonCommand) {
    Write-Host "✅ Python found: $pythonVersion (using '$pythonCommand')" -ForegroundColor Green
    
    # Check Python version compatibility
    $versionString = $pythonVersion -replace "Python ", ""
    $versionParts = $versionString.Split(".")
    $majorVersion = [int]$versionParts[0]
    $minorVersion = [int]$versionParts[1]
    
    if ($majorVersion -lt 3 -or ($majorVersion -eq 3 -and $minorVersion -lt 8)) {
        Write-Host "⚠️  Warning: Python 3.8+ is recommended for best compatibility" -ForegroundColor Yellow
        Write-Host "   Current version: $pythonVersion" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.8+ from https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# Check if virtual environment exists
Write-Host "🔧 Setting up virtual environment..." -ForegroundColor Yellow
if (Test-Path ".\venv") {
    Write-Host "✅ Virtual environment already exists" -ForegroundColor Green
} else {
    Write-Host "Creating virtual environment..." -ForegroundColor Cyan
    & $pythonCommand -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create virtual environment" -ForegroundColor Red
        Write-Host "💡 Try using a different Python command" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Virtual environment created" -ForegroundColor Green
}

# Activate virtual environment
Write-Host "🔌 Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to activate virtual environment" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Virtual environment activated" -ForegroundColor Green

# Install dependencies
Write-Host "📥 Installing Python dependencies..." -ForegroundColor Yellow
Write-Host "   Upgrading pip and essential build tools..." -ForegroundColor Cyan
pip install --upgrade pip setuptools wheel
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Warning: Failed to upgrade pip/setuptools, continuing anyway..." -ForegroundColor Yellow
}

Write-Host "   Installing project dependencies..." -ForegroundColor Cyan
Write-Host "   This may take a few minutes for first-time installation..." -ForegroundColor Cyan

# Try installing with more lenient approach first
pip install --upgrade-strategy eager -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  First attempt failed, trying alternative approach..." -ForegroundColor Yellow
    
    # Try installing packages individually with more flexibility
    Write-Host "   Installing core packages individually..." -ForegroundColor Cyan
    pip install "flask>=2.3.0,<3.0.0" "flask-socketio>=5.3.0" "websockets>=11.0.0"
    pip install "pandas>=2.0.0" "numpy>=1.26.0" "requests>=2.31.0"
    pip install "datasets>=2.14.0" "evaluate>=0.4.0" "rouge-score>=0.1.0"
    pip install "transformers>=4.30.0" "python-socketio>=5.9.0" "eventlet>=0.33.0"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        Write-Host "" -ForegroundColor White
        Write-Host "🔧 Troubleshooting steps:" -ForegroundColor Yellow
        Write-Host "   1. Your Python version: $pythonVersion" -ForegroundColor White
        Write-Host "   2. Try installing Microsoft C++ Build Tools if on Windows" -ForegroundColor White
        Write-Host "   3. Try using Python 3.9-3.11 if issues persist" -ForegroundColor White
        Write-Host "   4. Try installing with --no-build-isolation flag" -ForegroundColor White
        Write-Host "   5. Consider using conda instead of pip" -ForegroundColor White
        Write-Host "" -ForegroundColor White
        exit 1
    }
}
Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green

# Create results directory
Write-Host "📁 Creating results directory..." -ForegroundColor Yellow
if (-not (Test-Path ".\results")) {
    New-Item -ItemType Directory -Path ".\results"
    Write-Host "✅ Results directory created" -ForegroundColor Green
} else {
    Write-Host "✅ Results directory already exists" -ForegroundColor Green
}

Write-Host "" -ForegroundColor White
Write-Host "🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Test browser compatibility: Open test_browser_compatibility.html" -ForegroundColor White
Write-Host "  2. Open Chrome or Edge browser (version 130+ recommended)" -ForegroundColor White
Write-Host "  3. Run: python app.py" -ForegroundColor White
Write-Host "  4. Navigate to: http://localhost:5000" -ForegroundColor White
Write-Host "  5. Start the evaluation from the web interface" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "⚠️  Note: This project requires Chrome/Edge with Summarizer API support" -ForegroundColor Yellow
Write-Host "   Enable experimental features in chrome://flags/ or edge://flags/" -ForegroundColor Yellow
Write-Host "   Search for 'Summarization API' or 'Built-in AI APIs'" -ForegroundColor Yellow
Write-Host "" -ForegroundColor White

# Ask if user wants to start the server
$response = Read-Host "Would you like to start the server now? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host "🚀 Starting the server..." -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    & $pythonCommand app.py
} else {
    Write-Host "💡 To start the server later:" -ForegroundColor Cyan
    Write-Host "  1. Activate virtual environment: .\venv\Scripts\Activate.ps1" -ForegroundColor White
    Write-Host "  2. Run server: $pythonCommand app.py" -ForegroundColor White
    Write-Host "  3. Open browser: http://localhost:5000" -ForegroundColor White
}
