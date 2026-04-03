// TTS Voice Configuration
// Supports: Voxtral (Mistral Cloud), VITS-Web (local neural), Web Speech API (browser)

export type TTSEngine = 'voxtral' | 'neural' | 'standard';

export interface VoiceOption {
  id: string;
  name: string;
  engine: TTSEngine;
  quality: 'high' | 'medium' | 'low';
  description?: string;
  voxtralVoiceId?: string; // Mistral voice identifier
}

export interface LanguageVoiceConfig {
  locale: string;
  speechLang: string;
  voices: VoiceOption[];
  defaultVoice: string;
}

// Voxtral TTS voices (Mistral Cloud - highest quality)
// Uses voxtral-mini-tts-2603 model with UUID-based voice IDs
// Multilingual: voices work with any language input
export const voxtralVoices: Record<string, VoiceOption[]> = {
  de: [
    { id: 'voxtral-paul-de', name: 'Paul (Voxtral)', engine: 'voxtral', quality: 'high', description: 'Natuerliche maennliche Stimme', voxtralVoiceId: 'c69964a6-ab8b-4f8a-9465-ec0925096ec8' },
    { id: 'voxtral-paul-happy-de', name: 'Paul Froehlich (Voxtral)', engine: 'voxtral', quality: 'high', description: 'Froehliche maennliche Stimme', voxtralVoiceId: '1024d823-a11e-43ee-bf3d-d440dccc0577' },
    { id: 'voxtral-jane-de', name: 'Jane (Voxtral)', engine: 'voxtral', quality: 'high', description: 'Weibliche Stimme', voxtralVoiceId: 'a3e41ea8-020b-44c0-8d8b-f6cc03524e31' },
    { id: 'voxtral-oliver-de', name: 'Oliver (Voxtral)', engine: 'voxtral', quality: 'high', description: 'Britische maennliche Stimme', voxtralVoiceId: 'e3596645-b1af-469e-b857-f18ddedc7652' },
  ],
  en: [
    { id: 'voxtral-paul-en', name: 'Paul (Voxtral)', engine: 'voxtral', quality: 'high', description: 'Natural male voice', voxtralVoiceId: 'c69964a6-ab8b-4f8a-9465-ec0925096ec8' },
    { id: 'voxtral-paul-cheerful-en', name: 'Paul Cheerful (Voxtral)', engine: 'voxtral', quality: 'high', description: 'Cheerful male voice', voxtralVoiceId: '01d985cd-5e0c-4457-bfd8-80ba31a5bc03' },
    { id: 'voxtral-jane-en', name: 'Jane (Voxtral)', engine: 'voxtral', quality: 'high', description: 'British female voice', voxtralVoiceId: 'a3e41ea8-020b-44c0-8d8b-f6cc03524e31' },
    { id: 'voxtral-oliver-en', name: 'Oliver (Voxtral)', engine: 'voxtral', quality: 'high', description: 'British male voice', voxtralVoiceId: 'e3596645-b1af-469e-b857-f18ddedc7652' },
  ],
  es: [
    { id: 'voxtral-paul-es', name: 'Paul (Voxtral)', engine: 'voxtral', quality: 'high', description: 'Voz masculina natural', voxtralVoiceId: 'c69964a6-ab8b-4f8a-9465-ec0925096ec8' },
    { id: 'voxtral-jane-es', name: 'Jane (Voxtral)', engine: 'voxtral', quality: 'high', description: 'Voz femenina', voxtralVoiceId: 'a3e41ea8-020b-44c0-8d8b-f6cc03524e31' },
  ],
  fr: [
    { id: 'voxtral-paul-fr', name: 'Paul (Voxtral)', engine: 'voxtral', quality: 'high', description: 'Voix masculine naturelle', voxtralVoiceId: 'c69964a6-ab8b-4f8a-9465-ec0925096ec8' },
    { id: 'voxtral-jane-fr', name: 'Jane (Voxtral)', engine: 'voxtral', quality: 'high', description: 'Voix feminine', voxtralVoiceId: 'a3e41ea8-020b-44c0-8d8b-f6cc03524e31' },
  ],
  it: [
    { id: 'voxtral-paul-it', name: 'Paul (Voxtral)', engine: 'voxtral', quality: 'high', description: 'Voce maschile naturale', voxtralVoiceId: 'c69964a6-ab8b-4f8a-9465-ec0925096ec8' },
  ],
  nl: [
    { id: 'voxtral-paul-nl', name: 'Paul (Voxtral)', engine: 'voxtral', quality: 'high', description: 'Natuurlijke mannelijke stem', voxtralVoiceId: 'c69964a6-ab8b-4f8a-9465-ec0925096ec8' },
  ],
  pt: [
    { id: 'voxtral-paul-pt', name: 'Paul (Voxtral)', engine: 'voxtral', quality: 'high', description: 'Voz masculina natural', voxtralVoiceId: 'c69964a6-ab8b-4f8a-9465-ec0925096ec8' },
  ],
  ar: [
    { id: 'voxtral-paul-ar', name: 'Paul (Voxtral)', engine: 'voxtral', quality: 'high', description: 'صوت ذكوري طبيعي', voxtralVoiceId: 'c69964a6-ab8b-4f8a-9465-ec0925096ec8' },
  ],
};

