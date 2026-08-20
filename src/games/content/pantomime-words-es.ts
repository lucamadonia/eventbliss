/**
 * OHNE WORTE — Begriffe auf Spanisch.
 *
 * Das ist eine ANPASSUNG der deutschen Liste, keine Übersetzung. Maßstab bleibt
 * derselbe wie in `pantomime-words-de.ts`: Jeder Begriff muss sich OHNE Ton und
 * OHNE Requisit darstellen lassen — und im spanischsprachigen Raum bekannt
 * sein. Ein sauber übersetztes Wort nützt nichts, wenn es am Tisch niemand
 * kennt.
 *
 * Zwei Kategorien werden deshalb NICHT übersetzt, sondern neu besetzt:
 *
 * - `sprichwoerter`: Wörtlich übersetzte deutsche Redewendungen ergeben im
 *   Spanischen Unsinn. Hier stehen 50 gängige spanische Redewendungen mit einer
 *   darstellbaren Szene („Estar en las nubes", „Tomar el pelo", „Meter la pata").
 * - `filme`: Titel in der ortsüblichen Fassung („El Rey León"); Titel ohne
 *   Bekanntheit im Zielraum (z. B. „Tatort") sind durch dort geläufige Filme
 *   und Serien ersetzt.
 *
 * Die Kategorie-IDs bleiben deutsch — sie sind Schlüssel und müssen über alle
 * Sprachdateien hinweg identisch sein. Übersetzt wird nur `name`.
 */

import type { PantomimeCategory } from './pantomime-words-de';

