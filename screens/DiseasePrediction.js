import React, { useState } from "react";
import { View, Text, Button, Image, StyleSheet, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";

const DiseasePrediction = () => {
  const [image, setImage] = useState(null);
  const [prediction, setPrediction] = useState(null);

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
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to predict disease");
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Pick an image from gallery" onPress={pickImage} />
      <Button title="Take a photo" onPress={takePhoto} />
      {image && <Image source={{ uri: image }} style={styles.image} />}
      <Button title="Predict Disease" onPress={predictDisease} />
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
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
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

export default DiseasePrediction;
