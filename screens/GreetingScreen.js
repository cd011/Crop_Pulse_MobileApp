import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";

const GreetingScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/logo.png")} // Make sure to add your logo in assets folder
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>CropPulse</Text>
      </View>

      <View style={styles.descriptionContainer}>
        <Text style={styles.description}>
          Your smart companion for plant health monitoring. Instantly detect
          plant diseases using advanced AI and get advice for better crop
          management.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("GeneralUserAuth")}
      >
        <Text style={styles.buttonText}>Start Your Plant Health Journey</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F5F8F5", // Light green tint for nature theme
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 5,
    borderRadius: 75,
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2E7D32", // Dark green color
    letterSpacing: 1,
  },
  descriptionContainer: {
    width: "90%",
    marginBottom: 40,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    color: "#546E7A",
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#2E7D32", // Dark green color
    padding: 18,
    borderRadius: 25,
    width: "90%",
    alignItems: "center",
    marginBottom: 30,
    elevation: 3, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default GreetingScreen;
