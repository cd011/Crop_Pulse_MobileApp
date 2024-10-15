import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "./screens/Login";
import FieldOverview from "./screens/FieldOverview";
import DiseasePrediction from "./screens/DiseasePrediction";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="FieldOverview" component={FieldOverview} />
        <Stack.Screen name="DiseasePrediction" component={DiseasePrediction} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
