import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
} from "react-native";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

const ReportDetail = ({ route, navigation }) => {
  const { report } = route.params;
  const [answers, setAnswers] = useState(report.answers);
  const currentUser = auth.currentUser;

  const handleUpdate = async () => {
    if (currentUser.email === report.worker) {
      try {
        await updateDoc(doc(db, "diseaseReports", report.id), { answers });
        alert("Report updated successfully");
        navigation.goBack();
      } catch (error) {
        console.error("Error updating report:", error);
        alert("Failed to update report");
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Report Detail</Text>
      <Text>Date: {new Date(report.dateTime).toLocaleString()}</Text>
      <Text>Disease: {report.prediction}</Text>
      <Text>Confidence: {report.confidence}%</Text>
      <Text>Reported by: {report.worker}</Text>
      {report.answers.map((answer, index) => (
        <View key={index} style={styles.answerContainer}>
          <Text style={styles.question}>Question {index + 1}:</Text>
          <TextInput
            style={styles.input}
            value={answers[index]}
            onChangeText={(text) => {
              const newAnswers = [...answers];
              newAnswers[index] = text;
              setAnswers(newAnswers);
            }}
            editable={currentUser.email === report.worker}
          />
        </View>
      ))}
      {currentUser.email === report.worker && (
        <Button title="Update Report" onPress={handleUpdate} />
      )}
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
  answerContainer: {
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

export default ReportDetail;
