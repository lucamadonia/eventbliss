import { useTranslation } from 'react-i18next';
import { languages } from '@/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  return (
    <Select value={i18n.language} onValueChange={(value) => i18n.changeLanguage(value)}>
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
