/**
 * Frontend JavaScript for AI DungeonMaster.
 * Handles UI updates, user interactions, and communication with the Flask backend.
 */

// --- State ---
let currentSessionId = null; // Initialize later
let isLoading = false;

// --- Helper Functions ---
// ... (Keep all helper functions like disableInteraction, enableInteraction, updateStoryOutput, etc., exactly as they were in the previous version) ...
/** Clears previous button states and disables interaction */
function disableInteraction() {
     const loadingOverlay = document.getElementById('loading-overlay'); // Get element reference here
     const choicesContainer = document.getElementById('choices-container');
     const startButton = document.getElementById('start-button');

     isLoading = true;
     if (loadingOverlay) {
         // Use style.display = 'flex' or 'block' depending on your overlay's default display type when visible
         // Since it uses flex for centering, 'flex' is appropriate.
         loadingOverlay.style.display = 'flex';
         loadingOverlay.classList.remove('hidden'); // Keep class removal for consistency if needed elsewhere
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
    // Force hide using inline style
    if (loadingOverlay) {
        console.log("enableInteraction: Forcing loading overlay display to 'none'.");
        loadingOverlay.style.display = 'none';
        loadingOverlay.classList.add('hidden'); // Also add class for good measure
    } else {
        console.warn("enableInteraction: loadingOverlay not found.");
    }

    const buttons = choicesContainer ? choicesContainer.querySelectorAll('button') : [];
    buttons.forEach(button => {
        button.disabled = false;
        button.classList.remove('opacity-50', 'cursor-not-allowed');
    });
    // Only re-enable start button if the initial prompt area is visible
    if (startButton && initialPromptArea && !initialPromptArea.classList.contains('hidden')) {
        startButton.disabled = false;
        startButton.classList.remove('opacity-50', 'cursor-not-allowed');
    } else if (startButton) {
        // Ensure start button is disabled if prompt area is hidden
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
    const paragraph = document.createElement('p');
    paragraph.innerHTML = text.split('\n').map(line => line.trim()).filter(line => line).join('<br>');
    paragraph.classList.add('fade-in');
    storyOutput.appendChild(paragraph);
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
    if (!choicesContainer || !initialPromptArea) return;
    choicesContainer.innerHTML = '';
    if (!choices || choices.length === 0) {
        if (initialPromptArea.classList.contains('hidden')) {
            const endMessage = document.createElement('p');
            endMessage.textContent = "The story concludes, or perhaps the path ahead is unclear...";
            endMessage.classList.add('italic', 'text-center', 'text-gray-500', 'dark:text-gray-400', 'mt-4', 'fade-in');
            choicesContainer.appendChild(endMessage);
        }
        return;
    }

    choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.textContent = choice.replace(/^\d+\.\s*/, '');
        button.dataset.choiceText = choice;
        button.classList.add(
            'w-full', 'text-left', 'bg-gray-200', 'dark:bg-gray-700', 'hover:bg-gray-300',
            'dark:hover:bg-gray-600', 'text-gray-800', 'dark:text-gray-100',
            'font-semibold', 'py-3', 'px-4', 'rounded-lg', 'transition',
            'duration-150', 'ease-in-out', 'fade-in', 'shadow-sm', 'hover:shadow-md'
        );
        button.style.animationDelay = `${index * 0.08}s`;
        button.addEventListener('click', () => handleChoiceClick(choice));
        choicesContainer.appendChild(button);
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
        // Use setTimeout to ensure enableInteraction runs after potential immediate re-renders
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
    // If response is null, postToBackend handled displaying the fetch/network error
}

/**
 * Handles the click event for a choice button.
 * @param {string} choiceText - The text of the chosen option.
 */
async function handleChoiceClick(choiceText) {
    if (isLoading) return;

    console.log("Choice made:", choiceText);
    updateStoryOutput("Processing your choice...");
    updateChoices([]);
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
                 warningElement.classList.add('text-yellow-600', 'dark:text-yellow-400', 'text-sm', 'mt-2', 'text-center');
                 const storyOutput = document.getElementById('story-output');
                 if (storyOutput) storyOutput.appendChild(warningElement);
            }
        }
    }
    // If response is null, postToBackend handled the fetch/network error display
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

        let essentialElementsFound = true;
        const elementsToCheck = { /* ... elements ... */ }; // Assume check happens here
        // ... (element checking code from previous version) ...
         for (const [key, value] of Object.entries(elementsToCheck)) {
            if (!value) {
                console.error(`Essential DOM element not found on load: ${key}`);
                essentialElementsFound = false;
            }
        }
         if (!essentialElementsFound) {
            alert("Error initializing the page components. Some elements are missing. Check console (F12).");
            if(loadingOverlay) loadingOverlay.style.display = 'none'; // Force hide if possible
            return;
        }


        currentSessionId = sessionIdInput.value;
        console.log("Session ID found:", currentSessionId);

        // Force hide overlay using inline style *within* DOMContentLoaded
        console.log("Attempting to force hide loading overlay using style.display...");
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
             // Verify
            const displayStyle = window.getComputedStyle(loadingOverlay).display;
            if (displayStyle === 'none') {
                console.log("Loading overlay display style is now 'none'.");
            } else {
                console.error(`Failed to force hide loading overlay! Computed display style is: ${displayStyle}`);
                // As a last resort, try removing it from the DOM entirely, though this is hacky
                // loadingOverlay.remove();
                // console.warn("Removed loading overlay from DOM as a fallback.");
            }
        } else {
             console.error("Loading overlay element not found within DOMContentLoaded!");
        }


        console.log("Adding event listener to start button.");
        startButton.addEventListener('click', handleStartClick);

        console.log("Setting initial UI state.");
        updateStoryOutput("Enter a description below to start your AI-powered adventure!");
        updateSceneImage(null);
        updateAudioPlayer(null);
        // Call enableInteraction last to ensure overlay is hidden after setup
        enableInteraction();

        console.log("AI DungeonMaster frontend initialization complete.");

    } catch (error) {
        console.error("Error during DOMContentLoaded initialization:", error);
        const body = document.querySelector('body');
        if (body) { /* ... error display ... */ }
        const loadingOverlay = document.getElementById('loading-overlay');
        if(loadingOverlay) loadingOverlay.style.display = 'none';
    }
});

console.log("Script file loaded.");

