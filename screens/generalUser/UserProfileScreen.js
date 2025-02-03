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
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
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
                color="gray"
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
                color="gray"
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
                color="gray"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.modalButtons}>
            <Button title="Change Password" onPress={onSubmit} />
            <Button title="Cancel" onPress={onClose} color="red" />
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
      // Reauthenticate user first
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update password
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
                // Delete Firestore document first
                await deleteDoc(doc(db, "generalUsers", user.uid));

                // Adding a small delay before deleting the user
                await new Promise((resolve) => setTimeout(resolve, 500));

                // Now delete the user account
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
        <Text>Email: {profile.email}</Text>
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
            <Button title="Get Current Location" onPress={handleGetLocation} />
            <Text>
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
            <Button title="Save Changes" onPress={handleUpdateProfile} />
            <Button title="Cancel" onPress={() => setIsEditing(false)} />
          </>
        ) : (
          <>
            <Text>Name: {profile.name}</Text>
            <Text>
              Location: {profile.location.latitude},{" "}
              {profile.location.longitude}
            </Text>
            <Text>Plant Types: {profile.plantTypes}</Text>
            <Button title="Edit Profile" onPress={() => setIsEditing(true)} />
          </>
        )}
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Change Password"
          onPress={() => setShowPasswordModal(true)}
        />
        <Button title="Logout" onPress={handleLogout} />
        <Button
          title="Delete Account"
          onPress={handleDeleteAccount}
          color="red"
        />
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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  profileInfo: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  buttonContainer: {
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "column",
    gap: 10,
    marginTop: 15,
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
});

export default UserProfileScreen;
