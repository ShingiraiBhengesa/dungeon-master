# -*- coding: utf-8 -*-
"""Handles interactions with the OpenAI API for LLM, TTS, and Image Generation.

This module provides functions to communicate with OpenAI's services,
encapsulating API key management, request formatting, and response parsing.
It relies on the `openai` library and expects the API key to be available
either as an environment variable or through a .env file.
"""

import os
import logging
import uuid # Ensures uuid is imported
from pathlib import Path
from openai import OpenAI, OpenAIError
from dotenv import load_dotenv

# Use a try-except block for robustness when running this file directly
try:
    import story_manager
except ImportError:
    # Define a fallback if running this file directly for testing
    class MockStoryManager:
        INITIAL_SYSTEM_PROMPT = "You are an AI Dungeon Master."
    story_manager = MockStoryManager()
    logging.warning("Could not import 'story_manager', using mock for testing.")


# --- Configuration ---
load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s')


# --- Constants ---
DEFAULT_LLM_MODEL = "gpt-4o-mini"
DEFAULT_TTS_MODEL = "tts-1"
DEFAULT_TTS_VOICE = "alloy"
DEFAULT_IMAGE_MODEL = "dall-e-3"
DEFAULT_IMAGE_SIZE = "1024x1024"
# DEFAULT_IMAGE_QUALITY = "standard" # Removed as it caused an error
MAX_RETRIES = 3

# --- Initialization ---
client: OpenAI | None = None
try:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        logging.error("OPENAI_API_KEY not found in environment variables or .env file.")
    else:
        # Test connection during initialization
        logging.info("Testing OpenAI connection...")
        temp_client = OpenAI()
        temp_client.models.list() # Simple call to check authentication
        client = temp_client
        logging.info("OpenAI connection test successful.")
        logging.info("OpenAI client initialized successfully.")
except OpenAIError as e:
    logging.error(f"Failed to initialize OpenAI client (API Error during connection test): {e}")
except Exception as e:
    logging.error(f"An unexpected error occurred during OpenAI client initialization: {e}")

# --- Core Functions ---

def generate_story_and_choices(story_history: list[dict], llm_model: str = DEFAULT_LLM_MODEL) -> tuple[str | None, list[str] | None, str | None]:
    """Generates the next part of the story and player choices using OpenAI LLM."""
    if not client:
        return None, None, "OpenAI client is not initialized. Check API key and logs."

    logging.info(f"Generating story continuation using model: {llm_model}")
    attempt = 0
    while attempt < MAX_RETRIES:
        try:
            response = client.chat.completions.create(
                model=llm_model,
                messages=story_history,
                temperature=0.7,
                max_tokens=500,
            )
            full_response_text = response.choices[0].message.content
            if not full_response_text:
                logging.warning("Received empty response from LLM.")
                return "", [], ""

            # --- Parsing Logic ---
            scene_description = None
            choices = []
            try:
                scene_marker = "SCENE:"
                choice_marker = "CHOICES:"
                scene_part = full_response_text
                choices_part = ""
                choice_marker_index = full_response_text.find(choice_marker)
                scene_marker_index = full_response_text.find(scene_marker)

                if choice_marker_index != -1:
                    choices_part = full_response_text[choice_marker_index + len(choice_marker):].strip()
                    scene_part = full_response_text[:choice_marker_index].strip()
                    if scene_marker_index != -1 and scene_marker_index < choice_marker_index:
                         scene_part = scene_part[scene_marker_index + len(scene_marker):].strip()
                elif scene_marker_index != -1:
                     scene_part = full_response_text[scene_marker_index + len(scene_marker):].strip()
                     lines = scene_part.split('\n')
                     possible_choice_start = -1
                     for i in range(len(lines) - 1, max(-1, len(lines) - 5), -1):
                         if lines[i].strip().startswith(('1.', '2.', '3.', '4.', '5.')): possible_choice_start = i
                         elif possible_choice_start != -1: break
                     if possible_choice_start != -1:
                         choices_part = "\n".join(lines[possible_choice_start:])
                         scene_part = "\n".join(lines[:possible_choice_start]).strip()
                else: # Neither marker found
                     scene_part = full_response_text.strip()
                     lines = scene_part.split('\n')
                     possible_choice_start = -1
                     for i in range(len(lines) - 1, max(-1, len(lines) - 5), -1):
                         if lines[i].strip().startswith(('1.', '2.', '3.', '4.', '5.')): possible_choice_start = i
                         elif possible_choice_start != -1: break
                     if possible_choice_start != -1:
                         choices_part = "\n".join(lines[possible_choice_start:])
                         scene_part = "\n".join(lines[:possible_choice_start]).strip()

                scene_description = scene_part if scene_part else "(No scene description provided)"

                if choices_part:
                    choices = [
                        line.split('.', 1)[-1].strip()
                        for line in choices_part.split('\n')
                        if line.strip() and '.' in line and len(line.split('.', 1)) > 1
                    ]
                    if not choices:
                        logging.warning(f"Could not parse numbered choices from: {choices_part}")
                        choices = [c.strip() for c in choices_part.split('\n') if c.strip()]

                logging.info(f"Successfully generated scene: '{scene_description[:50] if scene_description else 'None'}...' and {len(choices)} choices.")
                return scene_description, choices, full_response_text
            except Exception as parse_error:
                logging.error(f"Error parsing LLM response: {parse_error}\nResponse: {full_response_text}")
                return full_response_text, [], full_response_text # Return raw text as scene on parse error

        except OpenAIError as e:
            attempt += 1
            logging.warning(f"OpenAI API error (attempt {attempt}/{MAX_RETRIES}): {e}")
            if attempt == MAX_RETRIES:
                error_msg = f"OpenAI API error after {MAX_RETRIES} retries: {e}"
                return None, None, error_msg
        except Exception as e:
            logging.exception("An unexpected error occurred during LLM generation.")
            error_msg = f"An unexpected error occurred: {e}"
            return None, None, error_msg

    return None, None, "LLM generation failed after multiple retries."


