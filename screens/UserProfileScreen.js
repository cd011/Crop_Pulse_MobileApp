import React from "react";
import { View, Text, StyleSheet } from "react-native";

function UserProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>User Profile Screen</Text>
      {/* We'll add user profile functionality here */}
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

export default UserProfileScreen;
