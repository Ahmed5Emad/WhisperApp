# WhisperApp 🎙️

WhisperApp is a powerful, privacy-focused React Native application that brings **local, on-device audio transcription** to your mobile device using OpenAI's Whisper model. 

Built with **Expo** and **whisper.rn**, this app performs all inference directly on your phone. This means your audio **never leaves your device**, ensuring complete privacy and full offline functionality.

## ✨ Key Features

- **On-Device Transcription:** No internet connection required. Fast, accurate, and private.
- **Real-time & File Mode:** Transcribe live audio or process existing files (coming soon).
- **Multiple Models:** Support for various Whisper model sizes (Tiny, Base, Small, Medium, Large) to balance speed and accuracy.
- **Multilingual Support:** Transcribe English and other languages (via Multilingual models).
- **Text-to-Speech (TTS):** Listen to your transcribed text with built-in speech synthesis.
- **Modern UI:** A beautiful "Glassmorphism" design using `expo-blur` and linear gradients.
- **Customizable:** easy settings to switch models, languages, and quantization levels.

## 🛠️ Tech Stack

- **Framework:** [Expo](https://expo.dev/) (SDK 54) / React Native
- **Core Engine:** [whisper.rn](https://github.com/mrousavy/whisper.rn) (binding for [Whisper.cpp](https://github.com/ggerganov/whisper.cpp))
- **Navigation:** Expo Router
- **State Management:** React Hooks & Async Storage
- **Audio:** `expo-audio` (Recording) & `expo-speech` (TTS)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Expo Go](https://expo.dev/client) app on your phone, or an Android/iOS emulator.
- *Note:* For the best performance with `whisper.rn`, a development build or prebuild is often recommended over Expo Go, though basic functionality may work.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/whisper-app.git
    cd whisper-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    bun install
    ```

3.  **Run the app:**
    ```bash
    npx expo start
    ```

4.  **Launch on Device:**
    - Scan the QR code with your phone (using the Expo Go app or Camera app).
    - Or press `a` to run on Android Emulator / `i` to run on iOS Simulator.

## 📖 Usage Guide

1.  **Download a Model:**
    - Go to **Settings**.
    - Choose a model size (e.g., `Tiny` for speed, `Base` for balance).
    - Select `English` or `Multilingual`.
    - Tap **Download**.

2.  **Start Transcribing:**
    - Go to the **Home** or **Transcription** screen.
    - Tap the **Microphone** button to start recording.
    - Speak clearly! The text will appear in real-time (or after processing depending on mode).
    - Tap **Stop** to finish.

3.  **Text-to-Speech:**
    - Tap the small speaker icon next to any transcribed message to hear it read aloud.

## ⚙️ Model Configuration

You can manage downloaded models in the **Settings** screen.

- **Tiny / Base:** Recommended for older devices or fastest response.
- **Small / Medium:** Better accuracy, requires more RAM/Storage.
- **Quantization:**
  - `Standard`: Highest accuracy.
  - `Q5 / Q8`: Compressed models (smaller size, slightly faster, minimal accuracy loss).

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a Pull Request.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
