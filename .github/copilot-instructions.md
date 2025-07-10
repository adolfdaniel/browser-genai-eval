# GitHub Copilot Instructions for Edge Quality Evaluation

## Project Overview

This is a **Browser Summarization Quality Evaluation** application built with Flask and Socket.IO that evaluates the quality of browser-based AI summarization APIs using ROUGE metrics. The application provides a web interface for testing different summarization configurations and comparing their performance.

## Architecture & Technology Stack

### Backend
- **Framework**: Flask with Socket.IO for real-time communication
- **Language**: Python 3.11
- **Key Libraries**: 
  - `flask-socketio` - Real-time WebSocket communication
  - `rouge-score` - ROUGE metric evaluation
  - `datasets` - HuggingFace datasets integration
  - `pandas` - Data manipulation
  - `evaluate` - ML evaluation metrics

### Frontend
- **UI Framework**: Material Design Components (MDC) with Bootstrap 5
- **JavaScript**: Vanilla JS with Socket.IO client
- **Styling**: Custom CSS with Material Design theming
- **Icons**: Material Icons

### Browser Integration
- **Summarizer API**: Uses the browser's built-in Summarizer API (Chrome's experimental feature)
- **Real-time Processing**: Articles are sent to browser for summarization via WebSocket

## Project Structure

```
edge-quality-eval/
├── app.py                      # Main Flask application
├── config.py                   # Development configuration
├── config_production.py        # Production configuration for Azure
├── startup.py                  # Azure App Service entry point
├── requirements.txt            # Python dependencies
├── static/
│   ├── css/
│   │   └── material.css       # Custom Material Design styles
│   └── js/
│       └── material.js        # Frontend JavaScript with Socket.IO
├── templates/
│   └── index_material.html    # Main application template
├── azure/                     # Azure deployment templates
├── .github/
│   └── workflows/
│       └── azure-deploy.yml   # CI/CD pipeline
└── results/                   # Evaluation results storage
```

## Key Features & Functionality

### Core Features
1. **Multi-Dataset Support**: CNN/DailyMail, XSum, Reddit TIFU, Multi-News, Sample articles
2. **Configuration Testing**: Multiple summarization types (tl;dr, key-points, teaser, headline)
3. **Real-time Evaluation**: Live progress updates via Socket.IO
4. **ROUGE Scoring**: Automatic quality evaluation using ROUGE-1, ROUGE-2, ROUGE-L
5. **Results Export**: CSV export functionality
6. **Responsive UI**: Material Design with dark/light theme support

### Browser API Integration
- **Summarizer Detection**: Checks browser support for Summarizer API
- **Model Download**: Handles AI model download with progress tracking
- **Configuration Options**: Supports different summarization formats and lengths
- **Error Handling**: Graceful fallback for unsupported browsers

## Configuration Management

### Development vs Production
- **Development**: Uses `config.py` with debug mode and full dataset access
- **Production**: Uses `config_production.py` with optimized settings for Azure App Service
- **Auto-detection**: Application automatically detects Azure environment via `WEBSITE_SITE_NAME`

### Key Configuration Areas
- **Dataset limits**: Configurable max articles (dev: 50, prod: 25)
- **Timeout settings**: Browser API timeout handling
- **Resource paths**: Temporary directories for Azure
- **Security**: Environment-based secret key management

## Development Guidelines

### Code Style & Patterns
- **Backend**: Follow Flask best practices with blueprint organization
- **Frontend**: Use Material Design Components consistently
- **Error Handling**: Comprehensive try-catch blocks with user-friendly messages
- **Logging**: Structured logging with appropriate levels
- **Real-time Updates**: Use Socket.IO events for progress and status updates

### Key Patterns Used
1. **Configuration Factory**: Environment-based config loading
2. **Event-Driven Architecture**: Socket.IO for real-time communication
3. **Progressive Enhancement**: Graceful degradation for browser API features
4. **Responsive Design**: Mobile-first approach with Material Design
5. **Error Boundaries**: Comprehensive error handling at multiple layers

### JavaScript Architecture
- **Module Pattern**: Organized into logical function groups
- **Event Handling**: Centralized event listeners with delegation
- **State Management**: Global evaluation state with real-time updates
- **Material Components**: Proper MDC initialization and lifecycle management
- **Tooltip System**: Bootstrap tooltips with HTML content support

