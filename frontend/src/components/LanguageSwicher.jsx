import React from 'react';
import { Menu, MenuButton, MenuList, MenuItem } from '@reach/menu-button';
import '@reach/menu-button/styles.css';
import { useTranslation } from 'react-i18next';
import { useTheme, useMediaQuery, Button } from '@mui/material';

const languages = [
  { code: 'en', label: 'English 🇺🇸' },
  { code: 'es', label: 'Español 🇪🇸' },
  { code: 'hi', label: 'हिन्दी 🇮🇳' },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));

  return (
    <Menu>
      <MenuButton as={Button} variant="outlined" sx={{ textTransform: 'none', minWidth: isSmUp ? 120 : 80 }}>
        🌐 {languages.find(l => l.code === i18n.language)?.label}
      </MenuButton>
      <MenuList>
        {languages.map(({ code, label }) => (
          <MenuItem key={code} onSelect={() => i18n.changeLanguage(code)}>
            {label}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

export default LanguageSwitcher;
