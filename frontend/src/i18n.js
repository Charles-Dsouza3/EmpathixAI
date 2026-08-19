import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      appName: "EmpathixAI",
      patientRecord: "Patient Record",
      newChart: "+ New Chart",
      loadingCharts: "Loading charts…",
      noChartsYet: "No charts yet. Start a new one above.",
      activeChart: "Active chart",
      noChartSelected: "No chart selected",
      startNewChart: "Start a new chart to begin",
      chartEmpty: "Chart is empty",
      chartEmptyDesc: "Describe what's on your mind — symptoms, a question about a condition, or something you read and want checked. EmpathixAI will note it here.",
      reviewingChart: "Reviewing chart…",
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
      newChart: "+ नया चार्ट",
      loadingCharts: "चार्ट लोड हो रहे हैं…",
      noChartsYet: "अभी तक कोई चार्ट नहीं। ऊपर से एक नया शुरू करें।",
      activeChart: "सक्रिय चार्ट",
      noChartSelected: "कोई चार्ट चयनित नहीं",
      startNewChart: "शुरू करने के लिए नया चार्ट बनाएं",
      chartEmpty: "चार्ट खाली है",
      chartEmptyDesc: "अपने लक्षण, किसी स्थिति के बारे में सवाल, या कुछ भी जांचने योग्य बताएं। एम्पैथिक्सएआई इसे यहां नोट करेगा।",
      reviewingChart: "चार्ट की समीक्षा हो रही है…",
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