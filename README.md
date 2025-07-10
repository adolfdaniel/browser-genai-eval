# Browser Summarization Quality Evaluation

A comprehensive system for evaluating the quality of browser-based text summarization using the Web Summarizer API and ROUGE metrics with support for multiple datasets and configuration options.

## Overview

This project creates a web-based evaluation platform that:
1. Uses the browser's native Summarizer API (Chrome/Edge)
2. Evaluates summarization quality using ROUGE metrics
3. Provides real-time progress tracking and results visualization
4. Supports multiple datasets with configurable selection
5. Offers both single and comprehensive multi-configuration evaluation modes
6. Features both classic and modern Material Design interfaces

## Features

- 🌐 **Web Interface**: Clean, responsive UI with real-time updates
- 🎨 **Dual UI Options**: Classic Bootstrap interface and modern Material Design interface
- 🔌 **WebSocket Communication**: Real-time bidirectional communication between browser and server
- 📊 **ROUGE Evaluation**: Comprehensive quality assessment using ROUGE-1, ROUGE-2, and ROUGE-L
- 📈 **Progress Tracking**: Live progress bars and status updates with model download monitoring
- 🗂️ **Multi-Dataset Support**: CNN/DailyMail, XSum, Reddit TIFU, Multi-News, and sample datasets
- ⚙️ **Configuration Management**: 36 summarizer configurations (4 types × 3 lengths × 2 formats)
- 🔄 **Evaluation Modes**: Single custom configuration or comprehensive all-configuration analysis
- 📁 **Data Export**: Export results to CSV for further analysis
- 🧪 **Browser API Testing**: Built-in summarizer API testing functionality
- 📝 **Enhanced Logging**: Comprehensive logging with collapsible input/output data sections
- 🌓 **Theme Support**: Light, dark, and auto theme switching
- 📊 **Configuration Analysis**: Visual comparison of configuration performance

## Prerequisites

- Python 3.8+
- Chrome or Edge browser with Summarizer API support
- Internet connection for initial dataset download

## Quick Start

### Windows (PowerShell)
```powershell
.\bootstrap.ps1
```

### Linux/macOS (Bash)
```bash
chmod +x bootstrap.sh
./bootstrap.sh
```

### Manual Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py
```

## Usage

1. **Start the server**: Navigate to the project directory and run `python app.py`
2. **Open browser**: Visit `http://localhost:5000` (classic UI) or `http://localhost:5000/material` (Material Design UI)
3. **Check API support**: The interface will automatically detect Summarizer API support
4. **Download model**: If needed, download the summarization model with real-time progress tracking
5. **Select dataset**: Choose from CNN/DailyMail, XSum, Reddit TIFU, Multi-News, or sample data
6. **Configure evaluation**: 
   - Set the number of articles to process (1-20)
   - Choose evaluation mode: Single configuration or All configurations (36 combinations)
   - For single mode: Select type, length, and format options
7. **Start evaluation**: Click "Start Evaluation" to begin the process
8. **Monitor progress**: Watch real-time progress updates and logs
9. **View results**: Review ROUGE scores, configuration analysis, and detailed metrics
10. **Export data**: Download results as CSV for further analysis

## Project Structure

```
edge-quality-eval/
├── app.py                 # Main Flask application with WebSocket support
├── config.py              # Configuration settings and dataset definitions
├── templates/
│   ├── index.html         # Classic Bootstrap web interface
│   └── index_material.html # Material Design web interface
├── static/
│   ├── css/
│   │   ├── main.css       # Classic interface styles
│   │   └── material.css   # Material Design styles
│   └── js/
│       ├── main.js        # Classic interface JavaScript logic
│       └── material.js    # Material Design JavaScript logic
├── requirements.txt       # Python dependencies
├── bootstrap.ps1          # Windows setup script
├── bootstrap.sh           # Linux/macOS setup script
├── start.ps1              # Windows quick start script
├── start.sh               # Linux/macOS quick start script
├── test_setup.py          # Setup verification script
├── test_browser_compatibility.html  # Browser API testing page
├── results/              # Generated results directory
├── DESIGN.md             # System architecture and communication design document
└── README.md             # This file
```

## Architecture & Design

For detailed information about the system architecture, client-server communication patterns, data structures, and technical implementation details, see the [**Design Document**](DESIGN.md).

The design document covers:
- 🏗️ **System Architecture**: Component relationships and data flow
- 🔄 **Communication Protocols**: WebSocket and HTTP API documentation  
- 📊 **Message Formats**: Complete data structure specifications
- ⚡ **Performance Considerations**: Optimization strategies and bottlenecks
- 🛡️ **Security & Error Handling**: Robust failure management
- 🚀 **Future Enhancements**: Scalability and feature roadmap

## Technical Details

### Backend Components
- **Flask**: Web framework for serving the application
- **Flask-SocketIO**: WebSocket support for real-time communication
- **Datasets**: Hugging Face datasets library for loading multiple evaluation datasets
- **Evaluate**: Evaluation metrics and tools
- **ROUGE**: Text summarization evaluation metrics

### Frontend Components
- **Socket.IO**: Real-time bidirectional communication
- **Bootstrap 5.3**: Responsive UI framework for classic interface
- **Material Design Components**: Modern Material Design interface
- **Native Summarizer API**: Browser-based text summarization

