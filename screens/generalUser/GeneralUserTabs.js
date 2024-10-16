import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import PredictionScreen from "./PredictionScreen";
import CommunityScreen from "./CommunityScreen";
import PostCommentsScreen from "./PostCommentsScreen";
import ChatbotScreen from "./ChatbotScreen";
import UserProfileScreen from "./UserProfileScreen";
import DashboardScreen from "./DashboardScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Tab = createBottomTabNavigator();
const CommunityStack = createNativeStackNavigator();

const CommunityStackScreen = () => (
  <CommunityStack.Navigator>
    <CommunityStack.Screen
      name="CommunityMain"
      component={CommunityScreen}
      options={{ headerShown: false }}
    />
    <CommunityStack.Screen
      name="PostCommentsScreen"
      component={PostCommentsScreen}
      options={{ title: "Comments" }}
    />
  </CommunityStack.Navigator>
);

const GeneralUserTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Prediction") {
            iconName = focused ? "leaf" : "leaf-outline";
          } else if (route.name === "Community") {
            iconName = focused ? "people" : "people-outline";
          } else if (route.name === "Chatbot") {
            iconName = focused ? "chatbubbles" : "chatbubbles-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === "Dashboard") {
            iconName = focused ? "grid" : "grid-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Prediction" component={PredictionScreen} />
      <Tab.Screen
        name="Community"
        component={CommunityStackScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Chatbot" component={ChatbotScreen} />
      <Tab.Screen name="Profile" component={UserProfileScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
    </Tab.Navigator>
  );
};

export default GeneralUserTabs;
