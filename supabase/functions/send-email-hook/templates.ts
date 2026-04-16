export type EmailAction =
  | "signup"
  | "invite"
  | "magiclink"
  | "recovery"
  | "email_change"
  | "reauthentication";

export type Lang =
  | "de" | "en" | "es" | "fr" | "it" | "nl" | "pl" | "pt" | "tr" | "ar";

interface Strings {
  subject: string;
  heading: string;
  body: string;
  cta?: string;
  buttonHelp?: string;
  ignore: string;
  oldLabel?: string;
  newLabel?: string;
  codeNotice?: string;
}

export const ALLOWED_LANGS: Lang[] = [
  "de", "en", "es", "fr", "it", "nl", "pl", "pt", "tr", "ar",
];
export const DEFAULT_LANG: Lang = "de";

const T: Record<Lang, Record<EmailAction, Strings>> = {
  de: {
    signup: {
      subject: "Willkommen bei EventBliss – bitte E-Mail bestätigen 🎉",
      heading: "Fast geschafft!",
      body: "Schön, dass du dabei bist. Bitte bestätige deine E-Mail-Adresse, damit deine Party losgehen kann:",
      cta: "E-Mail bestätigen",
      buttonHelp: "Button funktioniert nicht? Kopiere diesen Link in deinen Browser:",
      ignore: "Du hast dich nicht bei EventBliss registriert? Dann ignoriere diese E-Mail einfach.",
    },
    invite: {
      subject: "Du wurdest zu EventBliss eingeladen 🎊",
      heading: "Du bist eingeladen!",
      body: "Jemand hat dich zu EventBliss eingeladen – der Party-App mit über 40 Spielmodi für jedes Event. Klicke unten, um deinen Account zu erstellen:",
      cta: "Einladung annehmen",
      buttonHelp: "Button funktioniert nicht? Kopiere diesen Link in deinen Browser:",
      ignore: "Du kennst EventBliss nicht? Dann ignoriere diese Einladung einfach.",
    },
    magiclink: {
      subject: "Dein EventBliss-Login 🔐",
      heading: "Dein Login-Link",
      body: "Klicke auf den Button, um dich sicher bei EventBliss anzumelden. Der Link ist <strong>60 Minuten</strong> gültig.",
      cta: "Jetzt anmelden",
      buttonHelp: "Button funktioniert nicht? Kopiere diesen Link in deinen Browser:",
      ignore: "Du hast diesen Link nicht angefordert? Ignoriere die Mail – dein Account bleibt sicher.",
    },
    recovery: {
      subject: "Passwort zurücksetzen 🔑",
      heading: "Passwort zurücksetzen",
      body: "Du hast ein neues Passwort für deinen EventBliss-Account angefordert. Klicke unten, um es zu ändern. Der Link ist <strong>60 Minuten</strong> gültig.",
      cta: "Neues Passwort festlegen",
      buttonHelp: "Button funktioniert nicht? Kopiere diesen Link in deinen Browser:",
      ignore: "Du hast das nicht angefordert? Ignoriere diese E-Mail – dein Passwort bleibt unverändert.",
    },
    email_change: {
      subject: "Neue E-Mail-Adresse bestätigen ✉️",
      heading: "E-Mail-Änderung bestätigen",
      body: "Du möchtest die E-Mail-Adresse deines EventBliss-Accounts ändern. Klicke unten, um die Änderung zu bestätigen:",
      cta: "Änderung bestätigen",
      buttonHelp: "Button funktioniert nicht? Kopiere diesen Link in deinen Browser:",
      ignore: "Du hast das nicht angefordert? Ignoriere diese E-Mail – deine Adresse bleibt unverändert.",
      oldLabel: "Alt",
      newLabel: "Neu",
    },
    reauthentication: {
      subject: "Dein Bestätigungscode 🔒",
      heading: "Sicherheitsbestätigung",
      body: "Du möchtest eine sicherheitsrelevante Aktion in deinem Account durchführen. Gib diesen Code zur Bestätigung ein:",
      ignore: "Du hast diese Aktion nicht gestartet? Ignoriere diese E-Mail und prüfe dein Passwort.",
      codeNotice: "Der Code ist <strong>10 Minuten</strong> gültig.",
    },
  },
  en: {
    signup: {
      subject: "Welcome to EventBliss – please confirm your email 🎉",
      heading: "Almost there!",
      body: "Great to have you on board. Please confirm your email address so the party can begin:",
      cta: "Confirm email",
      buttonHelp: "Button not working? Copy this link into your browser:",
      ignore: "You didn't sign up for EventBliss? Just ignore this email.",
    },
    invite: {
      subject: "You've been invited to EventBliss 🎊",
      heading: "You're invited!",
      body: "Someone invited you to EventBliss – the party app with 40+ game modes for every event. Click below to create your account:",
      cta: "Accept invitation",
      buttonHelp: "Button not working? Copy this link into your browser:",
      ignore: "Don't know EventBliss? Just ignore this invitation.",
    },
    magiclink: {
      subject: "Your EventBliss login link 🔐",
      heading: "Your login link",
      body: "Click the button to securely sign in to EventBliss. The link is valid for <strong>60 minutes</strong>.",
      cta: "Sign in now",
      buttonHelp: "Button not working? Copy this link into your browser:",
      ignore: "Didn't request this link? Just ignore the email – your account stays safe.",
    },
    recovery: {
      subject: "Reset your password 🔑",
      heading: "Reset your password",
      body: "You requested a new password for your EventBliss account. Click below to set it. The link is valid for <strong>60 minutes</strong>.",
      cta: "Set new password",
      buttonHelp: "Button not working? Copy this link into your browser:",
      ignore: "Didn't request this? Just ignore this email – your password stays unchanged.",
    },
    email_change: {
      subject: "Confirm your new email address ✉️",
      heading: "Confirm email change",
      body: "You want to change the email address of your EventBliss account. Click below to confirm the change:",
      cta: "Confirm change",
      buttonHelp: "Button not working? Copy this link into your browser:",
      ignore: "Didn't request this? Just ignore this email – your address stays unchanged.",
      oldLabel: "Old",
      newLabel: "New",
    },
    reauthentication: {
      subject: "Your confirmation code 🔒",
      heading: "Security confirmation",
      body: "You're about to perform a security-sensitive action in your account. Enter this code to confirm:",
      ignore: "Didn't start this action? Ignore this email and check your password.",
      codeNotice: "The code is valid for <strong>10 minutes</strong>.",
    },
  },
  es: {
    signup: {
      subject: "Bienvenido a EventBliss – confirma tu correo 🎉",
      heading: "¡Ya casi estás!",
      body: "Nos alegra tenerte aquí. Confirma tu dirección de correo para que la fiesta pueda empezar:",
      cta: "Confirmar correo",
      buttonHelp: "¿El botón no funciona? Copia este enlace en tu navegador:",
      ignore: "¿No te has registrado en EventBliss? Ignora este correo.",
    },
    invite: {
      subject: "Te han invitado a EventBliss 🎊",
      heading: "¡Estás invitado!",
      body: "Alguien te ha invitado a EventBliss – la app de fiestas con más de 40 modos de juego. Haz clic abajo para crear tu cuenta:",
      cta: "Aceptar invitación",
      buttonHelp: "¿El botón no funciona? Copia este enlace en tu navegador:",
      ignore: "¿No conoces EventBliss? Ignora esta invitación.",
    },
    magiclink: {
      subject: "Tu enlace de acceso a EventBliss 🔐",
      heading: "Tu enlace de acceso",
      body: "Haz clic en el botón para iniciar sesión en EventBliss de forma segura. El enlace es válido durante <strong>60 minutos</strong>.",
      cta: "Iniciar sesión",
      buttonHelp: "¿El botón no funciona? Copia este enlace en tu navegador:",
      ignore: "¿No has solicitado este enlace? Ignora el correo – tu cuenta está a salvo.",
    },
    recovery: {
      subject: "Restablece tu contraseña 🔑",
      heading: "Restablecer contraseña",
      body: "Has solicitado una nueva contraseña para tu cuenta de EventBliss. Haz clic abajo para cambiarla. El enlace es válido durante <strong>60 minutos</strong>.",
      cta: "Establecer nueva contraseña",
      buttonHelp: "¿El botón no funciona? Copia este enlace en tu navegador:",
      ignore: "¿No lo has solicitado? Ignora este correo – tu contraseña no cambiará.",
    },
    email_change: {
      subject: "Confirma tu nueva dirección de correo ✉️",
      heading: "Confirmar cambio de correo",
      body: "Quieres cambiar la dirección de correo de tu cuenta de EventBliss. Haz clic abajo para confirmar el cambio:",
      cta: "Confirmar cambio",
      buttonHelp: "¿El botón no funciona? Copia este enlace en tu navegador:",
      ignore: "¿No lo has solicitado? Ignora este correo – tu dirección no cambiará.",
      oldLabel: "Antigua",
      newLabel: "Nueva",
    },
    reauthentication: {
      subject: "Tu código de confirmación 🔒",
      heading: "Confirmación de seguridad",
      body: "Vas a realizar una acción sensible en tu cuenta. Introduce este código para confirmarlo:",
      ignore: "¿No has iniciado esta acción? Ignora este correo y revisa tu contraseña.",
      codeNotice: "El código es válido durante <strong>10 minutos</strong>.",
    },
  },
  fr: {
    signup: {
      subject: "Bienvenue sur EventBliss – confirme ton e-mail 🎉",
      heading: "Presque fini !",
      body: "Content de t'avoir avec nous. Confirme ton adresse e-mail pour que la fête puisse commencer :",
      cta: "Confirmer l'e-mail",
      buttonHelp: "Le bouton ne fonctionne pas ? Copie ce lien dans ton navigateur :",
      ignore: "Tu ne t'es pas inscrit(e) sur EventBliss ? Ignore simplement cet e-mail.",
    },
    invite: {
      subject: "Tu as été invité(e) sur EventBliss 🎊",
      heading: "Tu es invité(e) !",
      body: "Quelqu'un t'a invité(e) sur EventBliss – l'appli de fête avec plus de 40 modes de jeu. Clique ci-dessous pour créer ton compte :",
      cta: "Accepter l'invitation",
      buttonHelp: "Le bouton ne fonctionne pas ? Copie ce lien dans ton navigateur :",
      ignore: "Tu ne connais pas EventBliss ? Ignore simplement cette invitation.",
    },
    magiclink: {
      subject: "Ton lien de connexion EventBliss 🔐",
      heading: "Ton lien de connexion",
      body: "Clique sur le bouton pour te connecter en toute sécurité à EventBliss. Le lien est valable <strong>60 minutes</strong>.",
      cta: "Se connecter",
      buttonHelp: "Le bouton ne fonctionne pas ? Copie ce lien dans ton navigateur :",
      ignore: "Tu n'as pas demandé ce lien ? Ignore l'e-mail – ton compte reste sécurisé.",
    },
    recovery: {
      subject: "Réinitialise ton mot de passe 🔑",
      heading: "Réinitialiser le mot de passe",
      body: "Tu as demandé un nouveau mot de passe pour ton compte EventBliss. Clique ci-dessous pour le modifier. Le lien est valable <strong>60 minutes</strong>.",
      cta: "Définir un nouveau mot de passe",
      buttonHelp: "Le bouton ne fonctionne pas ? Copie ce lien dans ton navigateur :",
      ignore: "Tu n'as pas fait cette demande ? Ignore cet e-mail – ton mot de passe reste inchangé.",
    },
    email_change: {
      subject: "Confirme ta nouvelle adresse e-mail ✉️",
      heading: "Confirmer le changement d'e-mail",
      body: "Tu veux changer l'adresse e-mail de ton compte EventBliss. Clique ci-dessous pour confirmer le changement :",
      cta: "Confirmer le changement",
      buttonHelp: "Le bouton ne fonctionne pas ? Copie ce lien dans ton navigateur :",
      ignore: "Tu n'as pas fait cette demande ? Ignore cet e-mail – ton adresse reste inchangée.",
      oldLabel: "Ancienne",
      newLabel: "Nouvelle",
    },
    reauthentication: {
      subject: "Ton code de confirmation 🔒",
      heading: "Confirmation de sécurité",
      body: "Tu vas effectuer une action sensible sur ton compte. Saisis ce code pour confirmer :",
      ignore: "Tu n'as pas initié cette action ? Ignore cet e-mail et vérifie ton mot de passe.",
      codeNotice: "Le code est valable <strong>10 minutes</strong>.",
    },
  },
  it: {
    signup: {
      subject: "Benvenuto su EventBliss – conferma la tua email 🎉",
      heading: "Ci siamo quasi!",
      body: "Siamo felici di averti qui. Conferma il tuo indirizzo email così la festa può iniziare:",
      cta: "Conferma email",
      buttonHelp: "Il pulsante non funziona? Copia questo link nel tuo browser:",
      ignore: "Non ti sei registrato su EventBliss? Ignora pure questa email.",
    },
    invite: {
      subject: "Sei stato invitato su EventBliss 🎊",
      heading: "Sei invitato!",
      body: "Qualcuno ti ha invitato su EventBliss – l'app per feste con oltre 40 modalità di gioco. Clicca sotto per creare il tuo account:",
      cta: "Accetta invito",
      buttonHelp: "Il pulsante non funziona? Copia questo link nel tuo browser:",
      ignore: "Non conosci EventBliss? Ignora pure questo invito.",
    },
    magiclink: {
      subject: "Il tuo link di accesso a EventBliss 🔐",
      heading: "Il tuo link di accesso",
      body: "Clicca sul pulsante per accedere a EventBliss in sicurezza. Il link è valido per <strong>60 minuti</strong>.",
      cta: "Accedi ora",
      buttonHelp: "Il pulsante non funziona? Copia questo link nel tuo browser:",
      ignore: "Non hai richiesto questo link? Ignora l'email – il tuo account è al sicuro.",
    },
    recovery: {
      subject: "Reimposta la password 🔑",
      heading: "Reimposta la password",
      body: "Hai richiesto una nuova password per il tuo account EventBliss. Clicca sotto per cambiarla. Il link è valido per <strong>60 minuti</strong>.",
      cta: "Imposta nuova password",
      buttonHelp: "Il pulsante non funziona? Copia questo link nel tuo browser:",
      ignore: "Non hai richiesto questa operazione? Ignora l'email – la tua password resta invariata.",
    },
    email_change: {
      subject: "Conferma il tuo nuovo indirizzo email ✉️",
      heading: "Conferma cambio email",
      body: "Vuoi cambiare l'indirizzo email del tuo account EventBliss. Clicca sotto per confermare il cambio:",
      cta: "Conferma cambio",
      buttonHelp: "Il pulsante non funziona? Copia questo link nel tuo browser:",
      ignore: "Non hai richiesto questa operazione? Ignora l'email – il tuo indirizzo resta invariato.",
      oldLabel: "Vecchia",
      newLabel: "Nuova",
    },
    reauthentication: {
      subject: "Il tuo codice di conferma 🔒",
      heading: "Conferma di sicurezza",
      body: "Stai per eseguire un'azione sensibile sul tuo account. Inserisci questo codice per confermare:",
      ignore: "Non hai avviato questa azione? Ignora l'email e controlla la tua password.",
      codeNotice: "Il codice è valido per <strong>10 minuti</strong>.",
    },
  },
  nl: {
    signup: {
      subject: "Welkom bij EventBliss – bevestig je e-mailadres 🎉",
      heading: "Bijna klaar!",
      body: "Leuk dat je erbij bent. Bevestig je e-mailadres zodat het feest kan beginnen:",
      cta: "E-mail bevestigen",
      buttonHelp: "Werkt de knop niet? Kopieer deze link in je browser:",
      ignore: "Heb je je niet aangemeld bij EventBliss? Negeer dan deze e-mail.",
    },
    invite: {
      subject: "Je bent uitgenodigd voor EventBliss 🎊",
      heading: "Je bent uitgenodigd!",
      body: "Iemand heeft je uitgenodigd voor EventBliss – de feest-app met meer dan 40 spelmodi. Klik hieronder om je account aan te maken:",
      cta: "Uitnodiging accepteren",
      buttonHelp: "Werkt de knop niet? Kopieer deze link in je browser:",
      ignore: "Ken je EventBliss niet? Negeer dan deze uitnodiging.",
    },
    magiclink: {
      subject: "Je EventBliss-inloglink 🔐",
      heading: "Je inloglink",
      body: "Klik op de knop om veilig in te loggen bij EventBliss. De link is <strong>60 minuten</strong> geldig.",
      cta: "Nu inloggen",
      buttonHelp: "Werkt de knop niet? Kopieer deze link in je browser:",
      ignore: "Heb je deze link niet aangevraagd? Negeer de e-mail – je account blijft veilig.",
    },
    recovery: {
      subject: "Wachtwoord opnieuw instellen 🔑",
      heading: "Wachtwoord opnieuw instellen",
      body: "Je hebt een nieuw wachtwoord aangevraagd voor je EventBliss-account. Klik hieronder om het te wijzigen. De link is <strong>60 minuten</strong> geldig.",
      cta: "Nieuw wachtwoord instellen",
      buttonHelp: "Werkt de knop niet? Kopieer deze link in je browser:",
      ignore: "Heb je dit niet aangevraagd? Negeer deze e-mail – je wachtwoord blijft ongewijzigd.",
    },
    email_change: {
      subject: "Bevestig je nieuwe e-mailadres ✉️",
      heading: "E-mailwijziging bevestigen",
      body: "Je wilt het e-mailadres van je EventBliss-account wijzigen. Klik hieronder om de wijziging te bevestigen:",
      cta: "Wijziging bevestigen",
      buttonHelp: "Werkt de knop niet? Kopieer deze link in je browser:",
      ignore: "Heb je dit niet aangevraagd? Negeer deze e-mail – je adres blijft ongewijzigd.",
      oldLabel: "Oud",
      newLabel: "Nieuw",
    },
    reauthentication: {
      subject: "Je bevestigingscode 🔒",
      heading: "Veiligheidsbevestiging",
      body: "Je gaat een gevoelige actie in je account uitvoeren. Voer deze code in ter bevestiging:",
      ignore: "Heb je deze actie niet gestart? Negeer deze e-mail en controleer je wachtwoord.",
      codeNotice: "De code is <strong>10 minuten</strong> geldig.",
    },
  },
  pl: {
    signup: {
      subject: "Witaj w EventBliss – potwierdź swój adres e-mail 🎉",
      heading: "Prawie gotowe!",
      body: "Cieszymy się, że jesteś z nami. Potwierdź swój adres e-mail, aby impreza mogła się zacząć:",
      cta: "Potwierdź e-mail",
      buttonHelp: "Przycisk nie działa? Skopiuj ten link do przeglądarki:",
      ignore: "Nie rejestrowałeś się w EventBliss? Zignoruj tę wiadomość.",
    },
    invite: {
      subject: "Zostałeś zaproszony do EventBliss 🎊",
      heading: "Jesteś zaproszony!",
      body: "Ktoś zaprosił Cię do EventBliss – aplikacji imprezowej z ponad 40 trybami gry. Kliknij poniżej, aby utworzyć konto:",
      cta: "Przyjmij zaproszenie",
      buttonHelp: "Przycisk nie działa? Skopiuj ten link do przeglądarki:",
      ignore: "Nie znasz EventBliss? Zignoruj to zaproszenie.",
    },
    magiclink: {
      subject: "Twój link logowania do EventBliss 🔐",
      heading: "Twój link logowania",
      body: "Kliknij przycisk, aby bezpiecznie zalogować się do EventBliss. Link jest ważny <strong>60 minut</strong>.",
      cta: "Zaloguj się",
      buttonHelp: "Przycisk nie działa? Skopiuj ten link do przeglądarki:",
      ignore: "Nie prosiłeś o ten link? Zignoruj wiadomość – Twoje konto jest bezpieczne.",
    },
    recovery: {
      subject: "Zresetuj hasło 🔑",
      heading: "Zresetuj hasło",
      body: "Poprosiłeś o nowe hasło do swojego konta EventBliss. Kliknij poniżej, aby je zmienić. Link jest ważny <strong>60 minut</strong>.",
      cta: "Ustaw nowe hasło",
      buttonHelp: "Przycisk nie działa? Skopiuj ten link do przeglądarki:",
      ignore: "Nie prosiłeś o to? Zignoruj wiadomość – Twoje hasło pozostaje bez zmian.",
    },
    email_change: {
      subject: "Potwierdź nowy adres e-mail ✉️",
      heading: "Potwierdź zmianę e-maila",
      body: "Chcesz zmienić adres e-mail swojego konta EventBliss. Kliknij poniżej, aby potwierdzić zmianę:",
      cta: "Potwierdź zmianę",
      buttonHelp: "Przycisk nie działa? Skopiuj ten link do przeglądarki:",
      ignore: "Nie prosiłeś o to? Zignoruj wiadomość – Twój adres pozostaje bez zmian.",
      oldLabel: "Stary",
      newLabel: "Nowy",
    },
    reauthentication: {
      subject: "Twój kod potwierdzający 🔒",
      heading: "Potwierdzenie bezpieczeństwa",
      body: "Zamierzasz wykonać wrażliwą operację na swoim koncie. Wpisz ten kod, aby potwierdzić:",
      ignore: "Nie rozpoczynałeś tej operacji? Zignoruj wiadomość i sprawdź swoje hasło.",
      codeNotice: "Kod jest ważny <strong>10 minut</strong>.",
    },
  },
  pt: {
    signup: {
      subject: "Bem-vindo ao EventBliss – confirma o teu e-mail 🎉",
      heading: "Quase lá!",
      body: "Que bom ter-te connosco. Confirma o teu endereço de e-mail para a festa começar:",
      cta: "Confirmar e-mail",
      buttonHelp: "O botão não funciona? Copia este link para o teu navegador:",
      ignore: "Não te registaste no EventBliss? Ignora este e-mail.",
    },
    invite: {
      subject: "Foste convidado para o EventBliss 🎊",
      heading: "Estás convidado!",
      body: "Alguém te convidou para o EventBliss – a app de festas com mais de 40 modos de jogo. Clica abaixo para criar a tua conta:",
      cta: "Aceitar convite",
      buttonHelp: "O botão não funciona? Copia este link para o teu navegador:",
      ignore: "Não conheces o EventBliss? Ignora este convite.",
    },
    magiclink: {
      subject: "O teu link de acesso ao EventBliss 🔐",
      heading: "O teu link de acesso",
      body: "Clica no botão para iniciar sessão no EventBliss em segurança. O link é válido por <strong>60 minutos</strong>.",
      cta: "Iniciar sessão",
      buttonHelp: "O botão não funciona? Copia este link para o teu navegador:",
      ignore: "Não pediste este link? Ignora o e-mail – a tua conta permanece segura.",
    },
    recovery: {
      subject: "Redefine a tua palavra-passe 🔑",
      heading: "Redefinir palavra-passe",
      body: "Pediste uma nova palavra-passe para a tua conta EventBliss. Clica abaixo para a alterar. O link é válido por <strong>60 minutos</strong>.",
      cta: "Definir nova palavra-passe",
      buttonHelp: "O botão não funciona? Copia este link para o teu navegador:",
      ignore: "Não pediste isto? Ignora este e-mail – a tua palavra-passe permanece inalterada.",
    },
    email_change: {
      subject: "Confirma o teu novo endereço de e-mail ✉️",
      heading: "Confirmar alteração de e-mail",
      body: "Queres alterar o endereço de e-mail da tua conta EventBliss. Clica abaixo para confirmar a alteração:",
      cta: "Confirmar alteração",
      buttonHelp: "O botão não funciona? Copia este link para o teu navegador:",
      ignore: "Não pediste isto? Ignora este e-mail – o teu endereço permanece inalterado.",
      oldLabel: "Antigo",
      newLabel: "Novo",
    },
    reauthentication: {
      subject: "O teu código de confirmação 🔒",
      heading: "Confirmação de segurança",
      body: "Vais executar uma ação sensível na tua conta. Introduz este código para confirmar:",
      ignore: "Não iniciaste esta ação? Ignora este e-mail e verifica a tua palavra-passe.",
      codeNotice: "O código é válido por <strong>10 minutos</strong>.",
    },
  },
  tr: {
    signup: {
      subject: "EventBliss'e hoş geldin – e-postanı onayla 🎉",
      heading: "Neredeyse tamam!",
      body: "Aramıza katıldığın için harika. Partinin başlaması için lütfen e-posta adresini onayla:",
      cta: "E-postayı onayla",
      buttonHelp: "Buton çalışmıyor mu? Bu bağlantıyı tarayıcına kopyala:",
      ignore: "EventBliss'e kayıt olmadın mı? Bu e-postayı yok sayabilirsin.",
    },
    invite: {
      subject: "EventBliss'e davet edildin 🎊",
      heading: "Davetlisin!",
      body: "Birisi seni EventBliss'e davet etti – 40'tan fazla oyun modlu parti uygulaması. Hesabını oluşturmak için aşağıya tıkla:",
      cta: "Daveti kabul et",
      buttonHelp: "Buton çalışmıyor mu? Bu bağlantıyı tarayıcına kopyala:",
      ignore: "EventBliss'i tanımıyor musun? Bu daveti yok sayabilirsin.",
    },
    magiclink: {
      subject: "EventBliss giriş bağlantın 🔐",
      heading: "Giriş bağlantın",
      body: "EventBliss'e güvenli giriş yapmak için butona tıkla. Bağlantı <strong>60 dakika</strong> geçerlidir.",
      cta: "Şimdi giriş yap",
      buttonHelp: "Buton çalışmıyor mu? Bu bağlantıyı tarayıcına kopyala:",
      ignore: "Bu bağlantıyı sen istemedin mi? E-postayı yok say – hesabın güvende.",
    },
    recovery: {
      subject: "Şifreni sıfırla 🔑",
      heading: "Şifreni sıfırla",
      body: "EventBliss hesabın için yeni bir şifre talep ettin. Değiştirmek için aşağıya tıkla. Bağlantı <strong>60 dakika</strong> geçerlidir.",
      cta: "Yeni şifre belirle",
      buttonHelp: "Buton çalışmıyor mu? Bu bağlantıyı tarayıcına kopyala:",
      ignore: "Bunu sen istemedin mi? E-postayı yok say – şifren değişmeyecek.",
    },
    email_change: {
      subject: "Yeni e-posta adresini onayla ✉️",
      heading: "E-posta değişikliğini onayla",
      body: "EventBliss hesabının e-posta adresini değiştirmek istiyorsun. Değişikliği onaylamak için aşağıya tıkla:",
      cta: "Değişikliği onayla",
      buttonHelp: "Buton çalışmıyor mu? Bu bağlantıyı tarayıcına kopyala:",
      ignore: "Bunu sen istemedin mi? E-postayı yok say – adresin değişmeyecek.",
      oldLabel: "Eski",
      newLabel: "Yeni",
    },
    reauthentication: {
      subject: "Onay kodun 🔒",
      heading: "Güvenlik onayı",
      body: "Hesabında hassas bir işlem yapmak üzeresin. Onaylamak için bu kodu gir:",
      ignore: "Bu işlemi sen başlatmadın mı? E-postayı yok say ve şifreni kontrol et.",
      codeNotice: "Kod <strong>10 dakika</strong> geçerlidir.",
    },
  },
  ar: {
    signup: {
      subject: "مرحبًا بك في EventBliss – يُرجى تأكيد بريدك الإلكتروني 🎉",
      heading: "أوشكت على الانتهاء!",
      body: "يسعدنا انضمامك إلينا. يُرجى تأكيد عنوان بريدك الإلكتروني لتبدأ الحفلة:",
      cta: "تأكيد البريد الإلكتروني",
      buttonHelp: "الزر لا يعمل؟ انسخ هذا الرابط في متصفحك:",
      ignore: "لم تسجّل في EventBliss؟ تجاهل هذه الرسالة.",
    },
    invite: {
      subject: "لقد تمت دعوتك إلى EventBliss 🎊",
      heading: "أنت مدعو!",
      body: "قام شخص ما بدعوتك إلى EventBliss – تطبيق الحفلات بأكثر من 40 وضع لعب. انقر أدناه لإنشاء حسابك:",
      cta: "قبول الدعوة",
      buttonHelp: "الزر لا يعمل؟ انسخ هذا الرابط في متصفحك:",
      ignore: "لا تعرف EventBliss؟ تجاهل هذه الدعوة.",
    },
    magiclink: {
      subject: "رابط تسجيل الدخول إلى EventBliss 🔐",
      heading: "رابط تسجيل الدخول",
      body: "انقر على الزر لتسجيل الدخول بأمان إلى EventBliss. الرابط صالح لمدة <strong>60 دقيقة</strong>.",
      cta: "تسجيل الدخول الآن",
      buttonHelp: "الزر لا يعمل؟ انسخ هذا الرابط في متصفحك:",
      ignore: "لم تطلب هذا الرابط؟ تجاهل الرسالة – حسابك آمن.",
    },
    recovery: {
      subject: "إعادة تعيين كلمة المرور 🔑",
      heading: "إعادة تعيين كلمة المرور",
      body: "لقد طلبت كلمة مرور جديدة لحسابك في EventBliss. انقر أدناه لتغييرها. الرابط صالح لمدة <strong>60 دقيقة</strong>.",
      cta: "تعيين كلمة مرور جديدة",
      buttonHelp: "الزر لا يعمل؟ انسخ هذا الرابط في متصفحك:",
      ignore: "لم تطلب هذا؟ تجاهل الرسالة – كلمة مرورك لن تتغير.",
    },
    email_change: {
      subject: "أكّد عنوان بريدك الإلكتروني الجديد ✉️",
      heading: "تأكيد تغيير البريد الإلكتروني",
      body: "تريد تغيير عنوان البريد الإلكتروني لحسابك في EventBliss. انقر أدناه لتأكيد التغيير:",
      cta: "تأكيد التغيير",
      buttonHelp: "الزر لا يعمل؟ انسخ هذا الرابط في متصفحك:",
      ignore: "لم تطلب هذا؟ تجاهل الرسالة – عنوانك لن يتغير.",
      oldLabel: "القديم",
      newLabel: "الجديد",
    },
    reauthentication: {
      subject: "رمز التأكيد الخاص بك 🔒",
      heading: "تأكيد الأمان",
      body: "أنت على وشك تنفيذ إجراء حساس في حسابك. أدخل هذا الرمز للتأكيد:",
      ignore: "لم تبدأ هذا الإجراء؟ تجاهل الرسالة وتحقق من كلمة المرور.",
      codeNotice: "الرمز صالح لمدة <strong>10 دقائق</strong>.",
    },
  },
};

