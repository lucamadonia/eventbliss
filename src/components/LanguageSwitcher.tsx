import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { languages } from '@/i18n';
import { mapSeoRoute } from '@/lib/seo-routes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const handleChange = (value: string) => {
    try { localStorage.setItem("eb.langManual", "1"); } catch { /* noop */ }
    void i18n.changeLanguage(value);
    // SEO landing pages derive their language from the URL — navigate to the
    // equivalent localized page so the content actually switches language.
    const mapped = mapSeoRoute(location.pathname, value);
    if (mapped && mapped !== location.pathname) {
      navigate(mapped + location.search + location.hash);
    }
  };

  return (
    <Select value={i18n.language} onValueChange={handleChange}>
      <SelectTrigger className="w-auto min-w-[140px] bg-background/50 border-border/50">
        <SelectValue>
          {languages.find(l => l.code === i18n.language)?.flag || '🌐'}{' '}
          {languages.find(l => l.code === i18n.language)?.name || 'Language'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
