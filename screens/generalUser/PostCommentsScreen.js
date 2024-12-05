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
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { auth, db } from "../../firebase";

const PostCommentsScreen = ({ route }) => {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      const postDoc = await getDoc(doc(db, "posts", postId));
      if (postDoc.exists()) {
        setPost({ id: postDoc.id, ...postDoc.data() });
      } else {
        Alert.alert("Error", "Post not found");
      }
    };

    fetchPost();
  }, [postId]);

  const handleAddComment = async () => {
    if (newComment.trim() === "") {
      Alert.alert("Error", "Comment cannot be empty");
      return;
    }

    try {
      const comment = {
        content: newComment,
        authorId: auth.currentUser.uid,
        authorEmail: auth.currentUser.email,
        createdAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, "posts", postId), {
        comments: arrayUnion(comment),
      });

      setPost({ ...post, comments: [...post.comments, comment] });
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Failed to add comment");
    }
  };

  const maskEmail = (email) => {
    // Split the email into username and domain parts
    const [username, domain] = email.split("@");

    // Mask the username part (e.g., show only the first character)
    const maskedUsername = username[0] + "*".repeat(username.length - 1);

    // Optionally, mask part of the domain as well (e.g., show only the first character of the domain)
    // const domainParts = domain.split(".");
    // const maskedDomain =
    //   domainParts[0][0] +
    //   "*".repeat(domainParts[0].length - 1) +
    //   "." +
    //   domainParts[1];

    return `${maskedUsername}@${domain}`;
  };

  const renderComment = ({ item }) => (
    <View style={styles.commentContainer}>
      <Text style={styles.commentContent}>{item.content}</Text>
      <Text style={styles.commentAuthor}>
        Posted by: {maskEmail(item.authorEmail)}
      </Text>
    </View>
  );

  if (!post) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.postContainer}>
        <Text style={styles.postContent}>{post.content}</Text>
        <Text style={styles.postAuthor}>
          Posted by: {maskEmail(post.authorEmail)}
        </Text>
      </View>
      <FlatList
        data={post.comments}
        renderItem={renderComment}
        keyExtractor={(item, index) => index.toString()}
        style={styles.commentList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Add a comment..."
          multiline
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddComment}>
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
  commentList: {
    flex: 1,
  },
  commentContainer: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  commentContent: {
    fontSize: 14,
  },
  commentAuthor: {
    fontSize: 10,
    color: "#666",
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

export default PostCommentsScreen;
