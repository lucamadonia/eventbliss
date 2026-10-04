import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TVParticles from './TVParticles';

/** Simple code entry page at /tv */
export function TVCodeEntry() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const code = (form.get('code') as string || '').toUpperCase().trim();
    if (code.length === 6) navigate(`/tv/${code}`);
  };

  return (
    <div className="min-h-screen bg-[#060810] flex flex-col items-center justify-center p-8 font-game">
      <TVParticles />
      <div className="relative z-10 text-center">
        <h1 className="text-6xl font-black italic mb-4"
          style={{ background: 'linear-gradient(135deg, #df8eff, #8ff5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          TV SCREEN
        </h1>
        <p className="text-xl text-[#a8abb3] mb-12">{t('tv.enterCode')}</p>
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6">
          <input name="code" type="text" maxLength={6} placeholder="PARTY7" autoFocus
            className="w-80 text-center text-5xl font-black tracking-[0.3em] bg-[#151a21] border-2 border-[#df8eff]/30 rounded-2xl px-6 py-5 text-[#df8eff] placeholder:text-[#df8eff]/20 focus:outline-none focus:border-[#df8eff]/60 uppercase"
            onChange={(e) => { e.target.value = e.target.value.toUpperCase(); }} />
          <button type="submit" className="px-12 py-4 rounded-full bg-gradient-to-r from-[#df8eff] to-[#d779ff] text-xl font-black text-white tracking-wider shadow-[0_0_30px_rgba(223,142,255,0.3)]">
            {t('tv.connect')}
          </button>
        </form>
      </div>
    </div>
  );
}
