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
    1063: "rainy",
    1180: "rainy",
    1183: "rainy",
    1186: "rainy",
    1189: "rainy",
    1192: "rainy",
    1195: "rainy",
    // Thunder
    1087: "thunderstorm",
    // Snow
    1114: "snow",
    1210: "snow",
    1213: "snow",
    1216: "snow",
    // Mist
    1030: "water",
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
  const [fertilizerCalc, setFertilizerCalc] = useState({
    nitrogen: 0,
    phosphorus: 0,
    potassium: 0,
  });
  const [selectedPost, setSelectedPost] = useState(null);
  const [isDialogVisible, setIsDialogVisible] = useState(false);

  const WEATHER_API_KEY = "37acc4c53c27446c904205138241610"; // Replace API key with env

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
        `http://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${location.latitude},${location.longitude}&days=3&aqi=no`
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

  const calculateFertilizer = (area, cropType) => {
    // This is a simplified calculation - you should implement proper calculations based on crop requirements
    const baseRates = {
      rice: { n: 120, p: 60, k: 60 },
      wheat: { n: 100, p: 50, k: 50 },
      corn: { n: 140, p: 70, k: 70 },
      default: { n: 100, p: 50, k: 50 },
    };

    const rates = baseRates[cropType] || baseRates.default;
    setFertilizerCalc({
      nitrogen: ((rates.n * area) / 10000).toFixed(2),
      phosphorus: ((rates.p * area) / 10000).toFixed(2),
      potassium: ((rates.k * area) / 10000).toFixed(2),
    });
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
      <CardSection title="Recent Predictions">
        {recentPredictions.length === 0 ? (
          <Text>No recent predictions</Text>
        ) : (
          recentPredictions.map((prediction) => (
            <View key={prediction.id} style={styles.listItem}>
              <Text>Disease: {prediction.prediction}</Text>
              <Text>Confidence: {prediction.confidence}%</Text>
              {prediction.isNew && <View style={styles.newIndicator} />}
            </View>
          ))
        )}
      </CardSection>

      {/* Fertilizer Calculator Section */}
      <CardSection title="Fertilizer Calculator">
        <View style={styles.fertilizerResults}>
          <Text>Recommended Application (kg/ha):</Text>
          <Text>Nitrogen (N): {fertilizerCalc.nitrogen}</Text>
          <Text>Phosphorus (P): {fertilizerCalc.phosphorus}</Text>
          <Text>Potassium (K): {fertilizerCalc.potassium}</Text>
        </View>
      </CardSection>
      <PostActionDialog />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    marginBottom: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  cardContent: {
    padding: 16,
  },
  locationPrompt: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
  },
  currentWeather: {
    alignItems: "center",
    marginBottom: 16,
    padding: 8,
  },
  temperature: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 8,
  },
  weatherText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  forecast: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  forecastDay: {
    alignItems: "center",
    flex: 1,
  },
  forecastDate: {
    fontSize: 12,
    marginBottom: 4,
    color: "#666",
  },
  forecastTemp: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  listItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  newIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007AFF",
    marginLeft: 8,
  },
  fertilizerResults: {
    padding: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "80%",
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
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 15,
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    width: "45%",
    justifyContent: "center",
  },
  viewPostButton: {
    backgroundColor: "#007AFF",
  },
  askChatbotButton: {
    backgroundColor: "#34C759",
  },
  modalButtonText: {
    color: "white",
    marginLeft: 5,
    fontWeight: "bold",
  },
  closeButton: {
    marginTop: 10,
  },
  closeButtonText: {
    color: "#666",
    fontSize: 16,
  },
});

export default DashboardScreen;
