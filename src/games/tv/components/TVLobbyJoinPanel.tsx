import { motion, useReducedMotion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { getBaseUrl } from '@/lib/platform';
import { LOBBY_ACCENTS, lu } from './tv-lobby-scale';

/**
 * Linke Spalte des Wartebereichs: grosser QR (≥ 30 % Bildhoehe, aus 3 m
 * scanbar) mit weissem Ruhebereich, zwei Schritte und der Code zum Abtippen.
 * Ohne Beitrittslink (lokaler Abend) steht hier ein freundlicher Hinweis statt
 * eines QR, der nirgendwohin fuehrt.
 *
 * Der QR selbst bewegt sich nie — Scanner moegen keine Bewegung. Nur der
 * Schein dahinter atmet (reine Deckkraft, kein Weichzeichner: TV-GPUs).
 */
export default function TVLobbyJoinPanel({ joinUrl, code }: { joinUrl: string | null; code: string }) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();

  if (!joinUrl) {
    const switchUrl = `${getBaseUrl()}/party/controllers?source=tv&tv=${encodeURIComponent(code)}`;
    return (
      <motion.section
        className="flex h-full flex-col justify-center rounded-[28px] border border-white/[0.07] bg-[#0d0915] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
        style={{ padding: lu(4), gap: lu(1.8), width: lu(60) }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div data-testid="tv-lobby-joystick-qr" data-join-url={switchUrl} className="w-fit rounded-[22px] bg-white" style={{ padding: lu(0.8) }}>
          <QRCodeSVG value={switchUrl} level="M" marginSize={4} bgColor="#ffffff" fgColor="#060810"
            title={t('tvLobby.switchToJoysticks', 'Joystick-Modus starten')}
            style={{ display: 'block', width: lu(25), height: lu(25) }} />
        </div>
        <p className="font-black leading-tight text-white" style={{ fontSize: lu(3.2) }}>
          {t('tvLobby.switchToJoysticks', 'Joystick-Modus starten')}
        </p>
        <p className="font-medium leading-snug text-white/70" style={{ fontSize: lu(2), maxWidth: '30ch' }}>
          {t('tvLobby.switchHostHint', 'Host: QR mit der EventBliss-App scannen und Handys für diesen Abend aktivieren. Danach können alle hier beitreten.')}
        </p>
        <h2 className="font-semibold leading-tight text-white/75" style={{ fontSize: lu(2.4) }}>
          {t('tvLobby.localTitle', 'Ein Handy für alle')}
        </h2>
        <p className="font-medium leading-snug text-white/60" style={{ fontSize: lu(1.8), maxWidth: '28ch' }}>
          {t('tvLobby.localHint', 'Heute wird das Handy herumgereicht – der Fernseher zeigt, wer dran ist.')}
        </p>
      </motion.section>
    );
  }

  return (
    <section className="flex h-full flex-col items-start justify-center" style={{ gap: lu(3), maxWidth: lu(80) }}>
      <div className="relative">
        <motion.div
          aria-hidden
          className="absolute -inset-[18%] rounded-full"
          style={{ background: 'radial-gradient(closest-side, rgba(223,142,255,0.55), rgba(143,245,255,0.18) 55%, transparent 100%)', opacity: 0.32 }}
          animate={reduced ? undefined : { opacity: [0.25, 0.4, 0.25] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          data-testid="tv-lobby-qr"
          data-join-url={joinUrl}
          className="relative rounded-[28px] bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
          style={{ padding: lu(1.2) }}
        >
          {/* marginSize 4 = die vom Standard verlangte Ruhezone aus vier Modulen. */}
          <QRCodeSVG
            value={joinUrl}
            level="M"
            marginSize={4}
            bgColor="#ffffff"
            fgColor="#060810"
            title={t('tvLobby.scanTitle', 'Scannen & mitspielen')}
            style={{ display: 'block', width: lu(38), height: lu(38) }}
          />
        </div>
      </div>

      <div className="flex flex-col" style={{ gap: lu(1.4) }}>
        <h2
          className="font-black italic leading-none tracking-tight"
          style={{
            fontSize: lu(5.2),
            background: 'linear-gradient(100deg, #ffffff 0%, #df8eff 55%, #8ff5ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {t('tvLobby.scanTitle', 'Scannen & mitspielen')}
        </h2>
        <ol className="flex flex-col font-semibold text-white/80" style={{ gap: lu(0.8), fontSize: lu(2.3) }}>
          {[t('tvLobby.step1', 'Handykamera auf den Code richten'), t('tvLobby.step2', 'App öffnet sich – du bist dabei')].map((step, i) => (
            <li key={i} className="flex items-center" style={{ gap: lu(1.2) }}>
              <span
                className="grid shrink-0 place-items-center rounded-full font-black text-[#060810]"
                style={{ width: lu(3.4), height: lu(3.4), fontSize: lu(2), background: i === 0 ? LOBBY_ACCENTS.purple : LOBBY_ACCENTS.cyan }}
              >
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap items-baseline" style={{ columnGap: lu(1.4), rowGap: lu(0.4), marginTop: lu(0.6) }}>
          <span className="font-bold uppercase text-white/60" style={{ fontSize: lu(2), letterSpacing: '0.16em' }}>
            {t('tvLobby.orCode', 'oder Code in der App')}
          </span>
          <span
            data-testid="tv-lobby-code"
            dir="ltr"
            className="font-mono font-black tabular-nums text-[#8ff5ff]"
            style={{ fontSize: lu(4.8), letterSpacing: '0.2em' }}
          >
            {code}
          </span>
        </div>
      </div>
    </section>
  );
}
