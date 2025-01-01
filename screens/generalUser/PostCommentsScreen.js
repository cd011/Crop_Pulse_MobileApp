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
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { auth, db } from "../../firebase";
import { Ionicons } from "@expo/vector-icons";

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
        authorName: auth.currentUser.displayName || "Anonymous",
        createdAt: new Date().toISOString(),
        likes: [],
        dislikes: [],
      };

      const updatedComments = [...(post.comments || []), comment];
      await updateDoc(doc(db, "posts", postId), {
        comments: updatedComments,
      });

      setPost({ ...post, comments: updatedComments });
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Failed to add comment");
    }
  };

  const handleLikeComment = async (commentIndex) => {
    const userId = auth.currentUser.uid;
    const updatedComments = [...post.comments];
    const comment = updatedComments[commentIndex];

    if (!comment.likes) comment.likes = [];
    if (!comment.dislikes) comment.dislikes = [];

    if (comment.likes.includes(userId)) {
      // Unlike
      comment.likes = comment.likes.filter((id) => id !== userId);
    } else {
      // Like and remove from dislikes if present
      comment.likes.push(userId);
      comment.dislikes = comment.dislikes.filter((id) => id !== userId);
    }

    try {
      await updateDoc(doc(db, "posts", postId), {
        comments: updatedComments,
      });
      setPost({ ...post, comments: updatedComments });
    } catch (error) {
      console.error("Error updating comment likes:", error);
      Alert.alert("Error", "Failed to update like");
    }
  };

  const handleDislikeComment = async (commentIndex) => {
    const userId = auth.currentUser.uid;
    const updatedComments = [...post.comments];
    const comment = updatedComments[commentIndex];

    if (!comment.likes) comment.likes = [];
    if (!comment.dislikes) comment.dislikes = [];

    if (comment.dislikes.includes(userId)) {
      // Remove dislike
      comment.dislikes = comment.dislikes.filter((id) => id !== userId);
    } else {
      // Dislike and remove from likes if present
      comment.dislikes.push(userId);
      comment.likes = comment.likes.filter((id) => id !== userId);
    }

    try {
      await updateDoc(doc(db, "posts", postId), {
        comments: updatedComments,
      });
      setPost({ ...post, comments: updatedComments });
    } catch (error) {
      console.error("Error updating comment dislikes:", error);
      Alert.alert("Error", "Failed to update dislike");
    }
  };

  const renderComment = ({ item, index }) => (
    <View style={styles.commentContainer}>
      <Text style={styles.commentContent}>{item.content}</Text>
      <Text style={styles.commentAuthor}>Posted by: {item.authorName}</Text>
      <View style={styles.interactionContainer}>
        <TouchableOpacity
          style={styles.interactionButton}
          onPress={() => handleLikeComment(index)}
        >
          <Ionicons
            name={
              item.likes?.includes(auth.currentUser.uid)
                ? "heart"
                : "heart-outline"
            }
            size={20}
            color={
              item.likes?.includes(auth.currentUser.uid) ? "#FF6B6B" : "#666"
            }
          />
          <Text style={styles.interactionCount}>{item.likes?.length || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.interactionButton}
          onPress={() => handleDislikeComment(index)}
        >
          <Ionicons
            name={
              item.dislikes?.includes(auth.currentUser.uid)
                ? "thumbs-down"
                : "thumbs-down-outline"
            }
            size={20}
            color={
              item.dislikes?.includes(auth.currentUser.uid) ? "#4A90E2" : "#666"
            }
          />
          <Text style={styles.interactionCount}>
            {item.dislikes?.length || 0}
          </Text>
        </TouchableOpacity>
      </View>
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
        <View style={styles.tagContainer}>
          <Text style={styles.tagText}>{post.tag}</Text>
        </View>
        <Text style={styles.postAuthor}>Posted by: {post.authorName}</Text>
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
  tagContainer: {
    backgroundColor: "#e8f4f8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 5,
  },
  tagText: {
    color: "#2c88d9",
    fontSize: 12,
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
    marginBottom: 5,
  },
  commentAuthor: {
    fontSize: 10,
    color: "#666",
    marginBottom: 5,
  },
  interactionContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  interactionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  interactionCount: {
    marginLeft: 5,
    color: "#666",
    fontSize: 12,
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
