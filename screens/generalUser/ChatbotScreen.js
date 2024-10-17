import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Markdown from "react-native-markdown-display";
// import { GEMINI_API_KEY } from "@env";

const API_KEY = "AIzaSyCjLQznlMxxiMWTmXRgaW7KRZs0N3Yd3TU";

const genAI = new GoogleGenerativeAI(API_KEY);

const ChatbotScreen = ({ route }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    // Check if there's an initial question from navigation params
    if (route.params?.initialQuestion) {
      setInputText(route.params.initialQuestion);
      // Automatically send the question
      handleSendMessage(route.params.initialQuestion);
    }
  }, [route.params?.initialQuestion]);

  const handleSendMessage = useCallback(
    async (text) => {
      const messageToSend = text || inputText;
      console.log(
        "messageToSend type:",
        typeof messageToSend,
        "value:",
        messageToSend
      );
      if (messageToSend.trim() === "") return;

      const newMessage = {
        id: Date.now(),
        text: messageToSend,
        sender: "user",
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setInputText("");

      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `You are a helpful assistant for farmers, specializing in crop diseases. Please provide information and advice about the following query related to crop diseases: ${messageToSend}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();

        const botMessage = {
          id: Date.now(),
          text: responseText,
          sender: "bot",
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      } catch (error) {
        console.error("Error generating response:", error);
        const errorMessage = {
          id: Date.now(),
          text: "Sorry, I encountered an error. Please try again.",
          sender: "bot",
        };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      }
    },
    [inputText]
  );

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageBubble,
        item.sender === "user" ? styles.userBubble : styles.botBubble,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        style={styles.messageList}
        inverted
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask about crop diseases..."
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => handleSendMessage(inputText)}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  messageList: {
    flex: 1,
    padding: 10,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 10,
    borderRadius: 20,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#DCF8C6",
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#007AFF",
    borderRadius: 20,
    paddingHorizontal: 20,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ChatbotScreen;
