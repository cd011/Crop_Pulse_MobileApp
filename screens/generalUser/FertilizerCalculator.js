import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebase";
import { Colors, Typography, GlobalStyles } from "../globalStyles";

const screenHeight = Dimensions.get("window").height;
const modalHeight = screenHeight * 0.7;

const FertilizerCalculator = () => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState("");
  const [area, setArea] = useState("");
  const [results, setResults] = useState(null);
  const [savedRatios, setSavedRatios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSavedRatiosModalVisible, setSavedRatiosModalVisible] =
    useState(false);

  const crops = [
    { value: "apple", label: "Apple" },
    { value: "bellpepper", label: "Bell Pepper" },
    { value: "cherry", label: "Cherry" },
    { value: "corn", label: "Corn" },
    { value: "grape", label: "Grape" },
    { value: "peach", label: "Peach" },
    { value: "potato", label: "Potato" },
    { value: "strawberry", label: "Strawberry" },
    { value: "tomato", label: "Tomato" },
  ];

  // Fertilizer rates in kg/ha
  const fertilizerRates = {
    apple: { n: 100, p: 50, k: 100 },
    bellpepper: { n: 120, p: 60, k: 120 },
    cherry: { n: 90, p: 45, k: 90 },
    corn: { n: 180, p: 80, k: 80 },
    grape: { n: 110, p: 55, k: 110 },
    peach: { n: 100, p: 50, k: 100 },
    potato: { n: 140, p: 70, k: 140 },
    strawberry: { n: 70, p: 35, k: 70 },
    tomato: { n: 130, p: 65, k: 130 },
  };

  useEffect(() => {
    fetchSavedRatios();
  }, []);

  const fetchSavedRatios = async () => {
    try {
      const ratiosQuery = query(
        collection(db, "fertilizerRatios"),
        where("userId", "==", auth.currentUser.uid),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(ratiosQuery);
      const ratios = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setSavedRatios(ratios);
    } catch (error) {
      console.error("Error fetching saved ratios:", error);
      Alert.alert("Error", "Failed to load saved fertilizer ratios");
    }
  };

  const handleCalculate = () => {
    if (!selectedCrop || !area || isNaN(area)) {
      return;
    }

    const rates = fertilizerRates[selectedCrop];
    const areaInHa = parseFloat(area) / 10000; // Convert m² to hectares

    setResults({
      nitrogen: (rates.n * areaInHa).toFixed(2),
      phosphorus: (rates.p * areaInHa).toFixed(2),
      potassium: (rates.k * areaInHa).toFixed(2),
    });
  };

  const resetFields = () => {
    setSelectedCrop("");
    setArea("");
    setResults(null);
  };

  const handleSaveRatio = async () => {
    if (!results || !selectedCrop || !area) return;

    setLoading(true);
    try {
      const ratioData = {
        userId: auth.currentUser.uid,
        crop: selectedCrop,
        area: parseFloat(area),
        nitrogen: parseFloat(results.nitrogen),
        phosphorus: parseFloat(results.phosphorus),
        potassium: parseFloat(results.potassium),
        createdAt: new Date().toISOString(),
      };

      // Check if a document for this crop already exists for the user
      const existingRatioQuery = query(
        collection(db, "fertilizerRatios"),
        where("userId", "==", auth.currentUser.uid),
        where("crop", "==", selectedCrop)
      );

      const querySnapshot = await getDocs(existingRatioQuery);
      if (!querySnapshot.empty) {
        // Update the existing document
        const docId = querySnapshot.docs[0].id;
        await updateDoc(doc(db, "fertilizerRatios", docId), ratioData);
      } else {
        // Create a new document
        await addDoc(collection(db, "fertilizerRatios"), ratioData);
      }

      await fetchSavedRatios();
      Alert.alert("Success", "Fertilizer ratio saved successfully");
      resetFields();
      setModalVisible(false);
    } catch (error) {
      console.error("Error saving ratio:", error);
      Alert.alert("Error", "Failed to save fertilizer ratio");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRatio = async (ratioId) => {
    Alert.alert("Delete Ratio", "Are you sure you want to delete this ratio?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "fertilizerRatios", ratioId));
            setSavedRatios((prevRatios) =>
              prevRatios.filter((ratio) => ratio.id !== ratioId)
            );
            Alert.alert("Success", "Fertilizer ratio deleted successfully");
          } catch (error) {
            console.error("Error deleting ratio:", error);
            Alert.alert("Error", "Failed to delete fertilizer ratio");
          }
        },
      },
    ]);
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.openButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="calculator-outline" size={24} color="white" />
        <Text style={styles.openButtonText}>Open Fertilizer Calculator</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.savedRatiosButton}
        onPress={() => setSavedRatiosModalVisible(true)}
      >
        <Ionicons name="list-outline" size={24} color="white" />
        <Text style={styles.savedRatiosButtonText}>Saved Ratios</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Fertilizer Calculator</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Select Crop</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedCrop}
                    onValueChange={(itemValue) => setSelectedCrop(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select a crop..." value="" />
                    {crops.map((crop) => (
                      <Picker.Item
                        key={crop.value}
                        label={crop.label}
                        value={crop.value}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Area (m²)</Text>
                <TextInput
                  style={styles.input}
                  value={area}
                  onChangeText={setArea}
                  placeholder="Enter area in square meters"
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.calculateButton,
                  (!selectedCrop || !area) && styles.disabledButton,
                ]}
                onPress={handleCalculate}
                disabled={!selectedCrop || !area}
              >
                <Text style={styles.calculateButtonText}>Calculate</Text>
              </TouchableOpacity>

              {results && (
                <View style={styles.resultsContainer}>
                  <Text style={styles.resultsTitle}>
                    Recommended Fertilizer (kg):
                  </Text>
                  <View style={styles.resultRow}>
                    <Text>Nitrogen (N):</Text>
                    <Text style={styles.resultValue}>{results.nitrogen}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text>Phosphorus (P):</Text>
                    <Text style={styles.resultValue}>{results.phosphorus}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text>Potassium (K):</Text>
                    <Text style={styles.resultValue}>{results.potassium}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveRatio}
                    disabled={loading}
                  >
                    <Ionicons name="save-outline" size={20} color="white" />
                    <Text style={styles.saveButtonText}>
                      {loading ? "Saving..." : "Save Ratio"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  resetFields();
                  setModalVisible(false);
                }}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isSavedRatiosModalVisible}
        onRequestClose={() => setSavedRatiosModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Saved Fertilizer Ratios</Text>
            <ScrollView style={styles.savedRatiosScroll}>
              {savedRatios.length === 0 ? (
                <Text style={styles.noRatiosText}>
                  No saved fertilizer ratios
                </Text>
              ) : (
                savedRatios.map((ratio) => (
                  <View key={ratio.id} style={styles.savedRatioCard}>
                    <View style={styles.savedRatioHeader}>
                      <Text style={styles.savedRatioCrop}>
                        {crops.find((c) => c.value === ratio.crop)?.label ||
                          ratio.crop}
                      </Text>
                      <Text style={styles.savedRatioDate}>
                        {new Date(ratio.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.savedRatioArea}>
                      Area: {ratio.area} m²
                    </Text>
                    <View style={styles.savedRatioValues}>
                      <Text>N: {ratio.nitrogen} kg</Text>
                      <Text>P: {ratio.phosphorus} kg</Text>
                      <Text>K: {ratio.potassium} kg</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteRatio(ratio.id)}
                    >
                      <Ionicons name="trash-outline" size={20} color="red" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSavedRatiosModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  openButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  openButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  savedRatiosButton: {
    backgroundColor: Colors.primaryLight,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  savedRatiosButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  savedRatiosContainer: {
    marginTop: 16,
  },
  savedRatiosTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#1a1a1a",
  },
  savedRatiosScroll: {
    maxHeight: "70%",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    width: "90%",
    height: modalHeight,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#444",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  picker: {
    height: 60,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  calculateButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calculateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: Colors.primaryLight,
  },
  resultsContainer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
    paddingTop: 24,
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#1a1a1a",
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 8,
    marginBottom: 8,
  },
  resultValue: {
    fontWeight: "500",
    color: "#007AFF",
  },
  saveButton: {
    backgroundColor: "#34C759",
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  closeButton: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  closeButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  savedRatioCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  savedRatioHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingRight: 40,
  },
  savedRatioCrop: {
    fontWeight: "600",
    fontSize: 16,
    color: "#1a1a1a",
  },
  savedRatioDate: {
    color: "#666",
    fontSize: 14,
  },
  savedRatioArea: {
    marginBottom: 8,
    color: "#444",
  },
  savedRatioValues: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.02)",
    padding: 10,
    borderRadius: 8,
  },
  noRatiosText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    padding: 20,
  },
  deleteButton: {
    position: "absolute",
    right: 16,
    top: 16,
    padding: 4,
  },
});

export default FertilizerCalculator;
