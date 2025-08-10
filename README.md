<div align="center">
  <img src="./assets/logo.png" alt="CropPulse Logo" width="200" height="200" />
</div>

# 🌱 CropPulse

A comprehensive React Native mobile application designed to help farmers and agricultural enthusiasts identify crop diseases, get treatment recommendations, and connect with a community of fellow farmers.

## 📱 Features

### 🔍 **Crop Disease Detection**

- **AI-Powered Analysis**: Upload photos of your crops to get instant disease identification
- **Multiple Plant Support**: Currently supports 9 types of plants with expandable plant type options
- **Follow-up Questions**: Interactive questionnaire system for more accurate diagnoses
- **Treatment Recommendations**: Get detailed treatment plans based on detected diseases

### 🌤️ **Weather Integration**

- **Real-time Weather Data**: Get current weather conditions for your location
- **Weather Forecast**: View upcoming weather predictions
- **Location-based Services**: Automatic location detection for weather data

### 💬 **Community Features**

- **Farmer Community**: Connect with other farmers and agricultural experts
- **Discussion Forums**: Share experiences, ask questions, and get advice
- **Post Comments**: Engage in meaningful discussions about farming practices

### 🤖 **AI Chatbot**

- **24/7 Support**: Get instant answers to farming-related questions
- **Contextual Responses**: AI-powered responses based on your specific situation
- **Integration**: Seamlessly integrated with disease detection and community features

### 📊 **Dashboard & Analytics**

- **Prediction History**: Track all your previous disease predictions
- **User Profile**: Manage your personal information and preferences
- **Recent Activity**: Quick access to your latest predictions and community interactions

## 🛠️ Technology Stack

- **Frontend**: React Native with Expo
- **Navigation**: React Navigation (Native Stack & Bottom Tabs)
- **Backend**: Firebase (Authentication, Firestore)
- **ML Service**: [Crop_Pulse_MLService](https://github.com/cd011/Crop_Pulse_MLService) - Docker containerized plant disease detection
- **AI Services**: Google Generative AI
- **Image Processing**: Expo Image Picker & Image Manipulator
- **Maps**: React Native Maps
- **Weather API**: External weather service integration
- **UI Components**: Custom components with global styling

## 🔗 Backend Services

### ML Service - Plant Disease Detection

This mobile application connects to the [Crop_Pulse_MLService](https://github.com/cd011/Crop_Pulse_MLService) backend for AI-powered plant disease detection.

**Backend Features:**
- **Multi-Plant Support**: Handles multiple plant types with separate ML models
- **TensorFlow Serving**: High-performance model inference
- **REST API**: FastAPI-based endpoints for real-time disease classification
- **Docker Containerization**: Easy deployment and scaling
- **Internet Exposure**: ngrok integration for remote access

**API Endpoint:**
```
POST /predict
```

**Parameters:**
- `plant_type`: Type of plant to analyze
- `file`: Image file for disease detection

**Response:**
```json
{
  "predicted_disease": "Disease Name",
  "confidence": 95.67,
  "status": "success"
}
```

For detailed setup instructions, see the [Crop_Pulse_MLService README](https://github.com/cd011/Crop_Pulse_MLService#readme).

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Android Studio](https://developer.android.com/studio) (for Android development)
- [Xcode](https://developer.apple.com/xcode/) (for iOS development, macOS only)

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/CropPulse.git
   cd CropPulse
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up Firebase**

   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication and Firestore
   - Download your `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
   - Place them in the appropriate directories
   - Update the Firebase configuration in `firebase.js`

4. **Configure Environment Variables**

   - Copy `env.example` to `.env`
   - Fill in your actual API keys in the `.env` file:

     ```bash
     # Copy the example file
     cp env.example .env

     # Edit the .env file with your actual keys
     # Firebase Configuration
     FIREBASE_API_KEY=your_actual_firebase_api_key
     FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
     FIREBASE_PROJECT_ID=your_project_id
     FIREBASE_STORAGE_BUCKET=your_project.appspot.com
     FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     FIREBASE_APP_ID=your_app_id
     FIREBASE_MEASUREMENT_ID=your_measurement_id

     # Google Gemini AI
     GEMINI_API_KEY=your_actual_gemini_api_key

     # Weather API
     WEATHER_API_KEY=your_actual_weather_api_key
     ```

   - **Important**: Never commit your `.env` file to version control!

5. **Start the development server**
   ```bash
   npm start
   # or
   expo start
   ```

## 📱 Running the App

### Development Mode

```bash
# Start Expo development server
expo start

# Run on Android
expo start --android

# Run on iOS
expo start --ios

# Run on web
expo start --web
```

### Building for Production

```bash
# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## 🏗️ Project Structure

```
CropPulse/
├── assets/                 # Images, icons, and static assets
├── screens/               # Application screens
│   ├── generalUser/      # User-specific screens
│   │   ├── DashboardScreen.js
│   │   ├── PredictionScreen.js
│   │   ├── CommunityScreen.js
│   │   ├── ChatbotScreen.js
│   │   ├── FertilizerCalculator.js
│   │   └── ...
│   ├── GreetingScreen.js
│   └── globalStyles.js
├── App.js                 # Main application component
├── firebase.js           # Firebase configuration
├── package.json          # Dependencies and scripts
├── app.json             # Expo configuration
└── README.md            # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)**.

This license ensures that:

- ✅ **Open Source**: The source code remains open and accessible
- ✅ **Copyleft**: Any derivative works must also be open source
- ✅ **Non-Commercial Protection**: Derivative works cannot be made proprietary
- ✅ **Attribution**: Original authors must be credited

**Key Terms:**

- You can use, modify, and distribute this software
- Any derivative works must also be licensed under GPL-3.0
- You must include the original license and copyright notice
- Commercial use is allowed, but derivative works must remain open source

For more details, see the [GPL-3.0 License](https://www.gnu.org/licenses/gpl-3.0.en.html).

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) for the amazing React Native development platform
- [Firebase](https://firebase.google.com/) for backend services
- [Google Generative AI](https://ai.google.dev/) for AI-powered features
- The farming community for inspiration and feedback

## 📞 Support

If you have any questions or need support, please:

- Open an issue in this repository
- Check the documentation for common solutions

## 🔮 Future Enhancements

- [ ] Support for more crop types
- [ ] Offline mode for basic features
- [ ] Multi-language support
- [ ] Advanced analytics and reporting
- [ ] Integration with IoT sensors
- [ ] Marketplace for agricultural products
- [ ] Expert consultation booking system
