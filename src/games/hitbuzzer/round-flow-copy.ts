const de = {
  startNow: 'Jetzt starten', otherSong: 'Anderen Song laden', ready: 'Ausschnitt bereit', finding: 'Ausschnitt wird geladen …', unavailable: 'Ausschnitt nicht verfügbar', waiting: 'Warten auf den Host',
  challenge: 'Wer erkennt den Song zuerst?', promise: '30 Sekunden Musik. Ein Buzzer-Moment. Interpret und Titel entscheiden.',
};

type RoundFlowCopy = typeof de;
const translations: Record<string, RoundFlowCopy> = {
  de,
  en: { startNow: 'Start now', otherSong: 'Load another song', ready: 'Clip ready', finding: 'Loading clip …', unavailable: 'Clip unavailable', waiting: 'Waiting for host', challenge: 'Who knows the song first?', promise: '30 seconds of music. One buzzer moment. Artist and title decide.' },
  fr: { startNow: 'Commencer', otherSong: 'Charger un autre titre', ready: 'Extrait prêt', finding: 'Chargement de l’extrait …', unavailable: 'Extrait indisponible', waiting: 'En attente de l’hôte', challenge: 'Qui reconnaîtra le titre ?', promise: '30 secondes de musique. Un buzzer. L’artiste et le titre décident.' },
  es: { startNow: 'Empezar ahora', otherSong: 'Cargar otra canción', ready: 'Fragmento listo', finding: 'Cargando fragmento …', unavailable: 'Fragmento no disponible', waiting: 'Esperando al anfitrión', challenge: '¿Quién reconoce la canción?', promise: '30 segundos de música. Un pulsador. Artista y título deciden.' },
  it: { startNow: 'Inizia ora', otherSong: 'Carica un altro brano', ready: 'Estratto pronto', finding: 'Caricamento estratto …', unavailable: 'Estratto non disponibile', waiting: 'In attesa dell’host', challenge: 'Chi riconosce il brano?', promise: '30 secondi di musica. Un buzzer. Artista e titolo decidono.' },
  pt: { startNow: 'Começar agora', otherSong: 'Carregar outra música', ready: 'Excerto pronto', finding: 'A carregar excerto …', unavailable: 'Excerto indisponível', waiting: 'À espera do anfitrião', challenge: 'Quem reconhece a música?', promise: '30 segundos de música. Um buzzer. Artista e título decidem.' },
  nl: { startNow: 'Nu starten', otherSong: 'Ander nummer laden', ready: 'Fragment klaar', finding: 'Fragment laden …', unavailable: 'Fragment niet beschikbaar', waiting: 'Wachten op de host', challenge: 'Wie herkent het nummer?', promise: '30 seconden muziek. Eén buzzermoment. Artiest en titel tellen.' },
  pl: { startNow: 'Zacznij teraz', otherSong: 'Wczytaj inną piosenkę', ready: 'Fragment gotowy', finding: 'Wczytywanie fragmentu …', unavailable: 'Fragment niedostępny', waiting: 'Oczekiwanie na prowadzącego', challenge: 'Kto pierwszy rozpozna utwór?', promise: '30 sekund muzyki. Jeden sygnał. Liczą się wykonawca i tytuł.' },
  tr: { startNow: 'Şimdi başlat', otherSong: 'Başka şarkı yükle', ready: 'Kesit hazır', finding: 'Kesit yükleniyor …', unavailable: 'Kesit kullanılamıyor', waiting: 'Sunucu bekleniyor', challenge: 'Şarkıyı ilk kim tanıyacak?', promise: '30 saniye müzik. Tek zil anı. Sanatçı ve ad belirler.' },
  ar: { startNow: 'ابدأ الآن', otherSong: 'حمّل أغنية أخرى', ready: 'المقطع جاهز', finding: 'جارٍ تحميل المقطع …', unavailable: 'المقطع غير متاح', waiting: 'بانتظار المضيف', challenge: 'من يعرف الأغنية أولاً؟', promise: '٣٠ ثانية من الموسيقى. ضغطة واحدة. الفنان والعنوان يحسمان النتيجة.' },
};

