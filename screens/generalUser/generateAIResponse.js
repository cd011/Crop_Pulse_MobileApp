const GEMINI_API_KEY = "AIzaSyBKKMtjkrp3dJjK70_hCV21OMmXvtLqc2k";
const BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export const generateAIResponse = async (postContent, plantTag) => {
  try {
    const prompt = `You are a plant disease and crop expert. A user has made the following post about their ${plantTag} plant/crop: "${postContent}". 
    If this post is related to plants, crops, or gardening, provide a helpful, short (2-3 sentences) response addressing their concern or adding relevant information.
    If the post is completely unrelated to plants/crops/gardening, respond with "This post appears to be unrelated to plants or crops. Please keep discussions focused on plant and crop-related topics."`;

    const response = await fetch(`${BASE_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "Unable to generate AI response at this time.";
  }
};
