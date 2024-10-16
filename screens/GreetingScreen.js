import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const GreetingScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to CropPulse</Text>
      <Text style={styles.subtitle}>Please select your user type:</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("CorporateLogin")}
      >
        <Text style={styles.buttonText}>Corporate User</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("GeneralUserAuth")}
      >
        <Text style={styles.buttonText}>General User</Text>
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
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default GreetingScreen;
