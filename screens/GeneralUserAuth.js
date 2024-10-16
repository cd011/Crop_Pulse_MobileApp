import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import SignUp from "./SignUp";
import Login from "./Login";

const GeneralUserAuth = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <View style={styles.container}>
      {isLogin ? (
        <Login navigation={navigation} />
      ) : (
        <SignUp navigation={navigation} />
      )}
      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.switchText}>
          {isLogin
            ? "Don't have an account? Sign Up"
            : "Already have an account? Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  switchText: {
    color: "#007AFF",
    textAlign: "center",
    marginTop: 20,
  },
});

export default GeneralUserAuth;
