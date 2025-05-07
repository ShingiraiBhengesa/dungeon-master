/**
 * Frontend JavaScript for AI DungeonMaster.
 * Handles UI updates, user interactions, and communication with the Flask backend.
 */

// --- State ---
let currentSessionId = null; // Initialize later
let isLoading = false;

// --- Helper Functions ---

/** Clears previous button states and disables interaction */
function disableInteraction() {
     const loadingOverlay = document.getElementById('loading-overlay');
     const choicesContainer = document.getElementById('choices-container');
     const startButton = document.getElementById('start-button');

     isLoading = true;
     if (loadingOverlay) {
         loadingOverlay.style.display = 'flex';
         loadingOverlay.classList.remove('hidden');
     }
     const buttons = choicesContainer ? choicesContainer.querySelectorAll('button') : [];
     buttons.forEach(button => {
        button.disabled = true;
        button.classList.add('opacity-50', 'cursor-not-allowed');
     });
     if (startButton) {
        startButton.disabled = true;
        startButton.classList.add('opacity-50', 'cursor-not-allowed');
     }
}

/** Enables interaction */
function enableInteraction() {
    const loadingOverlay = document.getElementById('loading-overlay');
    const choicesContainer = document.getElementById('choices-container');
    const startButton = document.getElementById('start-button');
    const initialPromptArea = document.getElementById('initial-prompt-area');

    isLoading = false;
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
        loadingOverlay.classList.add('hidden');
    } else {
        console.warn("enableInteraction: loadingOverlay not found.");
    }

    const buttons = choicesContainer ? choicesContainer.querySelectorAll('button') : [];
    buttons.forEach(button => {
        button.disabled = false;
        button.classList.remove('opacity-50', 'cursor-not-allowed');
    });
    if (startButton && initialPromptArea && !initialPromptArea.classList.contains('hidden')) {
        startButton.disabled = false;
        startButton.classList.remove('opacity-50', 'cursor-not-allowed');
    } else if (startButton) {
         startButton.disabled = true;
         startButton.classList.add('opacity-50', 'cursor-not-allowed');
    }
}


/**
 * Updates the story output area with new text.
 * @param {string} text - The text to display.
 */
function updateStoryOutput(text) {
    const storyOutput = document.getElementById('story-output');
    if (!storyOutput) return;
    storyOutput.innerHTML = '';
    
    if (window.dungeonEffects && window.dungeonEffects.typeStory) {
        const formattedText = text.split('\n').map(line => line.trim()).filter(line => line).join('<br>');
        window.dungeonEffects.typeStory(formattedText);
    } else {
        const paragraph = document.createElement('p');
        paragraph.innerHTML = text.split('\n').map(line => line.trim()).filter(line => line).join('<br>');
        paragraph.classList.add('fade-in');
        storyOutput.appendChild(paragraph);
    }
    
    storyOutput.scrollTop = 0;
}

/**
 * Updates the scene image display.
 * @param {string|null} imageUrl - The URL of the image to display, or null to hide.
 */
