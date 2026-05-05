import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

export default function LanguageSwitcher({ className }) {
  const { i18n } = useTranslation();
  const isPs = i18n.language === 'ps';

  const toggle = () => i18n.changeLanguage(isPs ? 'en' : 'ps');

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors hover:bg-accent',
        className
      )}
    >
      {isPs ? 'English' : 'پښتو'}
    </button>
  );
}
