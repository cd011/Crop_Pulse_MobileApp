import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { addDoc, collection } from "firebase/firestore";
import { auth, db } from "../firebase";

const FollowUpQuestions = ({ route, navigation }) => {
  const { questions, prediction, image, fieldId, location, plantType } =
    route.params;
  const [answers, setAnswers] = useState(Array(questions.length).fill(""));

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        await addDoc(collection(db, "diseaseReports"), {
          worker: user.email,
          fieldId,
          location,
          plantType,
          prediction: prediction.predicted_disease,
          confidence: prediction.confidence,
          image,
          answers,
          dateTime: new Date().toISOString(),
        });
        Alert.alert("Success", "Report submitted successfully");
        navigation.navigate("FieldOverview");
      } catch (error) {
        console.error("Error submitting report:", error);
        Alert.alert("Error", "Failed to submit report");
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Follow-up Questions</Text>
      {questions.map((question, index) => (
        <View key={index} style={styles.questionContainer}>
          <Text style={styles.question}>{question}</Text>
          <TextInput
            style={styles.input}
            onChangeText={(text) => {
              const newAnswers = [...answers];
              newAnswers[index] = text;
              setAnswers(newAnswers);
            }}
            value={answers[index]}
            multiline
          />
        </View>
      ))}
      <Button title="Submit Report" onPress={handleSubmit} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  questionContainer: {
    marginBottom: 20,
  },
  question: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    fontSize: 16,
    borderRadius: 6,
  },
});

export default FollowUpQuestions;
