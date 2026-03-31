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
  'Animais', 'Paises', 'Cidades', 'Profissoes', 'Esportes', 'Filmes',
  'Series', 'Marcas', 'Frutas', 'Legumes', 'Marcas de carros',
  'Cores', 'Instrumentos musicais', 'Bebidas', 'Doces',
  'Materias escolares', 'Idiomas', 'Flores', 'Arvores', 'Temperos',
  'Roupas', 'Moveis', 'Partes do corpo', 'Ferramentas',
  'Bandas de musica', 'Personagens de quadrinhos', 'Super-herois', 'Personagens Disney',
  'Eletrodomesticos', 'Esportes com bola', 'Esportes aquaticos',
  'Esportes de inverno', 'Mamiferos', 'Aves', 'Peixes',
  'Insetos', 'Capitais europeias', 'Cidades brasileiras',
  'Coberturas de pizza', 'Coqueteis', 'Tipos de pao', 'Tipos de queijo',
  'Estilos de danca', 'Jogos de cartas', 'Jogos de tabuleiro', 'Videogames',
  'Ervas', 'Nozes', 'Minerais', 'Tipos de tecido',
];

const LETTERS = 'ABCDEFGHILMNOPRSTUVZ'.split('');

export function generateCategoryPrompt(): CategoryPrompt {
  const category = CATEGORY_NAMES[Math.floor(Math.random() * CATEGORY_NAMES.length)];
  const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  return { category, letter };
}

