import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import GreetingScreen from "./screens/GreetingScreen";
import CorporateLogin from "./screens/CorporateLogin";
import FieldOverview from "./screens/FieldOverview";
import DiseasePrediction from "./screens/DiseasePrediction";
import FollowUpQuestions from "./screens/FollowUpQuestions";
import Reports from "./screens/Reports";
import ReportDetail from "./screens/ReportDetail";
import UserProfile from "./screens/UserProfile";
import GeneralUserAuth from "./screens/GeneralUserAuth";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const FieldStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="FieldOverview" component={FieldOverview} />
    <Stack.Screen name="DiseasePrediction" component={DiseasePrediction} />
    <Stack.Screen name="FollowUpQuestions" component={FollowUpQuestions} />
    <Stack.Screen name="Reports" component={Reports} />
    <Stack.Screen name="ReportDetail" component={ReportDetail} />
  </Stack.Navigator>
);

const CorporateTabs = () => (
  <Tab.Navigator>
    <Tab.Screen
      name="Fields"
      component={FieldStack}
      options={{ headerShown: false }}
    />
    <Tab.Screen name="Profile" component={UserProfile} />
  </Tab.Navigator>
);

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Greeting" component={GreetingScreen} />
        <Stack.Screen name="CorporateLogin" component={CorporateLogin} />
        <Stack.Screen name="CorporateMain" component={CorporateTabs} />
        <Stack.Screen name="GeneralUserAuth" component={GeneralUserAuth} />
        {/* GeneralUserTabs will be added in the next step */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
