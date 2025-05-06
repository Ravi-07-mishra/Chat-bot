import { Bot, MessageSquare, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

const Home = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white">
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-emerald-400 animate-gradient">
          {t("welcome")}
        </h1>

        <p className="text-lg sm:text-xl md:text-2xl text-center mb-16 text-gray-300 max-w-3xl mx-auto px-2">
          {t("description")}
          <Sparkles className="inline-block ml-2 text-yellow-400" />
        </p>

        <div className="flex flex-col md:flex-row justify-center items-center gap-10 md:gap-12 mb-20 px-2">
          <div className="group">
            <div className="relative p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl transition-all duration-500 transform group-hover:scale-105 group-hover:rotate-1 w-44 h-44 sm:w-48 sm:h-48 md:w-52 md:h-52">
              <img
                src="/robot.png"
                alt="AI Robot"
                className="w-full h-full object-cover rounded-lg"
              />
              <Bot className="absolute -top-4 -left-4 w-10 h-10 sm:w-12 sm:h-12 bg-white text-purple-600 rounded-full p-2 shadow-lg" />
            </div>
          </div>

          <div className="group">
            <div className="relative p-2 bg-gradient-to-r from-yellow-400 to-red-500 rounded-xl transition-all duration-500 transform group-hover:scale-105 group-hover:-rotate-1 w-44 h-44 sm:w-48 sm:h-48 md:w-52 md:h-52">
              <img
                src="/openai.png"
                alt="OpenAI Logo"
                className="w-full h-full object-cover rounded-lg invert"
              />
              <MessageSquare className="absolute -bottom-4 -right-4 w-10 h-10 sm:w-12 sm:h-12 bg-white text-red-500 rounded-full p-2 shadow-lg" />
            </div>
          </div>
        </div>

        <div className="relative mx-auto max-w-4xl group px-2">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
          <img
            src="/chat.png"
            alt="Chat Interface"
            className="relative rounded-xl w-full shadow-2xl transition-transform duration-500 transform group-hover:scale-[1.01]"
          />
        </div>
      </main>

      <footer className="text-center py-8 text-sm sm:text-base text-gray-400 px-2">
        <p>
          &copy; 2023 {t("appName")}. {t("rights")}
        </p>
      </footer>
    </div>
  );
};

export default Home;
