import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  TouchableOpacity,
} from "react-native";
import { auth, db } from "../../firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import {
  signOut,
  deleteUser,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, GlobalStyles } from "../globalStyles";

const PasswordChangeModal = ({
  visible,
  onClose,
  onSubmit,
  passwordData,
  setPasswordData,
}) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Change Password</Text>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Current Password"
              value={passwordData.currentPassword}
              onChangeText={(text) =>
                setPasswordData((prev) => ({ ...prev, currentPassword: text }))
              }
              secureTextEntry={!showCurrentPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              <Ionicons
                name={showCurrentPassword ? "eye-off-outline" : "eye-outline"}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="New Password"
              value={passwordData.newPassword}
              onChangeText={(text) =>
                setPasswordData((prev) => ({ ...prev, newPassword: text }))
              }
              secureTextEntry={!showNewPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              <Ionicons
                name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm New Password"
              value={passwordData.confirmNewPassword}
              onChangeText={(text) =>
                setPasswordData((prev) => ({
                  ...prev,
                  confirmNewPassword: text,
                }))
              }
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={onSubmit}
            >
              <Text style={styles.buttonText}>Change Password</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const UserProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    location: { latitude: null, longitude: null },
    plantTypes: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const user = auth.currentUser;
    if (user) {
      const docRef = doc(db, "generalUsers", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile({
          name: data.name || "",
          email: user.email,
          location: data.location || { latitude: null, longitude: null },
          plantTypes: data.plantTypes || "",
        });
      }
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      Alert.alert("Error", "New passwords don't match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      Alert.alert("Error", "New password must be at least 8 characters long");
      return;
    }

    const user = auth.currentUser;
    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwordData.newPassword);
      Alert.alert("Success", "Password updated successfully");
      handleClosePasswordModal();
    } catch (error) {
      if (error.code === "auth/wrong-password") {
        Alert.alert("Error", "Current password is incorrect");
      } else {
        Alert.alert("Error", "Failed to update password");
      }
    }
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });
  };

  const handleUpdateProfile = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        await updateDoc(doc(db, "generalUsers", user.uid), {
          name: profile.name,
          location: profile.location,
          plantTypes: profile.plantTypes,
        });
        Alert.alert("Success", "Profile updated successfully");
        setIsEditing(false);
      } catch (error) {
        Alert.alert("Error", "Failed to update profile");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: "Greeting" }],
      });
    } catch (error) {
      Alert.alert("Error", "Failed to log out");
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            const user = auth.currentUser;
            if (user) {
              try {
                await deleteDoc(doc(db, "generalUsers", user.uid));
                await new Promise((resolve) => setTimeout(resolve, 500));
                await deleteUser(user);
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Greeting" }],
                });
              } catch (error) {
                Alert.alert("Error", "Failed to delete account");
              }
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleGetLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Unable to access location");
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setProfile((prev) => ({
      ...prev,
      location: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
    }));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>User Profile</Text>
      <View style={styles.profileInfo}>
        <Text style={styles.label}>Email: {profile.email}</Text>
        {isEditing ? (
          <>
            <TextInput
              style={styles.input}
              value={profile.name}
              onChangeText={(text) =>
                setProfile((prev) => ({ ...prev, name: text }))
              }
              placeholder="Name"
            />
            <TouchableOpacity style={styles.button} onPress={handleGetLocation}>
              <Text style={styles.buttonText}>Get Current Location</Text>
            </TouchableOpacity>
            <Text style={styles.label}>
              Latitude: {profile.location.latitude}, Longitude:{" "}
              {profile.location.longitude}
            </Text>
            <TextInput
              style={styles.input}
              value={profile.plantTypes}
              onChangeText={(text) =>
                setProfile((prev) => ({ ...prev, plantTypes: text }))
              }
              placeholder="Plant Types (comma separated)"
            />
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleUpdateProfile}
            >
              <Text style={styles.buttonText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => setIsEditing(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>Name: {profile.name}</Text>
            <Text style={styles.label}>
              Location: {profile.location.latitude},{" "}
              {profile.location.longitude}
            </Text>
            <Text style={styles.label}>Plant Types: {profile.plantTypes}</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowPasswordModal(true)}
        >
          <Text style={styles.buttonText}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.buttonText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
      <PasswordChangeModal
        visible={showPasswordModal}
        onClose={handleClosePasswordModal}
        onSubmit={handleChangePassword}
        passwordData={passwordData}
        setPasswordData={setPasswordData}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  profileInfo: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: "#6c757d",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  modalButtons: {
    marginTop: 15,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ddd",
    borderWidth: 1,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  passwordInput: {
    flex: 1,
    height: 40,
    paddingLeft: 10,
    color: "#333",
  },
  eyeIcon: {
    padding: 10,
  },
});

export default UserProfileScreen;
