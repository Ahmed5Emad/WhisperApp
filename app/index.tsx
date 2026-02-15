import { StyleSheet, View, Text, Pressable } from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SettingsIcon, UserGuideIcon } from "../components/Icons";

export default function Index() {
  return (
    <LinearGradient 
      colors={['#C7BEF4', '#EBF4BE']} 
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* --- Settings Button --- */}
      <View style={styles.header}>
        <Link href="/settings" asChild>
          <Pressable style={styles.settingsButton}>
            <SettingsIcon color="#424242" />
          </Pressable>
        </Link>
      </View>

      {/* --- User Guide Box --- */}
      <Link href="/user_guide" asChild>
        <Pressable style={styles.glassContainer}>
          <BlurView intensity={50} tint="light" style={styles.blurContent}>
            <UserGuideIcon width={48} height={48} color="#424242" />
            <Text style={styles.userGuideText}>User Guide</Text>
          </BlurView>
        </Pressable>
      </Link>
      
      {/* --- Connect Button --- */}
      <View style={styles.fillSpace}>
        <Link href="/home" asChild>
          <Pressable style={styles.connectglassContainer}>
             <BlurView intensity={40} tint="light" style={styles.blurContent}>
                <Text style={styles.connectButtonText}>Connect</Text>
             </BlurView>
          </Pressable>
        </Link>
      </View>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 5,
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
  fillSpace: {
    flex: 0,  
    height: 100,       
    width: "100%",    
  },
  glassContainer: {
    width: "100%",
    height: 300,   
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.5)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  connectglassContainer: {
    width: "100%",
    height: 100,   
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.5)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  blurContent: {
    flex: 1, 
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    padding: 20,
  },
  userGuideText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#424242",
  },
  connectButtonText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#424242",
  },
});