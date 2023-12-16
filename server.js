const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const csvtojson = require('csvtojson'); // Add this line
const fs = require('fs').promises;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const spreadsheetPath = '/storage/emulated/0/Download/1DM/Retro_game_lists.csv';
let jsonDataCache = null;
const cacheRefreshInterval = 60 * 1000;

// Function to convert CSV to JSON
const convertCsvToJson = async () => {
  try {
    const fileData = await fs.readFile(spreadsheetPath, 'utf8');
    return csvtojson().fromString(fileData);
  } catch (error) {
    throw error;
  }
};

// Function to refresh the JSON data cache
const refreshDataCache = async () => {
  try {
    jsonDataCache = await convertCsvToJson();
    console.log('Cache refreshed');
  } catch (error) {
    console.error('Error refreshing cache:', error);
  }
};

// WebSocket connection handling
wss.on('connection', (ws) => {
  // Send initial data when a client connects
  if (!jsonDataCache) {
    refreshDataCache();
  }
  ws.send(JSON.stringify(jsonDataCache));
});

// HTTP route for initial data retrieval (optional)
app.get('/api/spreadsheet', async (req, res) => {
  try {
    // Use cached data if available
    if (!jsonDataCache) {
      await refreshDataCache();
    }
    res.json(jsonDataCache);
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Schedule periodic cache refresh
setInterval(refreshDataCache, cacheRefreshInterval);

const port = 3000;
server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

