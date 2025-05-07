/**
 * Frontend JavaScript for AI DungeonMaster.
 * Handles UI updates, user interactions, and communication with the Flask backend.
 */

// --- State ---
let currentSessionId = null;
let isLoading = false;

// --- DOM Element References (to be cached on DOMContentLoaded) ---
let storyOutput, choicesContainer, initialPromptContainer, initialPromptInput,
    startButtonContainer, startButton, imageContainer, sceneImage, imagePlaceholder,
    audioPlayerContainer, audioPlayer, loadingOverlay, sessionIdInput,
    quitGameContainer, quitButton;

/**
 * Caches references to frequently used DOM elements.
 */
function cacheDOMElements() {
    storyOutput = document.getElementById('story-output');
    choicesContainer = document.getElementById('choices-container');
    initialPromptContainer = document.getElementById('initial-prompt-container');
    initialPromptInput = document.getElementById('initial-prompt');
    startButtonContainer = document.getElementById('start-button-container');
    startButton = document.getElementById('start-button');
    imageContainer = document.getElementById('image-container');
    sceneImage = document.getElementById('scene-image');
    imagePlaceholder = document.getElementById('image-placeholder');
    audioPlayerContainer = document.getElementById('audio-player-container');
    audioPlayer = document.getElementById('audio-player');
    loadingOverlay = document.getElementById('loading-overlay');
    sessionIdInput = document.getElementById('session-id');
    quitGameContainer = document.getElementById('quit-game-container');
    quitButton = document.getElementById('quit-button');
}

/**
 * Validates if all essential DOM elements are found.
 * @returns {boolean} True if all essential elements are found, false otherwise.
 */
function validateDOMElements() {
    const elements = {
        storyOutput, choicesContainer, initialPromptContainer, initialPromptInput,
        startButtonContainer, startButton, imageContainer, sceneImage, imagePlaceholder,
        audioPlayerContainer, audioPlayer, loadingOverlay, sessionIdInput,
        quitGameContainer, quitButton
    };
    for (const [key, value] of Object.entries(elements)) {
        if (!value) {
            console.error(`Essential DOM element not found on load: ${key}`);
            return false;
        }
    }
    return true;
}

// --- UI Interaction Control ---
function disableInteraction() {
     isLoading = true;
     if (loadingOverlay) {
         loadingOverlay.classList.remove('hidden');
         loadingOverlay.style.display = 'flex'; // Ensure it's visible
     }
     const choiceButtons = choicesContainer ? choicesContainer.querySelectorAll('.choice-button') : [];
     choiceButtons.forEach(button => {
        button.disabled = true;
        button.classList.add('opacity-50', 'cursor-not-allowed');
     });
     if (startButton) {
        startButton.disabled = true;
        startButton.classList.add('opacity-50', 'cursor-not-allowed');
     }
     if (quitButton) {
        quitButton.disabled = true;
        quitButton.classList.add('opacity-50', 'cursor-not-allowed');
     }
}

function enableInteraction() {
    isLoading = false;
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
        loadingOverlay.style.display = 'none'; // Ensure it's hidden
    }
    const choiceButtons = choicesContainer ? choicesContainer.querySelectorAll('.choice-button') : [];
    choiceButtons.forEach(button => {
        button.disabled = false;
        button.classList.remove('opacity-50', 'cursor-not-allowed');
    });

    // Start button enabled only if game hasn't started (prompt is visible)
    if (startButton && initialPromptContainer && !initialPromptContainer.classList.contains('hidden')) {
        startButton.disabled = false;
        startButton.classList.remove('opacity-50', 'cursor-not-allowed');
    } else if (startButton) {
        startButton.disabled = true;
        startButton.classList.add('opacity-50', 'cursor-not-allowed');
    }

    // Quit button enabled only if game has started (quit container is visible)
    if (quitButton && quitGameContainer && !quitGameContainer.classList.contains('hidden')) {
        quitButton.disabled = false;
        quitButton.classList.remove('opacity-50', 'cursor-not-allowed');
    } else if (quitButton) {
         quitButton.disabled = true; // Should be disabled if not visible / game not active
    }
}