### Datasets
- **CNN/DailyMail**: News article summarization dataset
- **XSum**: BBC articles with abstractive summaries
- **Reddit TIFU**: Reddit "Today I F***ed Up" posts
- **Multi-News**: Multi-document summarization dataset
- **Sample**: Built-in sample articles for testing

### Summarizer Configurations
- **Types**: TL;DR, Key Points, Teaser, Headline (4 options)
- **Lengths**: Short, Medium, Long (3 options)
- **Formats**: Plain Text, Markdown (2 options)
- **Total**: 36 possible combinations (4 × 3 × 2)

### Data Flow
1. Server loads selected dataset (CNN/DailyMail, XSum, Reddit TIFU, Multi-News, or sample)
2. Server sends article text to browser via WebSocket
3. Browser uses Summarizer API to generate summary with specified configuration
4. Browser sends summary back to server with configuration details
5. Server calculates ROUGE scores against reference summary
6. Results are stored, analyzed, and displayed in real-time
7. Configuration performance is tracked and visualized

## Browser Support

This project supports both current and legacy implementations of the Summarizer API:

### Current API (Recommended)
- **Global Summarizer API**: Access via `Summarizer.create()`
- **Chrome/Edge**: Version 130+ with experimental features enabled
- **Features**: Full configuration support, download progress monitoring
- **API Reference**: [MDN Summarizer API](https://developer.mozilla.org/en-US/docs/Web/API/Summarizer)

### Legacy API (Fallback)
- **window.ai.summarizer**: Access via `window.ai.summarizer.create()`
- **Chrome/Edge**: Version 127-129 with experimental features enabled
- **Note**: Limited configuration options compared to current API

### Enabling Summarizer API

#### Method 1: Chrome/Edge Flags
1. Navigate to `chrome://flags/` or `edge://flags/`
2. Search for "Summarization API" or "Built-in AI APIs"
3. Enable the experimental feature
4. Restart the browser

#### Method 2: Command Line Flags
Start Chrome/Edge with:
```bash
# Chrome
chrome --enable-features=Summarization

# Edge  
msedge --enable-features=Summarization
```

### Testing Browser Compatibility
Open `test_browser_compatibility.html` in your browser to run comprehensive API detection and functionality tests.

## Configuration

### Dataset Configuration
- **Available Datasets**: CNN/DailyMail, XSum, Reddit TIFU, Multi-News, Sample
- **Article length limit**: 4000 characters (automatically filtered)
- **Maximum articles**: Configurable (1-20 for optimal performance)
- **Automatic fallback**: Sample articles if dataset loading fails

### Evaluation Modes
- **Single Configuration**: Test one specific combination of type, length, and format
- **All Configurations**: Comprehensive evaluation of all 36 possible combinations
- **Real-time Analysis**: Live configuration performance comparison

### Summarizer Options
- **Types**: tldr, key-points, teaser, headline
- **Lengths**: short, medium, long
- **Formats**: plain-text, markdown
- **Configurations**: Underscore-separated format (e.g., "tldr_short_plain-text")

### Evaluation Metrics
- **ROUGE-1**: Unigram overlap
- **ROUGE-2**: Bigram overlap  
- **ROUGE-L**: Longest common subsequence

## Results and Analytics

The system provides:
- **Real-time progress tracking** with model download monitoring
- **Individual article results** with configuration details
- **Average ROUGE scores** across all articles and configurations
- **Configuration performance analysis** with visual comparisons
- **Best configuration identification** based on ROUGE scores
- **Detailed logging** with collapsible input/output data sections
- **CSV export functionality** with comprehensive result data
- **Article length statistics** and compression ratios
- **Theme-aware visualizations** supporting light and dark modes

## Troubleshooting

### Common Issues

1. **"Summarizer API is not supported in this browser"**
   - Ensure you're using Chrome/Edge 130+ (or 127+ for legacy API)
   - Enable experimental features in browser flags
   - Try the browser compatibility test: `test_browser_compatibility.html`
   - Check console for specific error messages

2. **"Summarizer.availability() returns available but create() fails"**
   - API may need time to download required models
   - Use the download model button with progress tracking
   - Try waiting a few minutes and testing again
   - Check your internet connection
   - Try different summarizer configuration options

3. **Dataset loading fails**
   - Check internet connection for HuggingFace dataset downloads
   - Verify sufficient disk space for dataset caching
   - System automatically falls back to sample articles
   - Try selecting a different dataset from the dropdown

4. **WebSocket connection issues**
   - Check firewall settings
   - Ensure port 5000 is available
   - Try refreshing the browser
   - Check browser console for connection errors

5. **Configuration parsing errors**
   - Ensure underscore-separated format: "type_length_format"
   - Avoid using "plain-text" separator conflicts
   - Verify valid configuration combinations

6. **Material Design interface issues**
   - Ensure modern browser with full CSS support
   - Check for JavaScript errors in console
   - Fall back to classic interface at main URL

### Debug Mode
Run with debug enabled:
```bash
python app.py
# Debug mode is enabled by default in development
```

### Browser Console Debugging
Press F12 to open browser developer tools and check the console for detailed error messages and API detection logs.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Hugging Face for the datasets library
- Google/Microsoft for the Summarizer API
- Flask and Socket.IO communities
- ROUGE evaluation methodology researchers
