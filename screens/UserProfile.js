import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { auth } from "../firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const UserProfile = ({ navigation }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const userData = await AsyncStorage.getItem("userData");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      await AsyncStorage.removeItem("userData");
      navigation.reset({
        index: 0,
        routes: [{ name: "CorporateLogin" }],
      });
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Profile</Text>
      {user && (
        <>
          <Text>Email: {user.email}</Text>
          {/* Add more user details here */}
        </>
      )}
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
});

export default UserProfile;
