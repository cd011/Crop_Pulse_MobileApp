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
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebase";
import Checkbox from "expo-checkbox";
import { Ionicons } from "@expo/vector-icons";
import { useCommunityAndChatbot } from "./useCommunityAndChatbot";
import { Colors, Typography, GlobalStyles } from "../globalStyles"; // Import global styles

const MAX_IMAGE_SIZE = 1024 * 1024;

const PredictionScreen = () => {
  const [image, setImage] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [followUpAnswers, setFollowUpAnswers] = useState({});
  const [treatments, setTreatments] = useState([]);
  const [showTreatments, setShowTreatments] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const [plantType, setPlantType] = useState("apple");

  const resetForm = () => {
    setImage(null);
    setPrediction(null);
    setFollowUpQuestions([]);
    setFollowUpAnswers({});
    setTreatments([]);
    setShowTreatments(false);
    setPlantType("apple");
  };

  const compressImage = async (uri) => {
    try {
      // First, get the image info to check its size
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileSize = blob.size;

      if (fileSize > MAX_IMAGE_SIZE) {
        // Calculate compression quality (50% for images > 1MB)
        const manipResult = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 1024 } }], // Resize to max width of 1024px
          { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
        );
        return manipResult.uri;
      }
      return uri;
    } catch (error) {
      console.error("Error compressing image:", error);
      return uri;
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const compressedUri = await compressImage(result.assets[0].uri);
      setImage(compressedUri);
      setPrediction(null);
    }
  };

  const takePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7, // Reduced initial quality for camera
    });

    if (!result.canceled) {
      const compressedUri = await compressImage(result.assets[0].uri);
      setImage(compressedUri);
      setPrediction(null);
    }
  };

  // Fetch follow-up questions from Firestore based on disease
  const fetchFollowUpQuestions = async (diseaseName) => {
    try {
      const q = query(
        collection(db, "diseaseFollowUpQuestions"),
        where("disease", "==", diseaseName),
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

  const areAllQuestionsAnswered = () => {
    return followUpQuestions.every(
      (question) =>
        followUpAnswers[question] !== null &&
        followUpAnswers[question] !== undefined
    );
  };

  const fetchTreatments = async (disease, plantType) => {
    try {
      const q = query(
        collection(db, "treatments"),
        where("disease", "==", disease),
        where("plantType", "==", plantType)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const treatmentDoc = querySnapshot.docs[0].data();
        setTreatments(treatmentDoc.treatment);
      } else {
        setTreatments(["No specific treatments found for this disease."]);
      }
    } catch (error) {
      console.error("Error fetching treatments:", error);
      Alert.alert("Error", "Failed to load treatments");
    }
  };

  const predictDisease = async () => {
    if (!image) {
      Alert.alert("Error", "Please select an image first");
      return;
    }

    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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

  const handleSaveAndTreatments = async () => {
    if (!areAllQuestionsAnswered()) {
      Alert.alert("Error", "Please answer all follow-up questions first");
      return;
    }

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

        // Fetch and show treatments
        await fetchTreatments(prediction.predicted_disease, plantType);
        setShowTreatments(true);
      } catch (error) {
        console.error("Error submitting report:", error);
        Alert.alert("Error", "Failed to submit report");
      }
    }
  };

  const { handleAskChat, handleAskCommunity } = useCommunityAndChatbot();

  const handleAskChatbotClick = () => {
    const user = auth.currentUser;
    if (user && prediction) {
      const success = handleAskChat({
        plantType: plantType,
        disease: prediction.predicted_disease,
        confidence: prediction.confidence,
        followUpAnswers: followUpAnswers,
      });
      if (success) {
        resetForm();
        setIsDialogVisible(false);
      }
    }
  };

  const handleAskCommunityClick = () => {
    if (!areAllQuestionsAnswered()) {
      Alert.alert("Error", "Please answer all follow-up questions first");
      return;
    }

    const success = handleAskCommunity({
      plantType: plantType,
      disease: prediction.predicted_disease,
      confidence: prediction.confidence,
      followUpAnswers: followUpAnswers,
    });
    if (success) {
      resetForm();
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
      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => navigation.navigate("Prediction History")}
      >
        <Ionicons name="time-outline" size={24} color={Colors.primary} />
        <Text>History</Text>
      </TouchableOpacity>
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
        animationType="fade"
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

            {!showTreatments ? (
              <>
                <Text style={styles.followUpTitle}>Follow-up Questions</Text>
                <ScrollView style={styles.followUpContainer}>
                  {renderFollowUpQuestions()}
                </ScrollView>

                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      !areAllQuestionsAnswered() && styles.disabledButton,
                    ]}
                    onPress={handleAskChatbotClick}
                    disabled={!areAllQuestionsAnswered()}
                  >
                    <Text style={styles.modalButtonText}>Ask Chatbot</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      !areAllQuestionsAnswered() && styles.disabledButton,
                    ]}
                    onPress={handleAskCommunityClick}
                    disabled={!areAllQuestionsAnswered()}
                  >
                    <Text style={styles.modalButtonText}>Ask Community</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.modalButtonContainer2}>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      !areAllQuestionsAnswered() && styles.disabledButton,
                    ]}
                    onPress={handleSaveAndTreatments}
                    disabled={!areAllQuestionsAnswered()}
                  >
                    <Text style={styles.modalButtonText}>
                      Save and see treatments
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      resetForm();
                      setIsDialogVisible(false);
                    }}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.treatmentsTitle}>
                  Recommended Treatments
                </Text>
                <ScrollView style={styles.treatmentsContainer}>
                  {treatments.map((treatment, index) => (
                    <Text key={index} style={styles.treatmentText}>
                      • {treatment}
                    </Text>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    resetForm();
                    setIsDialogVisible(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>Done</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // Main container styles
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...Typography.body,
    marginTop: 10,
    color: Colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    ...Typography.body,
    color: Colors.text,
  },
  listContainer: {
    padding: 10,
  },

  // Prediction Item Card
  predictionItem: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  plantType: {
    ...Typography.h2,
    marginBottom: 8,
  },
  disease: {
    ...Typography.body,
    marginBottom: 4,
  },
  confidence: {
    ...Typography.body,
    marginBottom: 4,
  },
  date: {
    ...Typography.caption,
  },

  // Plant Type Picker
  pickerContainer: {
    width: "100%",
    marginBottom: 20,
  },
  pickerWrapper: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  label: {
    ...Typography.body,
    marginBottom: 8,
  },
  picker: {
    width: "100%",
    height: 60,
  },

  // Image Upload Section
  title: {
    ...Typography.h1,
    marginBottom: 20,
  },
  subtitle: {
    ...Typography.h2,
    marginBottom: 30,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
    marginBottom: 16,
    elevation: 3,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    ...Typography.button,
  },
  image: {
    width: 200,
    height: 200,
    marginVertical: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },

  // History Button
  historyButton: {
    position: "absolute",
    flexDirection: "row",
    top: 10,
    right: 10,
    padding: 12,
    borderRadius: 24,
    backgroundColor: Colors.white,
    elevation: 4,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 1,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    width: "90%",
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  scrollContainer: {
    width: "100%",
  },
  section: {
    marginBottom: 24,
    width: "100%",
  },
  sectionTitle: {
    ...Typography.h2,
    marginBottom: 12,
  },
  predictionText: {
    fontSize: 15,
    marginBottom: 10,
  },

  // Follow-up Questions
  followUpContainer: {
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
  followUpItem: {
    marginBottom: 12,
  },
  answerText: {
    ...Typography.body,
  },

  // Treatment Section
  treatmentsContainer: {
    maxHeight: 300,
    width: "100%",
    marginBottom: 15,
  },
  treatmentText: {
    fontSize: 16,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  treatmentsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
  },

  // Button Container and Action Buttons
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginTop: 16,
  },
  modalButtonContainer2: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
  },
  modalButton: {
    flexDirection: "row",
    marginRight: 4,
    marginLeft: 4,
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 12,
    minWidth: 120,
    alignItems: "center",
    marginHorizontal: 4,
    marginBottom: 8,
  },
  cancelButton: {
    backgroundColor: Colors.error,
  },
  closeButton: {
    backgroundColor: Colors.error,
    marginTop: 12,
    width: "100%",
  },
  modalButtonText: {
    color: "white",
    marginLeft: 8,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: Colors.primaryLight,
    opacity: 0.7,
  },

  // Prediction Results
  predictionContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  followUpTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
  },
});

export default PredictionScreen;