export const PANTOMIME_CATEGORIES_ES: PantomimeCategory[] = [
  {
    id: 'tiere',
    name: 'Animales',
    emoji: '🐘',
    words: [
      'Elefante', 'Jirafa', 'Pingüino', 'Canguro', 'Serpiente',
      'Águila', 'Rana', 'Cocodrilo', 'Mono', 'León',
      'Abeja', 'Mariposa', 'Araña', 'Cangrejo', 'Tiburón',
      'Ballena', 'Delfín', 'Erizo', 'Búho', 'Cigüeña',
      'Pavo real', 'Perezoso', 'Suricata', 'Camello', 'Rinoceronte',
      'Flamenco', 'Tortuga', 'Murciélago', 'Topo', 'Langosta',
      'Pulpo', 'Caballito de mar', 'Mapache', 'Ardilla', 'Colibrí',
      'Avestruz', 'Gorila', 'Lobo', 'Zorro', 'Conejo',
      'Vaca', 'Cerdo', 'Gallina', 'Caballo', 'Gato',
      'Perro', 'Pato', 'Cabra', 'Oveja', 'Ratón',
    ],
  },
  {
    id: 'berufe',
    name: 'Oficios',
    emoji: '👷',
    words: [
      'Bombero', 'Cocinero', 'Dentista', 'Piloto', 'Peluquero',
      'Policía', 'Profesor', 'Albañil', 'Camarero', 'Jardinero',
      'Fotógrafo', 'Director de orquesta', 'Payaso', 'Astronauta', 'Buzo',
      'Panadero', 'Carnicero', 'Pintor', 'Soldador', 'Cartero',
      'Basurero', 'Conductor de autobús', 'Juez', 'Abogado', 'Cirujano',
      'Enfermero', 'Veterinario', 'Bibliotecario', 'Cajera', 'Barman',
      'DJ', 'Actor', 'Entrenador de fútbol', 'Árbitro', 'Guía de montaña',
      'Apicultor', 'Pastor', 'Pescador', 'Granjero', 'Mecánico',
      'Electricista', 'Fontanero', 'Techador', 'Deshollinador', 'Secretaria',
      'Modelo', 'Doble de acción', 'Mago', 'Torero', 'Conserje',
    ],
  },
  {
    id: 'filme',
    name: 'Películas y series',
    emoji: '🎬',
    words: [
      'Titanic', 'El Padrino', 'Star Wars', 'Parque Jurásico', 'El Rey León',
      'Rocky', 'Terminator', 'Matrix', 'Piratas del Caribe', 'El Señor de los Anillos',
      'Harry Potter', 'E.T.', 'El Laberinto del Fauno', 'Los Cazafantasmas', 'Regreso al Futuro',
      'Forrest Gump', 'Dirty Dancing', 'Pretty Woman', 'Sister Act', 'Misión Imposible',
      'James Bond', 'Indiana Jones', 'El Mago de Oz', 'Mary Poppins', 'Frozen',
      'Buscando a Nemo', 'Shrek', 'Ice Age', 'Toy Story', 'El Libro de la Selva',
      'Aladdín', 'La Bella y la Bestia', 'Bambi', 'Dumbo', 'Kung Fu Panda',
      'Los Simpson', 'Juego de Tronos', 'Breaking Bad', 'Stranger Things', 'Friends',
      'Sherlock', 'Los Vigilantes de la Playa', 'Élite', 'La Casa de Papel', 'Gravity',
      'Marte', 'Avatar', 'El Exorcista', 'Coco', 'Los Otros',
    ],
  },
  {
    id: 'alltag',
    name: 'Vida cotidiana',
    emoji: '🪥',
    words: [
      'Lavarse los dientes', 'Hacer café', 'Tender la ropa', 'Pasar la aspiradora', 'Limpiar las ventanas',
      'Atarse los cordones', 'Abrir el paraguas', 'Lavar el coche', 'Cortar el césped', 'Sacar la basura',
      'Hacer la cama', 'Fregar los platos', 'Planchar', 'Secarse el pelo', 'Cortarse las uñas',
      'Untar el pan', 'Cascar un huevo', 'Escurrir la pasta', 'Pedir una pizza', 'Empujar el carrito de la compra',
      'Hacer cola', 'Perder el autobús', 'Parchear una rueda de bici', 'Cambiar un neumático', 'Montar una estantería',
      'Clavar un clavo', 'Cambiar una bombilla', 'Abrir un paquete', 'Envolver un regalo', 'Echar una carta al buzón',
      'Buscar las llaves', 'Cargar el móvil', 'Hacerse un selfi', 'Hacer zapping', 'Apagar el despertador',
      'Quedarse dormido', 'Hacer la maleta', 'Montar una tienda de campaña', 'Hacer una barbacoa', 'Hacer un muñeco de nieve',
      'Regar las plantas', 'Pasear al perro', 'Cambiar un pañal', 'Usar hilo dental', 'Estornudar',
      'Bostezar', 'Tener hipo', 'Mascar chicle', 'Esperar el ascensor', 'Perderse',
    ],
  },
  {
    id: 'sport',
    name: 'Deporte',
    emoji: '⚽',
    words: [
      'Fútbol', 'Baloncesto', 'Tenis', 'Golf', 'Boxeo',
      'Natación', 'Buceo', 'Esquí', 'Snowboard', 'Patinaje sobre hielo',
      'Gimnasia', 'Salto de altura', 'Salto de longitud', 'Salto con pértiga', 'Lanzamiento de jabalina',
      'Lanzamiento de peso', 'Vallas', 'Maratón', 'Ciclismo', 'Remo',
      'Vela', 'Surf', 'Escalada', 'Alpinismo', 'Equitación',
      'Tiro con arco', 'Esgrima', 'Judo', 'Kárate', 'Lucha libre',
      'Halterofilia', 'Tenis de mesa', 'Bádminton', 'Voleibol', 'Balonmano',
      'Hockey', 'Hockey sobre hielo', 'Rugby', 'Béisbol', 'Críquet',
      'Bolos', 'Dardos', 'Billar', 'Monopatín', 'Patines',
      'Cama elástica', 'Yoga', 'Saltar a la comba', 'Pescar', 'Fórmula 1',
    ],
  },
  {
    id: 'gefuehle',
    name: 'Emociones',
    emoji: '😤',
    words: [
      'Ira', 'Alegría', 'Miedo', 'Tristeza', 'Asco',
      'Sorpresa', 'Aburrimiento', 'Nerviosismo', 'Orgullo', 'Vergüenza',
      'Celos', 'Envidia', 'Enamoramiento', 'Nostalgia', 'Cansancio',
      'Agotamiento', 'Pánico', 'Alivio', 'Decepción', 'Bochorno',
      'Regodeo', 'Añoranza', 'Satisfacción', 'Impaciencia', 'Desconfianza',
      'Curiosidad', 'Entusiasmo', 'Frustración', 'Conmoción', 'Asombro',
      'Gratitud', 'Esperanza', 'Desesperación', 'Calma', 'Emoción',
      'Terquedad', 'Compasión', 'Admiración', 'Confusión', 'Escepticismo',
      'Fastidio', 'Timidez', 'Valentía', 'Cobardía', 'Arrepentimiento',
      'Triunfo', 'Soledad', 'Cobijo', 'Ansias de viajar', 'Ilusión',
    ],
  },
  {
    id: 'sprichwoerter',
    name: 'Refranes',
    emoji: '💬',
    words: [
      'Estar en las nubes', 'Tomar el pelo', 'Ser pan comido', 'Meter la pata', 'Dar en el clavo',
      'Romper el hielo', 'Matar dos pájaros de un tiro', 'Estar como una cabra', 'Hablar por los codos', 'Costar un ojo de la cara',
      'Tirar la toalla', 'Ponerse las pilas', 'Echar leña al fuego', 'No pegar ojo', 'Estar hasta las narices',
      'Buscar tres pies al gato', 'Tener la mosca detrás de la oreja', 'Ser uña y carne', 'Dormir como un tronco', 'Estar de mala leche',
      'Cruzar los dedos', 'Levantarse con el pie izquierdo', 'Tener memoria de pez', 'Poner los ojos en blanco', 'Estar entre la espada y la pared',
      'Pasarse de la raya', 'Quedarse de piedra', 'Ver las estrellas', 'Coger el toro por los cuernos', 'Salir por patas',
      'Ponerse rojo como un tomate', 'Empinar el codo', 'Estar sordo como una tapia', 'Llorar como una magdalena', 'Reírse a carcajadas',
      'Andarse por las ramas', 'Dar la vuelta a la tortilla', 'Hacer la vista gorda', 'Tener la piel de gallina', 'Poner la mano en el fuego',
      'Tener un nudo en la garganta', 'Perder los papeles', 'Dar plantón', 'Estar como pez en el agua', 'Comerse el coco',
      'Subirse por las paredes', 'Tirar la casa por la ventana', 'Arrimar el hombro', 'Meterse en un jardín', 'Ir al grano',
    ],
  },
  {
    id: 'maerchen',
    name: 'Cuentos y personajes',
    emoji: '🧚',
    words: [
      'Caperucita Roja', 'Blancanieves', 'La Cenicienta', 'La Bella Durmiente', 'Rapunzel',
      'Hansel y Gretel', 'El Príncipe Rana', 'Los tres cerditos', 'El Gato con Botas', 'Pulgarcito',
      'Pinocho', 'Peter Pan', 'Alicia en el País de las Maravillas', 'Robin Hood', 'El Rey Arturo',
      'Hércules', 'Zeus', 'Poseidón', 'Medusa', 'Ícaro',
      'Frankenstein', 'Drácula', 'Papá Noel', 'El Conejo de Pascua', 'El Ratoncito Pérez',
      'Un unicornio', 'Un dragón', 'Un enano', 'Un gigante', 'Una bruja',
      'Un brujo', 'Un caballero', 'Un pirata', 'Una sirena', 'Un vampiro',
      'Un hombre lobo', 'Un zombi', 'Un fantasma', 'Un robot', 'Un extraterrestre',
      'Superman', 'Batman', 'Spider-Man', 'Hulk', 'Wonder Woman',
      'Yoda', 'Gollum', 'El Grinch', 'Simbad', 'Alí Babá',
    ],
  },
  {
    id: 'ab18',
    name: '+18',
    emoji: '🔥',
    adult: true,
    words: [
      'Estriptis', 'Beso de tornillo', 'Cita a ciegas', 'Preservativo', 'Lencería',
      'Baile de barra', 'Danza del vientre', 'Baile erótico', 'Esposas', 'Kamasutra',
      'Despedida de soltero', 'Cita de Tinder', 'Piropo', 'Recibir calabazas', 'Ligar',
      'Chupetón', 'Carta de amor', 'Corazón acelerado', 'Seducción', 'Taparse los ojos',
      'Masaje', 'Baño de espuma', 'Pétalos de rosa', 'Luz de velas', 'Noche de bodas',
      'Luna de miel', 'Test de embarazo', 'Discusión de pareja', 'Escena de celos', 'Ruptura',
      'El ex', 'Infidelidad', 'Foto comprometida', 'Confesión', 'Detector de mentiras',
      'Chupito de vodka', 'Resaca', 'Bailar borracho', 'Karaoke a las tres de la mañana', 'Barriga cervecera',
      'Bañarse desnudo', 'Playa nudista', 'Sauna', 'Hacerse un tatuaje', 'Piercing',
      'Enseñar la tableta', 'Sacar músculo', 'Mirarse al espejo', 'Volver a casa a escondidas', 'Pagar a medias',
    ],
  },
];
