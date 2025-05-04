# -*- coding: utf-8 -*-
"""Flask backend for the AI DungeonMaster web application.

Handles API requests from the frontend, manages game state using StoryManager,
and interacts with OpenAI APIs via OpenAIHandler.
"""

import os
import logging
import uuid
import sys
import traceback # Import traceback for detailed error logging
from pathlib import Path
from flask import Flask, request, jsonify, render_template, send_from_directory
from dotenv import load_dotenv
# from werkzeug.utils import safe_join # Optional for safer path joining

# Import local modules
try:
    import openai_handler
    import story_manager
except ImportError as e:
    logging.error(f"Failed to import local modules: {e}. Make sure openai_handler.py and story_manager.py are accessible.")
    sys.exit(1)

# --- Configuration ---
load_dotenv()
# Use a formatter for more detailed logs
log_formatter = logging.Formatter('%(asctime)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s')
log_handler = logging.StreamHandler(sys.stdout) # Log to stdout
log_handler.setFormatter(log_formatter)
# Get the root logger
logger = logging.getLogger()
logger.addHandler(log_handler)
logger.setLevel(logging.INFO) # Set desired log level (INFO, DEBUG, ERROR)

# --- Flask App Initialization ---
app = Flask(__name__, template_folder='templates', static_folder='static')
app.secret_key = os.urandom(24) # Important for session security if you add Flask sessions

# --- Constants & Setup ---
AUDIO_FOLDER = Path("generated_assets/audio")
AUDIO_FOLDER.mkdir(parents=True, exist_ok=True)
# In-memory storage for game states (simple approach)
# WARNING: This will lose state if the server restarts. Consider databases (SQLite, Redis) for persistence.
game_states = {}

# --- Helper Functions ---
def get_or_create_game_state(session_id):
    """Retrieves or creates a game state for a given session ID."""
    if session_id not in game_states:
        logger.info(f"Creating new game state for session: {session_id}")
        game_states[session_id] = story_manager.StoryManager()
    # Add cleanup logic here eventually if states grow too large in memory
    return game_states[session_id]

# --- Routes ---
@app.route('/')
def index():
    """Serves the main HTML page."""
    session_id = str(uuid.uuid4()) # Simple session ID per visit
    logger.info(f"Serving index page for new session: {session_id}")
    return render_template('index.html', session_id=session_id)

@app.route('/start', methods=['POST'])
def start_game():
    """Starts a new adventure based on the user's initial prompt."""
    session_id = None
    try:
        data = request.json
        if not data: return jsonify({"error": "Request must be JSON"}), 400
        session_id = data.get('session_id')
        initial_prompt = data.get('prompt')

        if not session_id or not initial_prompt:
            logger.error(f"Missing session_id or prompt in /start request. Data: {data}")
            return jsonify({"error": "Missing session_id or prompt"}), 400

        logger.info(f"Starting game for session {session_id} with prompt: '{initial_prompt[:50]}...'")
        story = get_or_create_game_state(session_id)
        story.__init__() # Reset story manager
        story.start_story(initial_prompt)

        return generate_next_scene(story, session_id)
    except Exception as e:
        logger.exception(f"Unexpected error in /start route for session {session_id}: {e}")
        return jsonify({"error": "An unexpected error occurred while starting the game."}), 500


@app.route('/choose', methods=['POST'])
def make_choice():
    """Processes the player's choice and generates the next scene."""
    session_id = None
    try:
        data = request.json
        if not data: return jsonify({"error": "Request must be JSON"}), 400
        session_id = data.get('session_id')
        choice_text = data.get('choice')

        if not session_id or not choice_text:
            logger.error(f"Missing session_id or choice in /choose request. Data: {data}")
            return jsonify({"error": "Missing session_id or choice"}), 400

        logger.info(f"Processing choice for session {session_id}: '{choice_text}'")
        # Check if session exists before accessing
        if session_id not in game_states:
             logger.error(f"Session ID not found: {session_id}")
             return jsonify({"error": "Invalid or expired session. Please refresh."}), 400

        story = get_or_create_game_state(session_id)
        story.add_user_message(f"I choose to: {choice_text}")

        return generate_next_scene(story, session_id)
    except Exception as e:
        logger.exception(f"Unexpected error in /choose route for session {session_id}: {e}")
        return jsonify({"error": "An unexpected error occurred while processing your choice."}), 500


