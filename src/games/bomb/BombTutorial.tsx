import React from 'react';
import { motion } from 'framer-motion';

interface BombTutorialProps {
  onDismiss: () => void;
}

const STEPS = [
  {
    icon: '\ud83d\udccb',
    text: 'Kategorie + Buchstabe wird angezeigt',
  },
  {
    icon: '\u2705',
    text: '"Geschafft" wenn du eine Antwort hast',
  },
  {
    icon: '\u274c',
    text: '"Weiss nicht" = 1 Strafpunkt',
  },
  {
    icon: '\ud83d\udca3',
    text: 'Bei wem die Bombe explodiert = 2 Strafpunkte',
  },
  {
    icon: '\u26a1',
    text: 'Antworten duerfen sich nicht wiederholen!',
  },
];

export default function BombTutorial({ onDismiss }: BombTutorialProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10, 14, 20, 0.92)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background glow */}
      <div
        className="pointer-events-none absolute top-[20%] left-[50%] -translate-x-1/2 w-[60vw] h-[40vw] rounded-full blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(223,142,255,0.12) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute bottom-[10%] right-[20%] w-[40vw] h-[30vw] rounded-full blur-[100px]"
        style={{ background: 'radial-gradient(circle, rgba(143,245,255,0.08) 0%, transparent 70%)' }}
      />

      <motion.div
        className="relative w-full max-w-sm rounded-3xl border border-white/[0.08] overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(21,26,33,0.95) 0%, rgba(27,32,40,0.98) 50%, rgba(32,38,47,0.95) 100%)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
        initial={{ scale: 0.9, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Top gradient line */}
        <div
          className="h-[2px] w-full"
          style={{ background: 'linear-gradient(90deg, #df8eff, #8ff5ff, #ff6b98)' }}
        />

        <div className="px-6 py-8">
          {/* Title */}
          <motion.div
            className="text-center mb-6"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <span className="text-3xl mb-2 block">{'\ud83c\udfaf'}</span>
            <h2
              className="text-2xl font-black tracking-tight"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                background: 'linear-gradient(135deg, #df8eff, #8ff5ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ALLE ANTWORTEN
            </h2>
            <p className="text-white/50 text-sm mt-2">
              Jeder muss eine Antwort geben!
            </p>
          </motion.div>

          {/* Steps */}
          <div className="space-y-3">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(13,13,21,0.6)' }}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.15 + i * 0.08 }}
              >
                <span className="text-xl flex-shrink-0 w-8 text-center">{step.icon}</span>
                <span className="text-white/80 text-sm font-medium leading-snug">{step.text}</span>
              </motion.div>
            ))}
          </div>

          {/* CTA Button */}
          <motion.button
            onClick={onDismiss}
            className="w-full h-13 mt-6 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2"
            style={{
              height: '52px',
              background: 'linear-gradient(135deg, #df8eff 0%, #8ff5ff 100%)',
              boxShadow: '0 8px 32px rgba(223,142,255,0.25), 0 2px 8px rgba(143,245,255,0.15)',
            }}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.55 }}
            whileTap={{ scale: 0.97 }}
          >
            VERSTANDEN!
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
