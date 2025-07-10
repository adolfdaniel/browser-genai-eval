"""
Startup script for Azure App Service deployment.
This file is used by Azure to start the Flask application.
"""

import os
from app import app, socketio

if __name__ == "__main__":
    # Azure App Service will set the PORT environment variable
    port = int(os.environ.get('PORT', 5000))
    
    # Run with SocketIO for production
    socketio.run(
        app, 
        host='0.0.0.0', 
        port=port, 
        debug=False,
        use_reloader=False,
        allow_unsafe_werkzeug=True  # Required for Azure App Service deployment
    )
