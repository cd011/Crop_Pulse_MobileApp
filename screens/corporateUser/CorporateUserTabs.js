import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import FieldOverview from "./FieldOverview";
import DiseasePrediction from "./DiseasePrediction";
import FollowUpQuestions from "./FollowUpQuestions";
import Reports from "./Reports";
import ReportDetail from "./ReportDetail";
import UserProfile from "./UserProfile";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const FieldStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="FieldOverview" component={FieldOverview} />
    <Stack.Screen name="DiseasePrediction" component={DiseasePrediction} />
    <Stack.Screen name="FollowUpQuestions" component={FollowUpQuestions} />
    <Stack.Screen name="Reports" component={Reports} />
    <Stack.Screen name="ReportDetail" component={ReportDetail} />
  </Stack.Navigator>
);

const CorporateUserTabs = () => (
  <Tab.Navigator>
    <Tab.Screen
      name="Fields"
      component={FieldStack}
      options={{ headerShown: false }}
    />
    <Tab.Screen name="Profile" component={UserProfile} />
  </Tab.Navigator>
);

export default CorporateUserTabs;
