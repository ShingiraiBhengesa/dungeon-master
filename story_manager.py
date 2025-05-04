# -*- coding: utf-8 -*-
"""Manages the game state, including story history and current scene details.

This module defines a class to hold the conversation history formatted for
the OpenAI API, the current scene description, and the available choices.
"""

import logging

# --- Constants ---
INITIAL_SYSTEM_PROMPT = """You are an AI Dungeon Master creating a dynamic choose-your-own-adventure story.
Follow these instructions precisely:
1.  **Narrate Vividly:** Describe scenes, characters, and events with engaging detail. Use sensory language. Keep descriptions concise but atmospheric (2-4 paragraphs usually).
2.  **Maintain Coherence:** Ensure the story flows logically based on the player's previous choices and the established narrative. Remember key details.
3.  **Offer Choices:** After describing the scene, ALWAYS provide 3 distinct, numbered choices for the player. Each choice should lead to a different, meaningful consequence or path.
4.  **Format Output STRICTLY:** Your entire response MUST follow this format:
    SCENE:
    [Your narrative description for the current scene goes here.]

    CHOICES:
    1. [Action or decision choice 1]
    2. [Action or decision choice 2]
    3. [Action or decision choice 3]
    Do NOT add any extra text, greetings, or commentary outside this structure.
"""

class StoryManager:
    """Manages the story progression and state for the AI Dungeon Master game."""

    def __init__(self, system_prompt: str = INITIAL_SYSTEM_PROMPT):
        """Initializes the StoryManager with a system prompt."""
        self.history: list[dict] = [{"role": "system", "content": system_prompt}]
        self.current_scene: str | None = None
        self.current_choices: list[str] | None = None
        logging.info("StoryManager initialized.")

    def start_story(self, initial_user_prompt: str):
        """Adds the initial user prompt to the story history."""
        if not initial_user_prompt:
            logging.warning("Attempted to start story with an empty prompt.")
            return
        self.add_user_message(initial_user_prompt)
        logging.info(f"Story started with initial prompt: '{initial_user_prompt[:50]}...'")

    def add_user_message(self, message: str):
        """Adds a user message (player's choice/action) to the history."""
        if not message:
            logging.warning("Attempted to add an empty user message.")
            return
        self.history.append({"role": "user", "content": message})
        logging.debug(f"Added user message: '{message[:50]}...'")

    def add_assistant_message(self, message: str):
        """Adds an assistant message (AI's response/story part) to the history."""
        if not message:
            logging.warning("Attempted to add an empty assistant message.")
            return
        self.history.append({"role": "assistant", "content": message})
        logging.debug(f"Added assistant message: '{message[:50]}...'")

    def update_state(self, scene: str | None, choices: list[str] | None, full_assistant_response: str | None):
        """Updates the current scene and choices, and adds the AI response to history."""
        self.current_scene = scene
        self.current_choices = choices if choices else [] # Ensure it's a list

        if full_assistant_response:
            # Only add if it's not None or empty, prevent adding error messages to history
            if isinstance(full_assistant_response, str) and full_assistant_response.strip():
                 self.add_assistant_message(full_assistant_response)
            else:
                 logging.warning("Attempted to update state with empty or non-string assistant response.")
        else:
            logging.warning("Attempted to update state with no assistant response provided.")

        logging.info("Story state updated.")
        logging.debug(f"Current Scene: {self.current_scene[:50] if self.current_scene else 'None'}...")
        logging.debug(f"Current Choices: {self.current_choices}")

    def get_history(self) -> list[dict]:
        """Returns the current conversation history."""
        return self.history

    def get_current_scene(self) -> str | None:
        """Returns the current scene description."""
        return self.current_scene

    def get_current_choices(self) -> list[str]:
        """Returns the current available choices."""
        return self.current_choices if self.current_choices else []

# --- Example Usage (for testing) ---
if __name__ == "__main__":
    print("Testing StoryManager...")
    manager = StoryManager()
    print("Initial History:", manager.get_history())
    start_prompt = "Begin in a dark, spooky forest."
    manager.start_story(start_prompt)
    print("\nHistory after starting:", manager.get_history())
    simulated_ai_response = """SCENE:
The ancient trees loom over you...

CHOICES:
1. Investigate the rustling sound.
2. Light a torch.
3. Stay still."""
    simulated_scene = "The ancient trees loom over you..."
    simulated_choices = ["Investigate the rustling sound.", "Light a torch.", "Stay still."]
    manager.update_state(simulated_scene, simulated_choices, simulated_ai_response)
    print("\nHistory after AI response:", manager.get_history())
    print("\nCurrent Scene:", manager.get_current_scene())
    print("Current Choices:", manager.get_current_choices())
    user_choice_text = "1. Investigate the rustling sound."
    manager.add_user_message(f"My choice: {user_choice_text}")
    print("\nHistory after user choice:", manager.get_history())
