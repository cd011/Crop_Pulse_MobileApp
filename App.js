import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import GreetingScreen from "./screens/GreetingScreen";
import CorporateLogin from "./screens/corporateUser/CorporateLogin";
import CorporateUserTabs from "./screens/corporateUser/CorporateUserTabs";
import GeneralUserAuth from "./screens/generalUser/GeneralUserAuth";
import GeneralUserTabs from "./screens/generalUser/GeneralUserTabs";
import CompleteProfile from "./screens/generalUser/CompleteProfile";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Greeting" component={GreetingScreen} />
        <Stack.Screen name="CorporateLogin" component={CorporateLogin} />
        <Stack.Screen name="CorporateUserTabs" component={CorporateUserTabs} />
        <Stack.Screen name="GeneralUserAuth" component={GeneralUserAuth} />
        <Stack.Screen
          name="CompleteProfile"
          component={CompleteProfile}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="GeneralUserTabs" component={GeneralUserTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