// VITS-Web compatible voice IDs from Piper models (local neural)
// https://github.com/rhasspy/piper/blob/master/VOICES.md
export const vitsVoices: Record<string, VoiceOption[]> = {
  de: [
    { id: 'de_DE-thorsten-high', name: 'Thorsten (Lokal)', engine: 'neural', quality: 'high', description: 'Lokale männliche Stimme' },
    { id: 'de_DE-thorsten_emotional-medium', name: 'Thorsten Emotional', engine: 'neural', quality: 'medium', description: 'Ausdrucksstarke Stimme' },
  ],
  en: [
    { id: 'en_US-hfc_female-medium', name: 'Female US (Lokal)', engine: 'neural', quality: 'medium', description: 'Clear female voice' },
    { id: 'en_US-lessac-medium', name: 'Lessac (Lokal)', engine: 'neural', quality: 'medium', description: 'Natural male voice' },
    { id: 'en_GB-alba-medium', name: 'Alba UK (Lokal)', engine: 'neural', quality: 'medium', description: 'British female voice' },
  ],
  es: [
    { id: 'es_ES-sharvard-medium', name: 'Sharvard (Lokal)', engine: 'neural', quality: 'medium', description: 'Voz masculina clara' },
    { id: 'es_ES-davefx-medium', name: 'DaveFX (Lokal)', engine: 'neural', quality: 'medium', description: 'Voz masculina natural' },
  ],
  fr: [
    { id: 'fr_FR-upmc-medium', name: 'UPMC (Lokal)', engine: 'neural', quality: 'medium', description: 'Voix française claire' },
    { id: 'fr_FR-siwis-medium', name: 'Siwis (Lokal)', engine: 'neural', quality: 'medium', description: 'Voix naturelle' },
  ],
  it: [
    { id: 'it_IT-riccardo-x_low', name: 'Riccardo (Lokal)', engine: 'neural', quality: 'low', description: 'Voce maschile' },
  ],
  nl: [
    { id: 'nl_NL-mls-medium', name: 'MLS (Lokal)', engine: 'neural', quality: 'medium', description: 'Nederlandse stem' },
  ],
  pl: [
    { id: 'pl_PL-darkman-medium', name: 'Darkman (Lokal)', engine: 'neural', quality: 'medium', description: 'Głos męski' },
    { id: 'pl_PL-gosia-medium', name: 'Gosia (Lokal)', engine: 'neural', quality: 'medium', description: 'Głos żeński' },
  ],
  pt: [
    { id: 'pt_PT-tux-medium', name: 'Tux (Lokal)', engine: 'neural', quality: 'medium', description: 'Voz masculina' },
  ],
  tr: [
    { id: 'tr_TR-dfki-medium', name: 'DFKI (Lokal)', engine: 'neural', quality: 'medium', description: 'Türkçe ses' },
  ],
};

