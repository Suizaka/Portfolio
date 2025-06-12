const express = require('express');
const fetch = require('node-fetch'); // or use native fetch in newer Node.js versions
const cors = require('cors');

const app = express();
const PORT = 5000;

// Enable CORS for your frontend origin
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000']
}));


// To parse JSON body if needed
app.use(express.json());

// Proxy endpoint
app.all('/proxy', async (req, res) => {
  try {
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbzuFsfg8ICC4yJQmXJTSp2BuYrHXmmxzoV6M8-SypH1kWnW6lQTRZkj16aefgVLrJTV/exec';

    // Debug logs (optional)
    console.log('Incoming Request:', req.method, req.url);
    console.log('Request Body:', req.body);

    // Clean headers - only include necessary ones
    const headers = {};
    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'];
    }

    const options = {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    };

    const response = await fetch(GAS_URL, options);

    const contentType = response.headers.get('content-type') || '';

    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
      res.set('Content-Type', 'application/json');
      res.status(response.status).json(data);
    } else {
      data = await response.text();
      res.set('Content-Type', contentType);
      res.status(response.status).send(data);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy server error', details: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
