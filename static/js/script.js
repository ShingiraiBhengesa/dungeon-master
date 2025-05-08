/**
 * Frontend JavaScript for AI DungeonMaster.
 * Handles UI updates, user interactions, and communication with the Flask backend.
 */

// --- State ---
let currentSessionId = null; // Initialize later
let isLoading = false;
const storyOutputPlaceholderText = "Type your adventure's beginning here...";

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
    const storyOutput = document.getElementById('story-output'); // Added

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

    // Enable startButton if storyOutput is editable (i.e., game not started)
    if (startButton) {
        if (storyOutput && storyOutput.contentEditable === 'true') {
            startButton.disabled = false;
            startButton.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            startButton.disabled = true;
            startButton.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }
}


/**
 * Updates the story output area with new text.
 * @param {string} text - The text to display.
 */
function updateStoryOutput(text) {
    const storyOutput = document.getElementById('story-output');
    if (!storyOutput) return;

    // Only update if not editable (i.e., game is active, not in prompt input mode)
    if (storyOutput.contentEditable === 'true') {
        // If it's editable and we're trying to update, it's likely a reset to placeholder.
        // The placeholder is handled by CSS :empty:before, so just clear it.
        // However, this function is for story updates, not placeholder resets.
        // For placeholder reset, call a dedicated function or set innerHTML = '' directly.
        if (text === storyOutputPlaceholderText) { // Special case for resetting to placeholder
            storyOutput.innerHTML = ''; // Let CSS handle placeholder
            // Ensure the initial <p> tag for styling is there if CSS relies on it
            const initialP = document.createElement('p');
            initialP.classList.add('italic', 'text-gray-400', 'dark:text-gray-500');
            // storyOutput.appendChild(initialP); // This will prevent :empty selector, CSS handles placeholder
        }
        return; 
    }

    storyOutput.innerHTML = ''; // Clear previous content
    
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
     // Removed animation control logic from here

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
    const audioPlayer = document.getElementById('audio-player'); // This is the <audio> element
    if (!audioPlayerContainer || !audioPlayer) return;
    if (audioUrl) {
        audioPlayer.src = audioUrl;
        audioPlayerContainer.classList.remove('hidden');
        audioPlayerContainer.classList.add('fade-in');
        audioPlayer.load();
        // Attempt to play the audio
        const playPromise = audioPlayer.play();
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                // Autoplay started!
                console.log("Audio playback started automatically.");
            }).catch(error => {
                // Autoplay was prevented.
                console.warn("Audio autoplay was prevented:", error);
                // Optionally, you could show a "click to play" button here
                // or notify the user that they might need to enable audio.
            });
        }
    } else {
        audioPlayerContainer.classList.add('hidden');
        audioPlayer.removeAttribute('src');
        // If there's an existing audio playing, stop it
        if (audioPlayer && !audioPlayer.paused) {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
        }
    }
}


/**
 * Updates the choices buttons.
 * @param {string[]} choices - An array of choice strings.
 */
