import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../../firebase";

const CommunityScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData = [];
      querySnapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() });
      });
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, []);

  const handleAddPost = async () => {
    if (newPost.trim() === "") {
      Alert.alert("Error", "Post cannot be empty");
      return;
    }

    try {
      await addDoc(collection(db, "posts"), {
        content: newPost,
        authorId: auth.currentUser.uid,
        authorEmail: auth.currentUser.email,
        createdAt: new Date().toISOString(),
        comments: [],
      });
      setNewPost("");
    } catch (error) {
      console.error("Error adding post:", error);
      Alert.alert("Error", "Failed to add post");
    }
  };

  const renderPost = ({ item }) => (
    <View style={styles.postContainer}>
      <Text style={styles.postContent}>{item.content}</Text>
      <Text style={styles.postAuthor}>Posted by: {item.authorEmail}</Text>
      <TouchableOpacity
        style={styles.commentButton}
        onPress={() =>
          navigation.navigate("PostCommentsScreen", { postId: item.id })
        }
      >
        <Text style={styles.commentButtonText}>View Comments</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        style={styles.postList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newPost}
          onChangeText={setNewPost}
          placeholder="What's on your mind?"
          multiline
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddPost}>
          <Text style={styles.addButtonText}>Post</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  postList: {
    flex: 1,
  },
  postContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
  },
  postContent: {
    fontSize: 16,
    marginBottom: 5,
  },
  postAuthor: {
    fontSize: 12,
    color: "#666",
  },
  commentButton: {
    marginTop: 10,
    alignSelf: "flex-end",
  },
  commentButtonText: {
    color: "#007AFF",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#f0f0f0",
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 10,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    padding: 10,
    justifyContent: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default CommunityScreen;
