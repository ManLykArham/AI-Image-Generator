const maxImages = 4; // Number of images to generate for each prompt
let selectedImageNumber = null;

// Function to generate a random number
function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to disable the generate button during processing
function disableGenerateButton() {
    document.getElementById("generate").disabled = true;
}

// Function to enable the generate button after process
function enableGenerateButton() {
    document.getElementById("generate").disabled = false;
}

// Function to clear image grid
function clearImageGrid() {
    const imageGrid = document.getElementById("image-grid");
    imageGrid.innerHTML = "";
}

// Function to generate images
async function generateImages(input) {
    disableGenerateButton();
    clearImageGrid();

    const loading = document.getElementById("loading");
    loading.style.display = "block"; // Show loading message

    try {
        const response = await fetch('/generateImages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: input,  // User input prompt
            })
        });
        if (!response.ok) {
            throw new Error('Failed to generate images');
        }

        const data = await response.json();

        data.data.forEach((image, index) => {
            const imgUrl = image.url; // Get the URL of the generated image

            const img = document.createElement("img");
            img.src = imgUrl;
            img.alt = `art-${index + 1}`;
            img.onclick = () => downloadImage(imgUrl, index); // Click event to download the image
            document.getElementById("image-grid").appendChild(img); // Append image to the image grid
        });

    } catch (error) {
        console.error('Error:', error);
        alert("Failed to generate images. Please try again later.");
    } finally {
        loading.style.display = "none"; // Hide loading message
        enableGenerateButton(); // Re-enable generate button
        selectedImageNumber = null; 
    }
}


// Function to generate images when "Enter" key is pressed or button is clicked
function handleGenerate() {
    const input = document.getElementById("user-prompt").value.trim();
    if (input) {
        generateImages(input);
    } else {
        alert("Please enter a valid prompt!");
    }
}

// Event listener for the "Generate" button click
document.getElementById("generate").addEventListener('click', handleGenerate);

// Event listener for "Enter" key press inside the input field
document.getElementById("user-prompt").addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();  
        handleGenerate();        
    }
});

// Function to download an image using a backend proxy server
async function downloadImage(imgUrl, imageNumber) {
    try {
        // Make a request to the backend proxy with the image URL
        const response = await fetch(`/proxy-image?url=${encodeURIComponent(imgUrl)}`);
        
        // Check if the response is successful
        if (!response.ok) {
            throw new Error('Failed to fetch image');
        }

        // Convert the response to a Blob object
        const blob = await response.blob();
        // Create a URL for the Blob object
        const url = URL.createObjectURL(blob);

        // Create a temporary link element
        const link = document.createElement("a");
        link.href = url;
        link.download = `image-${imageNumber + 1}.jpg`; // Set the filename for the download
        document.body.appendChild(link); // Append the link to the document body
        link.click(); // Programmatically click the link to trigger the download
        document.body.removeChild(link); // Remove the link from the document

        // Revoke the object URL to free up memory
        URL.revokeObjectURL(url);

    } catch (error) {
        // Log any errors that occur during the download process
        console.error('Error downloading image:', error);
    }
}
