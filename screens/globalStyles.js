import { StyleSheet } from "react-native";

export const Colors = {
  primary: "#2E7D32", // Dark green (main theme)
  primaryLight: "#C8E6C9", // Light green
  secondary: "#FFA000", // Accent color (orange)
  background: "#F5F5F5", // Light gray background
  text: "#212121", // Dark gray for text
  white: "#FFFFFF", // White
  error: "#D32F2F", // Red for errors
  success: "#388E3C", // Green for success messages
};

export const Typography = {
  h1: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
  },
  body: {
    fontSize: 16,
    color: Colors.text,
  },
  caption: {
    fontSize: 14,
    color: "#616161",
  },
  button: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.white,
  },
};

export const GlobalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    ...Typography.button,
  },
  input: {
    height: 48,
    borderColor: Colors.primaryLight,
    borderWidth: 1,
    marginBottom: 16,
    paddingLeft: 12,
    borderRadius: 8,
    backgroundColor: Colors.white,
  },
});
