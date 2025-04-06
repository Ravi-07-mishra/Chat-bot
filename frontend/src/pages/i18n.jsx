// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      welcome: "Welcome to AI Chat",
      description: "Experience the future of conversation with our advanced AI chatbot",
      feature1Title: "Smart Replies",
      feature1Desc: "Get intelligent, real-time responses to your queries.",
      feature2Title: "Seamless Chat",
      feature2Desc: "Enjoy smooth and intuitive conversations like never before.",
      feature3Title: "Multilingual",
      feature3Desc: "Chat in your preferred language easily and instantly.",
      getStarted: "Get Started",
      appName: "AI Chat",
      rights: "All rights reserved.",
    }
  },
  es: {
    translation: {
      welcome: "Bienvenido a AI Chat",
      description: "Experimenta el futuro de la conversación con nuestro chatbot de IA avanzado",
      feature1Title: "Respuestas Inteligentes",
      feature1Desc: "Obtén respuestas inteligentes y en tiempo real a tus preguntas.",
      feature2Title: "Chat Fluido",
      feature2Desc: "Disfruta de conversaciones suaves e intuitivas como nunca antes.",
      feature3Title: "Multilingüe",
      feature3Desc: "Chatea en tu idioma preferido de manera fácil e instantánea.",
      getStarted: "Comenzar",
      appName: "AI Chat",
      rights: "Todos los derechos reservados.",
    }
  },
  hi: {
    translation: {
      welcome: "एआई चैट में आपका स्वागत है",
      description: "हमारे उन्नत एआई चैटबॉट के साथ बातचीत का भविष्य अनुभव करें",
      feature1Title: "स्मार्ट उत्तर",
      feature1Desc: "अपने सवालों के लिए बुद्धिमान, रियल-टाइम उत्तर प्राप्त करें।",
      feature2Title: "सीमलेस चैट",
      feature2Desc: "पहले से कहीं अधिक सहज और सहज बातचीत का आनंद लें।",
      feature3Title: "बहुभाषी",
      feature3Desc: "अपनी पसंदीदा भाषा में आसानी से और तुरंत चैट करें।",
      getStarted: "शुरू करें",
      appName: "एआई चैट",
      rights: "सर्वाधिकार सुरक्षित।",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
