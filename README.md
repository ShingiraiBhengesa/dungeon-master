# AI DungeonMaster - Choose Your Own AI Adventure 

## Concept

AI DungeonMaster is an immersive, web-based choose-your-own-adventure game where the story, narration, and scene illustrations are generated in real-time by AI. You are the hero, and your choices shape the unfolding narrative. This version features a graphical user interface with dark mode.

## Features

* **Web Interface:** Playable in a web browser with a dark mode theme.
* **Real-time Story Generation:** Uses OpenAI's LLM (`gpt-4o-mini` by default) via a Flask backend.
* **AI-Generated Scene Art:** Uses OpenAI's DALL-E 3 to generate illustrations displayed directly in the browser.
* **AI-Generated Narration:** Uses OpenAI's TTS (`tts-1` by default) with an integrated HTML5 audio player.
* **Interactive Choices:** Clickable buttons for story progression.
* **Loading Animations:** Visual feedback while waiting for AI generation.

## Setup Instructions

1.  **Clone the Repository (or create the files):**
    ```bash
    git clone <repository_url> # Or manually create the directory and files
    cd ai-dungeonmaster-web
    ```

2.  **Create Directories:**
    ```bash
    # Create directory for temporary audio files (if it doesn't exist)
    mkdir -p generated_assets/audio
    ```

3.  **Create a Virtual Environment (Recommended):**
    ```bash
    python -m venv venv
    # Activate the virtual environment
    # On Windows:
    .\venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate
    ```

4.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Set Up API Key:**
    * You need an API key from OpenAI. Get one at [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys).
    * Create a file named `.env` in the project's root directory.
    * Add your API key to the `.env` file like this:
        ```
        OPENAI_API_KEY=your_openai_api_key_here
        ```
    * **IMPORTANT:** Add `.env` and `generated_assets/` to your `.gitignore` file.

## How to Run

1.  Make sure your virtual environment is activated.
2.  Run the Flask development server from the project's root directory:
    ```bash
    flask run --port 5001
    # Or directly using python:
    # python app.py
    ```
3.  Open your web browser and navigate to `http://127.0.0.1:5001` (or the address provided by Flask).
4.  Enter your initial prompt and click "Begin Adventure". Interact with the game using the choice buttons.

## Dependencies

See `requirements.txt`. Key dependencies include:

* `openai`: For interacting with OpenAI APIs.
* `python-dotenv`: For loading the API key from the `.env` file.
* `Flask`: Web framework for the backend.
* `requests`: For potential HTTP requests (like downloading images if needed, though handled via URL now).

