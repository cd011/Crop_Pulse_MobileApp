import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { Ionicons } from "@expo/vector-icons";

const PostCommentsScreen = ({ route }) => {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const fetchUserName = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(
          doc(db, "generalUsers", auth.currentUser.uid)
        );
        if (userDoc.exists()) {
          setUserName(userDoc.data().name || "Anonymous");
        }
      }
    };
    fetchUserName();
  }, []);

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
      setIsLoading(true); // Start loading
      Keyboard.dismiss(); // Dismiss keyboard
      inputRef.current?.blur();

      const comment = {
        content: newComment,
        authorId: auth.currentUser.uid,
        authorEmail: auth.currentUser.email,
        authorName: userName,
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
    } finally {
      setIsLoading(false); // Stop loading regardless of outcome
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

  const handleDeleteComment = (commentIndex, authorId) => {
    // Check if the current user is the author
    if (authorId !== auth.currentUser.uid) {
      Alert.alert("Error", "You can only delete your own comments");
      return;
    }

    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedComments = [...post.comments];
              updatedComments.splice(commentIndex, 1);

              await updateDoc(doc(db, "posts", postId), {
                comments: updatedComments,
              });

              setPost({ ...post, comments: updatedComments });
              Alert.alert("Success", "Comment deleted successfully");
            } catch (error) {
              console.error("Error deleting comment:", error);
              Alert.alert("Error", "Failed to delete comment");
            }
          },
        },
      ]
    );
  };

  const renderComment = ({ item, index }) => (
    <View
      style={[
        styles.commentContainer,
        item.isAIResponse && styles.aiCommentContainer,
      ]}
    >
      <Text style={styles.commentContent}>{item.content}</Text>
      <Text
        style={[
          styles.commentAuthor,
          item.isAIResponse && styles.aiCommentAuthor,
        ]}
      >
        Posted by: {item.authorName}
      </Text>
      {!item.isAIResponse && (
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
            <Text style={styles.interactionCount}>
              {item.likes?.length || 0}
            </Text>
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
                item.dislikes?.includes(auth.currentUser.uid)
                  ? "#4A90E2"
                  : "#666"
              }
            />
            <Text style={styles.interactionCount}>
              {item.dislikes?.length || 0}
            </Text>
          </TouchableOpacity>

          {/* Delete button - only shown for the author */}
          {item.authorId === auth.currentUser.uid && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteComment(index, item.authorId)}
            >
              <Ionicons name="trash-outline" size={20} color="#FF4444" />
            </TouchableOpacity>
          )}
        </View>
      )}
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
      <FlatList
        data={post.comments}
        renderItem={renderComment}
        keyExtractor={(item, index) => index.toString()}
        style={styles.commentList}
        ListHeaderComponent={() => (
          <View style={styles.postContainer}>
            <Text style={styles.postContent}>{post.content}</Text>
            <View style={styles.tagContainer}>
              <Text style={styles.tagText}>{post.tag}</Text>
            </View>
            <Text style={styles.postAuthor}>Posted by: {post.authorName}</Text>
          </View>
        )}
      />
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Add a comment..."
          multiline
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddComment}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.addButtonText}>Post</Text>
          )}
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
    marginBottom: 50,
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
  deleteButton: {
    marginLeft: "auto",
    padding: 5,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#f0f0f0",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
  addButtonDisabled: {
    opacity: 0.7,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  aiCommentContainer: {
    backgroundColor: "#f0f8ff", // Light blue background
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
  },
  aiCommentAuthor: {
    color: "#007AFF",
    fontWeight: "bold",
  },
});

export default PostCommentsScreen;