// --- UI Update Functions ---
function updateStoryOutput(text, isError = false) {
    if (!storyOutput) return;
    storyOutput.innerHTML = '';
    
    if (isError) {
        const errorElement = document.createElement('div');
        errorElement.innerHTML = `
            <p class="font-bold text-red-600 dark:text-red-400 text-lg mb-2 font-medieval">An Error Occurred</p>
            <p class="text-red-700 dark:text-red-300">${text}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-3">Please check the server logs or try refreshing the page.</p>`;
        errorElement.classList.add('text-center', 'p-4', 'border', 'border-red-300', 'dark:border-red-700', 'bg-red-50', 'dark:bg-red-900/30', 'rounded-md', 'fade-in');
        storyOutput.appendChild(errorElement);
    } else if (window.dungeonEffects?.typeStory) { // Optional chaining for safety
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

function updateSceneImage(imageUrl) {
    if (!imagePlaceholder || !sceneImage) return;
    const defaultPlaceholderHTML = `
        <div class="text-center text-gray-500 dark:text-gray-400">
            <i class="fas fa-image fa-4x mb-3 floating"></i>
            <p class="text-lg">Scene visuals will appear here.</p>
        </div>`;

    if (imageUrl) {
        sceneImage.src = imageUrl;
        sceneImage.classList.remove('hidden');
        sceneImage.classList.add('fade-in');
        imagePlaceholder.classList.add('hidden');
        sceneImage.onerror = () => {
            console.error("Failed to load image:", imageUrl);
            sceneImage.classList.add('hidden');
            imagePlaceholder.classList.remove('hidden');
            imagePlaceholder.innerHTML = '<p class="text-red-500 font-semibold text-center font-medieval text-lg">Error loading image.</p>';
        };
        sceneImage.onload = () => console.log("Image loaded successfully:", imageUrl);
    } else {
        sceneImage.classList.add('hidden');
        sceneImage.removeAttribute('src');
        imagePlaceholder.classList.remove('hidden');
        imagePlaceholder.innerHTML = defaultPlaceholderHTML;
    }
}

function updateAudioPlayer(audioUrl) {
    if (!audioPlayerContainer || !audioPlayer) return;
    if (audioUrl) {
        audioPlayer.src = audioUrl;
        audioPlayerContainer.classList.remove('hidden');
        audioPlayerContainer.classList.add('fade-in');
        audioPlayer.load();
    } else {
        audioPlayerContainer.classList.add('hidden');
        audioPlayer.removeAttribute('src');
        if (!audioPlayer.paused) audioPlayer.pause();
    }
}

function updateChoices(choices) {
    if (!choicesContainer || !initialPromptContainer) return;
    choicesContainer.innerHTML = '';

    if (!choices || choices.length === 0) {
        if (initialPromptContainer.classList.contains('hidden')) {
            const endMessage = document.createElement('p');
            endMessage.textContent = "The story concludes, or perhaps the path ahead is unclear...";
            endMessage.classList.add('italic', 'text-center', 'text-gray-500', 'dark:text-gray-400', 'mt-4', 'fade-in', 'font-medieval');
            choicesContainer.appendChild(endMessage);
        }
        return;
    }

    const optionsHeading = document.createElement('h2');
    optionsHeading.textContent = "Choose Your Next Step";
    optionsHeading.classList.add('text-2xl', 'font-medieval', 'text-center', 'mb-4', 'mt-2', 'text-purple-300', 'dark:text-purple-300', 'glow-effect', 'fade-in', 'font-bold');
    choicesContainer.appendChild(optionsHeading);

    choices.forEach((originalChoiceText, index) => {
        const button = document.createElement('button');
        button.classList.add('choice-button');
        button.style.animationDelay = `${index * 0.15}s`;

        const cleanChoiceText = originalChoiceText.replace(/^\d+\.\s*/, '');
        button.dataset.choiceText = cleanChoiceText;

        const prefixSpan = document.createElement('span');
        prefixSpan.classList.add('choice-prefix');
        prefixSpan.textContent = `${index + 1}.`;

        const textSpan = document.createElement('span');
        textSpan.classList.add('choice-text');
        textSpan.textContent = cleanChoiceText;

        button.appendChild(prefixSpan);
        button.appendChild(textSpan);

        button.addEventListener('click', (e) => {
            e.currentTarget.classList.add('choice-selected');
            setTimeout(() => {
                handleChoiceClick(cleanChoiceText);
            }, 300); // Match animation duration in CSS if possible
        });
        
        button.addEventListener('mouseenter', () => button.classList.add('torch-light'));
        button.addEventListener('mouseleave', () => button.classList.remove('torch-light'));
        
        choicesContainer.appendChild(button);
    });
}

function displayError(message) {
     console.error("Game Error:", message);
     updateStoryOutput(message, true);
     updateChoices([]);
     updateSceneImage(null);
     updateAudioPlayer(null);

    if (initialPromptContainer) initialPromptContainer.classList.remove('hidden');
    if (startButtonContainer) startButtonContainer.classList.remove('hidden');
    if (quitGameContainer) quitGameContainer.classList.add('hidden');
}

// --- API Interaction ---
async function postToBackend(endpoint, data) {
    if (!currentSessionId) {
        displayError("Session ID is missing. Please refresh or ensure it's correctly set up.");
        return null;
    }
    disableInteraction();
    let responseData = null;

    try {
        const payload = { ...data, session_id: currentSessionId };
        console.log(`Sending request to ${endpoint} with payload:`, payload);
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        responseData = await response.json();
        console.log(`Received response from ${endpoint} (status ${response.status}):`, responseData);

        if (!response.ok) {
            const errorMsg = responseData?.error || `Request failed with status ${response.status}.`;
            throw new Error(errorMsg);
        }
        return responseData;

    } catch (error) {
        console.error(`Error during fetch to ${endpoint}:`, error);
        displayError(error.message || 'Network error or server unavailable.');
        return null;
    } finally {
        setTimeout(enableInteraction, 50);
    }
}

// --- Event Handlers ---
async function handleStartClick() {
    if (!initialPromptInput || isLoading) return;
    const prompt = initialPromptInput.value.trim();
    if (!prompt) {
        alert("Please enter a starting description for your adventure.");
        initialPromptInput.focus();
        return;
    }

    if (window.dungeonEffects?.sounds) window.dungeonEffects.sounds.play('success', { volume: 0.4 });

    if (initialPromptContainer) initialPromptContainer.classList.add('hidden');
    if (startButtonContainer) startButtonContainer.classList.add('hidden');
    if (quitGameContainer) quitGameContainer.classList.remove('hidden');

    updateStoryOutput("Generating the start of your adventure...");
    updateChoices([]);
    updateSceneImage(null);
    updateAudioPlayer(null);

    const response = await postToBackend('/start', { prompt });

    if (response) {
        updateStoryOutput(response.scene || "(The story didn't generate text for this turn.)");
        updateSceneImage(response.image_url);
        updateAudioPlayer(response.audio_url);
        updateChoices(response.choices);
        if (response.error) {
             console.warn("Asset generation warning:", response.error);
             const warningElement = document.createElement('p');
             warningElement.textContent = `Note: ${response.error}`;
             warningElement.classList.add('text-yellow-600', 'dark:text-yellow-400', 'text-sm', 'mt-2', 'text-center', 'fade-in', 'font-medieval');
             if (storyOutput) storyOutput.appendChild(warningElement);
        }
    }
}

async function handleChoiceClick(choiceText) {
    if (isLoading) return;
    if (window.dungeonEffects?.sounds) window.dungeonEffects.sounds.play('click', { volume: 0.4 });

    console.log("Choice made:", choiceText);
    updateStoryOutput("Processing your choice...");
    updateChoices([]); 
    updateSceneImage(null); 
    updateAudioPlayer(null);

    const response = await postToBackend('/choose', { choice: choiceText });

    if (response) {
        updateStoryOutput(response.scene || "(The story didn't generate text for this turn.)");
        updateSceneImage(response.image_url);
        updateAudioPlayer(response.audio_url);
        updateChoices(response.choices);
        if (response.error) {
             console.warn("Asset generation warning:", response.error);
             const warningElement = document.createElement('p');
             warningElement.textContent = `Note: ${response.error}`;
             warningElement.classList.add('text-yellow-600', 'dark:text-yellow-400', 'text-sm', 'mt-2', 'text-center', 'fade-in', 'font-medieval');
             if (storyOutput) storyOutput.appendChild(warningElement);
        }
    }
}

function handleQuitClick() {
    if (window.dungeonEffects?.sounds) window.dungeonEffects.sounds.play('click', { volume: 0.3 });

    console.log("Quit Game clicked.");
    updateStoryOutput("Enter a description below to start your AI-powered adventure!");
    updateChoices([]);
    updateSceneImage(null);
    updateAudioPlayer(null);

    if (initialPromptInput) initialPromptInput.value = '';
    if (initialPromptContainer) initialPromptContainer.classList.remove('hidden');
    if (startButtonContainer) startButtonContainer.classList.remove('hidden');
    if (quitGameContainer) quitGameContainer.classList.add('hidden');
    
    enableInteraction();
    if (initialPromptInput) initialPromptInput.focus();
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded: Initializing DungeonMaster UI...");
    cacheDOMElements();

    if (!validateDOMElements()) {
        alert("Critical Error: Some page elements are missing. The application may not function correctly. Please check the console (F12).");
        if(loadingOverlay) {
            loadingOverlay.classList.add('hidden');
            loadingOverlay.style.display = 'none';
        }
        return;
    }
    
    currentSessionId = sessionIdInput.value;
    if (!currentSessionId) {
        console.error("CRITICAL: Session ID is missing from the input field on load!");
        updateStoryOutput("Critical Error: Session ID not found. Unable to start game. Please refresh.", true);
        if (startButton) startButton.disabled = true; // Disable start button if no session
        // Hide loading overlay if it was somehow visible
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
            loadingOverlay.style.display = 'none';
        }
        return; // Stop further initialization
    } else {
        console.log("Session ID loaded:", currentSessionId);
    }
    
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
        loadingOverlay.style.display = 'none';
    }

    if (startButton) startButton.addEventListener('click', handleStartClick);
    if (quitButton) quitButton.addEventListener('click', handleQuitClick);

    updateStoryOutput("Enter a description below to start your AI-powered adventure!");
    updateSceneImage(null);
    updateAudioPlayer(null);
    if (quitGameContainer) quitGameContainer.classList.add('hidden');
    if (initialPromptContainer) initialPromptContainer.classList.remove('hidden');
    if (startButtonContainer) startButtonContainer.classList.remove('hidden');
    
    enableInteraction();

    console.log("AI DungeonMaster frontend initialization complete.");
});

console.log("script.js loaded by browser.");