import React from "react";
import { View, Text, StyleSheet } from "react-native";

const PredictionScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Prediction Screen</Text>
      {/* We'll add image upload and prediction functionality here */}
    </View>
  );
};

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

export default PredictionScreen;
