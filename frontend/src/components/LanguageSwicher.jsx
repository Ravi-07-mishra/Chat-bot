// src/components/LanguageSwitcher.js
import { Menu } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

const languages = [
  { code: 'en', label: 'English 🇺🇸' },
  { code: 'es', label: 'Español 🇪🇸' },
  { code: 'hi', label: 'हिन्दी 🇮🇳' },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  return (
    <div className="relative inline-block text-left">
      <Menu as="div" className="relative">
        <Menu.Button className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium hover:bg-gray-100 transition">
          🌐 {languages.find(l => l.code === i18n.language)?.label}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Menu.Button>
        <Menu.Items className="absolute z-10 mt-2 w-48 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg focus:outline-none">
          {languages.map((lang) => (
            <Menu.Item key={lang.code}>
              {({ active }) => (
                <button
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className={`${
                    active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                  } group flex w-full items-center px-4 py-2 text-sm transition`}
                >
                  {lang.label}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Menu>
    </div>
  );
};

export default LanguageSwitcher;
