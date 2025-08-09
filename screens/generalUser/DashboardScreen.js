import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
} from "react-native";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebase";
import { Ionicons } from "@expo/vector-icons";
import FertilizerCalculator from "./FertilizerCalculator";
import { useCommunityAndChatbot } from "./useCommunityAndChatbot";

// Weather condition to icon mapping
const getWeatherIcon = (condition) => {
  // Map weather conditions to Ionicons
  const conditionMap = {
    // Sunny / Clear
    1000: "sunny",
    // Partly cloudy
    1003: "partly-sunny",
    // Cloudy
    1006: "cloud",
    1009: "cloudy",
    // Rain
    1063: "rainy", // Patchy rain
    1150: "rainy", // Patchy light drizzle
    1153: "rainy", // Light drizzle
    1168: "rainy", // Freezing drizzle
    1171: "rainy", // Heavy freezing drizzle
    1180: "rainy", // Patchy light rain
    1183: "rainy", // Light rain
    1186: "rainy", // Moderate rain
    1189: "rainy", // Moderate rain
    1192: "rainy", // Heavy rain
    1195: "rainy", // Heavy rain
    1198: "rainy", // Light freezing rain
    1201: "rainy", // Moderate/heavy freezing rain
    // Thunder
    1087: "thunderstorm",
    1273: "thunderstorm", // Patchy light rain with thunder
    1276: "thunderstorm", // Moderate/heavy rain with thunder
    1279: "thunderstorm", // Patchy light snow with thunder
    1282: "thunderstorm", // Moderate/heavy snow with thunder
    // Snow
    1114: "snow",
    1210: "snow",
    1213: "snow",
    1216: "snow",
    1219: "snow", // Moderate snow
    1222: "snow", // Patchy heavy snow
    1225: "snow", // Heavy snow
    1237: "snow", // Ice pellets
    // Mist/Fog
    1030: "water", // Mist
    1135: "water", // Fog
    1147: "water", // Freezing fog
    // Sleet
    1069: "snow", // Patchy sleet
    1072: "snow", // Patchy freezing drizzle
    1204: "snow", // Light sleet
    1207: "snow", // Moderate/heavy sleet
    // Default
    default: "help-circle-outline",
  };

  return conditionMap[condition] || conditionMap.default;
};

const DashboardScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [recentPredictions, setRecentPredictions] = useState([]);
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [isPredictionDialogVisible, setIsPredictionDialogVisible] =
    useState(false);
  const [followUpAnswers, setFollowUpAnswers] = useState({});
  const [treatments, setTreatments] = useState([]);

  const WEATHER_API_KEY = process.env.WEATHER_API_KEY || "YOUR_WEATHER_API_KEY"; // Replace API key with env

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUserLocation(),
        fetchRecentPosts(),
        fetchRecentPredictions(),
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      Alert.alert("Error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchDashboardData().finally(() => setRefreshing(false));
  }, []);

  const fetchUserLocation = async () => {
    try {
      const userDocRef = doc(db, "generalUsers", auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData?.location?.latitude && userData?.location?.longitude) {
          setUserLocation(userData.location);
          await fetchWeatherData(userData.location);
        }
      }
    } catch (error) {
      console.error("Error fetching user location:", error);
    }
  };

  const fetchWeatherData = async (location) => {
    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${location.latitude},${location.longitude}&days=3&aqi=no`
      );
      const data = await response.json();
      setWeather(data.current);
      setForecast(data.forecast.forecastday);
    } catch (error) {
      console.error("Error fetching weather:", error);
    }
  };

  const fetchRecentPosts = async () => {
    try {
      // First try to fetch with ordering
      const postsQuery = query(
        collection(db, "posts"),
        where("authorId", "==", auth.currentUser.uid),
        orderBy("createdAt", "desc"),
        limit(3)
      );

      try {
        const postsSnap = await getDocs(postsQuery);
        const postsData = postsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          isNew:
            new Date(doc.data().createdAt) >
            new Date(Date.now() - 24 * 60 * 60 * 1000),
        }));
        setRecentPosts(postsData);
      } catch (error) {
        // If index error occurs, fetch without ordering temporarily
        if (error.code === "failed-precondition") {
          const simpleQuery = query(
            collection(db, "posts"),
            where("authorId", "==", auth.currentUser.uid),
            limit(3)
          );
          const snap = await getDocs(simpleQuery);
          const data = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            isNew:
              new Date(doc.data().createdAt) >
              new Date(Date.now() - 24 * 60 * 60 * 1000),
          }));
          setRecentPosts(data);
          console.log("Please create the required index in Firebase Console");
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const fetchRecentPredictions = async () => {
    const predictionsQuery = query(
      collection(db, "generalUserPredictions"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("dateTime", "desc"),
      limit(3)
    );

    const predictionsSnap = await getDocs(predictionsQuery);
    const predictionsData = predictionsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      isNew:
        new Date(doc.data().dateTime) >
        new Date(Date.now() - 24 * 60 * 60 * 1000),
    }));
    setRecentPredictions(predictionsData);
  };

  const handlePostPress = (post) => {
    setSelectedPost(post);
    setIsDialogVisible(true);
  };

  const handleViewPost = () => {
    setIsDialogVisible(false);
    navigation.navigate("Community", {
      screen: "PostCommentsScreen",
      params: { postId: selectedPost.id },
    });
  };

  const handleAskChatbot = () => {
    setIsDialogVisible(false);
    navigation.navigate("Chatbot", {
      initialQuestion: selectedPost.content,
    });
  };

  const PostActionDialog = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isDialogVisible}
      onRequestClose={() => setIsDialogVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Post Actions</Text>
          <Text style={styles.modalText} numberOfLines={3}>
            {selectedPost?.content}
          </Text>

          <View style={styles.modalButtons}>
            <Pressable
              style={[styles.modalButton, styles.viewPostButton]}
              onPress={handleViewPost}
            >
              <Ionicons name="document-text-outline" size={20} color="white" />
              <Text style={styles.modalButtonText}>View Post</Text>
            </Pressable>

            <Pressable
              style={[styles.modalButton, styles.askChatbotButton]}
              onPress={handleAskChatbot}
            >
              <Ionicons name="chatbubbles-outline" size={20} color="white" />
              <Text style={styles.modalButtonText}>Ask Chatbot</Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.closeButton}
            onPress={() => setIsDialogVisible(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

  const renderRecentPosts = () => (
    <CardSection title="Recent Posts">
      {recentPosts.length === 0 ? (
        <Text>No recent posts</Text>
      ) : (
        recentPosts.map((post) => (
          <TouchableOpacity
            key={post.id}
            style={styles.listItem}
            onPress={() => handlePostPress(post)}
          >
            <Text numberOfLines={2}>{post.content}</Text>
            {post.isNew && <View style={styles.newIndicator} />}
          </TouchableOpacity>
        ))
      )}
    </CardSection>
  );

  const handlePredictionPress = async (prediction) => {
    try {
      // Fetch follow-up answers for this prediction
      const followUpsQuery = query(
        collection(db, "predictionFollowUps"),
        where("userId", "==", auth.currentUser.uid),
        where("predictionId", "==", prediction.id)
      );

      const followUpsSnapshot = await getDocs(followUpsQuery);
      const followUpData = followUpsSnapshot.docs[0]?.data();

      if (followUpData) {
        setFollowUpAnswers(followUpData.followUpAnswers);
      }

      // Fetch treatments
      const treatmentsQuery = query(
        collection(db, "treatments"),
        where("disease", "==", prediction.prediction),
        where("plantType", "==", prediction.plantType)
      );

      const treatmentsSnapshot = await getDocs(treatmentsQuery);
      if (!treatmentsSnapshot.empty) {
        setTreatments(treatmentsSnapshot.docs[0].data().treatment);
      } else {
        setTreatments(["No specific treatments found for this disease."]);
      }

      setSelectedPrediction(prediction);
      setIsPredictionDialogVisible(true);
    } catch (error) {
      console.error("Error fetching prediction details:", error);
      Alert.alert("Error", "Failed to load prediction details");
    }
  };

  const { handleAskChat, handleAskCommunity } = useCommunityAndChatbot();

  const handleAskChatbotForPrediction = () => {
    if (selectedPrediction) {
      const success = handleAskChat({
        plantType: selectedPrediction.plantType,
        disease: selectedPrediction.prediction,
        confidence: selectedPrediction.confidence,
        followUpAnswers: followUpAnswers,
      });
      if (success) {
        setIsPredictionDialogVisible(false);
      }
    }
  };

  const handleAskCommunityForPrediction = () => {
    if (selectedPrediction) {
      const success = handleAskCommunity({
        plantType: selectedPrediction.plantType,
        disease: selectedPrediction.prediction,
        confidence: selectedPrediction.confidence,
        followUpAnswers: followUpAnswers,
      });
      if (success) {
        setIsPredictionDialogVisible(false);
      }
    }
  };

  const PredictionDialog = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isPredictionDialogVisible}
      onRequestClose={() => setIsPredictionDialogVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Prediction Details</Text>

          {selectedPrediction && (
            <ScrollView style={styles.scrollContainer}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Diagnosis</Text>
                <Text>Plant Type: {selectedPrediction.plantType}</Text>
                <Text>Disease: {selectedPrediction.prediction}</Text>
                <Text>Confidence: {selectedPrediction.confidence}%</Text>
                <Text>
                  Date: {new Date(selectedPrediction.dateTime).toLocaleString()}
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Follow-up Responses</Text>
                {Object.entries(followUpAnswers).map(
                  ([question, answer], index) => (
                    <View key={index} style={styles.followUpItem}>
                      <Text style={styles.questionText}>{question}</Text>
                      <Text>Answer: {answer ? "Yes" : "No"}</Text>
                    </View>
                  )
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recommended Treatments</Text>
                {treatments.map((treatment, index) => (
                  <Text key={index} style={styles.treatmentText}>
                    • {treatment}
                  </Text>
                ))}
              </View>
            </ScrollView>
          )}

          <View style={styles.modalButtons}>
            <Pressable
              style={[styles.modalButton, styles.chatbotButton]}
              onPress={handleAskChatbotForPrediction}
            >
              <Ionicons name="chatbubbles-outline" size={20} color="white" />
              <Text style={styles.modalButtonText}>Ask Chatbot</Text>
            </Pressable>

            <Pressable
              style={[styles.modalButton, styles.communityButton]}
              onPress={handleAskCommunityForPrediction}
            >
              <Ionicons name="people-outline" size={20} color="white" />
              <Text style={styles.modalButtonText}>Ask Community</Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.closeButton}
            onPress={() => setIsPredictionDialogVisible(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

  // Update the renderRecentPredictions function
  const renderRecentPredictions = () => (
    <CardSection title="Recent Predictions">
      {recentPredictions.length === 0 ? (
        <Text>No recent predictions</Text>
      ) : (
        recentPredictions.map((prediction) => (
          <TouchableOpacity
            key={prediction.id}
            style={styles.listItem}
            onPress={() => handlePredictionPress(prediction)}
          >
            <View style={styles.predictionContent}>
              <Text style={styles.predictionType}>
                Disease: {prediction.prediction}
              </Text>
              <Text style={styles.predictionConfidence}>
                Confidence: {prediction.confidence}%
              </Text>
            </View>
            {prediction.isNew && <View style={styles.newIndicator} />}
          </TouchableOpacity>
        ))
      )}
    </CardSection>
  );

  const CardSection = ({ title, children }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.cardContent}>{children}</View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const WeatherIcon = ({ condition, size = 24, color = "#000" }) => (
    <Ionicons name={getWeatherIcon(condition.code)} size={size} color={color} />
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Weather Section */}
      <CardSection title="Weather Information">
        {!userLocation ? (
          <TouchableOpacity
            style={styles.locationPrompt}
            onPress={() => navigation.navigate("Profile")}
          >
            <Text>Add your location in profile to see weather updates</Text>
            <Ionicons name="arrow-forward" size={20} color="#007AFF" />
          </TouchableOpacity>
        ) : (
          <View>
            {weather && (
              <View style={styles.currentWeather}>
                <Text style={styles.temperature}>{weather.temp_c}°C</Text>
                <WeatherIcon
                  condition={weather.condition}
                  size={40}
                  color="#007AFF"
                />
                <Text style={styles.weatherText}>{weather.condition.text}</Text>
              </View>
            )}
            {forecast && (
              <View style={styles.forecast}>
                {forecast.map((day, index) => (
                  <View key={index} style={styles.forecastDay}>
                    <Text style={styles.forecastDate}>
                      {new Date(day.date).toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </Text>
                    <Text style={styles.forecastTemp}>
                      {day.day.avgtemp_c}°C
                    </Text>
                    <WeatherIcon
                      condition={day.day.condition}
                      size={24}
                      color="#666"
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </CardSection>

      {/* Recent Posts Section */}
      {renderRecentPosts()}

      {/* Recent Predictions Section */}
      {renderRecentPredictions()}

      {/* Fertilizer Calculator Section */}
      <CardSection title="Fertilizer Calculator">
        <FertilizerCalculator />
      </CardSection>
      <PostActionDialog />
      <PredictionDialog />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  card: {
    marginBottom: 20,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  cardContent: {
    padding: 16,
  },
  // Weather Section Styles
  locationPrompt: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(0,122,255,0.08)",
    borderRadius: 12,
  },
  currentWeather: {
    alignItems: "center",
    marginBottom: 20,
    padding: 12,
  },
  temperature: {
    fontSize: 48,
    fontWeight: "700",
    marginBottom: 8,
    color: "#1a1a1a",
    letterSpacing: -1,
  },
  weatherText: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  forecast: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  forecastDay: {
    alignItems: "center",
    flex: 1,
    padding: 8,
  },
  forecastDate: {
    fontSize: 14,
    marginBottom: 6,
    color: "#666",
    fontWeight: "500",
  },
  forecastTemp: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
    color: "#1a1a1a",
  },
  // List Item Styles
  listItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  newIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#34C759",
    marginLeft: 12,
  },
  fertilizerResults: {
    padding: 12,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
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
  modalText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: "center",
    color: "#444",
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
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
  viewPostButton: {
    backgroundColor: "#007AFF",
  },
  askChatbotButton: {
    backgroundColor: "#34C759",
  },
  chatbotButton: {
    backgroundColor: "#34C759",
  },
  communityButton: {
    backgroundColor: "#007AFF",
  },
  modalButtonText: {
    color: "white",
    marginLeft: 8,
    fontWeight: "600",
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  closeButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  // Prediction Styles
  predictionContent: {
    flex: 1,
  },
  predictionType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  predictionConfidence: {
    fontSize: 14,
    color: "#666",
  },
  // Section Styles
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
  followUpItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 8,
  },
  questionText: {
    fontWeight: "600",
    marginBottom: 6,
    color: "#444",
  },
  treatmentText: {
    marginBottom: 8,
    paddingLeft: 12,
    color: "#444",
    lineHeight: 20,
  },
  scrollContainer: {
    maxHeight: 400,
    width: "100%",
  },
});

export default DashboardScreen;
