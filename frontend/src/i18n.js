import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      appName: "EmpathixAI",
      patientRecord: "Patient Record",
      newChat: "+ New Chat",
      loadingChats: "Loading chats…",
      noChatsYet: "No chats yet. Start a new one above.",
      activeChat: "Active chat",
      noChatSelected: "No chat selected",
      startNewChat: "Start a new chat to begin",
      chatEmpty: "Chat is empty",
      chatEmptyDesc: "Describe what's on your mind — symptoms, a question about a condition, or something you read and want checked. EmpathixAI will note it here.",
      reviewingChat: "Thinking…",
      inputPlaceholder: "Note your symptoms or question…",
      logEntry: "Log entry",
      inputHint: "Enter to send · Shift + Enter for a new line · Informational only, not a substitute for professional care.",
      notDiagnosis: "Not a diagnosis. For anything urgent, please see a licensed doctor.",
      signIn: "Sign in",
      signOut: "Sign out",
      patient: "Patient",
    },
  },
  hi: {
    translation: {
      appName: "एम्पैथिक्सएआई",
      patientRecord: "रोगी रिकॉर्ड",
      newChat: "+ नई चैट",
      loadingChats: "चैट लोड हो रही हैं…",
      noChatsYet: "अभी तक कोई चैट नहीं। ऊपर से एक नई शुरू करें।",
      activeChat: "सक्रिय चैट",
      noChatSelected: "कोई चैट चयनित नहीं",
      startNewChat: "शुरू करने के लिए नई चैट बनाएं",
      chatEmpty: "चैट खाली है",
      chatEmptyDesc: "अपने लक्षण, किसी स्थिति के बारे में सवाल, या कुछ भी जांचने योग्य बताएं। एम्पैथिक्सएआई इसे यहां नोट करेगा।",
      reviewingChat: "सोच रहा है…",
      inputPlaceholder: "अपने लक्षण या प्रश्न लिखें…",
      logEntry: "भेजें",
      inputHint: "भेजने के लिए Enter दबाएं · नई लाइन के लिए Shift + Enter · केवल जानकारी हेतु, पेशेवर सलाह का विकल्प नहीं।",
      notDiagnosis: "यह निदान नहीं है। किसी भी आपात स्थिति के लिए कृपया डॉक्टर से संपर्क करें।",
      signIn: "साइन इन करें",
      signOut: "साइन आउट करें",
      patient: "रोगी",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("empathixai-lang") || "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
