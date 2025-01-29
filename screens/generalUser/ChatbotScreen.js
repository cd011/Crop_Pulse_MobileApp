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

const API_KEY = "AIzaSyBKKMtjkrp3dJjK70_hCV21OMmXvtLqc2k";

const genAI = new GoogleGenerativeAI(API_KEY);

const ChatbotScreen = ({ route, navigation }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);
  const isInitialMount = useRef(true);
  const previousQuestionRef = useRef("");

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  // Add initial welcome message
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      const welcomeMessage = {
        id: Date.now(),
        text: "Hello! I'm your farming assistant, specialized in helping with crop diseases and plant health. How can I help you today?",
        sender: "bot",
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Handle navigation options and new chat
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            previousQuestionRef.current = "";
            setMessages([]);
            const welcomeMessage = {
              id: Date.now(),
              text: "Hello! I'm your farming assistant, specialized in helping with crop diseases and plant health. How can I help you today?",
              sender: "bot",
            };
            setMessages([welcomeMessage]);
          }}
          style={styles.newChatButton}
        >
          <Text style={styles.newChatButtonText}>New Chat</Text>
        </TouchableOpacity>
      ),
    });
  }, []);

  // Handle initial question from community post
  useEffect(() => {
    const processQuestion = async () => {
      const currentQuestion = route.params?.initialQuestion;

      if (
        currentQuestion &&
        currentQuestion !== previousQuestionRef.current &&
        messages.length > 0 &&
        !isLoading
      ) {
        previousQuestionRef.current = currentQuestion;
        await handleSendMessage(currentQuestion);
        // Clear the navigation params to allow the same question to be asked again
        navigation.setParams({ initialQuestion: null });
      }
    };

    processQuestion();
  }, [route.params?.initialQuestion, messages]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      // Reset the previous question reference when the screen comes into focus
      previousQuestionRef.current = "";
    });

    return unsubscribe;
  }, [navigation]);

  const handleSendMessage = useCallback(
    async (text) => {
      const messageToSend = text || inputText;
      if (messageToSend.trim() === "") return;

      const newMessage = {
        id: Date.now(),
        text: messageToSend,
        sender: "user",
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setInputText("");
      setIsLoading(true);

      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // const prompt = `Just a test. Reply:Pass ${messageToSend}`;
        const prompt = `You are a helpful assistant for farmers, specializing in crop diseases. Please provide information and advice about the following query related to crop diseases: ${messageToSend}. Limit your response to less than 50 words. `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();

        // Calculate tokens used based on word count ratio (65 tokens for every 100 words)
        const wordCount = responseText.trim().split(/\s+/).length;
        const tokensUsed = Math.ceil((wordCount * 65) / 100);
        const currentTime = new Date().getTime();

        console.log(`Current time (ms since epoch): ${currentTime}`);
        console.log(`Tokens used: ${tokensUsed}`);

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
      } finally {
        setIsLoading(false);
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
      {item.sender === "user" ? (
        <Text style={styles.messageText}>{item.text}</Text>
      ) : (
        <Markdown style={markdownStyles}>{item.text}</Markdown>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.messageListContainer}>
        <FlatList
          ref={flatListRef}
          data={[...messages].reverse()}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          style={styles.messageList}
          inverted={true}
          contentContainerStyle={styles.messageListContent}
        />
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}
      </View>
      <KeyboardAvoidingView behavior="height" keyboardVerticalOffset={0}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about crop diseases..."
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => handleSendMessage(inputText)}
            disabled={isLoading}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const markdownStyles = {
  body: {
    color: "#333",
  },
  heading1: {
    fontSize: 24,
    marginBottom: 10,
    fontWeight: "bold",
  },
  heading2: {
    fontSize: 20,
    marginBottom: 8,
    fontWeight: "bold",
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 8,
  },
  link: {
    color: "#007AFF",
  },
  listItem: {
    fontSize: 16,
    marginBottom: 4,
  },
  bullet_list: {
    marginLeft: 20,
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  messageListContainer: {
    flex: 1,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 10,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 10,
    borderRadius: 20,
    marginVertical: 5,
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
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
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
    maxHeight: 100,
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
  loadingContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 20,
    alignItems: "center",
  },
  newChatButton: {
    marginRight: 15,
  },
  newChatButtonText: {
    color: "#007AFF",
    fontSize: 16,
  },
});

export default ChatbotScreen;