function updateSceneImage(imageUrl) {
    const imagePlaceholder = document.getElementById('image-placeholder');
    const sceneImage = document.getElementById('scene-image');
    if (!imagePlaceholder || !sceneImage) return;

    const defaultPlaceholder = `
        <div class="text-center text-gray-500 dark:text-gray-400">
            <i class="fas fa-image fa-3x mb-2"></i>
            <p>Scene visuals will appear here.</p>
        </div>`;
     imagePlaceholder.innerHTML = defaultPlaceholder;

    if (imageUrl) {
        sceneImage.src = imageUrl;
        sceneImage.classList.remove('hidden');
        sceneImage.classList.add('fade-in');
        imagePlaceholder.classList.add('hidden');
        sceneImage.onerror = () => {
            console.error("Failed to load image:", imageUrl);
            sceneImage.classList.add('hidden');
            imagePlaceholder.classList.remove('hidden');
            imagePlaceholder.innerHTML = '<p class="text-red-500 font-semibold text-center">Error loading image.</p>';
        };
         sceneImage.onload = () => {
             console.log("Image loaded successfully");
         }
    } else {
        sceneImage.classList.add('hidden');
        sceneImage.removeAttribute('src');
        imagePlaceholder.classList.remove('hidden');
        if (imagePlaceholder.innerHTML.includes("Scene visuals will appear here")) {
             imagePlaceholder.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400">
                    <i class="fas fa-eye-slash fa-3x mb-2"></i>
                    <p>No visual generated.</p>
                </div>`;
        }
    }
}

/**
 * Updates the audio player.
 * @param {string|null} audioUrl - The URL of the audio file, or null to hide.
 */
function updateAudioPlayer(audioUrl) {
    const audioPlayerContainer = document.getElementById('audio-player-container');
    const audioPlayer = document.getElementById('audio-player');
    if (!audioPlayerContainer || !audioPlayer) return;
    if (audioUrl) {
        audioPlayer.src = audioUrl;
        audioPlayerContainer.classList.remove('hidden');
        audioPlayerContainer.classList.add('fade-in');
        audioPlayer.load();
    } else {
        audioPlayerContainer.classList.add('hidden');
        audioPlayer.removeAttribute('src');
    }
}


/**
 * Updates the choices buttons.
 * @param {string[]} choices - An array of choice strings.
 */
function updateChoices(choices) {
    const choicesContainer = document.getElementById('choices-container');
    const initialPromptArea = document.getElementById('initial-prompt-area');
    if (!choicesContainer || !initialPromptArea) {
        console.error("Choices container or initial prompt area not found.");
        return;
    }
    choicesContainer.innerHTML = ''; // Clear previous choices

    if (!choices || choices.length === 0) {
        if (initialPromptArea.classList.contains('hidden')) { // Only show "story concludes" if game has started
            const endMessage = document.createElement('p');
            endMessage.textContent = "The story concludes, or perhaps the path ahead is unclear...";
            endMessage.classList.add('italic', 'text-center', 'text-gray-500', 'dark:text-gray-400', 'mt-4', 'fade-in');
            choicesContainer.appendChild(endMessage);
        }
        return;
    }

    // Add a heading for the adventure options
    const optionsHeading = document.createElement('h2');
    optionsHeading.textContent = "Choose Your Next Step";
    optionsHeading.classList.add('text-2xl', 'font-medieval', 'text-center', 'mb-4', 'mt-2', 'text-purple-300', 'glow-effect', 'fade-in', 'font-bold');
    choicesContainer.appendChild(optionsHeading);

    choices.forEach((originalChoiceText, index) => { // Used 'originalChoiceText' for clarity
        const button = document.createElement('button');
        button.classList.add('choice-button'); // Apply the primary style from fantasy.css
        
        // Staggered animation for fadeInChoice (defined in fantasy.css for .choice-button)
        button.style.animationDelay = `${index * 0.15}s`;

        // Get clean choice text (removes any leading "1. ", "2. " etc.)
        const cleanChoiceText = originalChoiceText.replace(/^\d+\.\s*/, '');
        button.dataset.choiceText = cleanChoiceText; // Store clean choice text for potential use

        // Create the prefix span (e.g., "1.")
        const prefixSpan = document.createElement('span');
        prefixSpan.classList.add('choice-prefix');
        prefixSpan.textContent = `${index + 1}.`;

        // Create the text span for the actual choice description
        const textSpan = document.createElement('span');
        textSpan.classList.add('choice-text');
        textSpan.textContent = cleanChoiceText;

        button.appendChild(prefixSpan);
        button.appendChild(textSpan);

        // Add click event listener
        button.addEventListener('click', (e) => {
            // Apply selection animation from fantasy.css
            e.currentTarget.classList.add('choice-selected');
            
            // Wait for animation to be noticeable before processing the choice
            setTimeout(() => {
                handleChoiceClick(cleanChoiceText); // Pass the clean choice text
            }, 300); // Adjust delay as needed
        });
        
        // Optional: If you want to keep the 'torch-light' effect on hover for choice buttons
        button.addEventListener('mouseenter', () => {
            button.classList.add('torch-light');
        });
        button.addEventListener('mouseleave', () => {
            button.classList.remove('torch-light');
        });
        
        choicesContainer.appendChild(button); // Append the button ONCE
    });
}

/**
 * Displays an error message prominently in the story output area.
 * @param {string} message - The error message.
 */
function displayError(message) {
     const storyOutput = document.getElementById('story-output');
     const choicesContainer = document.getElementById('choices-container');
     const initialPromptArea = document.getElementById('initial-prompt-area');
     if (!storyOutput || !choicesContainer) return;
     console.error("Game Error:", message);
     storyOutput.innerHTML = '';
     const errorElement = document.createElement('div');
     errorElement.innerHTML = `
        <p class="font-bold text-red-600 dark:text-red-400 text-lg mb-2">An Error Occurred</p>
        <p class="text-red-700 dark:text-red-300">${message}</p>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-3">Please check the server logs or try refreshing the page.</p>
     `;
     errorElement.classList.add('text-center', 'p-4', 'border', 'border-red-300', 'dark:border-red-700', 'bg-red-50', 'dark:bg-red-900/30', 'rounded-md', 'fade-in');
     storyOutput.appendChild(errorElement);

     choicesContainer.innerHTML = '';
     updateSceneImage(null);
     updateAudioPlayer(null);
     if (initialPromptArea) initialPromptArea.classList.remove('hidden');
}


// --- API Interaction ---

/**
 * Sends data to the backend API.
 * @param {string} endpoint - The API endpoint (e.g., '/start', '/choose').
 * @param {object} data - The data payload to send.
 * @returns {Promise<object|null>} - The JSON response from the backend, or null on fetch error.
 */
async function postToBackend(endpoint, data) {
    if (!currentSessionId) {
        displayError("Session ID is missing. Please refresh the page.");
        return null;
    }
    disableInteraction();
    let responseData = null;

    try {
        console.log(`Sending request to ${endpoint} with data:`, data);
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify({...data, session_id: currentSessionId }),
        });

        try {
            responseData = await response.json();
            console.log(`Received response from ${endpoint} (status ${response.status}):`, responseData);
        } catch (jsonError) {
            console.error("Failed to parse JSON response:", jsonError);
            if (!response.ok) {
                 throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`);
            } else {
                 throw new Error("Received unexpected non-JSON response from server.");
            }
        }

        if (!response.ok) {
            const errorMsg = responseData?.error || `Request failed with status ${response.status}`;
            throw new Error(errorMsg);
        }
        return responseData; // Success

    } catch (error) {
        console.error(`Error during fetch to ${endpoint}:`, error);
        displayError(error.message || 'Network error or server unavailable.');
        return null; // Indicate failure
    } finally {
        setTimeout(enableInteraction, 0);
    }
}

