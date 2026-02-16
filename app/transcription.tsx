import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, Text, Pressable, ScrollView, ActivityIndicator, Alert, LogBox } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- IMPORTS ---
import * as FileSystem from 'expo-file-system/legacy';
import { AudioModule } from 'expo-audio';
import * as Speech from 'expo-speech';
// @ts-ignore
import * as WhisperRN from 'whisper.rn';

// --- CUSTOM COMPONENTS ---
import { MicIcon, WaveformIcon, StopIcon, MicStartIcon, KeyboardIcon, BackIcon } from '@/components/Icons';
import { useBluetooth } from '../context/BluetoothContext';

const { initWhisper, RealtimeTranscriber } = WhisperRN;

// --- SILENCE LOGS ---
LogBox.ignoreLogs(['transcribeRealtime', 'Falling back', 'statusBarTranslucent']);
const originalWarn = console.warn;
console.warn = (...args) => {
  const log = args.join(' ');
  if (log.includes('transcribeRealtime') || log.includes('statusBarTranslucent')) return;
  originalWarn(...args);
};

// --- MAIN COMPONENT ---

export default function Transcription() {
  const router = useRouter();
  const { connectedDevice, sendData } = useBluetooth();
  const [modelReady, setModelReady] = useState(false);
  const [modelPath, setModelPath] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedModel, setSelectedModel] = useState('tiny.en');
  const [messages, setMessages] = useState<string[]>([]);
  const [currentText, setCurrentText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("Initializing...");

  const realtimeRef = useRef<any>(null);
  const stopLegacyRef = useRef<(() => Promise<void>) | null>(null);
  const whisperContextRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Track last sent text to avoid repetition
  const lastSentTextRef = useRef("");
  const currentTextRef = useRef("");
  const silenceTimerRef = useRef<any>(null);
  const lastFinalizedTextRef = useRef("");
  const sessionPrefixRef = useRef("");

  useEffect(() => {
    setupApp();
    return () => {
      stopRecordingSession();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      Speech.stop();
    };
  }, []);

  useEffect(() => {
    if (modelReady && !isRecording && messages.length === 0 && currentText === "") {
      toggleRecording();
    }
  }, [modelReady]);

  useEffect(() => {
    currentTextRef.current = currentText;
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, currentText]);

  // --- TTS Handler ---
  const speakText = (text: string) => {
    Speech.stop(); 
    Speech.speak(text, { language: selectedLanguage === 'ar' ? 'ar-SA' : 'en-US', pitch: 1.0, rate: 0.9 });
  };

  const stopRecordingSession = async () => {
    try {
      if (realtimeRef.current) {
        await realtimeRef.current.stop();
        await realtimeRef.current.release();
        realtimeRef.current = null;
      }
      if (stopLegacyRef.current) {
        await stopLegacyRef.current();
        stopLegacyRef.current = null;
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert("Permission Required", "Go to Settings > Apps and enable Microphone access.");
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  };

  const setupApp = async () => {
    try {
      const lang = await AsyncStorage.getItem('language');
      const model = await AsyncStorage.getItem('model');
      if (lang) setSelectedLanguage(lang);
      if (model) setSelectedModel(model);
      
      await setupModel(model || 'tiny.en');
    } catch (e) {
      console.error("Setup error:", e);
      setStatus("Error loading settings");
    }
  };

  const setupModel = async (modelId: string) => {
    setStatus("Checking Model...");
    const FS = FileSystem;
    
    if (!FS.documentDirectory) {
      setStatus("Error: FileSystem Invalid");
      return;
    }

    const fileDir = FS.documentDirectory + 'whisper-models/';
    const fileUri = fileDir + `ggml-${modelId}.bin`;
    
    // Default URL if not found (fallback)
    const modelUrls: Record<string, string> = {
      'tiny.en': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin',
      'base.en': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin',
      'tiny': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin',
      'base': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
    };

    try {
      const dirInfo = await FS.getInfoAsync(fileDir);
      if (!dirInfo.exists) await FS.makeDirectoryAsync(fileDir);

      const fileInfo = await FS.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        setStatus("Downloading Model...");
        const url = modelUrls[modelId] || modelUrls['tiny.en'];
        await FS.downloadAsync(url, fileUri);
      }

      setModelPath(fileUri);
      
      setStatus("Loading Core...");
      if (initWhisper) {
        whisperContextRef.current = await initWhisper({ filePath: fileUri });
        setModelReady(true);
        setStatus("Ready");
      } else {
        setStatus("Error: initWhisper missing");
      }

    } catch (error) {
      console.error("Setup error:", error);
      setStatus("Error loading model");
    }
  };

  const handleNewTranscription = (text: string) => {
    if (!text) return;

    // --- SESSION REPETITION DETECTION ---
    // Detect if Whisper is repeating the last finalized message at the start of a new segment
    if (lastSentTextRef.current === "" && sessionPrefixRef.current === "" && lastFinalizedTextRef.current !== "") {
       const trimmedText = text.trim().toLowerCase();
       const trimmedFinalized = lastFinalizedTextRef.current.trim().toLowerCase();
       
       // If the new transcription starts with the last finalized text, mark it as a prefix to ignore
       if (trimmedText.startsWith(trimmedFinalized)) {
          sessionPrefixRef.current = text.slice(0, lastFinalizedTextRef.current.length);
       }
    }

    // Clean the incoming text by removing the detected session prefix
    let cleanText = text;
    if (sessionPrefixRef.current && text.startsWith(sessionPrefixRef.current)) {
       cleanText = text.slice(sessionPrefixRef.current.length);
    }

    // If no new content after cleaning or it matches the last sent part, skip
    if (!cleanText || cleanText === lastSentTextRef.current) return;

    // Filter out noise/hallucination tokens common in silence 
    const noisePatterns = [/\[BLANK_AUDIO\]/i, /\[music\]/i, /\[silence\]/i, /\[noise\]/i, /\(music\)/i , /\[SOUND]/i ];
    if (noisePatterns.some(pattern => pattern.test(cleanText))) return;

    // Check if it's an extension of what we already have in this segment
    let delta = "";
    if (cleanText.startsWith(lastSentTextRef.current)) {
      delta = cleanText.slice(lastSentTextRef.current.length);
    } else {
      // If it's completely different, treat the whole thing as new (or a reset)
      delta = " " + cleanText;
    }

    if (delta.trim().length > 0) {
      setCurrentText(cleanText);
      if (connectedDevice) {
        sendData(delta);
      }
      lastSentTextRef.current = cleanText;

      // --- HANDS-FREE SILENCE DETECTION ---
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(async () => {
        if (currentTextRef.current.trim().length > 0) {
          // Commit current text to messages
          setMessages(prev => [...prev, currentTextRef.current]);
          lastFinalizedTextRef.current = currentTextRef.current;
          setCurrentText("");
          lastSentTextRef.current = "";
          sessionPrefixRef.current = "";

          // Restart session to clear internal Whisper buffer
          await stopRecordingSession();
          setIsRecording(false);
          
          // Brief pause then restart
          setTimeout(() => {
            toggleRecording();
          }, 300);
        }
      }, 2000); // 2 seconds of silence triggers finalization
    }
  };

  const toggleRecording = async () => {
    if (!modelReady || !modelPath) return;

    if (isRecording) {
      // --- STOP ---
      await stopRecordingSession();
      setIsRecording(false);
      
      if (currentText.trim().length > 0) {
        setMessages(prev => [...prev, currentText]);
        lastFinalizedTextRef.current = currentText;
        setCurrentText("");
        lastSentTextRef.current = "";
        sessionPrefixRef.current = "";
      }
    } else {
      // --- START ---
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) return;

      setIsRecording(true);
      setCurrentText("");
      lastSentTextRef.current = "";
      sessionPrefixRef.current = "";
      
      try {
        if (RealtimeTranscriber) {
           const realtime = new RealtimeTranscriber({
             filePath: modelPath,
             language: selectedLanguage,
             maxLen: 1,
             beamSize: 1,
             realtimeAudioSec: 60,
             vad: { enable: true, lowThreshold: 0.6, minSpeechDurationMs: 100 }
           });
           
           realtime.on('transcribe', (data: any) => {
             if (data?.result) {
               handleNewTranscription(data.result);
             }
           });
           
           await realtime.start();
           realtimeRef.current = realtime;

        } else if (whisperContextRef.current) {
           // Legacy Fallback
           const options: any = {
             language: selectedLanguage, maxLen: 1, beamSize: 1, realtimeAudioSec: 60, audioSessionOnStart: true, 
           };

           const { stop, subscribe } = await whisperContextRef.current.transcribeRealtime(options);
           stopLegacyRef.current = stop;

           subscribe((event: any) => {
             if (event.data?.result) {
               handleNewTranscription(event.data.result);
             }
           });
        }
      } catch (e) {
        setIsRecording(false);
        const errStr = String(e);
        if (errStr.includes("-100")) {
           Alert.alert("Microphone Error", "Initialization failed (State: -100). Restart app.");
        } else {
           Alert.alert("Error", "Could not start recording.");
        }
      }
    }
  };

  return (
    <LinearGradient
      colors={['#C7BEF4', '#EBF4BE']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <BackIcon color="#424242" />
        </Pressable>
        <Text style={styles.headerTitle}>Transcription</Text>
        {connectedDevice && (
          <View style={styles.btStatus}>
            <View style={styles.btDot} />
            <Text style={styles.btText}>Live</Text>
          </View>
        )}
      </View>

      <View style={styles.bigFrame}>
        {!modelReady && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator color="#2E66F5" />
            <Text style={styles.statusText}>{status}</Text>
          </View>
        )}

        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && currentText === "" && modelReady && (
            <View style={styles.messageBubbleFull}>
              <Text style={styles.messageText}>Hands-free mode active. Start speaking and I will transcribe automatically.</Text>
            </View>
          )}

          {messages.map((msg, index) => (
            <View key={index} style={styles.messageBubbleFull}>
              <Text style={styles.messageText}>{msg}</Text>
              <Pressable 
                style={styles.micContainer}
                onPress={() => speakText(msg)}
                hitSlop={15}
              >
                <MicIcon width={12} height={16} color="#424242" />
              </Pressable>
            </View>
          ))}

          {currentText.length > 0 && (
            <View style={[styles.messageBubbleFull, styles.activeBubble]}>
              <Text style={styles.messageText}>{currentText}</Text>
              <View style={styles.micContainer}>
                <ActivityIndicator size="small" color="#2E66F5" />
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      <View style={styles.footerGlass}>
        <BlurView intensity={50} tint="light" style={styles.footerContent}>
          <Pressable style={styles.iconButton} onPress={() => router.push('/settings')}>
             <KeyboardIcon width={28} height={28} color="#424242" />
          </Pressable>
          <View style={styles.glassContainerWave}>
             <WaveformIcon color={isRecording ? "#FF4B4B" : "#2E66F5"} />
          </View>
          <Pressable 
            style={[styles.iconButton, isRecording && styles.recordingActive]} 
            onPress={toggleRecording}
            disabled={!modelReady}
          >
            {isRecording ? (
              <StopIcon width={32} height={32} color="#FF4B4B" />
            ) : (
              <MicStartIcon width={32} height={32} color={!modelReady ? "#ccc" : "#2E66F5"} />
            )}
          </Pressable>
        </BlurView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    gap: 20,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
    position: 'relative',
  },
  backButton: {
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 12,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#424242",
  },
  btStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
    gap: 6,
  },
  btDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  btText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#424242',
  },
  bigFrame: {
    flex: 1,
    width: "100%",
    paddingVertical: 15,
    borderRadius: 20,
    gap: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.5)",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    overflow: 'hidden',
  },
  loaderContainer: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  statusText: {
    color: "#555",
    fontSize: 14,
  },
  scrollView: {
    width: "100%",
  },
  scrollContent: {
    paddingHorizontal: 15,
    gap: 10,
    paddingBottom: 20,
  },
  messageBubbleFull: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    padding: 15,
    paddingBottom: 25,
    borderRadius: 10,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderLeftColor: '#2E66F5',
    borderRightColor: '#2E66F5',
    position: 'relative',
  },
  activeBubble: {
    borderLeftColor: '#FF4B4B',
    borderRightColor: '#FF4B4B',
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
  messageText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#424242",
    lineHeight: 22,
  },
  micContainer: {
    position: 'absolute',
    bottom: 8,
    right: 10,
    padding: 5,
  },
  footerGlass: {
    width: "100%",
    height: 80,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.5)",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  footerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 10,
  },
  iconButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  recordingActive: {
    borderColor: "#FF4B4B",
    backgroundColor: "rgba(255, 75, 75, 0.1)",
  },
  glassContainerWave: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  }
});