function updateChoices(choices) {
    const choicesContainer = document.getElementById('choices-container');
    const storyOutput = document.getElementById('story-output'); // Used to check if game has started

    if (!choicesContainer || !storyOutput) {
        console.error("Choices container or story output not found for updateChoices.");
        return;
    }
    choicesContainer.innerHTML = ''; // Clear previous choices

    if (!choices || choices.length === 0) {
        // Game has started if storyOutput is NOT editable
        if (storyOutput.contentEditable === 'false') { 
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
     // const initialPromptContainer = document.getElementById('initial-prompt-container'); // Removed
     const endAdventureContainer = document.getElementById('end-adventure-container');
     const startButton = document.getElementById('start-button');
     const startButtonContainer = document.getElementById('start-button-container'); // Added

     if (!storyOutput || !choicesContainer) return;
     console.error("Game Error:", message);

     storyOutput.contentEditable = 'true'; // Make it editable again
     storyOutput.innerHTML = ''; // Clear content to show CSS placeholder
     // Add the initial p tag for placeholder styling if needed, or rely on :empty:before
     const placeholderP = document.createElement('p');
     placeholderP.classList.add('italic', 'text-gray-400', 'dark:text-gray-500');
     placeholderP.textContent = storyOutputPlaceholderText;
     storyOutput.appendChild(placeholderP);


     const errorElement = document.createElement('div');
     errorElement.innerHTML = `
        <p class="font-bold text-red-600 dark:text-red-400 text-lg mb-2">An Error Occurred</p>
        <p class="text-red-700 dark:text-red-300">${message}</p>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-3">Please check the server logs or try refreshing the page.</p>
     `;
     errorElement.classList.add('text-center', 'p-4', 'border', 'border-red-300', 'dark:border-red-700', 'bg-red-50', 'dark:bg-red-900/30', 'rounded-md', 'fade-in');
     // Prepend error so placeholder logic doesn't get confused
     storyOutput.insertBefore(errorElement, storyOutput.firstChild);


     choicesContainer.innerHTML = '';
     updateSceneImage(null);
     updateAudioPlayer(null);
     if (startButtonContainer) startButtonContainer.classList.remove('hidden'); // Show start button container
     if (startButton) startButton.classList.remove('hidden');
     if (endAdventureContainer) endAdventureContainer.classList.add('hidden');
     enableInteraction();
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
    const storyOutput = document.getElementById('story-output');
    const startButton = document.getElementById('start-button');
    const startButtonContainer = document.getElementById('start-button-container'); // Added
    const endAdventureContainer = document.getElementById('end-adventure-container');

    if (!storyOutput || isLoading) return;

    let prompt = storyOutput.textContent.trim();
    // If the content is the placeholder, treat as empty
    if (prompt === storyOutputPlaceholderText || storyOutput.querySelector('p.italic')?.textContent === storyOutputPlaceholderText) {
        prompt = "";
    }

    if (!prompt) {
        alert("Please type a starting description for your adventure into the scroll.");
        storyOutput.focus();
        return;
    }

    if (window.dungeonEffects && window.dungeonEffects.sounds) {
        window.dungeonEffects.sounds.play('success', { volume: 0.4 });
    }

    storyOutput.contentEditable = 'false'; // Make story output non-editable
    if (startButton) startButton.classList.add('hidden');
    if (startButtonContainer) startButtonContainer.classList.add('hidden'); // Hide container too
    
    // Clear the prompt text before showing "Generating..."
    storyOutput.innerHTML = ''; 
    const generatingP = document.createElement('p');
    generatingP.textContent = "Generating the start of your adventure...";
    storyOutput.appendChild(generatingP);
    // updateStoryOutput("Generating the start of your adventure..."); // This won't work as it's not editable

    updateChoices([]);
    updateSceneImage(null);
    updateAudioPlayer(null);

    const response = await postToBackend('/start', { prompt });

    if (response) {
        storyOutput.contentEditable = 'false'; // Ensure it's not editable
        if (response.error && !response.scene) {
             displayError(response.error); 
             // displayError will make storyOutput editable again and show start button
        } else {
            // updateStoryOutput will now work as contentEditable is false
            updateStoryOutput(response.scene || "(The story didn't generate text for this turn.)");
            updateSceneImage(response.image_url);
            updateAudioPlayer(response.audio_url);
            updateChoices(response.choices);
            if (endAdventureContainer) endAdventureContainer.classList.remove('hidden');
            if (startButton) startButton.classList.add('hidden'); 
            if (startButtonContainer) startButtonContainer.classList.add('hidden'); // Ensure container is hidden
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
    // If postToBackend returned null, displayError would have been called from within it,
    // which would hide endAdventureContainer and show initialPromptContainer.
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

/**
 * Handles the click event for the "End Adventure" button.
 */
function handleEndAdventureClick() { // Renamed function
    if (isLoading) return;

    console.log("End Adventure button clicked.");

    if (window.dungeonEffects && window.dungeonEffects.sounds) {
        window.dungeonEffects.sounds.play('error', { volume: 0.4 });
    }

    const storyOutput = document.getElementById('story-output');
    const startButton = document.getElementById('start-button');
    const startButtonContainer = document.getElementById('start-button-container'); // Added
    const endAdventureContainer = document.getElementById('end-adventure-container');
    const choicesContainer = document.getElementById('choices-container');

    // Reset UI to initial pre-game state
    if (storyOutput) {
        storyOutput.contentEditable = 'true';
        storyOutput.innerHTML = ''; // Clear content, CSS placeholder will appear
        // Add the initial p tag for placeholder styling
        const placeholderP = document.createElement('p');
        placeholderP.classList.add('italic', 'text-gray-400', 'dark:text-gray-500');
        placeholderP.textContent = storyOutputPlaceholderText;
        storyOutput.appendChild(placeholderP);
        storyOutput.focus();
    }
    
    updateChoices([]); 
    updateSceneImage(null);
    updateAudioPlayer(null);
    
    if (choicesContainer) choicesContainer.innerHTML = '';

    // if (initialPromptContainer) initialPromptContainer.classList.remove('hidden'); // Removed
    // if (initialPromptInput) initialPromptInput.value = ''; // Removed
    if (startButton) startButton.classList.remove('hidden');
    if (startButtonContainer) startButtonContainer.classList.remove('hidden'); // Show container again
    if (endAdventureContainer) endAdventureContainer.classList.add('hidden');

    setTimeout(enableInteraction, 0); 
}


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired.");

    try {
        const storyOutput = document.getElementById('story-output');
        const choicesContainer = document.getElementById('choices-container');
        // const initialPromptContainer = document.getElementById('initial-prompt-container'); // Removed
        // const initialPromptInput = document.getElementById('initial-prompt'); // Removed
        const startButton = document.getElementById('start-button');
        const startButtonContainer = document.getElementById('start-button-container'); // Added
        const imageContainer = document.getElementById('image-container');
        const sceneImage = document.getElementById('scene-image');
        const imagePlaceholder = document.getElementById('image-placeholder');
        const audioPlayerContainer = document.getElementById('audio-player-container');
        const audioPlayer = document.getElementById('audio-player');
        const loadingOverlay = document.getElementById('loading-overlay');
        const sessionIdInput = document.getElementById('session-id');
        const endAdventureButton = document.getElementById('end-adventure-button');
        const endAdventureContainer = document.getElementById('end-adventure-container');

        // Basic check for essential elements
        const elementsToCheck = {
            storyOutput, choicesContainer, /*initialPromptContainer, initialPromptInput,*/ // Removed
            startButton, startButtonContainer, imageContainer, sceneImage, imagePlaceholder, // Added startButtonContainer
            audioPlayerContainer, audioPlayer, loadingOverlay, sessionIdInput,
            endAdventureButton, endAdventureContainer
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
        if (endAdventureButton) {
            endAdventureButton.addEventListener('click', handleEndAdventureClick);
        }
        if (endAdventureContainer) {
            endAdventureContainer.classList.add('hidden');
        }

        if (storyOutput) {
            storyOutput.contentEditable = 'true';
            // Set initial placeholder via direct manipulation if CSS :empty:before is not enough
            // Or ensure the HTML has the initial <p> tag for the placeholder.
            // The HTML already has: <p class="italic text-gray-400 dark:text-gray-500">Type your adventure's beginning here...</p>
            // So, we just need to handle clearing it on focus.

            storyOutput.addEventListener('focus', () => {
                if (storyOutput.textContent.trim() === storyOutputPlaceholderText && storyOutput.querySelector('p.italic')) {
                    storyOutput.innerHTML = ''; // Clear the placeholder <p>
                }
            });

            storyOutput.addEventListener('blur', () => {
                if (storyOutput.textContent.trim() === '') {
                    storyOutput.innerHTML = ''; // Clear any stray newlines or spaces
                    // Re-add the placeholder <p> tag or rely on CSS :empty:before
                    // For CSS :empty:before to work, innerHTML must be truly empty.
                    // If we want the <p> tag for styling, we add it back:
                    const placeholderP = document.createElement('p');
                    placeholderP.classList.add('italic', 'text-gray-400', 'dark:text-gray-500');
                    placeholderP.textContent = storyOutputPlaceholderText;
                    storyOutput.appendChild(placeholderP);
                }
            });
        }
        
        // updateStoryOutput("Enter a description below to start your AI-powered adventure!"); // Placeholder handled by HTML/CSS/focus/blur
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
