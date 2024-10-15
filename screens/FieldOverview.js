import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Button } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigation } from "@react-navigation/native";

const FieldOverview = () => {
  const [fields, setFields] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchFields = async () => {
      const user = auth.currentUser;
      if (user) {
        const q = query(
          collection(db, "fields"),
          where("assignedWorkerEmail", "==", user.email)
        );
        const querySnapshot = await getDocs(q);
        const fieldData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFields(fieldData);
      }
    };

    fetchFields();
  }, []);

  const renderField = ({ item }) => (
    <View style={styles.fieldItem}>
      <Text>Location: {item.location}</Text>
      <Text>Plant Type: {item.plantType}</Text>
      <Text>Area: {item.area} sq m</Text>
      <Button
        title="Predict Disease"
        onPress={() =>
          navigation.navigate("DiseasePrediction", {
            fieldId: item.id,
            location: item.location,
            plantType: item.plantType,
          })
        }
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* <Button
        title="Predict Disease"
        onPress={() => navigation.navigate("DiseasePrediction")}
      /> */}
      {fields.length > 0 ? (
        <>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: fields[0].latitude,
              longitude: fields[0].longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            {fields.map((field) => (
              <Marker
                key={field.id}
                coordinate={{
                  latitude: field.latitude,
                  longitude: field.longitude,
                }}
                title={field.location}
                description={field.plantType}
              />
            ))}
          </MapView>
          <FlatList
            data={fields}
            renderItem={renderField}
            keyExtractor={(item) => item.id}
            style={styles.list}
          />
        </>
      ) : (
        <Text style={styles.noFieldsText}>No fields assigned</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    height: 300,
  },
  list: {
    flex: 1,
  },
  fieldItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  noFieldsText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 18,
  },
});

export default FieldOverview;
