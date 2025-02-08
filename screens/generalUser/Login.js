import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  Alert,
} from "react-native";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";
import { Colors, Typography, GlobalStyles } from "../globalStyles";

const Login = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const logoScale = new Animated.Value(0.8);

  useEffect(() => {
    Animated.spring(logoScale, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

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

      // Check if email is verified
      if (!user.emailVerified) {
        Alert.alert(
          "Email Not Verified",
          "Please verify your email before logging in. Would you like us to send another verification email?",
          [
            {
              text: "Yes",
              onPress: async () => {
                try {
                  await sendEmailVerification(user);
                  Alert.alert(
                    "Verification Email Sent",
                    "Please check your email and verify your account."
                  );
                } catch (error) {
                  Alert.alert("Error", "Failed to send verification email");
                }
              },
            },
            {
              text: "No",
              style: "cancel",
            },
          ]
        );
        await auth.signOut();
        return;
      }

      // Save email for future use
      await AsyncStorage.setItem("lastUsedEmail", email);

      // Save auth state if keep logged in is checked
      if (keepLoggedIn) {
        await AsyncStorage.setItem("keepLoggedIn", "true");
      }

      // Check if user is a general user
      const userDoc = await getDoc(doc(db, "generalUsers", user.uid));
      if (userDoc.exists() && userDoc.data().userType === "general") {
        // Update emailVerified status in Firestore
        await updateDoc(doc(db, "generalUsers", user.uid), {
          emailVerified: true,
        });

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

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert(
        "Email Required",
        "Please enter your email address to reset your password"
      );
      return;
    }

    // Add confirmation alert before proceeding with password reset
    Alert.alert(
      "Password Reset",
      "Are you sure you want to request a password reset?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Reset Password",
          onPress: async () => {
            try {
              setIsResettingPassword(true);
              await sendPasswordResetEmail(auth, email);
              Alert.alert(
                "Password Reset Email Sent",
                "Please check your email for instructions to reset your password"
              );
            } catch (error) {
              let errorMessage = "Failed to send password reset email";
              switch (error.code) {
                case "auth/user-not-found":
                  errorMessage = "No account exists with this email address";
                  break;
                case "auth/invalid-email":
                  errorMessage = "Please enter a valid email address";
                  break;
                case "auth/too-many-requests":
                  errorMessage = "Too many attempts. Please try again later";
                  break;
              }
              Alert.alert("Error", errorMessage);
            } finally {
              setIsResettingPassword(false);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}
      >
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>CropPulse</Text>
      </Animated.View>
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
          color={keepLoggedIn ? Colors.primary : undefined}
        />
        <Text style={styles.checkboxLabel}>Keep me logged in</Text>
      </View>
      <TouchableOpacity
        style={[styles.button, !isValid && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={!isValid || isResettingPassword}
      >
        <Text style={styles.buttonText}>
          {isResettingPassword ? "Please wait..." : "Login"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.forgotPasswordButton}
        onPress={handleForgotPassword}
        disabled={isResettingPassword}
      >
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: Colors.background,
  },
  title: {
    ...Typography.h2,
    marginBottom: 20,
  },
  input: {
    height: 48,
    borderColor: Colors.primaryLight,
    borderWidth: 1,
    marginBottom: 16,
    paddingLeft: 12,
    borderRadius: 8,
    backgroundColor: Colors.white,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: Colors.primaryLight,
    borderWidth: 1,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: Colors.white,
  },
  passwordInput: {
    flex: 1,
    height: 48,
    paddingLeft: 12,
  },
  eyeIcon: {
    padding: 12,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    ...Typography.button,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  checkboxLabel: {
    ...Typography.caption,
    marginLeft: 8,
  },
  buttonDisabled: {
    backgroundColor: Colors.primaryLight,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginBottom: 16,
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
    fontSize: 32,
    fontWeight: "bold",
    color: "#1B5E20",
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  forgotPasswordButton: {
    marginTop: 16,
    marginBottom: 40,
    alignItems: "center",
  },
  forgotPasswordText: {
    ...Typography.caption,
    color: Colors.primary,
    textDecorationLine: "underline",
  },
});

export default Login;
