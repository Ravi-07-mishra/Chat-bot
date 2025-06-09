import React from 'react';
import { Bot, MessageSquare, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white">
      <main className="container mx-auto px-4 py-16 flex flex-col items-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-emerald-400 animate-gradient">
          {t('welcome')}
        </h1>

        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-center mb-16 text-gray-300 max-w-3xl px-2">
          {t('description')}
          <Sparkles className="inline-block ml-2 text-yellow-400" />
        </p>

        <div className="flex flex-wrap justify-center items-center gap-8 mb-20">
          <div className="group relative p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl transform transition-transform duration-500 hover:scale-105 hover:rotate-1 w-40 h-40 sm:w-44 sm:h-44 md:w-48 md:h-48 lg:w-52 lg:h-52">
            <img src="/robot.png" alt="AI Robot" className="w-full h-full object-cover rounded-lg" />
            <Bot className="absolute -top-2 -left-2 w-8 h-8 sm:w-10 sm:h-10 bg-white text-purple-600 rounded-full p-1 shadow-lg" />
          </div>

          <div className="group relative p-2 bg-gradient-to-r from-yellow-400 to-red-500 rounded-xl transform transition-transform duration-500 hover:scale-105 hover:-rotate-1 w-40 h-40 sm:w-44 sm:h-44 md:w-48 md:h-48 lg:w-52 lg:h-52">
            <img src="/openai.png" alt="OpenAI Logo" className="w-full h-full object-cover rounded-lg invert" />
            <MessageSquare className="absolute -bottom-2 -right-2 w-8 h-8 sm:w-10 sm:h-10 bg-white text-red-500 rounded-full p-1 shadow-lg" />
          </div>
        </div>

        <div className="relative max-w-4xl w-full group px-2">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-1000 group-hover:duration-200 animate-pulse"></div>
          <img src="/chat.png" alt="Chat Interface" className="relative rounded-xl w-full shadow-2xl transform transition-transform duration-500 group-hover:scale-[1.01]" />
        </div>
      </main>

      <footer className="text-center py-8 text-sm sm:text-base text-gray-400 px-2">
        <p>&copy; {new Date().getFullYear()} {t('appName')}. {t('rights')}</p>
      </footer>
    </div>
  );
};

export default Home;
