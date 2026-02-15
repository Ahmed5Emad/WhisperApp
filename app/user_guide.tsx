import React from "react";
import { StyleSheet, View, Text, Pressable, ScrollView } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from "expo-router";
import { BackIcon } from '../components/Icons';

export default function UserGuide() {
  const router = useRouter();

  const sections = [
    {
      title: "1. Getting Started",
      content: "Welcome to WhisperApp! This app uses OpenAI's Whisper models to perform high-quality, local transcription directly on your device. No data ever leaves your phone."
    },
    {
      title: "2. Connecting",
      content: "Tap the 'Connect' button on the home screen to begin. This will take you to the connection interface where the app prepares the audio environment."
    },
    {
      title: "3. Downloading Models",
      content: "Before transcribing, you need to download a model. Go to Settings (top-right icon) and select a model size. 'Tiny' is fastest, while 'Large' is most accurate. You can also choose between English-only and Multilingual models."
    },
    {
      title: "4. Transcription",
      content: "Once a model is downloaded and set as active, tap the microphone button in the transcription view to start speaking. You'll see your speech converted to text in real-time."
    },
    {
      title: "5. Languages",
      content: "In Settings, you can switch between English and Arabic. This affects both the transcription recognition and the Text-to-Speech playback."
    }
  ];

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
        <Text style={styles.headerTitle}>User Guide</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <View style={styles.glassContainer}>
              <BlurView intensity={40} tint="light" style={styles.blurContent}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionText}>{section.content}</Text>
              </BlurView>
            </View>
          </View>
        ))}
        
        <View style={styles.footer}>
          <Pressable 
            onPress={() => router.replace('/' as any)}
            style={styles.homeButton}
          >
            <Text style={styles.homeButtonText}>Return to Home</Text>
          </Pressable>
          <Text style={styles.footerText}>WhisperApp v1.0.0</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
    borderRadius: 12,
    marginRight: 15,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#424242",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  glassContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.5)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  blurContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E66F5",
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 15,
    color: "#424242",
    lineHeight: 22,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: "#888",
  },
  homeButton: {
    backgroundColor: "rgba(46, 102, 245, 0.1)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(46, 102, 245, 0.3)",
  },
  homeButtonText: {
    color: "#2E66F5",
    fontWeight: "bold",
    fontSize: 14,
  }
});