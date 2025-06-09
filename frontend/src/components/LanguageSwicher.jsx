// LanguageSwitcher.jsx
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Button } from '@mui/material';
import { KeyboardArrowDown } from '@mui/icons-material';

const LanguageSwitcher = ({ currentLang, setLang }) => {
  const languages = ['English', 'Hindi', 'Tamil'];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button endIcon={<KeyboardArrowDown />} variant="outlined">
          {currentLang}
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={5}
          style={{
            backgroundColor: 'white',
            padding: '0.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 0 10px rgba(0,0,0,0.15)',
          }}
        >
          {languages.map((lang) => (
            <DropdownMenu.Item
              key={lang}
              onSelect={() => setLang(lang)}
              style={{
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontWeight: lang === currentLang ? 'bold' : 'normal',
              }}
            >
              {lang}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default LanguageSwitcher;
