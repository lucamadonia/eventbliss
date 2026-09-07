import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function OnlineWaiting() {
  const { t } = useTranslation();
  return <div role="status" className="min-h-[70dvh] flex flex-col items-center justify-center gap-4 px-6 text-center text-white bg-[#0a0e14]">
    <Loader2 className="h-8 w-8 animate-spin text-[#df8eff]" />
    <p>{t('games.ohrwurm.waitingForHost')}</p>
  </div>;
}
