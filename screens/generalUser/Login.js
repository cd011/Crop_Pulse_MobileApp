import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";

const Login = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Load last used email
    loadLastEmail();
    // Check if user was kept logged in
    checkStoredAuth();
  }, []);

  useEffect(() => {
    // Validate form
    setIsValid(validateForm());
  }, [email, password]);

  const validateForm = () => {
    return email.includes("@") && email.includes(".") && password.length >= 7;
  };

  const loadLastEmail = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem("lastUsedEmail");
      if (savedEmail) setEmail(savedEmail);
    } catch (error) {
      console.error("Error loading email:", error);
    }
  };

  const checkStoredAuth = async () => {
    try {
      const storedAuth = await AsyncStorage.getItem("keepLoggedIn");
      if (storedAuth === "true" && auth.currentUser) {
        navigation.reset({
          index: 0,
          routes: [{ name: "GeneralUserTabs" }],
        });
      }
    } catch (error) {
      console.error("Error checking stored auth:", error);
    }
  };

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Save email for future use
      await AsyncStorage.setItem("lastUsedEmail", email);

      // Save auth state if keep logged in is checked
      if (keepLoggedIn) {
        await AsyncStorage.setItem("keepLoggedIn", "true");
      }

      // Check if user is a general user
      const userDoc = await getDoc(doc(db, "generalUsers", user.uid));
      if (userDoc.exists() && userDoc.data().userType === "general") {
        // Check if profile is complete
        if (
          !userDoc.data().name ||
          !userDoc.data().location ||
          !userDoc.data().plantTypes
        ) {
          navigation.navigate("CompleteProfile");
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: "GeneralUserTabs" }],
          });
        }
      } else {
        Alert.alert(
          "Error",
          "This account is not registered as a general user"
        );
        await auth.signOut();
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={24}
            color="gray"
          />
        </TouchableOpacity>
      </View>
      <View style={styles.checkboxContainer}>
        <Checkbox
          value={keepLoggedIn}
          onValueChange={setKeepLoggedIn}
          color={keepLoggedIn ? "#007AFF" : undefined}
        />
        <Text style={styles.checkboxLabel}>Keep me logged in</Text>
      </View>
      <TouchableOpacity
        style={[styles.button, !isValid && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={!isValid}
      >
        <Text style={styles.buttonText}>Login</Text>
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 12,
    paddingLeft: 8,
    borderRadius: 5,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 12,
    borderRadius: 5,
  },
  passwordInput: {
    flex: 1,
    height: 40,
    paddingLeft: 8,
  },
  eyeIcon: {
    padding: 10,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkboxLabel: {
    marginLeft: 8,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
});

export default Login;
