// server.prod.js - Production Server Entry Point
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { app } from './server/index.js'; // Import the Express app from your existing server file

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Production Server running on port ${PORT}`);
});
