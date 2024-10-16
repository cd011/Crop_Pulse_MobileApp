import React from "react";
import { View, Text, StyleSheet } from "react-native";

const CommunityScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Community Screen</Text>
      {/* We'll add post creation and viewing functionality here */}
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

export default CommunityScreen;
