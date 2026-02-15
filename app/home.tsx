import React, { useState } from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Slider from '@react-native-community/slider';
import { BackIcon, UserGuideIcon, BrightnessIcon, FontIcon, SettingsIcon } from "../components/Icons";

type Mode = 'brightness' | 'font';

export default function Home() {
  const router = useRouter();
  
  const [activeMode, setActiveMode] = useState<Mode>('brightness');
  const [brightness, setBrightness] = useState(60);
  const [fontSize, setFontSize] = useState(24);

  const activeColor = "#2E66F5";
  const inactiveColor = "#9D9D9D";

  const isBrightness = activeMode === 'brightness';
  const currentValue = isBrightness ? brightness : fontSize;
  
  const minVal = isBrightness ? 0 : 12;
  const maxVal = isBrightness ? 100 : 40;

  const handleSliderChange = (val: number) => {
    if (isBrightness) {
      setBrightness(val);
    } else {
      setFontSize(val);
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

        <Pressable onPress={() => router.push('/settings' as any)} style={styles.settingsButton}>
          <SettingsIcon color="#424242" />
        </Pressable>
      </View>

      {/* --- 1. User Guide --- */}
      <Pressable 
        onPress={() => router.push('/user_guide' as any)}
        style={[styles.glassContainer, { height: 250 }]}
      >
        <BlurView intensity={50} tint="light" style={styles.blurContent}>
          <UserGuideIcon width={48} height={48} color="#424242" />
          <Text style={styles.userGuideText}>User Guide</Text>
        </BlurView>
      </Pressable>

      {/* --- 2. Controls Row --- */}
      <View style={styles.controlsRow}>
        <Pressable 
          style={styles.controlButtonWrapper} 
          onPress={() => setActiveMode('brightness')}
        >
          <View style={[
            styles.glassContainerIcon, 
            isBrightness && styles.activeControl 
          ]}>
            <BlurView intensity={40} tint="light" style={styles.controlContent}>
               <BrightnessIcon 
                 width={40} 
                 height={40} 
                 color={isBrightness ? activeColor : inactiveColor} 
               />
               <Text style={[
                 styles.controlText, 
                 { color: isBrightness ? activeColor : inactiveColor }
               ]}>
                 Brightness
               </Text>
            </BlurView>
          </View>
        </Pressable>

        <Pressable 
          style={styles.controlButtonWrapper}
          onPress={() => setActiveMode('font')}
        >
          <View style={[
            styles.glassContainerIcon,
            !isBrightness && styles.activeControl 
          ]}>
            <BlurView intensity={40} tint="light" style={styles.controlContent}>
               <FontIcon 
                 width={40} 
                 height={40} 
                 color={!isBrightness ? activeColor : inactiveColor} 
               />
               <Text style={[
                 styles.controlText, 
                 { color: !isBrightness ? activeColor : inactiveColor }
               ]}>
                 Font Size
               </Text>
            </BlurView>
          </View>
        </Pressable>
      </View>

      {/* --- 3. Slider Section --- */}
      <View style={[styles.glassContainer, { height: 100 }]}>
         <BlurView intensity={50} tint="light" style={styles.sliderContent}>
            <View style={styles.sliderLeftInfo}>
              {isBrightness ? (
                <BrightnessIcon width={24} height={24} color="#424242" />
              ) : (
                <FontIcon width={24} height={24} color="#424242" />
              )}
              <View style={styles.valueBadge}>
                <Text style={styles.valueText}>{Math.round(currentValue)}</Text>
              </View>
            </View>

            <Slider
              style={styles.slider}
              minimumValue={minVal}
              maximumValue={maxVal}
              value={currentValue}
              onValueChange={handleSliderChange}
              minimumTrackTintColor={activeColor}
              maximumTrackTintColor="rgba(0,0,0,0.1)"
              thumbTintColor="#FFFFFF"
            />
         </BlurView>
      </View>

      {/* --- 4. Show Transcript Button --- */}
      <View style={styles.fillSpace}>
        <Pressable 
          onPress={() => router.push('/transcription' as any)}
          style={styles.glassContainerSmall}
        >
          <BlurView intensity={40} tint="light" style={styles.blurContent}>
            <Text style={styles.showTranscriptText}>Show Transcript</Text>
          </BlurView>
        </Pressable>
      </View>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    gap: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    width: '100%',
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
  settingsButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  glassContainer: {
    width: "100%",
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.5)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  glassContainerSmall: {
    width: "100%",
    height: 80,   
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.5)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  glassContainerIcon: {
    width: "100%",
    height: 120,   
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.5)", 
    backgroundColor: "rgba(255, 255, 255, 0.1)", 
  },
  fillSpace: {
    flex: 1,
    width: "100%",
    justifyContent: 'flex-start',
    paddingBottom: 20,
  },
  blurContent: {
    flex: 1, 
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  userGuideText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#424242",
  },
  controlsRow: {
    flexDirection: "row",
    width: "100%",
    gap: 15,
  },
  controlButtonWrapper: {
    flex: 1,
  },
  controlContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  activeControl: {
    backgroundColor: "rgba(255, 255, 255, 0.35)", 
    borderColor: "#2E66F5", 
    borderWidth: 2,
  },
  controlText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  sliderContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 15,
  },
  sliderLeftInfo: {
    alignItems: 'center',
    gap: 5,
  },
  valueBadge: {
    backgroundColor: "rgba(255,255,255,0.5)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  valueText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: "#424242"
  },
  slider: {
    flex: 1,
    height: 40,
  },
  showTranscriptText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#424242",
  },
});