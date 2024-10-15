import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";

const Reports = ({ navigation, route }) => {
  const [reports, setReports] = useState([]);
  const { fieldId } = route.params;

  useEffect(() => {
    const fetchReports = async () => {
      const q = query(
        collection(db, "diseaseReports"),
        where("fieldId", "==", fieldId)
      );
      const querySnapshot = await getDocs(q);
      const reportData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReports(reportData);
    };

    fetchReports();
  }, [fieldId]);

  const renderReportItem = ({ item }) => (
    <TouchableOpacity
      style={styles.reportItem}
      onPress={() => navigation.navigate("ReportDetail", { report: item })}
    >
      <Text>Date: {new Date(item.dateTime).toLocaleString()}</Text>
      <Text>Disease: {item.prediction}</Text>
      <Text>Reported by: {item.worker}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={reports}
        renderItem={renderReportItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  reportItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
});

export default Reports;
