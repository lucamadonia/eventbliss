// Neural TTS Voice Configuration using VITS-Web (Piper models)
// These voices run locally in the browser using ONNX inference

export type TTSEngine = 'neural' | 'standard';

export interface VoiceOption {
  id: string;
  name: string;
  engine: TTSEngine;
  quality: 'high' | 'medium' | 'low';
  description?: string;
}

export interface LanguageVoiceConfig {
  locale: string;
  speechLang: string;
  voices: VoiceOption[];
  defaultVoice: string;
}

// VITS-Web compatible voice IDs from Piper models
// https://github.com/rhasspy/piper/blob/master/VOICES.md
export const vitsVoices: Record<string, VoiceOption[]> = {
  de: [
    { id: 'de_DE-thorsten-high', name: 'Thorsten (Neural)', engine: 'neural', quality: 'high', description: 'Hochwertige männliche Stimme' },
    { id: 'de_DE-thorsten_emotional-medium', name: 'Thorsten Emotional', engine: 'neural', quality: 'medium', description: 'Ausdrucksstarke Stimme' },
  ],
  en: [
    { id: 'en_US-hfc_female-medium', name: 'Female US (Neural)', engine: 'neural', quality: 'medium', description: 'Clear female voice' },
    { id: 'en_US-lessac-medium', name: 'Lessac (Neural)', engine: 'neural', quality: 'medium', description: 'Natural male voice' },
    { id: 'en_GB-alba-medium', name: 'Alba UK (Neural)', engine: 'neural', quality: 'medium', description: 'British female voice' },
  ],
  es: [
    { id: 'es_ES-sharvard-medium', name: 'Sharvard (Neural)', engine: 'neural', quality: 'medium', description: 'Voz masculina clara' },
    { id: 'es_ES-davefx-medium', name: 'DaveFX (Neural)', engine: 'neural', quality: 'medium', description: 'Voz masculina natural' },
  ],
  fr: [
    { id: 'fr_FR-upmc-medium', name: 'UPMC (Neural)', engine: 'neural', quality: 'medium', description: 'Voix française claire' },
    { id: 'fr_FR-siwis-medium', name: 'Siwis (Neural)', engine: 'neural', quality: 'medium', description: 'Voix naturelle' },
  ],
  it: [
    { id: 'it_IT-riccardo-x_low', name: 'Riccardo (Neural)', engine: 'neural', quality: 'low', description: 'Voce maschile' },
  ],
  nl: [
    { id: 'nl_NL-mls-medium', name: 'MLS (Neural)', engine: 'neural', quality: 'medium', description: 'Nederlandse stem' },
  ],
  pl: [
    { id: 'pl_PL-darkman-medium', name: 'Darkman (Neural)', engine: 'neural', quality: 'medium', description: 'Głos męski' },
    { id: 'pl_PL-gosia-medium', name: 'Gosia (Neural)', engine: 'neural', quality: 'medium', description: 'Głos żeński' },
  ],
  pt: [
    { id: 'pt_PT-tux-medium', name: 'Tux (Neural)', engine: 'neural', quality: 'medium', description: 'Voz masculina' },
  ],
  tr: [
    { id: 'tr_TR-dfki-medium', name: 'DFKI (Neural)', engine: 'neural', quality: 'medium', description: 'Türkçe ses' },
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

// Get available voices for a language
export function getVoicesForLanguage(langCode: string): VoiceOption[] {
  const vits = vitsVoices[langCode] || [];
  
  // Add Web Speech fallback option
  const webSpeechOption: VoiceOption = {
    id: `webspeech-${langCode}`,
    name: langCode === 'ar' ? 'عربي (Standard)' : 'Standard (Browser)',
    engine: 'standard',
    quality: 'medium',
    description: langCode === 'ar' ? 'Web Speech API' : 'Browser built-in voice',
  };
  
  return [...vits, webSpeechOption];
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

// Check if a voice ID is a neural (VITS) voice
export function isNeuralVoice(voiceId: string): boolean {
  return !voiceId.startsWith('webspeech-');
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
  neural: { de: 'Neural', en: 'Neural', es: 'Neural', fr: 'Neural', it: 'Neurale', nl: 'Neuraal', pl: 'Neuronowy', pt: 'Neural', tr: 'Nöral', ar: 'عصبي' },
  standard: { de: 'Standard', en: 'Standard', es: 'Estándar', fr: 'Standard', it: 'Standard', nl: 'Standaard', pl: 'Standard', pt: 'Padrão', tr: 'Standart', ar: 'قياسي' },
};
