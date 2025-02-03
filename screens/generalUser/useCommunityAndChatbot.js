import { useNavigation } from "@react-navigation/native";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useState, useEffect } from "react";

export const useCommunityAndChatbot = () => {
  const navigation = useNavigation();
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    fetchUserLocation();
  }, []);

  const fetchUserLocation = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const docRef = doc(db, "generalUsers", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData.location) {
            setUserLocation(userData.location);
          }
        }
      } catch (error) {
        console.error("Error fetching user location:", error);
      }
    }
  };

  const handleAskChat = ({
    plantType,
    disease,
    confidence,
    followUpAnswers,
  }) => {
    // Create location string if available
    const locationString = userLocation
      ? `\nUser Location: Latitude ${userLocation.latitude}, Longitude ${userLocation.longitude}`
      : "";

    const chatPrompt = `I have a ${plantType} plant diagnosed with ${disease} (${confidence}% confidence). 
    Can you provide:
    1. Methods to confirm this diagnosis
    2. Effective treatment options
    3. Preventive measures for future occurrences

    Additional context: 
    - Plant Type: ${plantType}
    - Confidence Level: ${confidence}%
    - Follow-up Answers: ${JSON.stringify(followUpAnswers)}${locationString}`;

    navigation.navigate("Chatbot", { initialQuestion: chatPrompt });
    return true; // Can be used to handle modal closing in components
  };

  const handleAskCommunity = ({
    plantType,
    disease,
    confidence,
    followUpAnswers,
  }) => {
    const postContent = `Plant Type: ${plantType}
Disease: ${disease}
Confidence: ${confidence}%

Follow-up Information:
${Object.entries(followUpAnswers)
  .map(([question, answer]) => `${question}: ${answer ? "Yes" : "No"}`)
  .join("\n")}

I would appreciate any advice or experience with treating this condition.`;

    navigation.navigate("Community", {
      screen: "CommunityMain",
      params: { predefinedPost: postContent },
    });
    return true; // Can be used to handle modal closing in components
  };

  return {
    handleAskChat,
    handleAskCommunity,
  };
};
