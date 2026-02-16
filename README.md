# WhisperApp 🎙️

WhisperApp is a powerful, privacy-focused React Native application that brings **local, on-device audio transcription** to your mobile device using OpenAI's Whisper model. 

Built with **Expo** and **whisper.rn**, this app performs all inference directly on your phone. This means your audio **never leaves your device**, ensuring complete privacy and full offline functionality.

## ✨ Key Features

- **On-Device Transcription:** No internet connection required. Fast, accurate, and private.
- **Real-time & File Mode:** Transcribe live audio or process existing files.
- **Bluetooth Real-time Streaming:** Stream your transcriptions live to your Linux system via Bluetooth Low Energy (BLE).
- **Multiple Models:** Support for various Whisper model sizes (Tiny, Base, Small, Medium, Large) to balance speed and accuracy.
- **Multilingual Support:** Transcribe English and other languages (via Multilingual models).
- **Text-to-Speech (TTS):** Listen to your transcribed text with built-in speech synthesis.
- **Modern UI:** A beautiful "Glassmorphism" design using `expo-blur` and linear gradients.
- **Customizable:** Easy settings to switch models, languages, and quantization levels.

## 🛠️ Tech Stack

### Mobile App
- **Framework:** [Expo](https://expo.dev/) (SDK 54) / React Native
- **Core Engine:** [whisper.rn](https://github.com/mrousavy/whisper.rn)
- **Bluetooth:** `react-native-ble-plx`
- **Navigation:** Expo Router
- **Audio:** `expo-audio` (Recording) & `expo-speech` (TTS)

### Linux Receiver
- **Language:** Python 3
- **BLE Library:** `bless` (Bluetooth Low Energy Server Software)
- **UI:** `blessed` (Terminal styling)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Bun](https://bun.sh/) (Optional, but recommended for speed)
- Android/iOS device for testing (Bluetooth functionality requires a physical device)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/whisper-app.git
    cd whisper-app
    ```

2.  **Install mobile dependencies:**
    ```bash
    bun install
    ```

3.  **Run the app:**
    ```bash
    npx expo run:android # or run:ios
    ```
    *Note: Bluetooth features require a development build (`npx expo run:android`) and will not work in Expo Go.*

## 📖 Usage Guide

### 1. Basic Transcription
- **Download a Model:** Go to **Settings**, choose a model (e.g., `Base English`), and tap **Download**.
- **Start Transcribing:** Go to the **Transcription** screen and tap the **Microphone** button.
- **Text-to-Speech:** Tap the speaker icon next to any message to hear it.

### 2. Bluetooth Streaming (Linux)
WhisperApp can stream transcriptions directly to your Linux terminal as you speak.

#### Set up the Linux Receiver:
1. Navigate to the receiver directory:
   ```bash
   cd receiver
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
3. Install requirements:
   ```bash
   pip install bless blessed
   ```
4. Run the receiver (may require sudo for Bluetooth advertising):
   ```bash
   sudo ./venv/bin/python receiver.py
   ```

#### Connect from the App:
1. Ensure the receiver is running on your Linux machine.
2. In WhisperApp, go to **Settings**.
3. Under **Bluetooth Transfer**, tap **Scan for Devices**.
4. Select **WhisperLinux** from the list.
5. Once connected, go back to **Transcription** and start speaking. Your text will appear live on your Linux terminal!

## ⚙️ Model Configuration

- **Tiny / Base:** Recommended for older devices or fastest response.
- **Small / Medium:** Better accuracy, requires more RAM/Storage.
- **Quantization:** Use `Q5` or `Q8` for compressed models with minimal accuracy loss.

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a Pull Request.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
