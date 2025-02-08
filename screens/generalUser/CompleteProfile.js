import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { auth, db } from "../../firebase";
import { doc, updateDoc } from "firebase/firestore";
import * as Location from "expo-location";
import { Colors, Typography, GlobalStyles } from "../globalStyles"; // Import global styles

const CompleteProfile = ({ navigation }) => {
  const [name, setName] = useState("");
  const [plantTypes, setPlantTypes] = useState("");
  const [location, setLocation] = useState({ latitude: null, longitude: null });

  const handleGetLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Unable to access location");
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
  };

  const handleSubmit = async () => {
    if (!name || !plantTypes || !location.latitude) {
      Alert.alert("Error", "Please fill in all fields and set your location");
      return;
    }

    try {
      const user = auth.currentUser;
      await updateDoc(doc(db, "generalUsers", user.uid), {
        name,
        plantTypes,
        location,
      });

      navigation.reset({
        index: 0,
        routes: [{ name: "GeneralUserTabs" }],
      });
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Your Profile</Text>
      <Text style={styles.subtitle}>
        Please provide this information to use all app features
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Your Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Plant Types (comma separated)"
        value={plantTypes}
        onChangeText={setPlantTypes}
      />
      <TouchableOpacity style={styles.button} onPress={handleGetLocation}>
        <Text style={styles.buttonText}>Set Location</Text>
      </TouchableOpacity>
      {location.latitude && (
        <Text style={styles.locationText}>
          Location set: {location.latitude.toFixed(4)},{" "}
          {location.longitude.toFixed(4)}
        </Text>
      )}
      <TouchableOpacity
        style={[
          styles.submitButton,
          (!name || !plantTypes || !location.latitude) && styles.buttonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!name || !plantTypes || !location.latitude}
      >
        <Text style={styles.buttonText}>Complete Profile</Text>
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
    marginBottom: 10,
  },
  subtitle: {
    ...Typography.caption,
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
  button: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    ...Typography.button,
  },
  locationText: {
    ...Typography.caption,
    marginVertical: 10,
  },
  submitButton: {
    backgroundColor: Colors.success,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: Colors.primaryLight,
  },
});

export default CompleteProfile;
