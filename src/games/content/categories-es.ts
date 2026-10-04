export interface CategoryPrompt {
  category: string;
  letter?: string;
}

export interface GameCategory {
  id: string;
  name: string;
  terms: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

const CATEGORY_NAMES = [
  'Animales', 'Países', 'Ciudades', 'Profesiones', 'Deportes', 'Películas',
  'Series', 'Marcas', 'Frutas', 'Verduras', 'Marcas de coches',
  'Colores', 'Instrumentos musicales', 'Bebidas', 'Dulces',
  'Asignaturas', 'Idiomas', 'Flores', 'Árboles', 'Especias',
  'Ropa', 'Muebles', 'Partes del cuerpo', 'Herramientas',
  'Bandas de música', 'Personajes de cómic', 'Superhéroes', 'Personajes Disney',
  'Electrodomésticos', 'Deportes de pelota', 'Deportes acuáticos',
  'Deportes de invierno', 'Mamíferos', 'Aves', 'Peces',
  'Insectos', 'Capitales europeas', 'Ciudades latinoamericanas',
  'Ingredientes de pizza', 'Cócteles', 'Tipos de pan', 'Tipos de queso',
  'Estilos de baile', 'Juegos de cartas', 'Juegos de mesa', 'Videojuegos',
  'Hierbas', 'Frutos secos', 'Minerales', 'Tipos de tela',
];

const LETTERS = 'ABCDEFGHILMNOPRSTUVZ'.split('');

export function generateCategoryPrompt(): CategoryPrompt {
  const category = CATEGORY_NAMES[Math.floor(Math.random() * CATEGORY_NAMES.length)];
  const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  return { category, letter };
}

export const GAME_CATEGORIES_ES: GameCategory[] = [
  {
    id: 'cat-tiere',
    name: 'Animales',
    terms: ['Perro', 'Gato', 'Caballo', 'Vaca', 'Cerdo', 'Gallina', 'Oveja', 'Cabra', 'Elefante', 'León', 'Tigre', 'Oso', 'Mono', 'Delfín', 'Águila', 'Serpiente', 'Rana', 'Conejo', 'Erizo', 'Ardilla'],
    difficulty: 'easy',
  },
  {
    id: 'cat-laender',
    name: 'Países',
    terms: ['España', 'México', 'Argentina', 'Colombia', 'Perú', 'Chile', 'Francia', 'Italia', 'Alemania', 'Estados Unidos', 'Japón', 'Brasil', 'Australia', 'Canadá', 'Egipto', 'Sudáfrica', 'Suecia', 'Grecia', 'Portugal', 'Cuba'],
    difficulty: 'easy',
  },
  {
    id: 'cat-staedte',
    name: 'Ciudades',
    terms: ['Madrid', 'Barcelona', 'Ciudad de México', 'Buenos Aires', 'Lima', 'Bogotá', 'París', 'Londres', 'Roma', 'Nueva York', 'Tokio', 'La Habana', 'Santiago', 'Sevilla', 'Valencia', 'Miami', 'Los Ángeles', 'Berlín', 'Ámsterdam', 'Lisboa'],
    difficulty: 'easy',
  },
  {
    id: 'cat-automarken',
    name: 'Marcas de coches',
    terms: ['SEAT', 'BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Porsche', 'Ferrari', 'Lamborghini', 'Toyota', 'Honda', 'Ford', 'Tesla', 'Volvo', 'Fiat', 'Renault', 'Peugeot', 'Hyundai', 'Mazda', 'Jaguar', 'Opel'],
    difficulty: 'easy',
  },
  {
    id: 'cat-obstsorten',
    name: 'Frutas',
    terms: ['Manzana', 'Plátano', 'Naranja', 'Fresa', 'Cereza', 'Uva', 'Sandía', 'Piña', 'Mango', 'Kiwi', 'Pera', 'Melocotón', 'Ciruela', 'Frambuesa', 'Arándano', 'Limón', 'Lima', 'Coco', 'Granada', 'Higo'],
    difficulty: 'easy',
  },
  {
    id: 'cat-berufe',
    name: 'Profesiones',
    terms: ['Médico', 'Profesor', 'Policía', 'Bombero', 'Cocinero', 'Piloto', 'Abogado', 'Ingeniero', 'Mecánico', 'Enfermera', 'Arquitecto', 'Electricista', 'Panadero', 'Carnicero', 'Jardinero', 'Periodista', 'Fotógrafo', 'Juez', 'Farmacéutico', 'Dentista'],
    difficulty: 'easy',
  },
  {
    id: 'cat-filme',
    name: 'Películas',
    terms: ['Titanic', 'Avatar', 'Star Wars', 'Harry Potter', 'El Señor de los Anillos', 'Matrix', 'Origen', 'Parque Jurásico', 'Forrest Gump', 'El Padrino', 'Gladiador', 'Buscando a Nemo', 'Frozen', 'Shrek', 'Batman', 'Joker', 'Interestelar', 'Toy Story', 'Piratas del Caribe', 'Pulp Fiction'],
    difficulty: 'easy',
  },
  {
    id: 'cat-serien',
    name: 'Series',
    terms: ['Breaking Bad', 'Juego de Tronos', 'Friends', 'Stranger Things', 'La Casa de Papel', 'Élite', 'Squid Game', 'The Witcher', 'Peaky Blinders', 'Better Call Saul', 'The Crown', 'Narcos', 'Vis a Vis', 'Wednesday', 'The Mandalorian', 'Vikingos', 'Sherlock', 'Black Mirror', 'Lupin', 'Las Chicas del Cable'],
    difficulty: 'medium',
  },
  {
    id: 'cat-sportarten',
    name: 'Deportes',
    terms: ['Fútbol', 'Tenis', 'Baloncesto', 'Natación', 'Atletismo', 'Voleibol', 'Balonmano', 'Hockey sobre hielo', 'Golf', 'Boxeo', 'Esquí', 'Snowboard', 'Surf', 'Escalada', 'Remo', 'Esgrima', 'Judo', 'Gimnasia', 'Equitación', 'Tenis de mesa'],
    difficulty: 'easy',
  },
  {
    id: 'cat-marken',
    name: 'Marcas',
    terms: ['Apple', 'Nike', 'Adidas', 'Coca-Cola', 'Google', 'Amazon', 'Samsung', 'IKEA', 'Lego', 'Netflix', 'Spotify', 'McDonalds', 'Starbucks', 'Zara', 'H&M', 'Gucci', 'Prada', 'Disney', 'Red Bull', 'Rolex'],
    difficulty: 'easy',
  },
  {
    id: 'cat-essen',
    name: 'Comida',
    terms: ['Pizza', 'Pasta', 'Hamburguesa', 'Sushi', 'Paella', 'Tortilla española', 'Tacos', 'Lasaña', 'Empanadas', 'Curry', 'Patatas fritas', 'Kebab', 'Filete', 'Sopa', 'Ensalada', 'Churros', 'Croissant', 'Crepes', 'Croquetas', 'Gazpacho'],
    difficulty: 'easy',
  },
  {
    id: 'cat-musikgenres',
    name: 'Géneros musicales',
    terms: ['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Clásica', 'Techno', 'Reggae', 'Blues', 'Metal', 'Country', 'R&B', 'Soul', 'Punk', 'Reggaetón', 'Flamenco', 'Latin', 'Indie', 'EDM', 'Funk', 'Bachata'],
    difficulty: 'medium',
  },
  {
    id: 'cat-videospiele',
    name: 'Videojuegos',
    terms: ['Minecraft', 'Fortnite', 'Mario', 'Zelda', 'FIFA', 'GTA', 'Call of Duty', 'Pokémon', 'Tetris', 'Pac-Man', 'Los Sims', 'Overwatch', 'League of Legends', 'Animal Crossing', 'Sonic', 'Roblox', 'Among Us', 'Elden Ring', 'God of War', 'Resident Evil'],
    difficulty: 'easy',
  },
  {
    id: 'cat-farben',
    name: 'Colores',
    terms: ['Rojo', 'Azul', 'Verde', 'Amarillo', 'Naranja', 'Morado', 'Rosa', 'Blanco', 'Negro', 'Marrón', 'Gris', 'Turquesa', 'Dorado', 'Plateado', 'Beige', 'Burdeos', 'Menta', 'Coral', 'Índigo', 'Caqui'],
    difficulty: 'easy',
  },
  {
    id: 'cat-instrumente',
    name: 'Instrumentos',
    terms: ['Guitarra', 'Piano', 'Batería', 'Violín', 'Flauta', 'Trompeta', 'Saxofón', 'Arpa', 'Violonchelo', 'Clarinete', 'Oboe', 'Trombón', 'Acordeón', 'Ukelele', 'Tuba', 'Contrabajo', 'Gaita', 'Armónica', 'Triángulo', 'Xilófono'],
    difficulty: 'easy',
  },
  {
    id: 'cat-kleidung',
    name: 'Ropa',
    terms: ['Camiseta', 'Vaqueros', 'Vestido', 'Traje', 'Jersey', 'Chaqueta', 'Abrigo', 'Zapatos', 'Botas', 'Gorra', 'Bufanda', 'Guantes', 'Falda', 'Blusa', 'Camisa', 'Calcetines', 'Cinturón', 'Corbata', 'Pantalones cortos', 'Bañador'],
    difficulty: 'easy',
  },
  {
    id: 'cat-moebel',
    name: 'Muebles',
    terms: ['Mesa', 'Silla', 'Sofá', 'Cama', 'Armario', 'Estantería', 'Cómoda', 'Escritorio', 'Sillón', 'Taburete', 'Vitrina', 'Mesilla de noche', 'Perchero', 'Baúl', 'Banco', 'Aparador', 'Hamaca', 'Librería', 'Mesa de comedor', 'Mesa de centro'],
    difficulty: 'easy',
  },
  {
    id: 'cat-werkzeuge',
    name: 'Herramientas',
    terms: ['Martillo', 'Destornillador', 'Alicates', 'Sierra', 'Taladro', 'Llave inglesa', 'Nivel', 'Cincel', 'Lima', 'Lija', 'Cinta métrica', 'Soldador', 'Hacha', 'Cepillo', 'Gubia', 'Pincel', 'Espátula', 'Paleta', 'Llave Allen', 'Llave de tubo'],
    difficulty: 'medium',
  },
  {
    id: 'cat-blumen',
    name: 'Flores',
    terms: ['Rosa', 'Tulipán', 'Girasol', 'Lirio', 'Orquídea', 'Margarita', 'Clavel', 'Violeta', 'Lavanda', 'Geranio', 'Dalia', 'Amapola', 'Iris', 'Narciso', 'Crisantemo', 'Hibisco', 'Jazmín', 'Magnolia', 'Azafrán', 'Primavera'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gewuerze',
    name: 'Especias',
    terms: ['Sal', 'Pimienta', 'Pimentón', 'Canela', 'Cúrcuma', 'Orégano', 'Albahaca', 'Romero', 'Tomillo', 'Nuez moscada', 'Jengibre', 'Ajo', 'Azafrán', 'Chile', 'Vainilla', 'Cilantro', 'Comino', 'Anís', 'Eneldo', 'Perejil'],
    difficulty: 'medium',
  },
  {
    id: 'cat-getraenke',
    name: 'Bebidas',
    terms: ['Agua', 'Café', 'Té', 'Cerveza', 'Vino', 'Cola', 'Limonada', 'Zumo de naranja', 'Leche', 'Chocolate caliente', 'Batido', 'Cóctel', 'Champán', 'Whisky', 'Vodka', 'Ginebra', 'Sangría', 'Té helado', 'Espresso', 'Horchata'],
    difficulty: 'easy',
  },
  {
    id: 'cat-schulfaecher',
    name: 'Asignaturas',
    terms: ['Matemáticas', 'Lengua', 'Inglés', 'Biología', 'Física', 'Química', 'Historia', 'Geografía', 'Arte', 'Música', 'Educación Física', 'Informática', 'Francés', 'Religión', 'Ética', 'Política', 'Economía', 'Latín', 'Filosofía', 'Tecnología'],
    difficulty: 'easy',
  },
  {
    id: 'cat-sprachen',
    name: 'Idiomas',
    terms: ['Español', 'Inglés', 'Francés', 'Alemán', 'Italiano', 'Portugués', 'Ruso', 'Chino', 'Japonés', 'Árabe', 'Turco', 'Coreano', 'Hindi', 'Polaco', 'Holandés', 'Sueco', 'Griego', 'Checo', 'Húngaro', 'Catalán'],
    difficulty: 'easy',
  },
  {
    id: 'cat-planeten',
    name: 'Objetos celestes',
    terms: ['Mercurio', 'Venus', 'Tierra', 'Marte', 'Júpiter', 'Saturno', 'Urano', 'Neptuno', 'Luna', 'Sol', 'Plutón', 'Cometa', 'Asteroide', 'Vía Láctea', 'Agujero negro', 'Nebulosa', 'Enana roja', 'Supernova', 'Meteorito', 'Galaxia'],
    difficulty: 'medium',
  },
  {
    id: 'cat-koerperteile',
    name: 'Partes del cuerpo',
    terms: ['Cabeza', 'Mano', 'Pie', 'Ojo', 'Nariz', 'Boca', 'Oreja', 'Brazo', 'Pierna', 'Dedo', 'Dedo del pie', 'Rodilla', 'Codo', 'Hombro', 'Espalda', 'Barriga', 'Cuello', 'Frente', 'Labio', 'Lengua'],
    difficulty: 'easy',
  },
  {
    id: 'cat-maerchenfiguren',
    name: 'Personajes de cuentos',
    terms: ['Caperucita Roja', 'Cenicienta', 'Blancanieves', 'Rapunzel', 'Hansel', 'Gretel', 'La Bella Durmiente', 'Rumpelstiltskin', 'El Gato con Botas', 'Los Tres Cerditos', 'El Príncipe Rana', 'Ricitos de Oro', 'La Reina de las Nieves', 'Pulgarcito', 'El Lobo Feroz', 'La Madrastra Malvada', 'Pinocho', 'Peter Pan', 'Robin Hood', 'Aladino'],
    difficulty: 'easy',
  },
  {
    id: 'cat-superhelden',
    name: 'Superhéroes',
    terms: ['Superman', 'Batman', 'Spider-Man', 'Iron Man', 'Thor', 'Hulk', 'Capitán América', 'Wonder Woman', 'Aquaman', 'Flash', 'Wolverine', 'Black Panther', 'Deadpool', 'Doctor Strange', 'Ant-Man', 'Linterna Verde', 'Ojo de Halcón', 'Viuda Negra', 'Visión', 'Bruja Escarlata'],
    difficulty: 'easy',
  },
  {
    id: 'cat-emojis',
    name: 'Describir emojis',
    terms: ['Cara riendo', 'Corazón', 'Pulgar arriba', 'Fuego', 'Llorar de risa', 'Beso', 'Guiño', 'Pensativo', 'Cara triste', 'Enfadado', 'Fiesta', 'Fantasma', 'Payaso', 'Robot', 'Mono', 'Unicornio', 'Arcoíris', 'Cohete', 'Corona', 'Diamante'],
    difficulty: 'medium',
  },
  {
    id: 'cat-brettspiele',
    name: 'Juegos de mesa',
    terms: ['Ajedrez', 'Monopoly', 'Risk', 'Scrabble', 'Cluedo', 'Parchís', 'Catatan', 'Damas', 'Backgammon', 'Trivial Pursuit', 'Uno', 'Tres en raya', 'Molino', 'Pictionary', 'Tabú', 'Jenga', 'Stratego', 'Conecta 4', 'Memory', 'Dominó'],
    difficulty: 'easy',
  },
  {
    id: 'cat-fussballvereine',
    name: 'Clubes de fútbol',
    terms: ['Real Madrid', 'FC Barcelona', 'Atlético de Madrid', 'Sevilla FC', 'Valencia CF', 'Athletic Bilbao', 'Real Sociedad', 'Manchester United', 'Liverpool', 'Bayern Múnich', 'Paris Saint-Germain', 'Juventus', 'AC Milán', 'Inter de Milán', 'Chelsea', 'Arsenal', 'Boca Juniors', 'River Plate', 'América', 'Borussia Dortmund'],
    difficulty: 'medium',
  },
  {
    id: 'cat-desserts',
    name: 'Postres',
    terms: ['Tarta de chocolate', 'Tiramisú', 'Crème brûlée', 'Helado', 'Panna Cotta', 'Tarta de manzana', 'Brownie', 'Tarta de queso', 'Mousse de chocolate', 'Gofres', 'Tortitas', 'Flan', 'Magdalena', 'Macaron', 'Donut', 'Baklava', 'Churros con chocolate', 'Natillas', 'Arroz con leche', 'Crème Caramel'],
    difficulty: 'easy',
  },
  {
    id: 'cat-wetter',
    name: 'Fenómenos meteorológicos',
    terms: ['Lluvia', 'Nieve', 'Tormenta', 'Granizo', 'Niebla', 'Viento', 'Temporal', 'Tornado', 'Huracán', 'Sol', 'Arcoíris', 'Escarcha', 'Rocío', 'Relámpago', 'Trueno', 'Nubes', 'Calor', 'Frío', 'Carámbano', 'Copo de nieve'],
    difficulty: 'easy',
  },
  {
    id: 'cat-transportmittel',
    name: 'Medios de transporte',
    terms: ['Coche', 'Bicicleta', 'Autobús', 'Tren', 'Avión', 'Barco', 'Moto', 'Tranvía', 'Metro', 'Taxi', 'Helicóptero', 'Patinete', 'Lancha', 'Velero', 'Canoa', 'Globo aerostático', 'Monociclo', 'Monopatín', 'Carroza', 'Góndola'],
    difficulty: 'easy',
  },
  {
    id: 'cat-hauptstaedte',
    name: 'Capitales',
    terms: ['Madrid', 'París', 'Londres', 'Berlín', 'Roma', 'Viena', 'Berna', 'Washington', 'Tokio', 'Pekín', 'Moscú', 'Canberra', 'Ottawa', 'Brasilia', 'Buenos Aires', 'El Cairo', 'Atenas', 'Varsovia', 'Praga', 'Budapest'],
    difficulty: 'medium',
  },
  {
    id: 'cat-feiertage',
    name: 'Fiestas y celebraciones',
    terms: ['Navidad', 'Semana Santa', 'Nochevieja', 'Carnaval', 'San Valentín', 'Halloween', 'Día de la Madre', 'Día del Padre', 'Día de Acción de Gracias', 'Día de los Muertos', 'Reyes Magos', 'Feria de Abril', 'San Fermín', 'La Tomatina', 'Fallas', 'Día de la Hispanidad', 'Corpus Christi', 'Todos los Santos', 'San Juan', 'Las Posadas'],
    difficulty: 'easy',
  },
  {
    id: 'cat-beruehmt',
    name: 'Personas famosas',
    terms: ['Albert Einstein', 'Wolfgang Amadeus Mozart', 'Leonardo da Vinci', 'Cleopatra', 'Napoleón', 'Martin Luther King', 'Marie Curie', 'Mahatma Gandhi', 'Nelson Mandela', 'Frida Kahlo', 'Charles Darwin', 'Nikola Tesla', 'Simón Bolívar', 'Pablo Picasso', 'Beethoven', 'Cervantes', 'Gabriel García Márquez', 'Lionel Messi', 'Shakira', 'Salvador Dalí'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gemuese',
    name: 'Verduras',
    terms: ['Tomate', 'Pepino', 'Zanahoria', 'Brócoli', 'Coliflor', 'Pimiento', 'Cebolla', 'Ajo', 'Espinaca', 'Calabacín', 'Berenjena', 'Guisantes', 'Judías', 'Maíz', 'Apio', 'Rábano', 'Colinabo', 'Calabaza', 'Espárrago', 'Coles de Bruselas'],
    difficulty: 'easy',
  },
  {
    id: 'cat-insekten',
    name: 'Insectos y bichos',
    terms: ['Hormiga', 'Abeja', 'Mariposa', 'Mariquita', 'Araña', 'Mosquito', 'Mosca', 'Avispa', 'Saltamontes', 'Libélula', 'Escarabajo', 'Oruga', 'Grillo', 'Abejorro', 'Caracol', 'Lombriz', 'Cucaracha', 'Tijereta', 'Garrapata', 'Pulga'],
    difficulty: 'medium',
  },
  {
    id: 'cat-bauwerke',
    name: 'Edificios famosos',
    terms: ['Torre Eiffel', 'Coliseo', 'Gran Muralla China', 'Taj Mahal', 'Estatua de la Libertad', 'Big Ben', 'Puerta de Brandeburgo', 'Pirámides de Giza', 'Acrópolis', 'Basílica de San Pedro', 'Burj Khalifa', 'Ópera de Sídney', 'Sagrada Familia', 'Tower Bridge', 'Castillo de Neuschwanstein', 'Stonehenge', 'Machu Picchu', 'Cristo Redentor', 'Golden Gate', 'Alhambra'],
    difficulty: 'medium',
  },
  {
    id: 'cat-tanzstile',
    name: 'Estilos de baile',
    terms: ['Vals', 'Tango', 'Salsa', 'Ballet', 'Hip-Hop', 'Breakdance', 'Flamenco', 'Samba', 'Cha-Cha-Cha', 'Foxtrot', 'Quickstep', 'Rumba', 'Jive', 'Charleston', 'Polka', 'Sevillanas', 'Jazz Dance', 'Contemporáneo', 'Disco', 'Bachata'],
    difficulty: 'medium',
  },
  {
    id: 'cat-kaesesorten',
    name: 'Tipos de queso',
    terms: ['Manchego', 'Mozzarella', 'Parmesano', 'Brie', 'Camembert', 'Gouda', 'Feta', 'Gorgonzola', 'Roquefort', 'Gruyère', 'Emmental', 'Mascarpone', 'Cheddar', 'Queso de cabra', 'Tetilla', 'Mahón', 'Cabrales', 'Idiazabal', 'Torta del Casar', 'Pecorino'],
    difficulty: 'hard',
  },
];

export const CATEGORIES_ES = CATEGORY_NAMES;
