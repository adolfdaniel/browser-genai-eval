#!/usr/bin/env pwsh

# Quick start script for Browser Summarization Quality Evaluation
Write-Host "🚀 Browser Summarization Quality Evaluation - Quick Start" -ForegroundColor Green

# Check if virtual environment exists
if (-not (Test-Path ".\venv")) {
    Write-Host "❌ Virtual environment not found. Please run bootstrap.ps1 first." -ForegroundColor Red
    exit 1
}

# Activate virtual environment
Write-Host "🔌 Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Check if server is already running on port 5000
try {
    $result = Test-NetConnection -ComputerName localhost -Port 5000 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($result) {
        Write-Host "⚠️  Port 5000 is already in use. Another server might be running." -ForegroundColor Yellow
        $response = Read-Host "Continue anyway? (y/n)"
        if ($response -ne 'y' -and $response -ne 'Y') {
            exit 1
        }
    }
} catch {
    # Port check failed, but that's OK - probably means nothing is running
}

Write-Host "🌐 Starting server on http://localhost:5000" -ForegroundColor Green
Write-Host "📝 Check the browser console for Summarizer API status" -ForegroundColor Cyan
Write-Host "⏹️  Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the application
python app.py
