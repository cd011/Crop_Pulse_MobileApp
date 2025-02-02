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
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "gray",
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
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  locationText: {
    textAlign: "center",
    marginVertical: 10,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
});

export default CompleteProfile;
