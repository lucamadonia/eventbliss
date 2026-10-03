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
  'Animais', 'Países', 'Cidades', 'Profissões', 'Esportes', 'Filmes',
  'Séries', 'Marcas', 'Frutas', 'Legumes', 'Marcas de carros',
  'Cores', 'Instrumentos musicais', 'Bebidas', 'Doces',
  'Matérias escolares', 'Idiomas', 'Flores', 'Árvores', 'Temperos',
  'Roupas', 'Móveis', 'Partes do corpo', 'Ferramentas',
  'Bandas de música', 'Personagens de quadrinhos', 'Super-heróis', 'Personagens Disney',
  'Eletrodomésticos', 'Esportes com bola', 'Esportes aquáticos',
  'Esportes de inverno', 'Mamíferos', 'Aves', 'Peixes',
  'Insetos', 'Capitais europeias', 'Cidades brasileiras',
  'Coberturas de pizza', 'Coquetéis', 'Tipos de pão', 'Tipos de queijo',
  'Estilos de dança', 'Jogos de cartas', 'Jogos de tabuleiro', 'Videogames',
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
    terms: ['Cachorro', 'Gato', 'Cavalo', 'Vaca', 'Porco', 'Galinha', 'Ovelha', 'Cabra', 'Elefante', 'Leão', 'Tigre', 'Urso', 'Macaco', 'Golfinho', 'Águia', 'Cobra', 'Sapo', 'Coelho', 'Ouriço', 'Esquilo'],
    difficulty: 'easy',
  },
  {
    id: 'cat-laender',
    name: 'Países',
    terms: ['Brasil', 'Portugal', 'Alemanha', 'França', 'Itália', 'Espanha', 'Estados Unidos', 'Japão', 'Argentina', 'Austrália', 'Canadá', 'México', 'Índia', 'China', 'Rússia', 'Egito', 'África do Sul', 'Angola', 'Moçambique', 'Cabo Verde'],
    difficulty: 'easy',
  },
  {
    id: 'cat-staedte',
    name: 'Cidades',
    terms: ['São Paulo', 'Rio de Janeiro', 'Lisboa', 'Porto', 'Salvador', 'Brasília', 'Paris', 'Londres', 'Nova York', 'Tóquio', 'Berlim', 'Roma', 'Madrid', 'Barcelona', 'Istambul', 'Dubai', 'Sidney', 'Luanda', 'Recife', 'Belo Horizonte'],
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
    terms: ['Maçã', 'Banana', 'Laranja', 'Morango', 'Cereja', 'Uva', 'Melancia', 'Abacaxi', 'Manga', 'Kiwi', 'Pera', 'Pêssego', 'Ameixa', 'Framboesa', 'Mirtilo', 'Limão', 'Coco', 'Romã', 'Figo', 'Açaí'],
    difficulty: 'easy',
  },
  {
    id: 'cat-berufe',
    name: 'Profissões',
    terms: ['Médico', 'Professor', 'Policial', 'Bombeiro', 'Cozinheiro', 'Piloto', 'Advogado', 'Engenheiro', 'Mecânico', 'Enfermeira', 'Arquiteto', 'Eletricista', 'Padeiro', 'Açougueiro', 'Jardineiro', 'Jornalista', 'Fotógrafo', 'Juiz', 'Farmacêutico', 'Dentista'],
    difficulty: 'easy',
  },
  {
    id: 'cat-filme',
    name: 'Filmes',
    terms: ['Titanic', 'Avatar', 'Guerra nas Estrelas', 'Harry Potter', 'O Senhor dos Anéis', 'Matrix', 'A Origem', 'Parque dos Dinossauros', 'Forrest Gump', 'O Poderoso Chefão', 'Gladiador', 'Procurando Nemo', 'Frozen', 'Shrek', 'Batman', 'Coringa', 'Interestelar', 'Toy Story', 'Piratas do Caribe', 'Pulp Fiction'],
    difficulty: 'easy',
  },
  {
    id: 'cat-serien',
    name: 'Séries',
    terms: ['Breaking Bad', 'Game of Thrones', 'Friends', 'Stranger Things', 'The Office', 'La Casa de Papel', 'Dark', 'Squid Game', 'The Witcher', 'Peaky Blinders', 'Better Call Saul', 'The Crown', 'Narcos', '3%', 'Wednesday', 'The Mandalorian', 'Vikings', 'Sherlock', 'Black Mirror', 'Lupin'],
    difficulty: 'medium',
  },
  {
    id: 'cat-sportarten',
    name: 'Esportes',
    terms: ['Futebol', 'Tênis', 'Basquete', 'Natação', 'Atletismo', 'Vôlei', 'Handebol', 'Hóquei no gelo', 'Golfe', 'Boxe', 'Esqui', 'Snowboard', 'Surfe', 'Escalada', 'Remo', 'Esgrima', 'Judô', 'Ginástica', 'Hipismo', 'Tênis de mesa'],
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
    terms: ['Pizza', 'Macarrão', 'Hambúrguer', 'Sushi', 'Feijoada', 'Coxinha', 'Pão de queijo', 'Lasanha', 'Tacos', 'Curry', 'Batata frita', 'Churrasco', 'Bife', 'Sopa', 'Salada', 'Açaí', 'Croissant', 'Crepe', 'Brigadeiro', 'Moqueca'],
    difficulty: 'easy',
  },
  {
    id: 'cat-musikgenres',
    name: 'Gêneros musicais',
    terms: ['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Clássica', 'Techno', 'Reggae', 'Blues', 'Metal', 'Country', 'R&B', 'Soul', 'Punk', 'Samba', 'Bossa Nova', 'Fado', 'Sertanejo', 'Funk', 'MPB', 'Forró'],
    difficulty: 'medium',
  },
  {
    id: 'cat-videospiele',
    name: 'Videogames',
    terms: ['Minecraft', 'Fortnite', 'Mario', 'Zelda', 'FIFA', 'GTA', 'Call of Duty', 'Pokémon', 'Tetris', 'Pac-Man', 'The Sims', 'Overwatch', 'League of Legends', 'Animal Crossing', 'Sonic', 'Roblox', 'Among Us', 'Elden Ring', 'God of War', 'Resident Evil'],
    difficulty: 'easy',
  },
  {
    id: 'cat-farben',
    name: 'Cores',
    terms: ['Vermelho', 'Azul', 'Verde', 'Amarelo', 'Laranja', 'Roxo', 'Rosa', 'Branco', 'Preto', 'Marrom', 'Cinza', 'Turquesa', 'Dourado', 'Prateado', 'Bege', 'Borgonha', 'Menta', 'Coral', 'Índigo', 'Caqui'],
    difficulty: 'easy',
  },
  {
    id: 'cat-instrumente',
    name: 'Instrumentos musicais',
    terms: ['Violão', 'Piano', 'Bateria', 'Violino', 'Flauta', 'Trompete', 'Saxofone', 'Harpa', 'Violoncelo', 'Clarinete', 'Oboé', 'Trombone', 'Acordeão', 'Ukulele', 'Tuba', 'Contrabaixo', 'Gaita de foles', 'Gaita', 'Triângulo', 'Xilofone'],
    difficulty: 'easy',
  },
  {
    id: 'cat-kleidung',
    name: 'Roupas',
    terms: ['Camiseta', 'Jeans', 'Vestido', 'Terno', 'Suéter', 'Jaqueta', 'Casaco', 'Sapatos', 'Botas', 'Boné', 'Cachecol', 'Luvas', 'Saia', 'Blusa', 'Camisa', 'Meias', 'Cinto', 'Gravata', 'Bermuda', 'Maiô'],
    difficulty: 'easy',
  },
  {
    id: 'cat-moebel',
    name: 'Móveis',
    terms: ['Mesa', 'Cadeira', 'Sofá', 'Cama', 'Armário', 'Estante', 'Cômoda', 'Escrivaninha', 'Poltrona', 'Banqueta', 'Vitrine', 'Criado-mudo', 'Cabideiro', 'Baú', 'Banco', 'Aparador', 'Rede', 'Estante de livros', 'Mesa de jantar', 'Mesa de centro'],
    difficulty: 'easy',
  },
  {
    id: 'cat-werkzeuge',
    name: 'Ferramentas',
    terms: ['Martelo', 'Chave de fenda', 'Alicate', 'Serra', 'Furadeira', 'Chave inglesa', 'Nível', 'Cinzel', 'Lima', 'Lixa', 'Trena', 'Ferro de solda', 'Machado', 'Plaina', 'Formão', 'Pincel', 'Espátula', 'Colher de pedreiro', 'Chave Allen', 'Alicate de pressão'],
    difficulty: 'medium',
  },
  {
    id: 'cat-blumen',
    name: 'Flores',
    terms: ['Rosa', 'Tulipa', 'Girassol', 'Lírio', 'Orquídea', 'Margarida', 'Cravo', 'Violeta', 'Lavanda', 'Gerânio', 'Dália', 'Papoula', 'Íris', 'Narciso', 'Crisântemo', 'Hibisco', 'Jasmim', 'Magnólia', 'Açafrão', 'Prímula'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gewuerze',
    name: 'Temperos',
    terms: ['Sal', 'Pimenta', 'Colorau', 'Canela', 'Açafrão', 'Orégano', 'Manjericão', 'Alecrim', 'Tomilho', 'Noz-moscada', 'Gengibre', 'Alho', 'Açafrão', 'Pimenta malagueta', 'Baunilha', 'Coentro', 'Cominho', 'Anis', 'Endro', 'Salsinha'],
    difficulty: 'medium',
  },
  {
    id: 'cat-getraenke',
    name: 'Bebidas',
    terms: ['Água', 'Café', 'Chá', 'Cerveja', 'Vinho', 'Refrigerante', 'Limonada', 'Suco de laranja', 'Leite', 'Chocolate quente', 'Vitamina', 'Coquetel', 'Champanhe', 'Whisky', 'Vodka', 'Caipirinha', 'Guaraná', 'Chá gelado', 'Espresso', 'Quentão'],
    difficulty: 'easy',
  },
  {
    id: 'cat-schulfaecher',
    name: 'Matérias escolares',
    terms: ['Matemática', 'Português', 'Inglês', 'Biologia', 'Física', 'Química', 'História', 'Geografia', 'Artes', 'Música', 'Educação Física', 'Informática', 'Espanhol', 'Ensino Religioso', 'Filosofia', 'Sociologia', 'Economia', 'Latim', 'Literatura', 'Ciências'],
    difficulty: 'easy',
  },
  {
    id: 'cat-sprachen',
    name: 'Idiomas',
    terms: ['Português', 'Inglês', 'Francês', 'Espanhol', 'Alemão', 'Italiano', 'Russo', 'Chinês', 'Japonês', 'Árabe', 'Turco', 'Coreano', 'Hindi', 'Polonês', 'Holandês', 'Sueco', 'Grego', 'Tcheco', 'Húngaro', 'Finlandês'],
    difficulty: 'easy',
  },
  {
    id: 'cat-planeten',
    name: 'Objetos celestes',
    terms: ['Mercúrio', 'Vênus', 'Terra', 'Marte', 'Júpiter', 'Saturno', 'Urano', 'Netuno', 'Lua', 'Sol', 'Plutão', 'Cometa', 'Asteroide', 'Via Láctea', 'Buraco negro', 'Nebulosa', 'Anã vermelha', 'Supernova', 'Meteorito', 'Galáxia'],
    difficulty: 'medium',
  },
  {
    id: 'cat-koerperteile',
    name: 'Partes do corpo',
    terms: ['Cabeça', 'Mão', 'Pé', 'Olho', 'Nariz', 'Boca', 'Orelha', 'Braço', 'Perna', 'Dedo', 'Dedo do pé', 'Joelho', 'Cotovelo', 'Ombro', 'Costas', 'Barriga', 'Pescoço', 'Testa', 'Lábio', 'Língua'],
    difficulty: 'easy',
  },
  {
    id: 'cat-maerchenfiguren',
    name: 'Personagens de contos',
    terms: ['Chapeuzinho Vermelho', 'Cinderela', 'Branca de Neve', 'Rapunzel', 'João', 'Maria', 'Bela Adormecida', 'Gato de Botas', 'Pequeno Polegar', 'Três Porquinhos', 'Príncipe Sapo', 'Cachinhos Dourados', 'Rainha da Neve', 'Lobo Mau', 'Madrasta Má', 'Pinóquio', 'Peter Pan', 'Robin Hood', 'Aladim', 'Pequena Sereia'],
    difficulty: 'easy',
  },
  {
    id: 'cat-superhelden',
    name: 'Super-heróis',
    terms: ['Superman', 'Batman', 'Homem-Aranha', 'Homem de Ferro', 'Thor', 'Hulk', 'Capitão América', 'Mulher-Maravilha', 'Aquaman', 'Flash', 'Wolverine', 'Pantera Negra', 'Deadpool', 'Doutor Estranho', 'Homem-Formiga', 'Lanterna Verde', 'Gavião Arqueiro', 'Viúva Negra', 'Visão', 'Feiticeira Escarlate'],
    difficulty: 'easy',
  },
  {
    id: 'cat-emojis',
    name: 'Descrever emojis',
    terms: ['Rosto rindo', 'Coração', 'Polegar para cima', 'Fogo', 'Chorando de rir', 'Beijo', 'Piscadela', 'Pensativo', 'Rosto triste', 'Bravo', 'Festa', 'Fantasma', 'Palhaço', 'Robô', 'Macaco', 'Unicórnio', 'Arco-íris', 'Foguete', 'Coroa', 'Diamante'],
    difficulty: 'medium',
  },
  {
    id: 'cat-brettspiele',
    name: 'Jogos de tabuleiro',
    terms: ['Xadrez', 'Monopoly', 'War', 'Scrabble', 'Detetive', 'Ludo', 'Colonizadores de Catan', 'Damas', 'Gamão', 'Trivial Pursuit', 'Uno', 'Halma', 'Trilha', 'Pictionary', 'Tabu', 'Jenga', 'Stratego', 'Lig 4', 'Jogo da Memória', 'Banco Imobiliário'],
    difficulty: 'easy',
  },
  {
    id: 'cat-fussballvereine',
    name: 'Clubes de futebol',
    terms: ['Flamengo', 'Corinthians', 'Palmeiras', 'São Paulo', 'Santos', 'Benfica', 'Porto', 'Sporting', 'Real Madrid', 'FC Barcelona', 'Manchester United', 'Liverpool', 'Bayern de Munique', 'Paris Saint-Germain', 'Juventus', 'AC Milan', 'Inter de Milão', 'Chelsea', 'Arsenal', 'Boca Juniors'],
    difficulty: 'medium',
  },
  {
    id: 'cat-desserts',
    name: 'Sobremesas',
    terms: ['Bolo de chocolate', 'Tiramisu', 'Crème brûlée', 'Sorvete', 'Panna Cotta', 'Torta de maçã', 'Brownie', 'Cheesecake', 'Mousse de chocolate', 'Waffle', 'Panqueca', 'Pudim', 'Muffin', 'Macaron', 'Rosquinha', 'Baklava', 'Brigadeiro', 'Quindim', 'Bolo de rolo', 'Crème Caramelo'],
    difficulty: 'easy',
  },
  {
    id: 'cat-wetter',
    name: 'Fenômenos meteorológicos',
    terms: ['Chuva', 'Neve', 'Tempestade', 'Granizo', 'Neblina', 'Vento', 'Tempestade', 'Tornado', 'Furacão', 'Sol', 'Arco-íris', 'Geada', 'Orvalho', 'Relâmpago', 'Trovão', 'Nuvens', 'Calor', 'Frio', 'Estalactite de gelo', 'Floco de neve'],
    difficulty: 'easy',
  },
  {
    id: 'cat-transportmittel',
    name: 'Meios de transporte',
    terms: ['Carro', 'Bicicleta', 'Ônibus', 'Trem', 'Avião', 'Navio', 'Moto', 'Bonde', 'Metrô', 'Táxi', 'Helicóptero', 'Patinete', 'Barco', 'Veleiro', 'Canoa', 'Balão de ar quente', 'Monociclo', 'Skate', 'Carruagem', 'Gôndola'],
    difficulty: 'easy',
  },
  {
    id: 'cat-hauptstaedte',
    name: 'Capitais',
    terms: ['Brasília', 'Lisboa', 'Paris', 'Berlim', 'Londres', 'Madri', 'Roma', 'Viena', 'Berna', 'Washington', 'Tóquio', 'Pequim', 'Moscou', 'Camberra', 'Ottawa', 'Buenos Aires', 'Cairo', 'Atenas', 'Varsóvia', 'Praga'],
    difficulty: 'medium',
  },
  {
    id: 'cat-feiertage',
    name: 'Feriados e celebrações',
    terms: ['Natal', 'Páscoa', 'Réveillon', 'Carnaval', 'Dia dos Namorados', 'Halloween', 'Dia das Mães', 'Dia dos Pais', 'Dia da Independência', 'Dia de Finados', 'Dia de São João', 'Tiradentes', 'Festa Junina', 'Dia do Trabalho', 'Dia das Crianças', 'Corpus Christi', 'Proclamação da República', 'Sexta-Feira Santa', 'Dia da Consciência Negra', 'Ano Novo'],
    difficulty: 'easy',
  },
  {
    id: 'cat-beruehmt',
    name: 'Pessoas famosas',
    terms: ['Albert Einstein', 'Wolfgang Amadeus Mozart', 'Leonardo da Vinci', 'Cleópatra', 'Napoleão', 'Martin Luther King', 'Marie Curie', 'Mahatma Gandhi', 'Nelson Mandela', 'Frida Kahlo', 'Charles Darwin', 'Nikola Tesla', 'Pedro Álvares Cabral', 'Pablo Picasso', 'Beethoven', 'Santos Dumont', 'Pelé', 'Carmen Miranda', 'Machado de Assis', 'Ayrton Senna'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gemuese',
    name: 'Legumes e verduras',
    terms: ['Tomate', 'Pepino', 'Cenoura', 'Brócolis', 'Couve-flor', 'Pimentão', 'Cebola', 'Alho', 'Espinafre', 'Abobrinha', 'Berinjela', 'Ervilha', 'Feijão', 'Milho', 'Aipo', 'Rabanete', 'Couve-rabi', 'Abóbora', 'Aspargo', 'Couve de Bruxelas'],
    difficulty: 'easy',
  },
  {
    id: 'cat-insekten',
    name: 'Insetos e bichinhos',
    terms: ['Formiga', 'Abelha', 'Borboleta', 'Joaninha', 'Aranha', 'Mosquito', 'Mosca', 'Vespa', 'Gafanhoto', 'Libélula', 'Besouro', 'Lagarta', 'Grilo', 'Mamangava', 'Caracol', 'Minhoca', 'Barata', 'Tesourinha', 'Carrapato', 'Pulga'],
    difficulty: 'medium',
  },
  {
    id: 'cat-bauwerke',
    name: 'Monumentos famosos',
    terms: ['Torre Eiffel', 'Coliseu', 'Muralha da China', 'Taj Mahal', 'Estátua da Liberdade', 'Big Ben', 'Portão de Brandemburgo', 'Pirâmides de Gize', 'Acrópole', 'Basílica de São Pedro', 'Burj Khalifa', 'Ópera de Sydney', 'Sagrada Família', 'Tower Bridge', 'Castelo de Neuschwanstein', 'Stonehenge', 'Machu Picchu', 'Cristo Redentor', 'Ponte Golden Gate', 'Alhambra'],
    difficulty: 'medium',
  },
  {
    id: 'cat-tanzstile',
    name: 'Estilos de dança',
    terms: ['Valsa', 'Tango', 'Salsa', 'Balé', 'Hip-Hop', 'Breakdance', 'Flamenco', 'Samba', 'Cha-Cha-Cha', 'Foxtrote', 'Quickstep', 'Rumba', 'Jive', 'Charleston', 'Polca', 'Forró', 'Jazz', 'Contemporâneo', 'Funk', 'Bachata'],
    difficulty: 'medium',
  },
  {
    id: 'cat-kaesesorten',
    name: 'Tipos de queijo',
    terms: ['Queijo Minas', 'Mozzarella', 'Parmesão', 'Brie', 'Camembert', 'Gouda', 'Feta', 'Gorgonzola', 'Roquefort', 'Gruyère', 'Emmental', 'Mascarpone', 'Cheddar', 'Queijo coalho', 'Requeijão', 'Provolone', 'Queijo de cabra', 'Manchego', 'Pecorino', 'Catupiry'],
    difficulty: 'hard',
  },
];

export const CATEGORIES_PT = CATEGORY_NAMES;
