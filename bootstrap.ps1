#!/usr/bin/env pwsh

# Bootstrap script for Windows (PowerShell)
Write-Host "🚀 Starting Browser Summarization Quality Evaluation Setup" -ForegroundColor Green

# Check if Python is installed
Write-Host "📦 Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
    } else {
        throw "Python not found"
    }
} catch {
    Write-Host "❌ Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python from https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# Check if virtual environment exists
Write-Host "🔧 Setting up virtual environment..." -ForegroundColor Yellow
if (Test-Path ".\venv") {
    Write-Host "✅ Virtual environment already exists" -ForegroundColor Green
} else {
    Write-Host "Creating virtual environment..." -ForegroundColor Cyan
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create virtual environment" -ForegroundColor Red
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
pip install --upgrade pip
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
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
    python app.py
} else {
    Write-Host "💡 To start the server later:" -ForegroundColor Cyan
    Write-Host "  1. Activate virtual environment: .\venv\Scripts\Activate.ps1" -ForegroundColor White
    Write-Host "  2. Run server: python app.py" -ForegroundColor White
    Write-Host "  3. Open browser: http://localhost:5000" -ForegroundColor White
}