def generate_next_scene(story: story_manager.StoryManager, session_id: str):
    """Generates the next scene, choices, image, and audio."""
    history = story.get_history()
    response_data = {"scene": None, "choices": [], "image_url": None, "audio_url": None, "error": None}

    try:
        # 1. Generate Story and Choices
        logger.info(f"[{session_id}] Generating story...")
        scene_text, choices, llm_output = openai_handler.generate_story_and_choices(history)

        if scene_text is None: # Critical LLM error
            error_msg = llm_output if isinstance(llm_output, str) else "Unknown LLM error"
            logger.error(f"[{session_id}] Critical LLM Error: {error_msg}")
            response_data["error"] = f"Failed to generate story: {error_msg}"
            return jsonify(response_data), 500

        raw_assistant_response = llm_output # Store the raw response for history
        story.update_state(scene_text, choices, raw_assistant_response)
        response_data["scene"] = scene_text
        response_data["choices"] = choices if choices else []
        logger.info(f"[{session_id}] Story generated successfully.")

        # --- Asset Generation ---
        asset_errors = []
        # 2. Generate Image URL
        if scene_text: # Only generate if there's text
             logger.info(f"[{session_id}] Generating image...")
             # Construct a good prompt for the image model
             image_prompt = f"Digital painting, dark fantasy atmosphere, illustration for a choose your own adventure game: {scene_text}"
             max_prompt_len = 950
             if len(image_prompt) > max_prompt_len:
                 end_index = image_prompt.rfind('.', 0, max_prompt_len)
                 if end_index == -1: end_index = image_prompt.rfind(' ', 0, max_prompt_len)
                 if end_index == -1: end_index = max_prompt_len
                 image_prompt = image_prompt[:end_index].strip() + "..."

             image_url, image_error = openai_handler.generate_image_url(image_prompt)
             if image_error:
                 logger.error(f"[{session_id}] Image generation error: {image_error}")
                 asset_errors.append(f"Image Error: {image_error}")
             elif image_url:
                 response_data["image_url"] = image_url
                 logger.info(f"[{session_id}] Image URL generated.")
             else: # No error, but no URL returned (e.g., empty prompt handled in handler)
                 logger.info(f"[{session_id}] Image generation skipped or returned no URL.")
        else:
             logger.info(f"[{session_id}] Skipping image generation (no scene text).")

        # 3. Generate Audio URL
        if scene_text: # Only generate if there's text
            logger.info(f"[{session_id}] Generating audio...")
            saved_path, audio_error = openai_handler.generate_audio_narration(
                text=scene_text, output_dir=AUDIO_FOLDER, filename_prefix=f"{session_id}_turn"
            )
            if audio_error:
                 logger.error(f"[{session_id}] Audio generation error: {audio_error}")
                 asset_errors.append(f"Audio Error: {audio_error}")
            elif saved_path:
                response_data["audio_url"] = f"/audio/{saved_path.name}"
                logger.info(f"[{session_id}] Audio URL generated: {response_data['audio_url']}")
            else: # No error, but no path returned (e.g., empty prompt handled in handler)
                logger.info(f"[{session_id}] Audio generation skipped or returned no path.")
        else:
             logger.info(f"[{session_id}] Skipping audio generation (no scene text).")

        # Consolidate asset errors for frontend
        if asset_errors:
            response_data["error"] = "; ".join(asset_errors)
            logger.warning(f"[{session_id}] Completed scene generation with asset errors: {response_data['error']}")
        else:
             logger.info(f"[{session_id}] Scene and assets generated without errors.")

        return jsonify(response_data), 200 # OK, even with asset errors

    except Exception as e:
        logger.exception(f"[{session_id}] Unexpected error in generate_next_scene: {e}\n{traceback.format_exc()}")
        response_data["error"] = "An unexpected server error occurred while generating the scene."
        return jsonify(response_data), 500


@app.route('/audio/<path:filename>') # Use path converter for safety
def serve_audio(filename):
    """Serves the generated audio files safely."""
    logger.debug(f"Request to serve audio file: {filename}")
    try:
        # send_from_directory handles security checks like preventing directory traversal
        return send_from_directory(AUDIO_FOLDER.resolve(), filename, as_attachment=False)
    except FileNotFoundError:
        logger.error(f"Audio file not found: {filename} in {AUDIO_FOLDER}")
        return jsonify({"error": "Audio file not found"}), 404
    except Exception as e: # Catch potential permission errors etc.
        logger.error(f"Error serving audio file {filename}: {e}")
        return jsonify({"error": "Could not serve audio file"}), 500

# --- Error Handling ---
@app.errorhandler(404)
def not_found_error(error):
    logger.warning(f"404 Not Found error: {request.url}")
    if request.accept_mimetypes.accept_json and not request.accept_mimetypes.accept_html:
        return jsonify({"error": "Not Found"}), 404
    return "404 Not Found", 404 # Basic HTML response

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal Server Error triggered: {error}")
    logger.exception("Detailed traceback:")
    if request.accept_mimetypes.accept_json and not request.accept_mimetypes.accept_html:
         return jsonify({"error": "Internal Server Error"}), 500
    return "500 Internal Server Error", 500 # Basic HTML response

# --- Run the App ---
if __name__ == '__main__':
    logger.info("Checking OpenAI client initialization status...")
    openai_client_instance = getattr(openai_handler, 'client', None)

    if openai_client_instance:
        logger.info("OpenAI client seems initialized. Starting Flask app...")
        # Set debug=True for development (auto-reload, interactive debugger)
        # Set debug=False for production or more stable testing
        app.run(host='0.0.0.0', port=5001, debug=True)
    else:
        logger.error("OpenAI client attribute 'client' not found or is None in openai_handler.")
        print("\n" + "="*60)
        print(" ERROR: OpenAI client failed to initialize or is not accessible.")
        print(" Please check:")
        print("   1. Your OPENAI_API_KEY in the .env file (is it correct?).")
        print("   2. The location of the .env file (should be in the same directory as app.py).")
        print("   3. Your internet connection.")
        print("   4. Any error messages above this one in the log.")
        print("="*60 + "\n")
        sys.exit(1)
