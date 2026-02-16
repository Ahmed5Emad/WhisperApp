import React, { useState, useEffect, useMemo } from "react";
import { StyleSheet, View, Text, Pressable, ActivityIndicator, Alert, ScrollView } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from "expo-router";
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BackIcon, DownloadIcon, CheckIcon, TrashIcon } from '../components/Icons';
import { useBluetooth } from '../context/BluetoothContext';

// --- DATA STRUCTURES ---

const MODEL_FAMILIES = [
  { id: 'tiny', name: 'Tiny', hasEn: true, baseSize: 75 },
  { id: 'base', name: 'Base', hasEn: true, baseSize: 145 },
  { id: 'small', name: 'Small', hasEn: true, baseSize: 480 },
  { id: 'medium', name: 'Medium', hasEn: true, baseSize: 1500 },
  { id: 'large-v1', name: 'Large v1', hasEn: false, baseSize: 3000 },
  { id: 'large-v2', name: 'Large v2', hasEn: false, baseSize: 3000 },
  { id: 'large-v3', name: 'Large v3', hasEn: false, baseSize: 3000 },
  { id: 'large-v3-turbo', name: 'Large v3 Turbo', hasEn: false, baseSize: 1600 },
];

const QUANT_OPTIONS: Record<string, string[]> = {
  'tiny': ['standard', 'q5_1', 'q8_0'],
  'tiny.en': ['standard', 'q5_1', 'q8_0'],
  'base': ['standard', 'q5_1', 'q8_0'],
  'base.en': ['standard', 'q5_1', 'q8_0'],
  'small': ['standard', 'q5_1', 'q8_0'],
  'small.en': ['standard', 'q5_1', 'q8_0'],
  'medium': ['standard', 'q5_0', 'q8_0'],
  'medium.en': ['standard', 'q5_0', 'q8_0'],
  'large-v1': ['standard'],
  'large-v2': ['standard', 'q5_0', 'q8_0'],
  'large-v3': ['standard', 'q5_0'],
  'large-v3-turbo': ['standard', 'q5_0', 'q8_0'],
};

// Helper to estimate size in MB
const getEstSize = (familyId: string, quant: string) => {
  const family = MODEL_FAMILIES.find(f => f.id === familyId);
  if (!family) return 0;
  if (quant === 'standard') return family.baseSize;
  if (quant.startsWith('q5')) return Math.round(family.baseSize * 0.38);
  if (quant.startsWith('q8')) return Math.round(family.baseSize * 0.55);
  return family.baseSize;
};

const LANGUAGES = [
  { id: 'en', name: 'English' },
  { id: 'ar', name: 'Arabic' },
];

