#!/bin/bash

# Bootstrap script for Unix-like systems (Linux/macOS)
echo "🚀 Starting Browser Summarization Quality Evaluation Setup"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
WHITE='\033[0;37m'
NC='\033[0m' # No Color

# Check if Python is installed
echo -e "${YELLOW}📦 Checking Python installation...${NC}"
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✅ Python found: $PYTHON_VERSION${NC}"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
    PYTHON_VERSION=$(python --version)
    echo -e "${GREEN}✅ Python found: $PYTHON_VERSION${NC}"
else
    echo -e "${RED}❌ Python is not installed or not in PATH${NC}"
    echo -e "${YELLOW}Please install Python from https://www.python.org/downloads/${NC}"
    exit 1
fi

# Check if virtual environment exists
echo -e "${YELLOW}🔧 Setting up virtual environment...${NC}"
if [ -d "venv" ]; then
    echo -e "${GREEN}✅ Virtual environment already exists${NC}"
else
    echo -e "${CYAN}Creating virtual environment...${NC}"
    $PYTHON_CMD -m venv venv
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to create virtual environment${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Virtual environment created${NC}"
fi

# Activate virtual environment
echo -e "${YELLOW}🔌 Activating virtual environment...${NC}"
source venv/bin/activate
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to activate virtual environment${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Virtual environment activated${NC}"

# Install dependencies
echo -e "${YELLOW}📥 Installing Python dependencies...${NC}"
pip install --upgrade pip
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependencies installed successfully${NC}"

# Create results directory
echo -e "${YELLOW}📁 Creating results directory...${NC}"
if [ ! -d "results" ]; then
    mkdir results
    echo -e "${GREEN}✅ Results directory created${NC}"
else
    echo -e "${GREEN}✅ Results directory already exists${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo ""
echo -e "${CYAN}📋 Next steps:${NC}"
echo -e "${WHITE}  1. Test browser compatibility: Open test_browser_compatibility.html${NC}"
echo -e "${WHITE}  2. Open Chrome or Edge browser (version 130+ recommended)${NC}"
echo -e "${WHITE}  3. Run: python app.py${NC}"
echo -e "${WHITE}  4. Navigate to: http://localhost:5000${NC}"
echo -e "${WHITE}  5. Start the evaluation from the web interface${NC}"
echo ""
echo -e "${YELLOW}⚠️  Note: This project requires Chrome/Edge with Summarizer API support${NC}"
echo -e "${YELLOW}   Enable experimental features in chrome://flags/ or edge://flags/${NC}"
echo -e "${YELLOW}   Search for 'Summarization API' or 'Built-in AI APIs'${NC}"
echo ""

# Ask if user wants to start the server
read -p "Would you like to start the server now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}🚀 Starting the server...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
    $PYTHON_CMD app.py
else
    echo -e "${CYAN}💡 To start the server later:${NC}"
    echo -e "${WHITE}  1. Activate virtual environment: source venv/bin/activate${NC}"
    echo -e "${WHITE}  2. Run server: python app.py${NC}"
    echo -e "${WHITE}  3. Open browser: http://localhost:5000${NC}"
fi
