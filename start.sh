#!/bin/bash

# Quick start script for Browser Summarization Quality Evaluation
echo "🚀 Browser Summarization Quality Evaluation - Quick Start"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${RED}❌ Virtual environment not found. Please run bootstrap.sh first.${NC}"
    exit 1
fi

# Activate virtual environment
echo -e "${YELLOW}🔌 Activating virtual environment...${NC}"
source venv/bin/activate

# Check Python command
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo -e "${RED}❌ Python not found${NC}"
    exit 1
fi

# Check if port 5000 is in use
if command -v lsof &> /dev/null; then
    if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null; then
        echo -e "${YELLOW}⚠️  Port 5000 is already in use. Another server might be running.${NC}"
        read -p "Continue anyway? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

echo -e "${GREEN}🌐 Starting server on http://localhost:5000${NC}"
echo -e "${CYAN}📝 Check the browser console for Summarizer API status${NC}"
echo -e "${YELLOW}⏹️  Press Ctrl+C to stop the server${NC}"
echo

# Start the application
$PYTHON_CMD app.py