export default function Settings() {
  const router = useRouter();
  const { isScanning, devices, connectedDevice, error, scanDevices, connectToDevice, disconnect } = useBluetooth();
  
  // App Settings
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [activeModel, setActiveModel] = useState('tiny.en'); // The one currently used for transcription
  
  // Download Selection State
  const [selFamily, setSelFamily] = useState('tiny');
  const [selType, setSelType] = useState<'en' | 'multilingual'>('en');
  const [selQuant, setSelQuant] = useState('standard');

  // Status State
  const [downloadingModel, setDownloadingModel] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadedModels, setDownloadedModels] = useState<string[]>([]);

  useEffect(() => {
    loadSettings();
    checkDownloadedModels();
  }, []);

  // Update Type and Quant when Family changes
  useEffect(() => {
    const family = MODEL_FAMILIES.find(f => f.id === selFamily);
    if (family && !family.hasEn) setSelType('multilingual');
    setSelQuant('standard');
  }, [selFamily]);

  const loadSettings = async () => {
    try {
      const lang = await AsyncStorage.getItem('language');
      const model = await AsyncStorage.getItem('model');
      if (lang) setSelectedLanguage(lang);
      if (model) setActiveModel(model);
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  };

  const checkDownloadedModels = async () => {
    const FS = FileSystem;
    const fileDir = FS.documentDirectory + 'whisper-models/';
    try {
      const dirInfo = await FS.getInfoAsync(fileDir);
      if (!dirInfo.exists) {
        await FS.makeDirectoryAsync(fileDir);
        setDownloadedModels([]);
        return;
      }
      const files = await FS.readDirectoryAsync(fileDir);
      // files are like ggml-tiny.en.bin or ggml-tiny.en-q5_1.bin
      const downloaded = files
        .filter(f => f.startsWith('ggml-') && f.endsWith('.bin'))
        .map(f => f.replace('ggml-', '').replace('.bin', ''));
      setDownloadedModels(downloaded);
    } catch (e) {
      console.error("Failed to check models", e);
    }
  };

  const saveLanguage = async (lang: string) => {
    setSelectedLanguage(lang);
    await AsyncStorage.setItem('language', lang);
  };

  const currentCombination = useMemo(() => {
    let id = selFamily;
    if (selType === 'en') id += '.en';
    if (selQuant !== 'standard') id += '-' + selQuant;
    return id;
  }, [selFamily, selType, selQuant]);

  const estSize = useMemo(() => getEstSize(selFamily, selQuant), [selFamily, selQuant]);

  const isCurrentDownloaded = downloadedModels.includes(currentCombination);

  const selectActiveModel = async () => {
    if (!isCurrentDownloaded) return;
    setActiveModel(currentCombination);
    await AsyncStorage.setItem('model', currentCombination);
    Alert.alert("Success", `Active model set to ${currentCombination}`);
  };

  const downloadModel = async () => {
    const FS = FileSystem;
    const fileDir = FS.documentDirectory + 'whisper-models/';
    const fileName = `ggml-${currentCombination}.bin`;
    const fileUri = fileDir + fileName;
    const url = `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/${fileName}`;
    
    setDownloadingModel(currentCombination);
    setDownloadProgress(0);

    try {
      const downloadResumable = FS.createDownloadResumable(
        url,
        fileUri,
        {},
        (dp) => {
          const progress = dp.totalBytesWritten / dp.totalBytesExpectedToWrite;
          setDownloadProgress(progress);
        }
      );

      const result = await downloadResumable.downloadAsync();
      if (result) {
        setDownloadedModels(prev => [...prev, currentCombination]);
      }
    } catch (e) {
      console.error("Download error", e);
      Alert.alert("Error", "Failed to download model. Check your internet connection.");
    } finally {
      setDownloadingModel(null);
      setDownloadProgress(0);
    }
  };

  const deleteModel = async (modelName: string) => {
    Alert.alert(
      "Delete Model",
      `Are you sure you want to delete ${modelName}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            const FS = FileSystem;
            const fileUri = FS.documentDirectory + 'whisper-models/' + `ggml-${modelName}.bin`;
            try {
              await FS.deleteAsync(fileUri);
              setDownloadedModels(prev => prev.filter(m => m !== modelName));
              if (activeModel === modelName) {
                setActiveModel('');
                await AsyncStorage.removeItem('model');
              }
              Alert.alert("Success", "Model deleted successfully.");
            } catch (e) {
              console.error("Delete error", e);
              Alert.alert("Error", "Failed to delete model.");
            }
          }
        }
      ]
    );
  };

  const availableQuants = QUANT_OPTIONS[selType === 'en' ? `${selFamily}.en` : selFamily] || ['standard'];

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
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Bluetooth Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bluetooth Transfer</Text>
          <View style={styles.glassContainer}>
            <BlurView intensity={40} tint="light" style={styles.blurContent}>
              <View style={styles.statusBox}>
                <Text style={styles.subLabel}>Status: {connectedDevice ? `Connected to ${connectedDevice.name}` : 'Not Connected'}</Text>
                {error && <Text style={styles.errorText}>{error}</Text>}
                
                <View style={styles.btActionContainer}>
                  {connectedDevice ? (
                    <Pressable onPress={disconnect} style={[styles.actionButton, { backgroundColor: '#FF4B4B' }]}>
                      <Text style={styles.actionButtonText}>Disconnect</Text>
                    </Pressable>
                  ) : (
                    <Pressable onPress={scanDevices} style={styles.actionButton} disabled={isScanning}>
                      {isScanning ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionButtonText}>Scan for Devices</Text>}
                    </Pressable>
                  )}
                </View>

                {!connectedDevice && devices.length > 0 && (
                  <View style={styles.deviceList}>
                    <Text style={styles.subLabel}>Available Devices:</Text>
                    {devices.map((device) => (
                      <Pressable 
                        key={device.id} 
                        style={styles.deviceItem}
                        onPress={() => connectToDevice(device)}
                      >
                        <Text style={styles.deviceText}>{device.name || 'Unknown'}</Text>
                        <Text style={styles.deviceIdText}>{device.id}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </BlurView>
          </View>
          <Text style={styles.hintText}>Connect to your Linux system to stream transcriptions in real-time.</Text>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>
          <View style={styles.glassContainer}>
            <BlurView intensity={40} tint="light" style={styles.blurContent}>
              {LANGUAGES.map((lang) => (
                <Pressable 
                  key={lang.id} 
                  style={styles.optionItem}
                  onPress={() => saveLanguage(lang.id)}
                >
                  <Text style={[styles.optionText, selectedLanguage === lang.id && styles.selectedText]}>
                    {lang.name}
                  </Text>
                  {selectedLanguage === lang.id && <CheckIcon width={20} height={20} />}
                </Pressable>
              ))}
            </BlurView>
          </View>
        </View>

        {/* Model Selection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Model Configuration</Text>
          
          <Text style={styles.subLabel}>Size</Text>
          <View style={styles.chipContainer}>
            {MODEL_FAMILIES.map(f => (
              <Pressable 
                key={f.id} 
                onPress={() => setSelFamily(f.id)}
                style={[styles.chip, selFamily === f.id && styles.activeChip]}
              >
                <Text style={[styles.chipText, selFamily === f.id && styles.activeChipText]}>{f.name}</Text>
              </Pressable>
            ))}
          </View>

          {MODEL_FAMILIES.find(f => f.id === selFamily)?.hasEn && (
            <>
              <Text style={styles.subLabel}>Type</Text>
              <View style={styles.chipContainer}>
                <Pressable 
                  onPress={() => setSelType('en')}
                  style={[styles.chip, selType === 'en' && styles.activeChip]}
                >
                  <Text style={[styles.chipText, selType === 'en' && styles.activeChipText]}>English Only</Text>
                </Pressable>
                <Pressable 
                  onPress={() => setSelType('multilingual')}
                  style={[styles.chip, selType === 'multilingual' && styles.activeChip]}
                >
                  <Text style={[styles.chipText, selType === 'multilingual' && styles.activeChipText]}>Multilingual</Text>
                </Pressable>
              </View>
            </>
          )}

          {availableQuants.length > 1 && (
            <>
              <Text style={styles.subLabel}>Quantization</Text>
              <View style={styles.chipContainer}>
                {availableQuants.map(q => (
                  <Pressable 
                    key={q}
                    onPress={() => setSelQuant(q)}
                    style={[styles.chip, selQuant === q && styles.activeChip]}
                  >
                    <Text style={[styles.chipText, selQuant === q && styles.activeChipText]}>
                      {q === 'standard' ? 'Standard (FP16)' : q.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <View style={[styles.glassContainer, { marginTop: 20 }]}>
            <BlurView intensity={60} tint="light" style={styles.statusBox}>
              <View style={styles.statusInfo}>
                <Text style={styles.currentModelLabel}>Selected Combination:</Text>
                <Text style={styles.currentModelName}>{currentCombination}</Text>
                <View style={styles.sizeBadge}>
                   <Text style={styles.sizeBadgeText}>Est. Size: {estSize >= 1000 ? (estSize/1000).toFixed(1) + ' GB' : estSize + ' MB'}</Text>
                </View>
                {activeModel === currentCombination && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>CURRENTLY ACTIVE</Text>
                  </View>
                )}
              </View>

              {downloadingModel === currentCombination ? (
                <View style={styles.downloadProgressContainer}>
                  <ActivityIndicator color="#2E66F5" />
                  <Text style={styles.progressText}>{Math.round(downloadProgress * 100)}%</Text>
                </View>
              ) : isCurrentDownloaded ? (
                <Pressable 
                  onPress={selectActiveModel}
                  style={[styles.actionButton, activeModel === currentCombination && styles.disabledButton]}
                  disabled={activeModel === currentCombination}
                >
                  <Text style={styles.actionButtonText}>
                    {activeModel === currentCombination ? 'Currently Active' : 'Set as Active'}
                  </Text>
                </Pressable>
              ) : (
                <Pressable 
                  onPress={downloadModel}
                  style={styles.downloadAction}
                  disabled={!!downloadingModel}
                >
                  <DownloadIcon color="#FFF" />
                  <Text style={styles.downloadActionText}>Download Model</Text>
                </Pressable>
              )}
            </BlurView>
          </View>

          <Text style={styles.hintText}>
            Higher sizes and "Standard" quantization offer better accuracy but require more RAM and storage. Quantized models (Q5, Q8) are faster and smaller.
          </Text>
        </View>

        {/* List of Downloaded Models */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Downloaded Models</Text>
          <View style={styles.glassContainer}>
            <BlurView intensity={40} tint="light" style={styles.blurContent}>
              {downloadedModels.length === 0 ? (
                <Text style={styles.emptyText}>No models downloaded yet.</Text>
              ) : (
                downloadedModels.map((m) => (
                  <View key={m} style={styles.optionItem}>
                    <View style={styles.modelItemInfo}>
                      <Text style={[styles.optionText, activeModel === m && styles.selectedText]}>{m}</Text>
                      {activeModel === m && <CheckIcon width={18} height={18} style={{marginLeft: 8}} />}
                    </View>
                    <Pressable onPress={() => deleteModel(m)} style={styles.deleteButton}>
                      <TrashIcon width={20} height={20} color="#FF4B4B" />
                    </Pressable>
                  </View>
                ))
              )}
            </BlurView>
          </View>
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
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 12,
    marginRight: 15,
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
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#424242",
    marginBottom: 15,
    marginLeft: 5,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
    marginLeft: 10,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  activeChip: {
    backgroundColor: "#2E66F5",
    borderColor: "#2E66F5",
  },
  chipText: {
    fontSize: 13,
    color: "#424242",
    fontWeight: "500",
  },
  activeChipText: {
    color: "#FFF",
  },
  glassContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.5)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  blurContent: {
    paddingVertical: 5,
  },
  statusBox: {
    padding: 20,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 15,
  },
  statusInfo: {
    alignItems: 'center',
  },
  currentModelLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  currentModelName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E66F5",
  },
  sizeBadge: {
    marginTop: 4,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sizeBadgeText: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
  },
  activeBadge: {
    marginTop: 8,
    backgroundColor: "rgba(46, 102, 245, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(46, 102, 245, 0.3)",
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2E66F5",
  },
  actionButton: {
    backgroundColor: "#2E66F5",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: "#AAA",
  },
  actionButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  downloadAction: {
    backgroundColor: "#2E66F5",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    gap: 10,
  },
  downloadActionText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  downloadProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E66F5",
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modelItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 75, 75, 0.1)',
  },
  optionText: {
    fontSize: 15,
    color: "#424242",
    fontWeight: "500",
  },
  selectedText: {
    fontWeight: "bold",
    color: "#2E66F5",
  },
  emptyText: {
    padding: 20,
    textAlign: 'center',
    color: "#999",
    fontStyle: 'italic',
  },
  hintText: {
    fontSize: 12,
    color: "#666",
    marginTop: 15,
    paddingHorizontal: 10,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  errorText: {
    color: '#FF4B4B',
    fontSize: 12,
    textAlign: 'center',
  },
  btActionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  deviceList: {
    width: '100%',
    marginTop: 10,
    gap: 10,
  },
  deviceItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  deviceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#424242',
  },
  deviceIdText: {
    fontSize: 10,
    color: '#666',
  }
});
