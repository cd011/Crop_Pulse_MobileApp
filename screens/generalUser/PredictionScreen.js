import React, { useState } from "react";
import {
  View,
  Text,
  Button,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebase";
import Checkbox from "expo-checkbox";

const PredictionScreen = () => {
  const [image, setImage] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [followUpAnswers, setFollowUpAnswers] = useState({});
  const navigation = useNavigation();
  const [plantType, setPlantType] = useState("corn"); // Default selection
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

  // Fetch follow-up questions from Firestore based on disease
  const fetchFollowUpQuestions = async (diseaseName) => {
    try {
      const q = query(
        collection(db, "diseaseFollowUpQuestions"),
        where("disease", "==", diseaseName.toLowerCase()),
        where("plantType", "==", plantType)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Fallback to generic questions if no specific questions found
        const genericQ = query(
          collection(db, "diseaseFollowUpQuestions"),
          where("disease", "==", "generic")
        );
        const genericSnapshot = await getDocs(genericQ);

        if (!genericSnapshot.empty) {
          const genericQuestions = genericSnapshot.docs.map((doc) =>
            doc.data()
          );
          setFollowUpQuestions(genericQuestions[0].questions);
        } else {
          // Hardcoded fallback questions
          setFollowUpQuestions([
            "Are there visible symptoms on the plant?",
            "Have you noticed any changes in plant growth?",
            "Are there any environmental stress factors?",
          ]);
        }
      } else {
        const questions = querySnapshot.docs.map((doc) => doc.data());
        setFollowUpQuestions(questions[0].questions);
      }

      // Initialize answers
      const initialAnswers = {};
      followUpQuestions.forEach((question) => {
        initialAnswers[question] = null;
      });
      setFollowUpAnswers(initialAnswers);
    } catch (error) {
      console.error("Error fetching follow-up questions:", error);
      Alert.alert("Error", "Failed to load follow-up questions");
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
        `https://llama-ready-verbally.ngrok-free.app/predict?plant_type=${plantType}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setPrediction(response.data);

      // Fetch follow-up questions based on predicted disease
      await fetchFollowUpQuestions(response.data.predicted_disease);
      setIsDialogVisible(true);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to predict disease");
    }
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (user && prediction) {
      try {
        // Save prediction results
        const predictionDoc = await addDoc(
          collection(db, "generalUserPredictions"),
          {
            userId: user.uid,
            plantType: plantType,
            prediction: prediction.predicted_disease,
            confidence: prediction.confidence,
            dateTime: new Date().toISOString(),
          }
        );

        // Save follow-up answers
        await addDoc(collection(db, "predictionFollowUps"), {
          predictionId: predictionDoc.id,
          userId: user.uid,
          disease: prediction.predicted_disease,
          plantType: plantType,
          followUpAnswers: followUpAnswers,
          confidence: prediction.confidence,
          dateTime: new Date().toISOString(),
        });

        Alert.alert("Success", "Report submitted successfully");
        setImage(null);
        setPrediction(null);
        setIsDialogVisible(false);
        navigation.navigate("Prediction");
      } catch (error) {
        console.error("Error submitting report:", error);
        Alert.alert("Error", "Failed to submit report");
      }
    }
  };

  const handleAskChatbot = () => {
    const user = auth.currentUser;
    if (user && prediction) {
      const chatPrompt = `I have a ${plantType} plant diagnosed with ${
        prediction.predicted_disease
      } (${prediction.confidence}% confidence). 
      Can you provide:
      1. Methods to confirm this diagnosis
      2. Effective treatment options
      3. Preventive measures for future occurrences

      Additional context: 
      - Plant Type: ${plantType}
      - Confidence Level: ${prediction.confidence}%
      - Follow-up Answers: ${JSON.stringify(followUpAnswers)}`;

      navigation.navigate("Chatbot", { initialQuestion: chatPrompt });
      setIsDialogVisible(false);
    }
  };

  const renderFollowUpQuestions = () => {
    return followUpQuestions.map((question, index) => (
      <View key={index} style={styles.checkboxContainer}>
        <Text style={styles.questionText}>{question}</Text>
        <View style={styles.checkboxWrapper}>
          <Checkbox
            value={followUpAnswers[question] === true}
            onValueChange={() =>
              setFollowUpAnswers((prev) => ({
                ...prev,
                [question]: prev[question] === true ? null : true,
              }))
            }
            style={styles.checkbox}
          />
          <Text
            onPress={() =>
              setFollowUpAnswers((prev) => ({
                ...prev,
                [question]: prev[question] === true ? null : true,
              }))
            }
          >
            Yes
          </Text>
        </View>
        <View style={styles.checkboxWrapper}>
          <Checkbox
            value={followUpAnswers[question] === false}
            onValueChange={() =>
              setFollowUpAnswers((prev) => ({
                ...prev,
                [question]: prev[question] === false ? null : false,
              }))
            }
            style={styles.checkbox}
          />
          <Text
            onPress={() =>
              setFollowUpAnswers((prev) => ({
                ...prev,
                [question]: prev[question] === false ? null : false,
              }))
            }
          >
            No
          </Text>
        </View>
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Select Plant Type:</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={plantType}
            style={styles.picker}
            onValueChange={(itemValue) => setPlantType(itemValue)}
          >
            <Picker.Item label="Apple" value="apple" />
            <Picker.Item label="Bell pepper" value="bell_pepper" />
            <Picker.Item label="Cherry" value="cherry" />
            <Picker.Item label="Corn" value="corn" />
            <Picker.Item label="Grape" value="grape" />
            <Picker.Item label="Peach" value="peach" />
            <Picker.Item label="Potato" value="potato" />
            <Picker.Item label="strawberry" value="strawberry" />
            <Picker.Item label="Tomato" value="tomato" />
          </Picker>
        </View>
      </View>
      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>Pick an image from gallery</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={takePhoto}>
        <Text style={styles.buttonText}>Take a photo</Text>
      </TouchableOpacity>
      {image && <Image source={{ uri: image }} style={styles.image} />}
      <TouchableOpacity style={styles.button} onPress={predictDisease}>
        <Text style={styles.buttonText}>Predict Disease</Text>
      </TouchableOpacity>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isDialogVisible}
        onRequestClose={() => setIsDialogVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Prediction Results</Text>

            {prediction && (
              <View>
                <Text style={styles.predictionText}>
                  Predicted Disease: {prediction.predicted_disease}
                </Text>
                <Text style={styles.predictionText}>
                  Confidence: {prediction.confidence}%
                </Text>
              </View>
            )}

            <Text style={styles.followUpTitle}>Follow-up Questions</Text>
            <ScrollView style={styles.followUpContainer}>
              {renderFollowUpQuestions()}
            </ScrollView>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleAskChatbot}
              >
                <Text style={styles.modalButtonText}>Ask Chatbot</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleSubmit}
              >
                <Text style={styles.modalButtonText}>Save Results</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsDialogVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  pickerContainer: {
    width: "80%",
    marginBottom: 20,
  },
  pickerWrapper: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    overflow: "hidden",
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  picker: {
    width: "100%",
    height: 50,
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  predictionText: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  modalButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "red",
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  followUpTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
  },
  followUpContainer: {
    maxHeight: 200,
    width: "100%",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkboxWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
  },
  checkbox: {
    marginRight: 5,
  },
  questionText: {
    flex: 1,
  },
});

export default PredictionScreen;
