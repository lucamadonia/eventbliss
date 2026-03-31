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
  'Animales', 'Paises', 'Ciudades', 'Profesiones', 'Deportes', 'Peliculas',
  'Series', 'Marcas', 'Frutas', 'Verduras', 'Marcas de coches',
  'Colores', 'Instrumentos musicales', 'Bebidas', 'Dulces',
  'Asignaturas', 'Idiomas', 'Flores', 'Arboles', 'Especias',
  'Ropa', 'Muebles', 'Partes del cuerpo', 'Herramientas',
  'Bandas de musica', 'Personajes de comic', 'Superheroes', 'Personajes Disney',
  'Electrodomesticos', 'Deportes de pelota', 'Deportes acuaticos',
  'Deportes de invierno', 'Mamiferos', 'Aves', 'Peces',
  'Insectos', 'Capitales europeas', 'Ciudades latinoamericanas',
  'Ingredientes de pizza', 'Cocteles', 'Tipos de pan', 'Tipos de queso',
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
    terms: ['Perro', 'Gato', 'Caballo', 'Vaca', 'Cerdo', 'Gallina', 'Oveja', 'Cabra', 'Elefante', 'Leon', 'Tigre', 'Oso', 'Mono', 'Delfin', 'Aguila', 'Serpiente', 'Rana', 'Conejo', 'Erizo', 'Ardilla'],
    difficulty: 'easy',
  },
  {
    id: 'cat-laender',
    name: 'Paises',
    terms: ['Espana', 'Mexico', 'Argentina', 'Colombia', 'Peru', 'Chile', 'Francia', 'Italia', 'Alemania', 'Estados Unidos', 'Japon', 'Brasil', 'Australia', 'Canada', 'Egipto', 'Sudafrica', 'Suecia', 'Grecia', 'Portugal', 'Cuba'],
    difficulty: 'easy',
  },
  {
    id: 'cat-staedte',
    name: 'Ciudades',
    terms: ['Madrid', 'Barcelona', 'Ciudad de Mexico', 'Buenos Aires', 'Lima', 'Bogota', 'Paris', 'Londres', 'Roma', 'Nueva York', 'Tokio', 'La Habana', 'Santiago', 'Sevilla', 'Valencia', 'Miami', 'Los Angeles', 'Berlin', 'Amsterdam', 'Lisboa'],
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
    terms: ['Manzana', 'Platano', 'Naranja', 'Fresa', 'Cereza', 'Uva', 'Sandia', 'Pina', 'Mango', 'Kiwi', 'Pera', 'Melocoton', 'Ciruela', 'Frambuesa', 'Arandano', 'Limon', 'Lima', 'Coco', 'Granada', 'Higo'],
    difficulty: 'easy',
  },
  {
    id: 'cat-berufe',
    name: 'Profesiones',
    terms: ['Medico', 'Profesor', 'Policia', 'Bombero', 'Cocinero', 'Piloto', 'Abogado', 'Ingeniero', 'Mecanico', 'Enfermera', 'Arquitecto', 'Electricista', 'Panadero', 'Carnicero', 'Jardinero', 'Periodista', 'Fotografo', 'Juez', 'Farmaceutico', 'Dentista'],
    difficulty: 'easy',
  },
  {
    id: 'cat-filme',
    name: 'Peliculas',
    terms: ['Titanic', 'Avatar', 'Star Wars', 'Harry Potter', 'El Senor de los Anillos', 'Matrix', 'Origen', 'Parque Jurasico', 'Forrest Gump', 'El Padrino', 'Gladiador', 'Buscando a Nemo', 'Frozen', 'Shrek', 'Batman', 'Joker', 'Interestelar', 'Toy Story', 'Piratas del Caribe', 'Pulp Fiction'],
    difficulty: 'easy',
  },
  {
    id: 'cat-serien',
    name: 'Series',
    terms: ['Breaking Bad', 'Juego de Tronos', 'Friends', 'Stranger Things', 'La Casa de Papel', 'Elite', 'Squid Game', 'The Witcher', 'Peaky Blinders', 'Better Call Saul', 'The Crown', 'Narcos', 'Vis a Vis', 'Wednesday', 'The Mandalorian', 'Vikingos', 'Sherlock', 'Black Mirror', 'Lupin', 'Las Chicas del Cable'],
    difficulty: 'medium',
  },
  {
    id: 'cat-sportarten',
    name: 'Deportes',
    terms: ['Futbol', 'Tenis', 'Baloncesto', 'Natacion', 'Atletismo', 'Voleibol', 'Balonmano', 'Hockey sobre hielo', 'Golf', 'Boxeo', 'Esqui', 'Snowboard', 'Surf', 'Escalada', 'Remo', 'Esgrima', 'Judo', 'Gimnasia', 'Equitacion', 'Tenis de mesa'],
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
    terms: ['Pizza', 'Pasta', 'Hamburguesa', 'Sushi', 'Paella', 'Tortilla espanola', 'Tacos', 'Lasana', 'Empanadas', 'Curry', 'Patatas fritas', 'Kebab', 'Filete', 'Sopa', 'Ensalada', 'Churros', 'Croissant', 'Crepes', 'Croquetas', 'Gazpacho'],
    difficulty: 'easy',
  },
  {
    id: 'cat-musikgenres',
    name: 'Generos musicales',
    terms: ['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Clasica', 'Techno', 'Reggae', 'Blues', 'Metal', 'Country', 'R&B', 'Soul', 'Punk', 'Reggaeton', 'Flamenco', 'Latin', 'Indie', 'EDM', 'Funk', 'Bachata'],
    difficulty: 'medium',
  },
  {
    id: 'cat-videospiele',
    name: 'Videojuegos',
    terms: ['Minecraft', 'Fortnite', 'Mario', 'Zelda', 'FIFA', 'GTA', 'Call of Duty', 'Pokemon', 'Tetris', 'Pac-Man', 'Los Sims', 'Overwatch', 'League of Legends', 'Animal Crossing', 'Sonic', 'Roblox', 'Among Us', 'Elden Ring', 'God of War', 'Resident Evil'],
    difficulty: 'easy',
  },
  {
    id: 'cat-farben',
    name: 'Colores',
    terms: ['Rojo', 'Azul', 'Verde', 'Amarillo', 'Naranja', 'Morado', 'Rosa', 'Blanco', 'Negro', 'Marron', 'Gris', 'Turquesa', 'Dorado', 'Plateado', 'Beige', 'Burdeos', 'Menta', 'Coral', 'Indigo', 'Caqui'],
    difficulty: 'easy',
  },
  {
    id: 'cat-instrumente',
    name: 'Instrumentos',
    terms: ['Guitarra', 'Piano', 'Bateria', 'Violin', 'Flauta', 'Trompeta', 'Saxofon', 'Arpa', 'Violonchelo', 'Clarinete', 'Oboe', 'Trombon', 'Acordeon', 'Ukelele', 'Tuba', 'Contrabajo', 'Gaita', 'Armonica', 'Triangulo', 'Xilofono'],
    difficulty: 'easy',
  },
  {
    id: 'cat-kleidung',
    name: 'Ropa',
    terms: ['Camiseta', 'Vaqueros', 'Vestido', 'Traje', 'Jersey', 'Chaqueta', 'Abrigo', 'Zapatos', 'Botas', 'Gorra', 'Bufanda', 'Guantes', 'Falda', 'Blusa', 'Camisa', 'Calcetines', 'Cinturon', 'Corbata', 'Pantalones cortos', 'Banador'],
    difficulty: 'easy',
  },
  {
    id: 'cat-moebel',
    name: 'Muebles',
    terms: ['Mesa', 'Silla', 'Sofa', 'Cama', 'Armario', 'Estanteria', 'Comoda', 'Escritorio', 'Sillon', 'Taburete', 'Vitrina', 'Mesilla de noche', 'Perchero', 'Baul', 'Banco', 'Aparador', 'Hamaca', 'Libreria', 'Mesa de comedor', 'Mesa de centro'],
    difficulty: 'easy',
  },
  {
    id: 'cat-werkzeuge',
    name: 'Herramientas',
    terms: ['Martillo', 'Destornillador', 'Alicates', 'Sierra', 'Taladro', 'Llave inglesa', 'Nivel', 'Cincel', 'Lima', 'Lija', 'Cinta metrica', 'Soldador', 'Hacha', 'Cepillo', 'Gubia', 'Pincel', 'Espatula', 'Paleta', 'Llave Allen', 'Llave de tubo'],
    difficulty: 'medium',
  },
  {
    id: 'cat-blumen',
    name: 'Flores',
    terms: ['Rosa', 'Tulipan', 'Girasol', 'Lirio', 'Orquidea', 'Margarita', 'Clavel', 'Violeta', 'Lavanda', 'Geranio', 'Dalia', 'Amapola', 'Iris', 'Narciso', 'Crisantemo', 'Hibisco', 'Jazmin', 'Magnolia', 'Azafran', 'Primavera'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gewuerze',
    name: 'Especias',
    terms: ['Sal', 'Pimienta', 'Pimenton', 'Canela', 'Curcuma', 'Oregano', 'Albahaca', 'Romero', 'Tomillo', 'Nuez moscada', 'Jengibre', 'Ajo', 'Azafran', 'Chile', 'Vainilla', 'Cilantro', 'Comino', 'Anis', 'Eneldo', 'Perejil'],
    difficulty: 'medium',
  },
  {
    id: 'cat-getraenke',
    name: 'Bebidas',
    terms: ['Agua', 'Cafe', 'Te', 'Cerveza', 'Vino', 'Cola', 'Limonada', 'Zumo de naranja', 'Leche', 'Chocolate caliente', 'Batido', 'Coctel', 'Champan', 'Whisky', 'Vodka', 'Ginebra', 'Sangria', 'Te helado', 'Espresso', 'Horchata'],
    difficulty: 'easy',
  },
  {
    id: 'cat-schulfaecher',
    name: 'Asignaturas',
    terms: ['Matematicas', 'Lengua', 'Ingles', 'Biologia', 'Fisica', 'Quimica', 'Historia', 'Geografia', 'Arte', 'Musica', 'Educacion Fisica', 'Informatica', 'Frances', 'Religion', 'Etica', 'Politica', 'Economia', 'Latin', 'Filosofia', 'Tecnologia'],
    difficulty: 'easy',
  },
  {
    id: 'cat-sprachen',
    name: 'Idiomas',
    terms: ['Espanol', 'Ingles', 'Frances', 'Aleman', 'Italiano', 'Portugues', 'Ruso', 'Chino', 'Japones', 'Arabe', 'Turco', 'Coreano', 'Hindi', 'Polaco', 'Holandes', 'Sueco', 'Griego', 'Checo', 'Hungaro', 'Catalan'],
    difficulty: 'easy',
  },
  {
    id: 'cat-planeten',
    name: 'Objetos celestes',
    terms: ['Mercurio', 'Venus', 'Tierra', 'Marte', 'Jupiter', 'Saturno', 'Urano', 'Neptuno', 'Luna', 'Sol', 'Pluton', 'Cometa', 'Asteroide', 'Via Lactea', 'Agujero negro', 'Nebulosa', 'Enana roja', 'Supernova', 'Meteorito', 'Galaxia'],
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
    terms: ['Caperucita Roja', 'Cenicienta', 'Blancanieves', 'Rapunzel', 'Hansel', 'Gretel', 'La Bella Durmiente', 'Rumpelstiltskin', 'El Gato con Botas', 'Los Tres Cerditos', 'El Principe Rana', 'Ricitos de Oro', 'La Reina de las Nieves', 'Pulgarcito', 'El Lobo Feroz', 'La Madrastra Malvada', 'Pinocho', 'Peter Pan', 'Robin Hood', 'Aladino'],
    difficulty: 'easy',
  },
  {
    id: 'cat-superhelden',
    name: 'Superheroes',
    terms: ['Superman', 'Batman', 'Spider-Man', 'Iron Man', 'Thor', 'Hulk', 'Capitan America', 'Wonder Woman', 'Aquaman', 'Flash', 'Wolverine', 'Black Panther', 'Deadpool', 'Doctor Strange', 'Ant-Man', 'Linterna Verde', 'Ojo de Halcon', 'Viuda Negra', 'Vision', 'Bruja Escarlata'],
    difficulty: 'easy',
  },
  {
    id: 'cat-emojis',
    name: 'Describir emojis',
    terms: ['Cara riendo', 'Corazon', 'Pulgar arriba', 'Fuego', 'Llorar de risa', 'Beso', 'Guino', 'Pensativo', 'Cara triste', 'Enfadado', 'Fiesta', 'Fantasma', 'Payaso', 'Robot', 'Mono', 'Unicornio', 'Arcoiris', 'Cohete', 'Corona', 'Diamante'],
    difficulty: 'medium',
  },
  {
    id: 'cat-brettspiele',
    name: 'Juegos de mesa',
    terms: ['Ajedrez', 'Monopoly', 'Risk', 'Scrabble', 'Cluedo', 'Parchis', 'Catatan', 'Damas', 'Backgammon', 'Trivial Pursuit', 'Uno', 'Tres en raya', 'Molino', 'Pictionary', 'Tabu', 'Jenga', 'Stratego', 'Conecta 4', 'Memory', 'Domino'],
    difficulty: 'easy',
  },
  {
    id: 'cat-fussballvereine',
    name: 'Clubes de futbol',
    terms: ['Real Madrid', 'FC Barcelona', 'Atletico de Madrid', 'Sevilla FC', 'Valencia CF', 'Athletic Bilbao', 'Real Sociedad', 'Manchester United', 'Liverpool', 'Bayern Munich', 'Paris Saint-Germain', 'Juventus', 'AC Milan', 'Inter de Milan', 'Chelsea', 'Arsenal', 'Boca Juniors', 'River Plate', 'America', 'Borussia Dortmund'],
    difficulty: 'medium',
  },
  {
    id: 'cat-desserts',
    name: 'Postres',
    terms: ['Tarta de chocolate', 'Tiramisu', 'Creme brulee', 'Helado', 'Panna Cotta', 'Tarta de manzana', 'Brownie', 'Tarta de queso', 'Mousse de chocolate', 'Gofres', 'Tortitas', 'Flan', 'Magdalena', 'Macaron', 'Donut', 'Baklava', 'Churros con chocolate', 'Natillas', 'Arroz con leche', 'Creme Caramel'],
    difficulty: 'easy',
  },
  {
    id: 'cat-wetter',
    name: 'Fenomenos meteorologicos',
    terms: ['Lluvia', 'Nieve', 'Tormenta', 'Granizo', 'Niebla', 'Viento', 'Temporal', 'Tornado', 'Huracan', 'Sol', 'Arcoiris', 'Escarcha', 'Rocio', 'Relampago', 'Trueno', 'Nubes', 'Calor', 'Frio', 'Carambano', 'Copo de nieve'],
    difficulty: 'easy',
  },
  {
    id: 'cat-transportmittel',
    name: 'Medios de transporte',
    terms: ['Coche', 'Bicicleta', 'Autobus', 'Tren', 'Avion', 'Barco', 'Moto', 'Tranvia', 'Metro', 'Taxi', 'Helicoptero', 'Patinete', 'Lancha', 'Velero', 'Canoa', 'Globo aerostatico', 'Monociclo', 'Monopatin', 'Carroza', 'Gondola'],
    difficulty: 'easy',
  },
  {
    id: 'cat-hauptstaedte',
    name: 'Capitales',
    terms: ['Madrid', 'Paris', 'Londres', 'Berlin', 'Roma', 'Viena', 'Berna', 'Washington', 'Tokio', 'Pekin', 'Moscu', 'Canberra', 'Ottawa', 'Brasilia', 'Buenos Aires', 'El Cairo', 'Atenas', 'Varsovia', 'Praga', 'Budapest'],
    difficulty: 'medium',
  },
  {
    id: 'cat-feiertage',
    name: 'Fiestas y celebraciones',
    terms: ['Navidad', 'Semana Santa', 'Nochevieja', 'Carnaval', 'San Valentin', 'Halloween', 'Dia de la Madre', 'Dia del Padre', 'Dia de Accion de Gracias', 'Dia de los Muertos', 'Reyes Magos', 'Feria de Abril', 'San Fermin', 'La Tomatina', 'Fallas', 'Dia de la Hispanidad', 'Corpus Christi', 'Todos los Santos', 'San Juan', 'Las Posadas'],
    difficulty: 'easy',
  },
  {
    id: 'cat-beruehmt',
    name: 'Personas famosas',
    terms: ['Albert Einstein', 'Wolfgang Amadeus Mozart', 'Leonardo da Vinci', 'Cleopatra', 'Napoleon', 'Martin Luther King', 'Marie Curie', 'Mahatma Gandhi', 'Nelson Mandela', 'Frida Kahlo', 'Charles Darwin', 'Nikola Tesla', 'Simon Bolivar', 'Pablo Picasso', 'Beethoven', 'Cervantes', 'Gabriel Garcia Marquez', 'Lionel Messi', 'Shakira', 'Salvador Dali'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gemuese',
    name: 'Verduras',
    terms: ['Tomate', 'Pepino', 'Zanahoria', 'Brocoli', 'Coliflor', 'Pimiento', 'Cebolla', 'Ajo', 'Espinaca', 'Calabacin', 'Berenjena', 'Guisantes', 'Judias', 'Maiz', 'Apio', 'Rabano', 'Colinabo', 'Calabaza', 'Esparrago', 'Coles de Bruselas'],
    difficulty: 'easy',
  },
  {
    id: 'cat-insekten',
    name: 'Insectos y bichos',
    terms: ['Hormiga', 'Abeja', 'Mariposa', 'Mariquita', 'Arana', 'Mosquito', 'Mosca', 'Avispa', 'Saltamontes', 'Libelula', 'Escarabajo', 'Oruga', 'Grillo', 'Abejorro', 'Caracol', 'Lombriz', 'Cucaracha', 'Tijereta', 'Garrapata', 'Pulga'],
    difficulty: 'medium',
  },
  {
    id: 'cat-bauwerke',
    name: 'Edificios famosos',
    terms: ['Torre Eiffel', 'Coliseo', 'Gran Muralla China', 'Taj Mahal', 'Estatua de la Libertad', 'Big Ben', 'Puerta de Brandeburgo', 'Piramides de Giza', 'Acropolis', 'Basilica de San Pedro', 'Burj Khalifa', 'Opera de Sidney', 'Sagrada Familia', 'Tower Bridge', 'Castillo de Neuschwanstein', 'Stonehenge', 'Machu Picchu', 'Cristo Redentor', 'Golden Gate', 'Alhambra'],
    difficulty: 'medium',
  },
  {
    id: 'cat-tanzstile',
    name: 'Estilos de baile',
    terms: ['Vals', 'Tango', 'Salsa', 'Ballet', 'Hip-Hop', 'Breakdance', 'Flamenco', 'Samba', 'Cha-Cha-Cha', 'Foxtrot', 'Quickstep', 'Rumba', 'Jive', 'Charleston', 'Polka', 'Sevillanas', 'Jazz Dance', 'Contemporaneo', 'Disco', 'Bachata'],
    difficulty: 'medium',
  },
  {
    id: 'cat-kaesesorten',
    name: 'Tipos de queso',
    terms: ['Manchego', 'Mozzarella', 'Parmesano', 'Brie', 'Camembert', 'Gouda', 'Feta', 'Gorgonzola', 'Roquefort', 'Gruyere', 'Emmental', 'Mascarpone', 'Cheddar', 'Queso de cabra', 'Tetilla', 'Mahon', 'Cabrales', 'Idiazabal', 'Torta del Casar', 'Pecorino'],
    difficulty: 'hard',
  },
];

export const CATEGORIES_ES = CATEGORY_NAMES;