export const GAME_CATEGORIES_PT: GameCategory[] = [
  {
    id: 'cat-tiere',
    name: 'Animais',
    terms: ['Cachorro', 'Gato', 'Cavalo', 'Vaca', 'Porco', 'Galinha', 'Ovelha', 'Cabra', 'Elefante', 'Leao', 'Tigre', 'Urso', 'Macaco', 'Golfinho', 'Aguia', 'Cobra', 'Sapo', 'Coelho', 'Ourico', 'Esquilo'],
    difficulty: 'easy',
  },
  {
    id: 'cat-laender',
    name: 'Paises',
    terms: ['Brasil', 'Portugal', 'Alemanha', 'Franca', 'Italia', 'Espanha', 'Estados Unidos', 'Japao', 'Argentina', 'Australia', 'Canada', 'Mexico', 'India', 'China', 'Russia', 'Egito', 'Africa do Sul', 'Angola', 'Mocambique', 'Cabo Verde'],
    difficulty: 'easy',
  },
  {
    id: 'cat-staedte',
    name: 'Cidades',
    terms: ['Sao Paulo', 'Rio de Janeiro', 'Lisboa', 'Porto', 'Salvador', 'Brasilia', 'Paris', 'Londres', 'Nova York', 'Toquio', 'Berlim', 'Roma', 'Madrid', 'Barcelona', 'Istambul', 'Dubai', 'Sidney', 'Luanda', 'Recife', 'Belo Horizonte'],
    difficulty: 'easy',
  },
  {
    id: 'cat-automarken',
    name: 'Marcas de carros',
    terms: ['BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Porsche', 'Ferrari', 'Lamborghini', 'Toyota', 'Honda', 'Ford', 'Tesla', 'Volvo', 'Fiat', 'Renault', 'Peugeot', 'Chevrolet', 'Hyundai', 'Mazda', 'Jaguar', 'Jeep'],
    difficulty: 'easy',
  },
  {
    id: 'cat-obstsorten',
    name: 'Frutas',
    terms: ['Maca', 'Banana', 'Laranja', 'Morango', 'Cereja', 'Uva', 'Melancia', 'Abacaxi', 'Manga', 'Kiwi', 'Pera', 'Pessego', 'Ameixa', 'Framboesa', 'Mirtilo', 'Limao', 'Coco', 'Roma', 'Figo', 'Acai'],
    difficulty: 'easy',
  },
  {
    id: 'cat-berufe',
    name: 'Profissoes',
    terms: ['Medico', 'Professor', 'Policial', 'Bombeiro', 'Cozinheiro', 'Piloto', 'Advogado', 'Engenheiro', 'Mecanico', 'Enfermeira', 'Arquiteto', 'Eletricista', 'Padeiro', 'Acougueiro', 'Jardineiro', 'Jornalista', 'Fotografo', 'Juiz', 'Farmaceutico', 'Dentista'],
    difficulty: 'easy',
  },
  {
    id: 'cat-filme',
    name: 'Filmes',
    terms: ['Titanic', 'Avatar', 'Guerra nas Estrelas', 'Harry Potter', 'O Senhor dos Aneis', 'Matrix', 'A Origem', 'Parque dos Dinossauros', 'Forrest Gump', 'O Poderoso Chefao', 'Gladiador', 'Procurando Nemo', 'Frozen', 'Shrek', 'Batman', 'Coringa', 'Interestelar', 'Toy Story', 'Piratas do Caribe', 'Pulp Fiction'],
    difficulty: 'easy',
  },
  {
    id: 'cat-serien',
    name: 'Series',
    terms: ['Breaking Bad', 'Game of Thrones', 'Friends', 'Stranger Things', 'The Office', 'La Casa de Papel', 'Dark', 'Squid Game', 'The Witcher', 'Peaky Blinders', 'Better Call Saul', 'The Crown', 'Narcos', '3%', 'Wednesday', 'The Mandalorian', 'Vikings', 'Sherlock', 'Black Mirror', 'Lupin'],
    difficulty: 'medium',
  },
  {
    id: 'cat-sportarten',
    name: 'Esportes',
    terms: ['Futebol', 'Tenis', 'Basquete', 'Natacao', 'Atletismo', 'Volei', 'Handebol', 'Hoquei no gelo', 'Golfe', 'Boxe', 'Esqui', 'Snowboard', 'Surfe', 'Escalada', 'Remo', 'Esgrima', 'Judo', 'Ginastica', 'Hipismo', 'Tenis de mesa'],
    difficulty: 'easy',
  },
  {
    id: 'cat-marken',
    name: 'Marcas',
    terms: ['Apple', 'Nike', 'Adidas', 'Coca-Cola', 'Google', 'Amazon', 'Samsung', 'IKEA', 'Lego', 'Netflix', 'Spotify', 'McDonalds', 'Starbucks', 'Zara', 'H&M', 'Gucci', 'Prada', 'Disney', 'Red Bull', 'Havaianas'],
    difficulty: 'easy',
  },
  {
    id: 'cat-essen',
    name: 'Comida',
    terms: ['Pizza', 'Macarrao', 'Hamburguer', 'Sushi', 'Feijoada', 'Coxinha', 'Pao de queijo', 'Lasanha', 'Tacos', 'Curry', 'Batata frita', 'Churrasco', 'Bife', 'Sopa', 'Salada', 'Acai', 'Croissant', 'Crepe', 'Brigadeiro', 'Moqueca'],
    difficulty: 'easy',
  },
  {
    id: 'cat-musikgenres',
    name: 'Generos musicais',
    terms: ['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Classica', 'Techno', 'Reggae', 'Blues', 'Metal', 'Country', 'R&B', 'Soul', 'Punk', 'Samba', 'Bossa Nova', 'Fado', 'Sertanejo', 'Funk', 'MPB', 'Forro'],
    difficulty: 'medium',
  },
  {
    id: 'cat-videospiele',
    name: 'Videogames',
    terms: ['Minecraft', 'Fortnite', 'Mario', 'Zelda', 'FIFA', 'GTA', 'Call of Duty', 'Pokemon', 'Tetris', 'Pac-Man', 'The Sims', 'Overwatch', 'League of Legends', 'Animal Crossing', 'Sonic', 'Roblox', 'Among Us', 'Elden Ring', 'God of War', 'Resident Evil'],
    difficulty: 'easy',
  },
  {
    id: 'cat-farben',
    name: 'Cores',
    terms: ['Vermelho', 'Azul', 'Verde', 'Amarelo', 'Laranja', 'Roxo', 'Rosa', 'Branco', 'Preto', 'Marrom', 'Cinza', 'Turquesa', 'Dourado', 'Prateado', 'Bege', 'Borgonha', 'Menta', 'Coral', 'Indigo', 'Caqui'],
    difficulty: 'easy',
  },
  {
    id: 'cat-instrumente',
    name: 'Instrumentos musicais',
    terms: ['Violao', 'Piano', 'Bateria', 'Violino', 'Flauta', 'Trompete', 'Saxofone', 'Harpa', 'Violoncelo', 'Clarinete', 'Oboe', 'Trombone', 'Acordeao', 'Ukulele', 'Tuba', 'Contrabaixo', 'Gaita de foles', 'Gaita', 'Triangulo', 'Xilofone'],
    difficulty: 'easy',
  },
  {
    id: 'cat-kleidung',
    name: 'Roupas',
    terms: ['Camiseta', 'Jeans', 'Vestido', 'Terno', 'Sueter', 'Jaqueta', 'Casaco', 'Sapatos', 'Botas', 'Bone', 'Cachecol', 'Luvas', 'Saia', 'Blusa', 'Camisa', 'Meias', 'Cinto', 'Gravata', 'Bermuda', 'Maio'],
    difficulty: 'easy',
  },
  {
    id: 'cat-moebel',
    name: 'Moveis',
    terms: ['Mesa', 'Cadeira', 'Sofa', 'Cama', 'Armario', 'Estante', 'Comoda', 'Escrivaninha', 'Poltrona', 'Banqueta', 'Vitrine', 'Criado-mudo', 'Cabideiro', 'Bau', 'Banco', 'Aparador', 'Rede', 'Estante de livros', 'Mesa de jantar', 'Mesa de centro'],
    difficulty: 'easy',
  },
  {
    id: 'cat-werkzeuge',
    name: 'Ferramentas',
    terms: ['Martelo', 'Chave de fenda', 'Alicate', 'Serra', 'Furadeira', 'Chave inglesa', 'Nivel', 'Cinzel', 'Lima', 'Lixa', 'Trena', 'Ferro de solda', 'Machado', 'Plaina', 'Formao', 'Pincel', 'Espatula', 'Colher de pedreiro', 'Chave Allen', 'Alicate de pressao'],
    difficulty: 'medium',
  },
  {
    id: 'cat-blumen',
    name: 'Flores',
    terms: ['Rosa', 'Tulipa', 'Girassol', 'Lirio', 'Orquidea', 'Margarida', 'Cravo', 'Violeta', 'Lavanda', 'Gerânio', 'Dalia', 'Papoula', 'Iris', 'Narciso', 'Crisantemo', 'Hibisco', 'Jasmim', 'Magnolia', 'Acafrao', 'Primula'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gewuerze',
    name: 'Temperos',
    terms: ['Sal', 'Pimenta', 'Colorau', 'Canela', 'Acafrao', 'Oregano', 'Manjericao', 'Alecrim', 'Tomilho', 'Noz-moscada', 'Gengibre', 'Alho', 'Acafrao', 'Pimenta malagueta', 'Baunilha', 'Coentro', 'Cominho', 'Anis', 'Endro', 'Salsinha'],
    difficulty: 'medium',
  },
  {
    id: 'cat-getraenke',
    name: 'Bebidas',
    terms: ['Agua', 'Cafe', 'Cha', 'Cerveja', 'Vinho', 'Refrigerante', 'Limonada', 'Suco de laranja', 'Leite', 'Chocolate quente', 'Vitamina', 'Coquetel', 'Champanhe', 'Whisky', 'Vodka', 'Caipirinha', 'Guarana', 'Cha gelado', 'Espresso', 'Quentao'],
    difficulty: 'easy',
  },
  {
    id: 'cat-schulfaecher',
    name: 'Materias escolares',
    terms: ['Matematica', 'Portugues', 'Ingles', 'Biologia', 'Fisica', 'Quimica', 'Historia', 'Geografia', 'Artes', 'Musica', 'Educacao Fisica', 'Informatica', 'Espanhol', 'Ensino Religioso', 'Filosofia', 'Sociologia', 'Economia', 'Latim', 'Literatura', 'Ciencias'],
    difficulty: 'easy',
  },
  {
    id: 'cat-sprachen',
    name: 'Idiomas',
    terms: ['Portugues', 'Ingles', 'Frances', 'Espanhol', 'Alemao', 'Italiano', 'Russo', 'Chines', 'Japones', 'Arabe', 'Turco', 'Coreano', 'Hindi', 'Polones', 'Holandes', 'Sueco', 'Grego', 'Tcheco', 'Hungaro', 'Finlandes'],
    difficulty: 'easy',
  },
  {
    id: 'cat-planeten',
    name: 'Objetos celestes',
    terms: ['Mercurio', 'Venus', 'Terra', 'Marte', 'Jupiter', 'Saturno', 'Urano', 'Netuno', 'Lua', 'Sol', 'Plutao', 'Cometa', 'Asteroide', 'Via Lactea', 'Buraco negro', 'Nebulosa', 'Ana vermelha', 'Supernova', 'Meteorito', 'Galaxia'],
    difficulty: 'medium',
  },
  {
    id: 'cat-koerperteile',
    name: 'Partes do corpo',
    terms: ['Cabeca', 'Mao', 'Pe', 'Olho', 'Nariz', 'Boca', 'Orelha', 'Braco', 'Perna', 'Dedo', 'Dedo do pe', 'Joelho', 'Cotovelo', 'Ombro', 'Costas', 'Barriga', 'Pescoco', 'Testa', 'Labio', 'Lingua'],
    difficulty: 'easy',
  },
  {
    id: 'cat-maerchenfiguren',
    name: 'Personagens de contos',
    terms: ['Chapeuzinho Vermelho', 'Cinderela', 'Branca de Neve', 'Rapunzel', 'Joao', 'Maria', 'Bela Adormecida', 'Gato de Botas', 'Pequeno Polegar', 'Tres Porquinhos', 'Principe Sapo', 'Cachinhos Dourados', 'Rainha da Neve', 'Lobo Mau', 'Madrasta Ma', 'Pinoquio', 'Peter Pan', 'Robin Hood', 'Aladim', 'Pequena Sereia'],
    difficulty: 'easy',
  },
  {
    id: 'cat-superhelden',
    name: 'Super-herois',
    terms: ['Superman', 'Batman', 'Homem-Aranha', 'Homem de Ferro', 'Thor', 'Hulk', 'Capitao America', 'Mulher-Maravilha', 'Aquaman', 'Flash', 'Wolverine', 'Pantera Negra', 'Deadpool', 'Doutor Estranho', 'Homem-Formiga', 'Lanterna Verde', 'Gaviao Arqueiro', 'Viuva Negra', 'Visao', 'Feiticeira Escarlate'],
    difficulty: 'easy',
  },
  {
    id: 'cat-emojis',
    name: 'Descrever emojis',
    terms: ['Rosto rindo', 'Coracao', 'Polegar para cima', 'Fogo', 'Chorando de rir', 'Beijo', 'Piscadela', 'Pensativo', 'Rosto triste', 'Bravo', 'Festa', 'Fantasma', 'Palhaco', 'Robo', 'Macaco', 'Unicornio', 'Arco-iris', 'Foguete', 'Coroa', 'Diamante'],
    difficulty: 'medium',
  },
  {
    id: 'cat-brettspiele',
    name: 'Jogos de tabuleiro',
    terms: ['Xadrez', 'Monopoly', 'War', 'Scrabble', 'Detetive', 'Ludo', 'Colonizadores de Catan', 'Damas', 'Gamao', 'Trivial Pursuit', 'Uno', 'Halma', 'Trilha', 'Pictionary', 'Tabu', 'Jenga', 'Stratego', 'Lig 4', 'Jogo da Memoria', 'Banco Imobiliario'],
    difficulty: 'easy',
  },
  {
    id: 'cat-fussballvereine',
    name: 'Clubes de futebol',
    terms: ['Flamengo', 'Corinthians', 'Palmeiras', 'Sao Paulo', 'Santos', 'Benfica', 'Porto', 'Sporting', 'Real Madrid', 'FC Barcelona', 'Manchester United', 'Liverpool', 'Bayern de Munique', 'Paris Saint-Germain', 'Juventus', 'AC Milan', 'Inter de Milao', 'Chelsea', 'Arsenal', 'Boca Juniors'],
    difficulty: 'medium',
  },
  {
    id: 'cat-desserts',
    name: 'Sobremesas',
    terms: ['Bolo de chocolate', 'Tiramisu', 'Creme brulee', 'Sorvete', 'Panna Cotta', 'Torta de maca', 'Brownie', 'Cheesecake', 'Mousse de chocolate', 'Waffle', 'Panqueca', 'Pudim', 'Muffin', 'Macaron', 'Rosquinha', 'Baklava', 'Brigadeiro', 'Quindim', 'Bolo de rolo', 'Creme Caramelo'],
    difficulty: 'easy',
  },
  {
    id: 'cat-wetter',
    name: 'Fenomenos meteorologicos',
    terms: ['Chuva', 'Neve', 'Tempestade', 'Granizo', 'Neblina', 'Vento', 'Tempestade', 'Tornado', 'Furacao', 'Sol', 'Arco-iris', 'Geada', 'Orvalho', 'Relampago', 'Trovao', 'Nuvens', 'Calor', 'Frio', 'Estalactite de gelo', 'Floco de neve'],
    difficulty: 'easy',
  },
  {
    id: 'cat-transportmittel',
    name: 'Meios de transporte',
    terms: ['Carro', 'Bicicleta', 'Onibus', 'Trem', 'Aviao', 'Navio', 'Moto', 'Bonde', 'Metro', 'Taxi', 'Helicoptero', 'Patinete', 'Barco', 'Veleiro', 'Canoa', 'Balao de ar quente', 'Monociclo', 'Skate', 'Carruagem', 'Gondola'],
    difficulty: 'easy',
  },
  {
    id: 'cat-hauptstaedte',
    name: 'Capitais',
    terms: ['Brasilia', 'Lisboa', 'Paris', 'Berlim', 'Londres', 'Madri', 'Roma', 'Viena', 'Berna', 'Washington', 'Toquio', 'Pequim', 'Moscou', 'Camberra', 'Ottawa', 'Buenos Aires', 'Cairo', 'Atenas', 'Varsovia', 'Praga'],
    difficulty: 'medium',
  },
  {
    id: 'cat-feiertage',
    name: 'Feriados e celebracoes',
    terms: ['Natal', 'Pascoa', 'Reveillon', 'Carnaval', 'Dia dos Namorados', 'Halloween', 'Dia das Maes', 'Dia dos Pais', 'Dia da Independencia', 'Dia de Finados', 'Dia de Sao Joao', 'Tiradentes', 'Festa Junina', 'Dia do Trabalho', 'Dia das Criancas', 'Corpus Christi', 'Proclamacao da Republica', 'Sexta-Feira Santa', 'Dia da Consciencia Negra', 'Ano Novo'],
    difficulty: 'easy',
  },
  {
    id: 'cat-beruehmt',
    name: 'Pessoas famosas',
    terms: ['Albert Einstein', 'Wolfgang Amadeus Mozart', 'Leonardo da Vinci', 'Cleopatra', 'Napoleao', 'Martin Luther King', 'Marie Curie', 'Mahatma Gandhi', 'Nelson Mandela', 'Frida Kahlo', 'Charles Darwin', 'Nikola Tesla', 'Pedro Alvares Cabral', 'Pablo Picasso', 'Beethoven', 'Santos Dumont', 'Pele', 'Carmen Miranda', 'Machado de Assis', 'Ayrton Senna'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gemuese',
    name: 'Legumes e verduras',
    terms: ['Tomate', 'Pepino', 'Cenoura', 'Brocolis', 'Couve-flor', 'Pimentao', 'Cebola', 'Alho', 'Espinafre', 'Abobrinha', 'Berinjela', 'Ervilha', 'Feijao', 'Milho', 'Aipo', 'Rabanete', 'Couve-rabi', 'Abobora', 'Aspargo', 'Couve de Bruxelas'],
    difficulty: 'easy',
  },
  {
    id: 'cat-insekten',
    name: 'Insetos e bichinhos',
    terms: ['Formiga', 'Abelha', 'Borboleta', 'Joaninha', 'Aranha', 'Mosquito', 'Mosca', 'Vespa', 'Gafanhoto', 'Libelula', 'Besouro', 'Lagarta', 'Grilo', 'Mamangava', 'Caracol', 'Minhoca', 'Barata', 'Tesourinha', 'Carrapato', 'Pulga'],
    difficulty: 'medium',
  },
  {
    id: 'cat-bauwerke',
    name: 'Monumentos famosos',
    terms: ['Torre Eiffel', 'Coliseu', 'Muralha da China', 'Taj Mahal', 'Estatua da Liberdade', 'Big Ben', 'Portao de Brandemburgo', 'Piramides de Gize', 'Acropole', 'Basilica de Sao Pedro', 'Burj Khalifa', 'Opera de Sydney', 'Sagrada Familia', 'Tower Bridge', 'Castelo de Neuschwanstein', 'Stonehenge', 'Machu Picchu', 'Cristo Redentor', 'Ponte Golden Gate', 'Alhambra'],
    difficulty: 'medium',
  },
  {
    id: 'cat-tanzstile',
    name: 'Estilos de danca',
    terms: ['Valsa', 'Tango', 'Salsa', 'Bale', 'Hip-Hop', 'Breakdance', 'Flamenco', 'Samba', 'Cha-Cha-Cha', 'Foxtrote', 'Quickstep', 'Rumba', 'Jive', 'Charleston', 'Polca', 'Forro', 'Jazz', 'Contemporaneo', 'Funk', 'Bachata'],
    difficulty: 'medium',
  },
  {
    id: 'cat-kaesesorten',
    name: 'Tipos de queijo',
    terms: ['Queijo Minas', 'Mozzarella', 'Parmesao', 'Brie', 'Camembert', 'Gouda', 'Feta', 'Gorgonzola', 'Roquefort', 'Gruyere', 'Emmental', 'Mascarpone', 'Cheddar', 'Queijo coalho', 'Requeijao', 'Provolone', 'Queijo de cabra', 'Manchego', 'Pecorino', 'Catupiry'],
    difficulty: 'hard',
  },
];

export const CATEGORIES_PT = CATEGORY_NAMES;
