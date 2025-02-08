import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const GreetingScreen = ({ navigation }) => {
  // Animation setup
  const logoScale = new Animated.Value(0.8);

  useEffect(() => {
    Animated.spring(logoScale, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <LinearGradient
      colors={["#E8F5E9", "#C8E6C9", "#B9DEB9"]}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View
          style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}
        >
          <Image
            source={require("../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>CropPulse</Text>
          <Text style={styles.tagline}>Smart Plant Health Monitor</Text>
        </Animated.View>

        <View style={styles.card}>
          <Text style={styles.description}>
            Your intelligent companion for plant health monitoring. Use advanced
            AI to instantly detect plant diseases and receive expert advice for
            better crop management.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("GeneralUserAuth")}
        >
          <LinearGradient
            colors={["#2E7D32", "#1B5E20"]}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Text style={styles.footnote}>Empowering farmers with technology</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingTop: 200,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
    borderRadius: 60,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  appName: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#1B5E20",
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: "#424242",
    marginTop: 8,
    fontWeight: "500",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginVertical: 20,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: "justify",
    color: "#424242",
  },
  button: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  footnote: {
    color: "#616161",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "500",
  },
});

export default GreetingScreen;