export function resolveLang(meta: Record<string, unknown> | undefined | null): Lang {
  const raw = (
    (meta?.["language"] as string | undefined) ??
    (meta?.["locale"] as string | undefined) ??
    (meta?.["lang"] as string | undefined) ??
    ""
  ).toString().toLowerCase().slice(0, 2);
  return (ALLOWED_LANGS as string[]).includes(raw) ? (raw as Lang) : DEFAULT_LANG;
}

export interface RenderVars {
  confirmationUrl: string;
  token?: string;
  email?: string;
  newEmail?: string;
}

export function renderEmail(
  lang: Lang,
  action: EmailAction,
  vars: RenderVars,
): { subject: string; html: string } {
  const s = T[lang][action];
  const dir = lang === "ar" ? "rtl" : "ltr";

  let middle = "";
  if (action === "reauthentication") {
    middle = `
      <div style="text-align:center;margin:0 0 24px;">
        <div style="display:inline-block;background:#faf5ff;border:2px solid #7c3aed;border-radius:12px;padding:20px 40px;font-size:32px;font-weight:800;letter-spacing:8px;color:#7c3aed;font-family:monospace;">
          ${escapeHtml(vars.token ?? "")}
        </div>
      </div>
      <p style="color:#444;line-height:1.6;font-size:14px;margin:0 0 24px;text-align:center;">
        ${s.codeNotice ?? ""}
      </p>`;
  } else {
    const changeInfo =
      action === "email_change" && vars.email && vars.newEmail && s.oldLabel && s.newLabel
        ? `<p style="color:#111;line-height:1.6;font-size:15px;margin:0 0 24px;background:#faf5ff;padding:12px 16px;border-radius:8px;">
             <strong>${s.oldLabel}:</strong> ${escapeHtml(vars.email)}<br>
             <strong>${s.newLabel}:</strong> ${escapeHtml(vars.newEmail)}
           </p>`
        : "";

    middle = `
      ${changeInfo}
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr><td style="border-radius:12px;background:linear-gradient(135deg,#7c3aed 0%,#ec4899 100%);">
          <a href="${vars.confirmationUrl}" style="display:inline-block;padding:16px 40px;color:#fff;text-decoration:none;font-weight:700;font-size:16px;">${s.cta ?? ""}</a>
        </td></tr>
      </table>
      <p style="color:#888;font-size:14px;line-height:1.6;margin:32px 0 0;">
        ${s.buttonHelp ?? ""}<br>
        <span style="color:#7c3aed;word-break:break-all;">${vars.confirmationUrl}</span>
      </p>`;
  }

  const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<body style="margin:0;padding:0;background:#f5f3ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#7c3aed 0%,#ec4899 100%);padding:40px 40px 32px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;">EventBliss 🎉</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="color:#111;margin:0 0 16px;font-size:24px;">${s.heading}</h2>
          <p style="color:#444;line-height:1.6;font-size:16px;margin:0 0 24px;">${s.body}</p>
          ${middle}
          <p style="color:#888;font-size:13px;margin:24px 0 0;">${s.ignore}</p>
        </td></tr>
        <tr><td style="background:#faf5ff;padding:24px 40px;text-align:center;color:#888;font-size:12px;">
          EventBliss · <a href="https://event-bliss.com" style="color:#7c3aed;text-decoration:none;">event-bliss.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject: s.subject, html };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
