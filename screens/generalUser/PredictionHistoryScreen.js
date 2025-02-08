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
  RefreshControl, // Import RefreshControl
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
import { useCommunityAndChatbot } from "./useCommunityAndChatbot";
import { Colors, Typography, GlobalStyles } from "../globalStyles"; // Import global styles
import { Ionicons } from "@expo/vector-icons";

const PredictionHistoryScreen = () => {
  const [predictions, setPredictions] = useState([]);
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [followUpAnswers, setFollowUpAnswers] = useState({});
  const [treatments, setTreatments] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // State for refresh control
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
      setIsRefreshing(false); // Set refreshing state to false after data is fetched
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

  const { handleAskChat, handleAskCommunity } = useCommunityAndChatbot();

  // Replace handleAskChatbot with:
  const handleAskChatbotForPrediction = () => {
    if (selectedPrediction) {
      const success = handleAskChat({
        plantType: selectedPrediction.plantType,
        disease: selectedPrediction.prediction,
        confidence: selectedPrediction.confidence,
        followUpAnswers: followUpAnswers,
      });
      if (success) {
        setIsModalVisible(false);
      }
    }
  };

  // Replace handleAskCommunity with:
  const handleAskCommunityForPrediction = () => {
    if (selectedPrediction) {
      const success = handleAskCommunity({
        plantType: selectedPrediction.plantType,
        disease: selectedPrediction.prediction,
        confidence: selectedPrediction.confidence,
        followUpAnswers: followUpAnswers,
      });
      if (success) {
        setIsModalVisible(false);
      }
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

  const onRefresh = () => {
    setIsRefreshing(true); // Set refreshing to true when user pulls to refresh
    fetchPredictionHistory(); // Fetch the data again
  };

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
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing} // Bind refreshing state to the RefreshControl
              onRefresh={onRefresh} // Set the function to call on pull to refresh
            />
          }
        />
      )}

      <Modal
        animationType="fade"
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
                    style={[styles.modalButton, styles.chatbotButton]}
                    onPress={handleAskChatbotForPrediction}
                  >
                    <Ionicons
                      name="chatbubbles-outline"
                      size={20}
                      color="white"
                    />
                    <Text style={styles.buttonText}>Ask Chatbot</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.communityButton]}
                    onPress={handleAskCommunityForPrediction}
                  >
                    <Ionicons name="people-outline" size={20} color="white" />
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
    backgroundColor: Colors.background,
    padding: 10,
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
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    width: "85%",
    maxHeight: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  scrollContainer: {
    width: "100%",
  },
  section: {
    marginBottom: 24,
    width: "100%",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  predictionText: {
    fontSize: 16,
    marginBottom: 5,
  },
  followUpItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 8,
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
    marginBottom: 8,
    paddingLeft: 12,
    color: "#444",
    lineHeight: 20,
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
    marginLeft: 8,
    fontWeight: "600",
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    width: "45%",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chatbotButton: {
    backgroundColor: "#34C759",
  },
  communityButton: {
    backgroundColor: "#007AFF",
  },
});

export default PredictionHistoryScreen;