// Web Speech API language mapping
export const webSpeechLanguages: Record<string, string> = {
  de: 'de-DE',
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  it: 'it-IT',
  nl: 'nl-NL',
  pl: 'pl-PL',
  pt: 'pt-PT',
  tr: 'tr-TR',
  ar: 'ar-SA',
};

// Get available voices for a language (Voxtral first, then VITS, then Web Speech)
export function getVoicesForLanguage(langCode: string): VoiceOption[] {
  const voxtral = voxtralVoices[langCode] || [];
  const vits = vitsVoices[langCode] || [];

  // Add Web Speech fallback option
  const webSpeechOption: VoiceOption = {
    id: `webspeech-${langCode}`,
    name: langCode === 'ar' ? 'عربي (Standard)' : 'Standard (Browser)',
    engine: 'standard',
    quality: 'medium',
    description: langCode === 'ar' ? 'Web Speech API' : 'Browser built-in voice',
  };

  return [...voxtral, ...vits, webSpeechOption];
}

// Get default voice for a language
export function getDefaultVoice(langCode: string): string {
  const voices = vitsVoices[langCode];
  if (voices && voices.length > 0) {
    return voices[0].id;
  }
  // Fallback to Web Speech for unsupported languages (like Arabic)
  return `webspeech-${langCode}`;
}

// Check if a voice ID is a Voxtral cloud voice
export function isVoxtralVoice(voiceId: string): boolean {
  return voiceId.startsWith('voxtral-');
}

// Check if a voice ID is a local neural (VITS) voice
export function isNeuralVoice(voiceId: string): boolean {
  return !voiceId.startsWith('webspeech-') && !voiceId.startsWith('voxtral-');
}

// Get the Voxtral voice ID for API calls
export function getVoxtralVoiceId(voiceId: string, langCode: string): string {
  const voices = voxtralVoices[langCode] || [];
  const voice = voices.find(v => v.id === voiceId);
  return voice?.voxtralVoiceId || 'aria';
}

// Get stored voice preference for a language
export function getStoredVoicePreference(langCode: string): string | null {
  try {
    return localStorage.getItem(`tts-preferred-voice-${langCode}`);
  } catch {
    return null;
  }
}

// Store voice preference for a language
export function storeVoicePreference(langCode: string, voiceId: string): void {
  try {
    localStorage.setItem(`tts-preferred-voice-${langCode}`, voiceId);
  } catch {
    // Ignore storage errors
  }
}

// Quality badge labels (localized)
export const qualityLabels: Record<string, Record<string, string>> = {
  high: { de: 'Hoch', en: 'High', es: 'Alta', fr: 'Haute', it: 'Alta', nl: 'Hoog', pl: 'Wysoka', pt: 'Alta', tr: 'Yüksek', ar: 'عالي' },
  medium: { de: 'Mittel', en: 'Medium', es: 'Media', fr: 'Moyenne', it: 'Media', nl: 'Gemiddeld', pl: 'Średnia', pt: 'Média', tr: 'Orta', ar: 'متوسط' },
  low: { de: 'Niedrig', en: 'Low', es: 'Baja', fr: 'Basse', it: 'Bassa', nl: 'Laag', pl: 'Niska', pt: 'Baixa', tr: 'Düşük', ar: 'منخفض' },
};

// Engine type labels
export const engineLabels: Record<TTSEngine, Record<string, string>> = {
  voxtral: { de: 'Voxtral AI', en: 'Voxtral AI', es: 'Voxtral AI', fr: 'Voxtral AI', it: 'Voxtral AI', nl: 'Voxtral AI', pl: 'Voxtral AI', pt: 'Voxtral AI', tr: 'Voxtral AI', ar: 'Voxtral AI' },
  neural: { de: 'Lokal', en: 'Local', es: 'Local', fr: 'Local', it: 'Locale', nl: 'Lokaal', pl: 'Lokalny', pt: 'Local', tr: 'Yerel', ar: 'محلي' },
  standard: { de: 'Standard', en: 'Standard', es: 'Estándar', fr: 'Standard', it: 'Standard', nl: 'Standaard', pl: 'Standard', pt: 'Padrão', tr: 'Standart', ar: 'قياسي' },
};
