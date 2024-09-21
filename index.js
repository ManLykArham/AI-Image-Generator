import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize environment variables
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the 'public' and 'assets' directories
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Serve homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'homePage.html'));
});

// Helper function to implement fetch with timeout
const fetchWithTimeout = (url, options, timeout = 10000) => {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), timeout))
    ]);
};

// Route to handle image generation request
app.post('/generateImages', async (req, res) => {
    const prompt = req.body.prompt;
    const apiKey = process.env.API_KEY_OPENAI;

    try {
        // Use fetchWithTimeout to limit the request to 10 seconds
        const response = await fetchWithTimeout('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                prompt: prompt,
                n: 2, // Number of images to generate
                size: '256x256' // Image size
            })
        }, 10000); // 10-second timeout

        if (!response.ok) {
            throw new Error('Failed to generate images');
        }

        const data = await response.json();
        res.status(200).json(data);

    } catch (error) {
        console.error('Error: ', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Proxy Server - Using the backend to fetch the image from the link and then serve it to the front end (avoids CORS)
app.get('/proxy-image', async (req, res) => {
    const imageUrl = req.query.url;

    try {
        const response = await fetch(imageUrl);
        const contentType = response.headers.get('content-type');
        const buffer = await response.buffer();

        res.set('Content-Type', contentType);
        res.send(buffer);
    } catch (error) {
        console.error('Error fetching image:', error);
        res.status(500).send('Failed to fetch image');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
