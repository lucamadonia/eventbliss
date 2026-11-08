import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Camera, ImagePlus, Keyboard, QrCode, RefreshCw } from 'lucide-react';
import type QrScanner from 'qr-scanner';
import { scannedInvitation } from '@/lib/qr-invitation';

/** Shared scanner from the app's + menu. The camera stays inside EventBliss. */
export default function QrScanScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const video = useRef<HTMLVideoElement>(null);
  const scanner = useRef<QrScanner | null>(null);
  const handled = useRef(false);
  const [restart, setRestart] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState('');
  const [manual, setManual] = useState('');
  const [plainCode, setPlainCode] = useState<string | null>(null);

  const accept = useCallback((value: string) => {
    if (handled.current) return;
    const invitation = scannedInvitation(value);
    if (!invitation) {
      setError(t('qrScanner.invalid', 'Dieser QR-Code gehört nicht zu EventBliss.'));
      return;
    }
    handled.current = true;
    scanner.current?.stop();
    if (invitation.kind === 'code') {
      setPlainCode(invitation.code);
      setError('');
      return;
    }
    navigate(invitation.path, { replace: true });
  }, [navigate, t]);

  useEffect(() => {
    let disposed = false;
    handled.current = false;
    setCameraReady(false);
    const start = async () => {
      const { default: QrScannerImpl } = await import('qr-scanner');
      if (disposed || !video.current) return;
      const instance = new QrScannerImpl(video.current, result => accept(result.data), {
        preferredCamera: 'environment', maxScansPerSecond: 10,
        highlightScanRegion: true, returnDetailedScanResult: true,
      });
      scanner.current = instance;
      await instance.start();
      if (disposed) { instance.destroy(); return; }
      setCameraReady(true);
      setError('');
    };
    void start().catch(() => {
      if (!disposed) setError(t('qrScanner.cameraUnavailable', 'Kamera nicht verfügbar. Du kannst ein QR-Bild wählen oder den Link eingeben.'));
    });
    return () => { disposed = true; scanner.current?.destroy(); scanner.current = null; };
  }, [restart, accept, t]);

  const scanFile = async (file?: File) => {
    if (!file) return;
    try {
      const { default: QrScannerImpl } = await import('qr-scanner');
      const result = await QrScannerImpl.scanImage(file, { returnDetailedScanResult: true });
      accept(result.data);
    } catch {
      setError(t('qrScanner.noCodeInImage', 'In diesem Bild wurde kein QR-Code gefunden.'));
    }
  };

  const retry = () => {
    setPlainCode(null);
    setError('');
    handled.current = false;
    setRestart(value => value + 1);
  };

  return <main data-testid="qr-scanner" className="flex h-full min-h-dvh flex-col bg-[#080b13] text-white">
    <header className="flex items-center gap-3 px-5 pb-4 pt-[max(24px,env(safe-area-inset-top))]">
      <button type="button" aria-label={t('common.back', 'Zurück')} onClick={() => navigate(-1)} className="grid h-11 w-11 place-items-center rounded-xl bg-white/10"><ArrowLeft size={20} /></button>
      <div><p className="text-xs font-bold text-[#8ff5ff]">EVENTBLISS</p><h1 className="text-xl font-bold">{t('qrScanner.title', 'QR-Code scannen')}</h1></div>
    </header>
    <div className="flex-1 space-y-5 overflow-y-auto px-5 pb-10">
      <p className="text-sm text-white/65">{t('qrScanner.hint', 'Scanne eine Party-, Spielraum- oder andere EventBliss-Einladung.')}</p>
      <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl border border-[#8ff5ff]/30 bg-black">
        <video ref={video} muted playsInline className="h-full w-full object-cover" />
        {!cameraReady && <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/55"><Camera className="h-12 w-12 text-[#8ff5ff]" /></div>}
        <div aria-hidden className="pointer-events-none absolute inset-[14%] rounded-2xl border-2 border-[#8ff5ff]/70" />
      </div>
      {error && <p role="alert" className="rounded-xl border border-rose-300/30 bg-rose-300/10 p-3 text-sm text-rose-100">{error}</p>}
      {plainCode && <section data-testid="qr-code-choice" className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
        <p className="font-semibold">{t('qrScanner.codeFound', 'Code {{code}} erkannt. Was möchtest du öffnen?', { code: plainCode })}</p>
        <button type="button" className="min-h-12 w-full rounded-xl bg-[#df8eff] px-4 font-bold text-[#080b13]" onClick={() => navigate(`/party/join/${plainCode}`, { replace: true })}>{t('qrScanner.joinParty', 'Party beitreten')}</button>
        <button type="button" className="min-h-12 w-full rounded-xl bg-[#8ff5ff] px-4 font-bold text-[#080b13]" onClick={() => navigate(`/games/bomb?room=${plainCode}`, { replace: true })}>{t('qrScanner.joinRoom', 'Online-Raum beitreten')}</button>
        <button type="button" className="min-h-11 w-full rounded-xl border border-white/20" onClick={retry}>{t('qrScanner.scanAgain', 'Erneut scannen')}</button>
      </section>}
      {!plainCode && <div className="flex flex-wrap gap-3">
        <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold"><ImagePlus size={18} />{t('qrScanner.chooseImage', 'QR-Bild wählen')}<input type="file" accept="image/*" className="sr-only" onChange={event => { void scanFile(event.target.files?.[0]); event.target.value = ''; }} /></label>
        <button type="button" className="flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold" onClick={retry}><RefreshCw size={18} />{t('qrScanner.retryCamera', 'Kamera neu starten')}</button>
      </div>}
      <div className="space-y-2 rounded-2xl bg-white/5 p-4"><label htmlFor="qr-manual" className="flex items-center gap-2 text-sm font-semibold"><Keyboard size={17} />{t('qrScanner.enterLink', 'Link oder Code eingeben')}</label>
        <div className="flex gap-2"><input id="qr-manual" value={manual} onChange={event => setManual(event.target.value)} autoCapitalize="off" autoCorrect="off" className="min-w-0 flex-1 rounded-xl bg-black/35 px-3 py-3 text-sm" placeholder="event-bliss.com/..." />
          <button type="button" aria-label={t('qrScanner.open', 'Öffnen')} onClick={() => accept(manual)} className="grid min-h-11 min-w-11 place-items-center rounded-xl bg-[#df8eff] text-[#080b13]"><QrCode size={20} /></button></div>
      </div>
    </div>
  </main>;
}
