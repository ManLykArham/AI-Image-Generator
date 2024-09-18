import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialising ev 
dotenv.config();

// Creating Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default route to serve the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'homePage.html'));
});

// Route to handle image generation request
app.post('/generateImages', async (req, res) => {
    const prompt = req.body.prompt; // Getting the user's prompt from the request body
    const apiKey = process.env.API_KEY_OPENAI; // getting the API key from the .env file

    try{
        // Making a post request to openai to generate images
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify ({
                prompt: prompt,
                n: 4, // Numbers of images to generate
                size: '512x512' // Image size
            })
        });

        // Checking if the response is ok
        if (!response.ok){
            throw new Error('Failed to generate images')}
console.log("image generated");
        const data = await response.json(); // Parsing the response data
        res.status(200).json(data); // Send the images back to the front end

    } catch (error) {
        console.error('Error: ', error);
        res.status(500).json({error: 'Failed to generate images'});
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


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});