// --- Event Handlers ---

/**
 * Handles the click event for the "Begin Adventure" button.
 */
async function handleStartClick() {
    const initialPromptInput = document.getElementById('initial-prompt');
    const initialPromptArea = document.getElementById('initial-prompt-area');
    if (!initialPromptInput || isLoading) return;
    const prompt = initialPromptInput.value.trim();
    if (!prompt) {
        alert("Please enter a starting description for your adventure.");
        return;
    }

    if (window.dungeonEffects && window.dungeonEffects.sounds) {
        window.dungeonEffects.sounds.play('success', { volume: 0.4 });
    }

    if (initialPromptArea) initialPromptArea.classList.add('hidden');
    updateStoryOutput("Generating the start of your adventure...");
    updateChoices([]);
    updateSceneImage(null);
    updateAudioPlayer(null);

    const response = await postToBackend('/start', { prompt });

    if (response) {
        if (response.error && !response.scene) {
             displayError(response.error);
             if (initialPromptArea) initialPromptArea.classList.remove('hidden');
        } else {
            updateStoryOutput(response.scene || "(The story didn't generate text for this turn.)");
            updateSceneImage(response.image_url);
            updateAudioPlayer(response.audio_url);
            updateChoices(response.choices);
            if (response.error) {
                 console.warn("Asset generation warning:", response.error);
                 const warningElement = document.createElement('p');
                 warningElement.textContent = `Note: ${response.error}`;
                 warningElement.classList.add('text-yellow-600', 'dark:text-yellow-400', 'text-sm', 'mt-2', 'text-center');
                 const storyOutput = document.getElementById('story-output');
                 if (storyOutput) storyOutput.appendChild(warningElement);
            }
        }
    }
}

