import React from "react";
import { View, Text, StyleSheet } from "react-native";

function ChatbotScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Chatbot Screen</Text>
      {/* We'll add chatbot functionality here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
  },
});

export default ChatbotScreen;