const answerCopy = {
  de: { answerNow: 'Dein Buzzer-Moment', sayAnswer: 'Nenne jetzt Interpret und Titel.', markAnswer: 'Tippe vor Ablauf auf Richtig oder Falsch.', waitForPlayer: 'Die Antwort wird gerade laut genannt.', history: 'Rundenverlauf', timeout: 'Zeit abgelaufen', noAttempts: 'Niemand hat gebuzzert.' },
  en: { answerNow: 'Your buzzer moment', sayAnswer: 'Say the artist and title now.', markAnswer: 'Tap Correct or Wrong before time runs out.', waitForPlayer: 'The answer is being spoken aloud.', history: 'Round history', timeout: 'Time ran out', noAttempts: 'No one buzzed.' },
  fr: { answerNow: 'À toi de répondre', sayAnswer: 'Dis l’artiste et le titre.', markAnswer: 'Choisis Correct ou Faux avant la fin du temps.', waitForPlayer: 'La réponse est annoncée à voix haute.', history: 'Historique des manches', timeout: 'Temps écoulé', noAttempts: 'Personne n’a buzzé.' },
  es: { answerNow: 'Tu momento', sayAnswer: 'Di el artista y el título.', markAnswer: 'Elige Correcto o Incorrecto antes de que termine el tiempo.', waitForPlayer: 'La respuesta se está diciendo en voz alta.', history: 'Historial de rondas', timeout: 'Se acabó el tiempo', noAttempts: 'Nadie pulsó.' },
  it: { answerNow: 'È il tuo momento', sayAnswer: 'Di artista e titolo.', markAnswer: 'Scegli Giusto o Sbagliato prima dello scadere del tempo.', waitForPlayer: 'La risposta viene detta ad alta voce.', history: 'Cronologia dei round', timeout: 'Tempo scaduto', noAttempts: 'Nessuno ha premuto.' },
  pt: { answerNow: 'É a tua vez', sayAnswer: 'Diz o artista e o título.', markAnswer: 'Escolhe Certo ou Errado antes de acabar o tempo.', waitForPlayer: 'A resposta está a ser dita em voz alta.', history: 'Histórico das rondas', timeout: 'Tempo esgotado', noAttempts: 'Ninguém carregou.' },
  nl: { answerNow: 'Jouw buzzermoment', sayAnswer: 'Noem nu artiest en titel.', markAnswer: 'Kies Goed of Fout voordat de tijd om is.', waitForPlayer: 'Het antwoord wordt hardop genoemd.', history: 'Rondegeschiedenis', timeout: 'Tijd voorbij', noAttempts: 'Niemand heeft gedrukt.' },
  pl: { answerNow: 'Twoja kolej', sayAnswer: 'Podaj wykonawcę i tytuł.', markAnswer: 'Wybierz Dobrze lub Źle przed końcem czasu.', waitForPlayer: 'Odpowiedź jest podawana na głos.', history: 'Historia rund', timeout: 'Czas minął', noAttempts: 'Nikt nie nacisnął.' },
  tr: { answerNow: 'Sıra sende', sayAnswer: 'Sanatçıyı ve şarkı adını söyle.', markAnswer: 'Süre dolmadan Doğru veya Yanlış seç.', waitForPlayer: 'Yanıt yüksek sesle söyleniyor.', history: 'Tur geçmişi', timeout: 'Süre doldu', noAttempts: 'Kimse basmadı.' },
  ar: { answerNow: 'دورك الآن', sayAnswer: 'اذكر الفنان واسم الأغنية.', markAnswer: 'اختر صحيح أو خطأ قبل انتهاء الوقت.', waitForPlayer: 'تُقال الإجابة بصوت عالٍ.', history: 'سجل الجولات', timeout: 'انتهى الوقت', noAttempts: 'لم يضغط أحد.' },
};

export function roundFlowText(language: string): RoundFlowCopy & (typeof answerCopy)['de'] {
  const locale = language.split('-')[0];
  return { ...(translations[locale] ?? translations.en), ...(answerCopy[locale as keyof typeof answerCopy] ?? answerCopy.en) };
}
