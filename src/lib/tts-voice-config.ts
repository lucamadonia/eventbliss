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
export const voxtralVoices: Record<string, VoiceOption[]> = {
  de: [
    { id: 'voxtral-aria-de', name: 'Aria (Voxtral)', engine: 'voxtral', quality: 'high', description: 'Natürliche weibliche Stimme', voxtralVoiceId: 'aria' },
    { id: 'voxtral-zeus-de', name: 'Zeus (Voxtral)', engine: 'voxtral', quality: 'high', description: 'Klare männliche Stimme', voxtralVoiceId: 'zeus' },
  ],
  en: [
    { id: 'voxtral-aria-en', name: 'Aria (Voxtral)', engine: 'voxtral', quality: 'high', description: 'Natural female voice', voxtralVoiceId: 'aria' },
    { id: 'voxtral-zeus-en', name: 'Zeus (Voxtral)', engine: 'voxtral', quality: 'high', description: 'Clear male voice', voxtralVoiceId: 'zeus' },
  ],
  es: [
    { id: 'voxtral-aria-es', name: 'Aria (Voxtral)', engine: 'voxtral', quality: 'high', description: 'Voz femenina natural', voxtralVoiceId: 'aria' },
    { id: 'voxtral-zeus-es', name: 'Zeus (Voxtral)', engine: 'voxtral', quality: 'high', description: 'Voz masculina clara', voxtralVoiceId: 'zeus' },
  ],
  fr: [
    { id: 'voxtral-aria-fr', name: 'Aria (Voxtral)', engine: 'voxtral', quality: 'high', description: 'Voix féminine naturelle', voxtralVoiceId: 'aria' },
    { id: 'voxtral-zeus-fr', name: 'Zeus (Voxtral)', engine: 'voxtral', quality: 'high', description: 'Voix masculine claire', voxtralVoiceId: 'zeus' },
  ],
  it: [
    { id: 'voxtral-aria-it', name: 'Aria (Voxtral)', engine: 'voxtral', quality: 'high', description: 'Voce femminile naturale', voxtralVoiceId: 'aria' },
  ],
  nl: [
    { id: 'voxtral-aria-nl', name: 'Aria (Voxtral)', engine: 'voxtral', quality: 'high', description: 'Natuurlijke vrouwelijke stem', voxtralVoiceId: 'aria' },
  ],
  pt: [
    { id: 'voxtral-aria-pt', name: 'Aria (Voxtral)', engine: 'voxtral', quality: 'high', description: 'Voz feminina natural', voxtralVoiceId: 'aria' },
  ],
  ar: [
    { id: 'voxtral-aria-ar', name: 'Aria (Voxtral)', engine: 'voxtral', quality: 'high', description: 'صوت أنثوي طبيعي', voxtralVoiceId: 'aria' },
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