/**
 * Handles the click event for a choice button.
 * @param {string} choiceText - The text of the chosen option (should be clean text without prefix).
 */
async function handleChoiceClick(choiceText) {
    if (isLoading) return;

    if (window.dungeonEffects && window.dungeonEffects.sounds) {
        window.dungeonEffects.sounds.play('click', { volume: 0.4 });
    }

    console.log("Choice made:", choiceText);
    updateStoryOutput("Processing your choice...");
    updateChoices([]); // Clear current choices immediately
    updateSceneImage(null); 
    updateAudioPlayer(null);

    const response = await postToBackend('/choose', { choice: choiceText });

    if (response) {
        if (response.error && !response.scene) {
             displayError(response.error);
        } else {
            updateStoryOutput(response.scene || "(The story didn't generate text for this turn.)");
            updateSceneImage(response.image_url);
            updateAudioPlayer(response.audio_url);
            updateChoices(response.choices); 
            if (response.error) { 
                 console.warn("Asset generation warning:", response.error);
                 const warningElement = document.createElement('p');
                 warningElement.textContent = `Note: ${response.error}`;
                 warningElement.classList.add('text-yellow-600', 'dark:text-yellow-400', 'text-sm', 'mt-2', 'text-center', 'fade-in');
                 const storyOutput = document.getElementById('story-output');
                 if (storyOutput) storyOutput.appendChild(warningElement);
            }
        }
    }
}


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired.");

    try {
        const storyOutput = document.getElementById('story-output');
        const choicesContainer = document.getElementById('choices-container');
        const initialPromptArea = document.getElementById('initial-prompt-area');
        const initialPromptInput = document.getElementById('initial-prompt');
        const startButton = document.getElementById('start-button');
        const imageContainer = document.getElementById('image-container');
        const sceneImage = document.getElementById('scene-image');
        const imagePlaceholder = document.getElementById('image-placeholder');
        const audioPlayerContainer = document.getElementById('audio-player-container');
        const audioPlayer = document.getElementById('audio-player');
        const loadingOverlay = document.getElementById('loading-overlay');
        const sessionIdInput = document.getElementById('session-id');

        // Basic check for essential elements
        const elementsToCheck = {
            storyOutput, choicesContainer, initialPromptArea, initialPromptInput,
            startButton, imageContainer, sceneImage, imagePlaceholder,
            audioPlayerContainer, audioPlayer, loadingOverlay, sessionIdInput
        };
        
        let essentialElementsFound = true;
        for (const [key, value] of Object.entries(elementsToCheck)) {
            if (!value) {
                console.error(`Essential DOM element not found on load: ${key}`);
                essentialElementsFound = false;
            }
        }

        if (!essentialElementsFound) {
            alert("Error initializing the page components. Some elements are missing. Check console (F12).");
            if(loadingOverlay) loadingOverlay.style.display = 'none';
            return;
        }

        currentSessionId = sessionIdInput.value;
        if (!currentSessionId) {
            console.warn("Session ID is missing or empty from the input field!");
            // Potentially display a user-facing error or disable functionality
        } else {
            console.log("Session ID found:", currentSessionId);
        }
        
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
            const displayStyle = window.getComputedStyle(loadingOverlay).display;
            if (displayStyle === 'none') {
                console.log("Loading overlay display style is now 'none'.");
            } else {
                console.error(`Failed to force hide loading overlay! Computed display style is: ${displayStyle}`);
            }
        } else {
             console.error("Loading overlay element not found within DOMContentLoaded!");
        }

        startButton.addEventListener('click', handleStartClick);

        updateStoryOutput("Enter a description below to start your AI-powered adventure!");
        updateSceneImage(null);
        updateAudioPlayer(null);
        enableInteraction();

        console.log("AI DungeonMaster frontend initialization complete.");

    } catch (error) {
        console.error("Error during DOMContentLoaded initialization:", error);
        const body = document.querySelector('body');
        if (body) {
             body.innerHTML = '<p style="color:red; text-align:center; padding-top: 20px;">A critical error occurred during page initialization. Please check the console (F12) and try refreshing.</p>';
        }
        const loadingOverlay = document.getElementById('loading-overlay');
        if(loadingOverlay) loadingOverlay.style.display = 'none';
    }
});

console.log("Script file loaded.");