## Deployment Information

### Azure App Service
- **Runtime**: Python 3.11 on Linux
- **Startup**: Uses `startup.py` for Azure-specific configuration
- **Environment Variables**: 
  - `PORT` (set by Azure)
  - `SECRET_KEY` (required for Flask sessions)
  - `WEBSITE_SITE_NAME` (Azure identifier)

### CI/CD Pipeline
- **GitHub Actions**: Automated deployment on push to main
- **Build Process**: Virtual environment, dependency installation, linting
- **Deployment**: Azure Web App Deploy action with publish profile

## Important Implementation Details

### Socket.IO Events
- `connect/disconnect` - Connection management
- `progress_update` - Real-time progress tracking
- `article_completed` - Individual article processing results
- `evaluation_completed` - Final evaluation results
- `summarize_request` - Browser summarization requests

### Data Flow
1. User configures evaluation parameters
2. Backend loads dataset and creates evaluation queue
3. Articles sent to frontend via Socket.IO
4. Browser Summarizer API processes articles
5. Results sent back to backend for ROUGE evaluation
6. Real-time updates sent to frontend
7. Final results aggregated and displayed

### Browser API Integration
- **Feature Detection**: Check for Summarizer API availability
- **Progressive Download**: Handle model download with progress
- **Configuration Mapping**: Map UI settings to API parameters
- **Error Recovery**: Graceful handling of API failures

## Security Considerations

### Production Security
- **HTTPS Only**: Enforced in Azure App Service
- **Secret Management**: Environment variables for sensitive data
- **Input Validation**: Server-side validation for all user inputs
- **Content Security**: HTML escaping for user-generated content

### Development Security
- **Debug Mode**: Disabled in production
- **Secret Keys**: Different keys for dev/prod environments
- **File Access**: Restricted to designated directories

## Testing & Quality Assurance

### Code Quality
- **Linting**: Flake8 integration in CI/CD pipeline
- **Error Handling**: Comprehensive exception management
- **Logging**: Structured logging for debugging
- **Browser Compatibility**: Progressive enhancement approach

### Performance Considerations
- **Resource Limits**: Optimized for Azure free tier
- **Memory Management**: Efficient dataset handling
- **Caching**: Browser API model caching
- **Async Operations**: Non-blocking real-time updates

## Future Enhancement Areas

### Potential Improvements
1. **Database Integration**: Persistent storage for results
2. **User Authentication**: Multi-user support
3. **Advanced Analytics**: Detailed performance metrics
4. **Batch Processing**: Multiple article evaluation
5. **API Integration**: External summarization services
6. **Custom Datasets**: User-uploaded article sets

### Scalability Considerations
- **State Management**: Consider Redis for session storage
- **Background Tasks**: Celery for long-running evaluations
- **Database**: PostgreSQL for result persistence
- **Caching**: Redis/Memcached for performance
- **Load Balancing**: Multiple App Service instances

## Troubleshooting Common Issues

### Browser API Issues
- **Unsupported Browser**: Fallback to sample data
- **Model Download Failures**: Progress tracking and retry logic
- **API Timeouts**: Configurable timeout settings

### Deployment Issues
- **Azure Startup**: Check `startup.py` and environment variables
- **Static Files**: Ensure proper static file serving
- **Dependencies**: Verify `requirements.txt` compatibility

### Performance Issues
- **Memory Limits**: Reduce dataset size for free tier
- **Timeout Issues**: Increase browser API timeout
- **UI Responsiveness**: Optimize large dataset handling

## Development Workflow

When contributing to this project:
1. **Environment Setup**: Use virtual environment with `requirements.txt`
2. **Local Testing**: Test with sample dataset first
3. **Browser Testing**: Verify Summarizer API functionality
4. **Azure Testing**: Test deployment scripts before production
5. **Documentation**: Update this file for architectural changes

## Key Dependencies & Versions

- **Python**: 3.11 (required for latest features)
- **Flask**: 2.3.3 (stable release)
- **Socket.IO**: 5.3.6 (real-time communication)
- **Bootstrap**: 5.x (UI framework)
- **Material Design Components**: Latest (UI components)
- **Azure CLI**: Latest (deployment)

Remember to keep dependencies updated and test thoroughly before deploying to production.
