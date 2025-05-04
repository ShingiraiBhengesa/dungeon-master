/**
 * Visual effects and animations for AI DungeonMaster
 * Enhances the user experience with fantasy-themed effects
 */

// Initialize the effects module
window.dungeonEffects = {};

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing visual effects...');
    initializeEffects();
});

/**
 * Initialize all visual effects
 */
function initializeEffects() {
    // Initialize all effect modules
    initializeTypewriter();
    initializeParticles();
    initializeSounds();
    initializeButtonEffects();
    initializeGlowEffects();
    
    console.log('All visual effects initialized');
}

/**
 * Add interactive button effects
 */
function initializeButtonEffects() {
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.fantasy-button');
    
    buttons.forEach(button => {
        button.addEventListener('mousedown', function(e) {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement('span');
            ripple.classList.add('ripple-effect');
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            button.appendChild(ripple);
            
            // Play click sound if available
            if (window.dungeonEffects.sounds) {
                window.dungeonEffects.sounds.play('click', { volume: 0.3 });
            }
            
            // Remove ripple after animation completes
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Add style for ripple effect
    const style = document.createElement('style');
    style.textContent = `
        .fantasy-button {
            position: relative;
            overflow: hidden;
        }
        
        .ripple-effect {
            position: absolute;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.4);
            width: 100px;
            height: 100px;
            margin-top: -50px;
            margin-left: -50px;
            animation: ripple 0.6s linear;
            transform: scale(0);
            opacity: 1;
            pointer-events: none;
        }
        
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Add subtle glow effects to elements
 */
function initializeGlowEffects() {
    // Add a subtle pulsing glow to important elements
    const glowElements = document.querySelectorAll('.magic-glow, h1, .fantasy-border');
    
    glowElements.forEach((element, index) => {
        // Create a subtle random delay for each element
        const delay = Math.random() * 2;
        element.style.animation = `glow-pulse 3s ease-in-out ${delay}s infinite alternate`;
    });
    
    // Add style for glow pulse
    const style = document.createElement('style');
    style.textContent = `
        @keyframes glow-pulse {
            0% {
                box-shadow: 0 0 5px rgba(138, 95, 255, 0.3);
                text-shadow: 0 0 3px rgba(138, 95, 255, 0.3);
            }
            100% {
                box-shadow: 0 0 15px rgba(138, 95, 255, 0.7);
                text-shadow: 0 0 8px rgba(138, 95, 255, 0.7);
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Typewriter effect for story text
 */
function initializeTypewriter() {
    // Store the typewriter function in the global dungeonEffects object
    window.dungeonEffects.typeStory = function(text) {
        const storyOutput = document.getElementById('story-output');
        if (!storyOutput) return;
        
        // Clear existing content
        storyOutput.innerHTML = '';
        
        // Create paragraph for the text
        const paragraph = document.createElement('p');
        storyOutput.appendChild(paragraph);
        
        // Add a blinking cursor element
        const cursor = document.createElement('span');
        cursor.classList.add('typewriter-cursor');
        storyOutput.appendChild(cursor);
        
        // Split text by <br> tags to handle line breaks
        const textSegments = text.split('<br>');
        let currentSegmentIndex = 0;
        let currentCharIndex = 0;
        let currentContent = '';
        
        // Function to type the next character
        function typeNextChar() {
            if (currentSegmentIndex >= textSegments.length) {
                // Typing complete, remove cursor
                cursor.remove();
                return;
            }
            
            const currentSegment = textSegments[currentSegmentIndex];
            
            if (currentCharIndex < currentSegment.length) {
                // Add next character
                currentContent += currentSegment[currentCharIndex];
                paragraph.innerHTML = currentContent;
                currentCharIndex++;
                
                // Schedule next character
                setTimeout(typeNextChar, 20 + Math.random() * 10);
            } else {
                // Move to next segment
                currentContent += '<br>';
                currentSegmentIndex++;
                currentCharIndex = 0;
                setTimeout(typeNextChar, 200); // Pause at line breaks
            }
            
            // Keep scroll at the top as text is typed
            storyOutput.scrollTop = 0;
        }
        
        // Start typing
        setTimeout(typeNextChar, 300);
    };
}

/**
 * Background particle effects
 */
function initializeParticles() {
    // Create floating particles in the background
    const createParticles = () => {
        const body = document.querySelector('body');
        const particleCount = 50;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = '2px';
            particle.style.height = '2px';
            particle.style.background = 'rgba(138, 95, 255, 0.5)';
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '-1';
            
            // Random position
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            
            // Random animation
            const duration = 30 + Math.random() * 60;
            const delay = Math.random() * 10;
            
            particle.style.animation = `floatParticle ${duration}s linear ${delay}s infinite`;
            
            body.appendChild(particle);
        }
        
        // Add keyframe animation to stylesheet
        if (!document.querySelector('#particle-style')) {
            const style = document.createElement('style');
            style.id = 'particle-style';
            style.textContent = `
                @keyframes floatParticle {
                    0% {
                        transform: translate(0, 0) rotate(0deg);
                        opacity: 0;
                    }
                    10% {
                        opacity: 0.8;
                    }
                    90% {
                        opacity: 0.8;
                    }
                    100% {
                        transform: translate(${Math.random() > 0.5 ? '+' : '-'}${20 + Math.random() * 30}px, ${Math.random() > 0.5 ? '+' : '-'}${20 + Math.random() * 30}px) rotate(${Math.random() * 360}deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    };
    
    // Initialize particles with a slight delay
    setTimeout(createParticles, 500);
}

/**
 * Sound effects system
 */
function initializeSounds() {
    // Create sound manager
    const soundManager = {
        sounds: {
            click: '/static/sounds/click.mp3',
            success: '/static/sounds/success.mp3',
            ambient: '/static/sounds/ambient.mp3',
            error: '/static/sounds/error.mp3'
        },
        
        // Play a sound with options
        play: function(soundName, options = {}) {
            const soundPath = this.sounds[soundName];
            if (!soundPath) {
                console.warn(`Sound "${soundName}" not found`);
                return;
            }
            
            try {
                const audio = new Audio(soundPath);
                
                // Apply options
                if (options.volume !== undefined) {
                    audio.volume = options.volume;
                }
                
                if (options.loop) {
                    audio.loop = true;
                }
                
                // Play the sound
                audio.play().catch(error => {
                    console.warn(`Failed to play sound "${soundName}":`, error);
                });
                
                return audio;
            } catch (error) {
                console.warn(`Error playing sound "${soundName}":`, error);
                return null;
            }
        }
    };
    
    // Store sound manager in global dungeonEffects object
    window.dungeonEffects.sounds = soundManager;
}
