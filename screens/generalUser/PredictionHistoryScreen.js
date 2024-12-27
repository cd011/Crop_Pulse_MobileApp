import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebase";
import { useNavigation } from "@react-navigation/native";

const PredictionHistoryScreen = () => {
  const [predictions, setPredictions] = useState([]);
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [followUpAnswers, setFollowUpAnswers] = useState({});
  const [treatments, setTreatments] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    fetchPredictionHistory();
  }, []);

  const fetchPredictionHistory = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // First, get the user's predictions
      const predictionsQuery = query(
        collection(db, "generalUserPredictions"),
        where("userId", "==", user.uid)
      );

      const querySnapshot = await getDocs(predictionsQuery);
      const predictionsData = [];

      // Then, for each prediction, get its follow-up data
      for (const predictionDoc of querySnapshot.docs) {
        const predictionData = predictionDoc.data();

        // Query follow-ups using userId and predictionId
        const followUpsQuery = query(
          collection(db, "predictionFollowUps"),
          where("userId", "==", user.uid),
          where("predictionId", "==", predictionDoc.id)
        );

        try {
          const followUpsSnapshot = await getDocs(followUpsQuery);
          const followUpData = followUpsSnapshot.docs[0]?.data();

          predictionsData.push({
            id: predictionDoc.id,
            ...predictionData,
            followUpData: followUpData || null,
          });
        } catch (error) {
          console.error("Error fetching follow-up data:", error);
          // Continue with the next prediction even if one fails
          predictionsData.push({
            id: predictionDoc.id,
            ...predictionData,
            followUpData: null,
          });
        }
      }

      // Sort by date, newest first
      setPredictions(
        predictionsData.sort(
          (a, b) => new Date(b.dateTime) - new Date(a.dateTime)
        )
      );
    } catch (error) {
      console.error("Error fetching prediction history:", error);
      Alert.alert("Error", "Failed to load prediction history");
    } finally {
      setLoading(false);
    }
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
      setTreatments(["Unable to load treatments at this time."]);
    }
  };

  const handlePredictionPress = async (prediction) => {
    setSelectedPrediction(prediction);
    if (prediction.followUpData) {
      setFollowUpAnswers(prediction.followUpData.followUpAnswers);
    }
    await fetchTreatments(prediction.prediction, prediction.plantType);
    setIsModalVisible(true);
  };

  const handleAskChatbot = () => {
    if (selectedPrediction) {
      const chatPrompt = `I have a ${
        selectedPrediction.plantType
      } plant diagnosed with ${selectedPrediction.prediction} (${
        selectedPrediction.confidence
      }% confidence). 
      Can you provide:
      1. Methods to confirm this diagnosis
      2. Effective treatment options
      3. Preventive measures for future occurrences

      Additional context: 
      - Plant Type: ${selectedPrediction.plantType}
      - Confidence Level: ${selectedPrediction.confidence}%
      - Follow-up Answers: ${JSON.stringify(followUpAnswers)}`;

      navigation.navigate("Chatbot", { initialQuestion: chatPrompt });
      setIsModalVisible(false);
    }
  };

  const handleAskCommunity = () => {
    if (selectedPrediction) {
      const postContent = `Plant Type: ${selectedPrediction.plantType}
Disease: ${selectedPrediction.prediction}
Confidence: ${selectedPrediction.confidence}%

Follow-up Information:
${Object.entries(followUpAnswers)
  .map(([question, answer]) => `${question}: ${answer ? "Yes" : "No"}`)
  .join("\n")}

I would appreciate any advice or experience with treating this condition.`;

      navigation.navigate("Community", {
        screen: "CommunityMain",
        params: { predefinedPost: postContent },
      });
      setIsModalVisible(false);
    }
  };

  const renderPredictionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.predictionItem}
      onPress={() => handlePredictionPress(item)}
    >
      <Text style={styles.plantType}>Plant Type: {item.plantType}</Text>
      <Text style={styles.disease}>Disease: {item.prediction}</Text>
      <Text style={styles.confidence}>Confidence: {item.confidence}%</Text>
      <Text style={styles.date}>
        Date: {new Date(item.dateTime).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading predictions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {predictions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No predictions found</Text>
        </View>
      ) : (
        <FlatList
          data={predictions}
          renderItem={renderPredictionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Prediction Report</Text>

            {selectedPrediction && (
              <ScrollView style={styles.scrollContainer}>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Diagnosis</Text>
                  <Text style={styles.predictionText}>
                    Plant Type: {selectedPrediction.plantType}
                  </Text>
                  <Text style={styles.predictionText}>
                    Disease: {selectedPrediction.prediction}
                  </Text>
                  <Text style={styles.predictionText}>
                    Confidence: {selectedPrediction.confidence}%
                  </Text>
                  <Text style={styles.predictionText}>
                    Date:{" "}
                    {new Date(selectedPrediction.dateTime).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Follow-up Responses</Text>
                  {Object.entries(followUpAnswers).map(
                    ([question, answer], index) => (
                      <View key={index} style={styles.followUpItem}>
                        <Text style={styles.questionText}>{question}</Text>
                        <Text style={styles.answerText}>
                          Answer: {answer ? "Yes" : "No"}
                        </Text>
                      </View>
                    )
                  )}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Recommended Treatments
                  </Text>
                  {treatments.map((treatment, index) => (
                    <Text key={index} style={styles.treatmentText}>
                      • {treatment}
                    </Text>
                  ))}
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleAskChatbot}
                  >
                    <Text style={styles.buttonText}>Ask Chatbot</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleAskCommunity}
                  >
                    <Text style={styles.buttonText}>Ask Community</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            <TouchableOpacity
              style={[styles.actionButton, styles.closeButton]}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  listContainer: {
    padding: 10,
  },
  predictionItem: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  plantType: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  disease: {
    fontSize: 14,
    marginBottom: 3,
  },
  confidence: {
    fontSize: 14,
    marginBottom: 3,
  },
  date: {
    fontSize: 12,
    color: "#666",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  scrollContainer: {
    width: "100%",
  },
  section: {
    marginBottom: 20,
    width: "100%",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  predictionText: {
    fontSize: 16,
    marginBottom: 5,
  },
  followUpItem: {
    marginBottom: 10,
  },
  questionText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 3,
  },
  answerText: {
    fontSize: 14,
  },
  treatmentText: {
    fontSize: 14,
    marginBottom: 5,
    paddingLeft: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 5,
    minWidth: 120,
    alignItems: "center",
  },
  closeButton: {
    backgroundColor: "#FF3B30",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default PredictionHistoryScreen;