def generate_audio_narration(text: str, output_dir: str | Path = "audio", filename_prefix: str = "narration", tts_model: str = DEFAULT_TTS_MODEL, voice: str = DEFAULT_TTS_VOICE) -> tuple[Path | None, str | None]:
    """Generates audio narration and saves it to a file."""
    if not client: return None, "OpenAI client is not initialized."
    if not text: return None, None # No error if text is empty

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    output_file = output_path / f"{filename_prefix}_{uuid.uuid4()}.mp3"

    logging.info(f"Generating audio narration for text: '{text[:50]}...'")
    attempt = 0
    while attempt < MAX_RETRIES:
        try:
            response = client.audio.speech.create(model=tts_model, voice=voice, input=text)
            response.stream_to_file(output_file)
            logging.info(f"Audio narration saved successfully to: {output_file}")
            return output_file, None # Success
        except OpenAIError as e:
            attempt += 1
            logging.warning(f"OpenAI API error during TTS (attempt {attempt}/{MAX_RETRIES}): {e}")
            if attempt == MAX_RETRIES: return None, f"OpenAI API error after {MAX_RETRIES} retries: {e}"
        except Exception as e:
             logging.exception("Unexpected error during TTS generation.")
             return None, f"An unexpected error occurred: {e}"
    return None, "TTS generation failed after multiple retries."


# def generate_image_url(prompt: str, image_model: str = DEFAULT_IMAGE_MODEL, size: str = DEFAULT_IMAGE_SIZE, quality: str = DEFAULT_IMAGE_QUALITY) -> tuple[str | None, str | None]:
# Modified function signature to remove the quality parameter
def generate_image_url(prompt: str, image_model: str = DEFAULT_IMAGE_MODEL, size: str = DEFAULT_IMAGE_SIZE) -> tuple[str | None, str | None]:
    """Generates an image based on a prompt using OpenAI DALL-E and returns the image URL."""
    if not client: return None, "OpenAI client is not initialized."
    if not prompt: return None, None # No error if prompt is empty

    logging.info(f"Generating image URL for prompt: '{prompt[:50]}...' using model {image_model}")
    attempt = 0
    while attempt < MAX_RETRIES:
        try:
            response = client.images.generate(
                model=image_model,
                prompt=prompt,
                size=size,
                # quality=quality, # <-- REMOVED this parameter
                n=1,
                response_format="url"
            )

            image_url = response.data[0].url
            if not image_url:
                 logging.error("Image generation succeeded but no URL was returned.")
                 return None, "Image generation succeeded but no URL was returned."
            logging.info(f"Image URL generated successfully: {image_url}")
            return image_url, None # Success
        except OpenAIError as e:
            attempt += 1
            # Check if the error is specifically about the quality parameter again, just in case
            if "unknown parameter: 'quality'" in str(e).lower():
                 logging.error(f"API still rejecting 'quality' parameter even though it was removed? Error: {e}")
                 # Handle this specific case if needed, maybe by trying without size too?
                 # For now, just report the error.
                 return None, f"Persistent API error regarding parameters: {e}"

            logging.warning(f"OpenAI API error during image generation (attempt {attempt}/{MAX_RETRIES}): {e}")
            if attempt == MAX_RETRIES: return None, f"OpenAI API error after {MAX_RETRIES} retries: {e}"
        except Exception as e:
            logging.exception("Unexpected error during image generation.")
            return None, f"An unexpected error occurred: {e}"
    return None, "Image generation failed after multiple retries."


# --- Example Usage (for testing) ---
if __name__ == "__main__":
    print("Testing OpenAI Handler functions...")
    if not client:
        print("OpenAI client failed to initialize. Exiting tests.")
    else:
        print("\n--- Testing LLM Generation ---")
        test_history = [
            {"role": "system", "content": story_manager.INITIAL_SYSTEM_PROMPT},
            {"role": "user", "content": "Start in a quiet moonlit clearing."}
        ]
        scene, choices, llm_output = generate_story_and_choices(test_history)
        is_error = scene is None

        if is_error: print(f"LLM Error: {llm_output}")
        else:
            print(f"Scene: {scene}")
            print(f"Choices: {choices}")
            print(f"Raw Response: {llm_output[:100]}...")

            if scene:
                print("\n--- Testing TTS Generation ---")
                audio_path, tts_error = generate_audio_narration(scene)
                if tts_error: print(f"TTS Error: {tts_error}")
                elif audio_path: print(f"Audio saved to: {audio_path}")
                else: print("TTS skipped (empty scene or other non-error issue).")

            if scene:
                 print("\n--- Testing Image Generation ---")
                 img_gen_prompt = scene.split('.')[0] if '.' in scene else scene
                 img_gen_prompt = f"Fantasy art style illustration of: {img_gen_prompt[:200]}"
                 print(f"Image Prompt: {img_gen_prompt}")
                 # Test the updated function without quality
                 img_url, img_error = generate_image_url(img_gen_prompt)
                 if img_error: print(f"Image Gen Error: {img_error}")
                 elif img_url: print(f"Image URL: {img_url}")
                 else: print("Image Gen skipped (empty scene or other non-error issue).")
