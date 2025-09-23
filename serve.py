#!/usr/bin/env python3
"""
Simple HTTP server for local development and testing
Compatible with Python 3.x
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

# Configuration
PORT = 8000
HOST = 'localhost'

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler to serve files with proper MIME types"""
    
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def guess_type(self, path):
        """Override to set correct MIME types"""
        # Ensure JSON files are served with correct MIME type
        if path.endswith('.json'):
            return 'application/json'
        
        # Use parent method for other files
        return super().guess_type(path)

def main():
    """Main function to start the server"""
    # Change to the directory containing this script
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Check if index.html exists
    if not Path('index.html').exists():
        print("❌ Error: index.html not found in current directory")
        print("Please run this script from the project root directory")
        sys.exit(1)
    
    # Create server
    with socketserver.TCPServer((HOST, PORT), CustomHTTPRequestHandler) as httpd:
        print(f"🚀 Starting server at http://{HOST}:{PORT}")
        print(f"📁 Serving files from: {script_dir}")
        print(f"🌐 Open your browser and go to: http://{HOST}:{PORT}")
        print("📱 Test mobile responsiveness using browser dev tools")
        print("⏹️  Press Ctrl+C to stop the server")
        print("-" * 50)
        
        # Try to open browser automatically
        try:
            webbrowser.open(f'http://{HOST}:{PORT}')
            print("🔗 Browser opened automatically")
        except Exception as e:
            print(f"⚠️  Could not open browser automatically: {e}")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped by user")
            print("👋 Goodbye!")

if __name__ == '__main__':
    main()
