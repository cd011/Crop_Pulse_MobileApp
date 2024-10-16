import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { signOut, deleteUser } from "firebase/auth";
import * as Location from "expo-location";

const UserProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    location: { latitude: null, longitude: null },
    plantTypes: "",
  });
  const [isEditing, setIsEditing] = useState(false);

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
        <Button title="Logout" onPress={handleLogout} />
        <Button
          title="Delete Account"
          onPress={handleDeleteAccount}
          color="red"
        />
      </View>
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
});

export default UserProfileScreen;
