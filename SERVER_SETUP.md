# Server Setup Instructions

## Overview
This project now includes a Node.js server that handles file operations for saving and loading data in multiple languages.

## Prerequisites
- Node.js (v14 or higher)
- npm

## Installation
```bash
npm install
```

## Running the Application

### Option 1: Development Mode (Recommended)
Run both the API server and static file server simultaneously:
```bash
npm run dev
```
This will start:
- API server on http://localhost:3001
- Static file server on http://localhost:8000

### Option 2: Manual Setup
1. Start the API server:
```bash
npm run server
```

2. In another terminal, start the static file server:
```bash
npm start
```

## API Endpoints

### Save Lebenslauf Data
- **POST** `/api/save-lebenslauf`
- Saves Lebenslauf data to language-specific JSON files
- Files: `lebenslauf_data_de.json`, `lebenslauf_data_en.json`, `lebenslauf_data.json`

### Save Anschreiben Data
- **POST** `/api/save-anschreiben`
- Saves Anschreiben data to language-specific JSON files
- Files: `anschreiben_data_de.json`, `anschreiben_data_en.json`, `anschreiben_data.json`

### Get File Information
- **GET** `/api/file-info/:type/:lang`
- Returns information about existing files
- Example: `/api/file-info/lebenslauf/uk`

## File Structure
```
data/
├── lebenslauf_data.json          # Ukrainian Lebenslauf
├── lebenslauf_data_de.json       # German Lebenslauf
├── lebenslauf_data_en.json       # English Lebenslauf
├── anschreiben_data.json         # Ukrainian Anschreiben
├── anschreiben_data_de.json      # German Anschreiben
└── anschreiben_data_en.json      # English Anschreiben
```

## Features

### Automatic File Creation
- The server automatically creates the `data/` directory if it doesn't exist
- JSON files are created automatically when saving data for the first time
- Files are updated when saving existing data

### Language Support
- German (de): `*_de.json` files
- English (en): `*_en.json` files
- Ukrainian (uk): `*.json` files (default)

### Data Validation
- All saved data includes metadata (lastUpdated, lang)
- Server validates JSON structure before saving
- Error handling for file operations

## Usage in Frontend

### Saving Data
```javascript
// Save Lebenslauf data
await saveLebenslaufData()

// Save Anschreiben data
await saveAnschreibenData()
```

### Checking File Status
```javascript
// Show current data info
await showCurrentDataInfo()
```

## Troubleshooting

### Server Not Starting
- Check if port 3001 is available
- Ensure all dependencies are installed: `npm install`

### File Operations Failing
- Check if the `data/` directory exists and is writable
- Verify server is running on http://localhost:3001

### CORS Issues
- The server includes CORS middleware for cross-origin requests
- Ensure the frontend is making requests to the correct server URL

## Production Deployment

For production deployment, you'll need to:
1. Set up a proper web server (nginx, Apache)
2. Configure the Node.js server as a backend service
3. Update API URLs in the frontend to point to the production server
4. Set up proper file permissions for the data directory

## Security Notes

- The server runs on localhost by default for development
- File operations are restricted to the `data/` directory
- Input validation is performed on all API endpoints
- Consider implementing authentication for production use
