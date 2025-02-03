import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebase";
import { Ionicons } from "@expo/vector-icons";
import { generateAIResponse } from "./generateAIResponse";

const PLANT_TAGS = [
  "Apple",
  "Bell pepper",
  "Cherry",
  "Corn",
  "Grape",
  "Peach",
  "Potato",
  "Strawberry",
  "Tomato",
];

const CommunityScreen = ({ route, navigation }) => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [filterCriteria, setFilterCriteria] = useState("all"); // all, myPosts, byTag, mostLiked
  const [selectedTagFilter, setSelectedTagFilter] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Fetch the current user's name when component mounts
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

  useEffect(() => {
    if (route.params?.predefinedPost) {
      setNewPost(route.params.predefinedPost);
      navigation.setParams({ predefinedPost: null });
    }
  }, [route.params?.predefinedPost]);

  const handleAddPost = async () => {
    if (newPost.trim() === "") {
      Alert.alert("Error", "Post cannot be empty");
      return;
    }
    if (!selectedTag) {
      Alert.alert("Error", "Please select a plant tag");
      return;
    }

    try {
      // Generate AI response
      const aiResponse = await generateAIResponse(newPost, selectedTag);

      // Add post with AI response as first comment
      await addDoc(collection(db, "posts"), {
        content: newPost,
        authorId: auth.currentUser.uid,
        authorEmail: auth.currentUser.email,
        authorName: userName,
        tag: selectedTag,
        createdAt: new Date().toISOString(),
        comments: [
          {
            content: aiResponse,
            authorId: "AI_SYSTEM",
            authorName: "Plant Expert AI",
            authorEmail: "ai@system",
            createdAt: new Date().toISOString(),
            likes: [],
            dislikes: [],
            isAIResponse: true,
          },
        ],
        likes: [],
        dislikes: [],
      });

      setNewPost("");
      setSelectedTag("");
    } catch (error) {
      console.error("Error adding post:", error);
      Alert.alert("Error", "Failed to add post");
    }
  };

  const handleLikePost = async (postId, likes, dislikes) => {
    const userId = auth.currentUser.uid;
    const postRef = doc(db, "posts", postId);

    try {
      if (likes.includes(userId)) {
        // Unlike
        await updateDoc(postRef, {
          likes: arrayRemove(userId),
        });
      } else {
        // Like and remove from dislikes if present
        await updateDoc(postRef, {
          likes: arrayUnion(userId),
          dislikes: arrayRemove(userId),
        });
      }
    } catch (error) {
      console.error("Error updating likes:", error);
    }
  };

  const handleDislikePost = async (postId, likes, dislikes) => {
    const userId = auth.currentUser.uid;
    const postRef = doc(db, "posts", postId);

    try {
      if (dislikes.includes(userId)) {
        // Remove dislike
        await updateDoc(postRef, {
          dislikes: arrayRemove(userId),
        });
      } else {
        // Dislike and remove from likes if present
        await updateDoc(postRef, {
          dislikes: arrayUnion(userId),
          likes: arrayRemove(userId),
        });
      }
    } catch (error) {
      console.error("Error updating dislikes:", error);
    }
  };

  const getFilteredPosts = () => {
    let filteredPosts = [...posts];

    switch (filterCriteria) {
      case "myPosts":
        filteredPosts = filteredPosts.filter(
          (post) => post.authorId === auth.currentUser.uid
        );
        break;
      case "byTag":
        if (selectedTagFilter) {
          filteredPosts = filteredPosts.filter(
            (post) => post.tag === selectedTagFilter
          );
        }
        break;
      case "mostLiked":
        filteredPosts.sort(
          (a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)
        );
        break;
    }

    return filteredPosts;
  };

  const handleDeletePost = (postId, authorId) => {
    // Check if the current user is the author
    if (authorId !== auth.currentUser.uid) {
      Alert.alert("Error", "You can only delete your own posts");
      return;
    }

    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
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
              await deleteDoc(doc(db, "posts", postId));
              Alert.alert("Success", "Post deleted successfully");
            } catch (error) {
              console.error("Error deleting post:", error);
              Alert.alert("Error", "Failed to delete post");
            }
          },
        },
      ]
    );
  };

  const renderPost = ({ item }) => (
    <View style={styles.postContainer}>
      <Text style={styles.postContent}>{item.content}</Text>
      <View style={styles.tagContainer}>
        <Text style={styles.tagText}>{item.tag}</Text>
      </View>
      <Text style={styles.postAuthor}>Posted by: {item.authorName}</Text>
      <View style={styles.interactionContainer}>
        <TouchableOpacity
          style={styles.interactionButton}
          onPress={() =>
            handleLikePost(item.id, item.likes || [], item.dislikes || [])
          }
        >
          <Ionicons
            name={
              item.likes?.includes(auth.currentUser.uid)
                ? "heart"
                : "heart-outline"
            }
            size={24}
            color={
              item.likes?.includes(auth.currentUser.uid) ? "#FF6B6B" : "#666"
            }
          />
          <Text style={styles.interactionCount}>{item.likes?.length || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.interactionButton}
          onPress={() =>
            handleDislikePost(item.id, item.likes || [], item.dislikes || [])
          }
        >
          <Ionicons
            name={
              item.dislikes?.includes(auth.currentUser.uid)
                ? "thumbs-down"
                : "thumbs-down-outline"
            }
            size={24}
            color={
              item.dislikes?.includes(auth.currentUser.uid) ? "#4A90E2" : "#666"
            }
          />
          <Text style={styles.interactionCount}>
            {item.dislikes?.length || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.commentButton}
          onPress={() =>
            navigation.navigate("PostCommentsScreen", { postId: item.id })
          }
        >
          <Ionicons name="chatbubbles-outline" size={24} color="#0e2cc4" />
        </TouchableOpacity>

        {item.authorId === auth.currentUser.uid && (
          <TouchableOpacity
            style={styles.commentButton}
            onPress={() =>
              navigation.navigate("Chatbot", {
                initialQuestion: item.content,
              })
            }
          >
            <Text style={styles.commentButtonText}>Ask Chatbot</Text>
          </TouchableOpacity>
        )}

        {/* Delete button - only shown for the author */}
        {item.authorId === auth.currentUser.uid && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeletePost(item.id, item.authorId)}
          >
            <Ionicons name="trash-outline" size={24} color="#FF4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView horizontal style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterCriteria === "all" && styles.filterButtonActive,
          ]}
          onPress={() => setFilterCriteria("all")}
        >
          <Text style={styles.filterButtonText}>All Posts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterCriteria === "myPosts" && styles.filterButtonActive,
          ]}
          onPress={() => setFilterCriteria("myPosts")}
        >
          <Text style={styles.filterButtonText}>My Posts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterCriteria === "mostLiked" && styles.filterButtonActive,
          ]}
          onPress={() => setFilterCriteria("mostLiked")}
        >
          <Text style={styles.filterButtonText}>Most Liked</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterCriteria === "byTag" && styles.filterButtonActive,
          ]}
          onPress={() => setFilterCriteria("byTag")}
        >
          <Text style={styles.filterButtonText}>Filter by Tag</Text>
        </TouchableOpacity>
      </ScrollView>

      {filterCriteria === "byTag" && (
        <ScrollView horizontal style={styles.tagFilterContainer}>
          {PLANT_TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tagFilterButton,
                selectedTagFilter === tag && styles.tagFilterButtonActive,
              ]}
              onPress={() => setSelectedTagFilter(tag)}
            >
              <Text style={styles.tagFilterButtonText}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <FlatList
        data={getFilteredPosts()}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        style={styles.postList}
      />

      <View style={styles.inputContainer}>
        <View style={styles.tagSelectionContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {PLANT_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagButton,
                  selectedTag === tag && styles.tagButtonActive,
                ]}
                onPress={() => setSelectedTag(tag)}
              >
                <Text style={styles.tagButtonText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <TextInput
          style={styles.input}
          value={newPost}
          onChangeText={setNewPost}
          placeholder="Create a new post."
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
    paddingTop: 40,
  },
  filterContainer: {
    flexGrow: 0,
    marginBottom: 10,
  },
  filterButton: {
    padding: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  filterButtonActive: {
    backgroundColor: "#007AFF",
  },
  filterButtonText: {
    color: "#333",
  },
  tagFilterContainer: {
    flexGrow: 0,
    marginBottom: 10,
  },
  tagFilterButton: {
    padding: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  tagFilterButtonActive: {
    backgroundColor: "#28a745",
  },
  tagFilterButtonText: {
    color: "#333",
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
  interactionContainer: {
    flexDirection: "row",
    marginTop: 10,
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
  },
  commentButton: {
    marginLeft: "auto",
  },
  deleteButton: {
    marginLeft: "auto",
    padding: 5,
  },
  commentButtonText: {
    color: "#007AFF",
  },
  tagSelectionContainer: {
    height: 40,
    marginBottom: 10,
  },
  tagButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  tagButtonActive: {
    backgroundColor: "#28a745",
  },
  tagButtonText: {
    color: "#333",
  },
  inputContainer: {
    padding: 10,
    backgroundColor: "#f0f0f0",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 10,
    marginBottom: 10,
    minHeight: 40,
  },
  addButton: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    padding: 10,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default CommunityScreen;
