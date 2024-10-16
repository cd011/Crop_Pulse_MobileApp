import React, { useState } from "react";
import { View, Text, Button, Image, StyleSheet, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const PredictionScreen = () => {
  const [image, setImage] = useState(null);
  const [prediction, setPrediction] = useState(null);
  // const [plantType, setPlantType] = useState(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setPrediction(null);
    }
  };

  const takePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setPrediction(null);
    }
  };

  const predictDisease = async () => {
    if (!image) {
      Alert.alert("Error", "Please select an image first");
      return;
    }

    const formData = new FormData();
    formData.append("file", {
      uri: image,
      type: "image/jpeg",
      name: "image.jpg",
    });

    try {
      const response = await axios.post(
        "https://llama-ready-verbally.ngrok-free.app/predict",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setPrediction(response.data);
      return response.data;
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to predict disease");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.button}>
        <Button title="Pick an image from gallery" onPress={pickImage} />
      </View>
      <View style={styles.button}>
        <Button title="Take a photo" onPress={takePhoto} />
      </View>
      {image && <Image source={{ uri: image }} style={styles.image} />}
      <View style={styles.button}>
        <Button title="Predict Disease" onPress={predictDisease} />
      </View>
      {prediction && (
        <View style={styles.predictionContainer}>
          <Text style={styles.predictionText}>
            Predicted Disease: {prediction.predicted_disease}
          </Text>
          <Text style={styles.predictionText}>
            Confidence: {prediction.confidence}%
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  image: {
    width: 200,
    height: 200,
    marginVertical: 20,
  },
  predictionContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  predictionText: {
    fontSize: 16,
    marginBottom: 10,
  },
});

export default PredictionScreen;
