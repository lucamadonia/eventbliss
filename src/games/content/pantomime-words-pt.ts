/**
 * OHNE WORTE — Begriffe auf Portugiesisch.
 *
 * Das ist eine ANPASSUNG der deutschen Vorlage, keine Übersetzung. Die
 * Kategorie-IDs bleiben deutsch (sie sind Schlüssel), der Inhalt richtet sich
 * nach dem portugiesischen Sprachraum.
 *
 * Auswahlkriterium bleibt: Jeder Begriff muss sich OHNE Ton und OHNE Requisit
 * darstellen lassen. Bevorzugt sind Dinge mit typischer BEWEGUNG, typischer
 * FORM oder typischer SZENE.
 *
 * Zwei Kategorien sind bewusst NICHT übersetzt, sondern ersetzt:
 * - `sprichwoerter`: hier stehen gängige portugiesische Redewendungen
 *   („Ficar a ver navios"). Wörtlich übersetzte deutsche Redewendungen wären
 *   im Spiel unratbar.
 * - `filme`: Filmtitel in der ortsüblichen Fassung; Titel ohne Bekanntheit im
 *   Zielland (z. B. „Tatort") sind durch dort geläufige Filme ersetzt.
 */

import type { PantomimeCategory } from './pantomime-words-de';

export const PANTOMIME_CATEGORIES_PT: PantomimeCategory[] = [
  {
    id: 'tiere',
    name: 'Animais',
    emoji: '🐘',
    words: [
      'Elefante', 'Girafa', 'Pinguim', 'Canguru', 'Cobra',
      'Águia', 'Sapo', 'Crocodilo', 'Macaco', 'Leão',
      'Abelha', 'Borboleta', 'Aranha', 'Caranguejo', 'Tubarão',
      'Baleia', 'Golfinho', 'Ouriço', 'Coruja', 'Cegonha',
      'Pavão', 'Preguiça', 'Suricata', 'Camelo', 'Rinoceronte',
      'Flamingo', 'Tartaruga', 'Morcego', 'Toupeira', 'Lagosta',
      'Água-viva', 'Cavalo-marinho', 'Guaxinim', 'Esquilo', 'Beija-flor',
      'Avestruz', 'Gorila', 'Lobo', 'Raposa', 'Coelho',
      'Vaca', 'Porco', 'Galinha', 'Cavalo', 'Gato',
      'Cão', 'Pato', 'Cabra', 'Ovelha', 'Rato',
    ],
  },
  {
    id: 'berufe',
    name: 'Profissões',
    emoji: '👷',
    words: [
      'Bombeiro', 'Cozinheiro', 'Dentista', 'Piloto', 'Cabeleireiro',
      'Polícia', 'Professor', 'Pedreiro', 'Empregado de mesa', 'Jardineiro',
      'Fotógrafo', 'Maestro', 'Palhaço', 'Astronauta', 'Mergulhador',
      'Padeiro', 'Talhante', 'Pintor', 'Soldador', 'Carteiro',
      'Lixeiro', 'Motorista de autocarro', 'Juiz', 'Advogado', 'Cirurgião',
      'Enfermeiro', 'Veterinário', 'Bibliotecário', 'Caixa de supermercado', 'Barman',
      'DJ', 'Ator', 'Treinador de futebol', 'Árbitro', 'Guia de montanha',
      'Apicultor', 'Pastor', 'Pescador', 'Agricultor', 'Mecânico',
      'Eletricista', 'Canalizador', 'Telhador', 'Limpa-chaminés', 'Secretária',
      'Modelo', 'Duplo de cinema', 'Mágico', 'Vendedor de feira', 'Porteiro',
    ],
  },
  {
    id: 'filme',
    name: 'Filmes e séries',
    emoji: '🎬',
    words: [
      'Titanic', 'O Padrinho', 'Guerra das Estrelas', 'Parque Jurássico', 'O Rei Leão',
      'Rocky', 'Exterminador Implacável', 'Matrix', 'Piratas das Caraíbas', 'O Senhor dos Anéis',
      'Harry Potter', 'E.T.', 'Sozinho em Casa', 'Caça-Fantasmas', 'Regresso ao Futuro',
      'Forrest Gump', 'Dirty Dancing', 'Pretty Woman', 'Mudança de Hábito', 'Missão Impossível',
      'James Bond', 'Indiana Jones', 'O Feiticeiro de Oz', 'Mary Poppins', 'Frozen',
      'À Procura de Nemo', 'Shrek', 'A Idade do Gelo', 'Toy Story', 'O Livro da Selva',
      'Aladino', 'Cinderela', 'Bambi', 'Dumbo', 'Kung Fu Panda',
      'Os Simpsons', 'A Guerra dos Tronos', 'Breaking Bad', 'Stranger Things', 'Friends',
      'Sherlock', 'Marés Vivas', 'Narcos', 'Os Vingadores', 'Squid Game',
      'La Casa de Papel', 'Gravidade', 'Perdido em Marte', 'Avatar', 'O Exorcista',
    ],
  },
  {
    id: 'alltag',
    name: 'Vida quotidiana',
    emoji: '🪥',
    words: [
      'Lavar os dentes', 'Fazer café', 'Estender a roupa', 'Aspirar o chão', 'Limpar as janelas',
      'Atar os sapatos', 'Abrir o guarda-chuva', 'Lavar o carro', 'Cortar a relva', 'Deitar o lixo fora',
      'Fazer a cama', 'Lavar a loiça', 'Passar a ferro', 'Secar o cabelo', 'Cortar as unhas',
      'Barrar o pão', 'Partir um ovo', 'Escorrer a massa', 'Pedir uma pizza', 'Empurrar o carrinho das compras',
      'Esperar na fila', 'Perder o autocarro', 'Arranjar um furo na bicicleta', 'Mudar um pneu', 'Montar uma estante',
      'Pregar um prego', 'Trocar uma lâmpada', 'Abrir uma encomenda', 'Embrulhar um presente', 'Pôr uma carta no correio',
      'Procurar as chaves', 'Carregar o telemóvel', 'Tirar uma selfie', 'Fazer zapping', 'Desligar o despertador',
      'Dormir demais', 'Fazer as malas', 'Montar a tenda', 'Fazer um churrasco', 'Fazer um boneco de neve',
      'Regar as plantas', 'Passear o cão', 'Mudar a fralda ao bebé', 'Usar o fio dentário', 'Espirrar',
      'Bocejar', 'Ter soluços', 'Mastigar pastilha elástica', 'Esperar pelo elevador', 'Perder-se',
    ],
  },
  {
    id: 'sport',
    name: 'Desporto',
    emoji: '⚽',
    words: [
      'Futebol', 'Basquetebol', 'Ténis', 'Golfe', 'Boxe',
      'Natação', 'Mergulho', 'Esqui', 'Snowboard', 'Patinagem no gelo',
      'Ginástica', 'Salto em altura', 'Salto em comprimento', 'Salto com vara', 'Lançamento do dardo',
      'Lançamento do peso', 'Corrida de barreiras', 'Maratona', 'Ciclismo', 'Remo',
      'Vela', 'Surf', 'Escalada', 'Alpinismo', 'Equitação',
      'Tiro com arco', 'Esgrima', 'Judo', 'Karaté', 'Luta livre',
      'Halterofilismo', 'Ténis de mesa', 'Badminton', 'Voleibol', 'Andebol',
      'Hóquei', 'Hóquei no gelo', 'Râguebi', 'Basebol', 'Críquete',
      'Bowling', 'Dardos', 'Bilhar', 'Skate', 'Patins em linha',
      'Saltar no trampolim', 'Ioga', 'Saltar à corda', 'Pesca', 'Fórmula 1',
    ],
  },
  {
    id: 'gefuehle',
    name: 'Emoções',
    emoji: '😤',
    words: [
      'Raiva', 'Alegria', 'Medo', 'Tristeza', 'Nojo',
      'Surpresa', 'Tédio', 'Nervosismo', 'Orgulho', 'Vergonha',
      'Ciúme', 'Inveja', 'Paixão', 'Saudades de casa', 'Sono',
      'Exaustão', 'Pânico', 'Alívio', 'Deceção', 'Embaraço',
      'Gozo com a desgraça alheia', 'Nostalgia', 'Satisfação', 'Impaciência', 'Desconfiança',
      'Curiosidade', 'Entusiasmo', 'Frustração', 'Choque', 'Reverência',
      'Gratidão', 'Esperança', 'Desespero', 'Serenidade', 'Excitação',
      'Teimosia', 'Compaixão', 'Admiração', 'Confusão', 'Ceticismo',
      'Irritação', 'Timidez', 'Coragem', 'Cobardia', 'Arrependimento',
      'Triunfo', 'Solidão', 'Aconchego', 'Vontade de viajar', 'Expectativa',
    ],
  },
  {
    id: 'sprichwoerter',
    name: 'Provérbios',
    emoji: '💬',
    words: [
      'Ficar a ver navios', 'Meter o pé na poça', 'Fazer tempestade num copo de água', 'Comprar gato por lebre', 'Dar com a língua nos dentes',
      'Pôr as mãos no fogo', 'Estar com a pulga atrás da orelha', 'Matar dois coelhos de uma cajadada', 'Acertar na mouche', 'Atirar a toalha ao chão',
      'Ficar de boca aberta', 'Estar nas nuvens', 'Chorar sobre o leite derramado', 'Dar a mão à palmatória', 'Meter a mão na massa',
      'Ter macaquinhos no sótão', 'Estar entre a espada e a parede', 'Deitar achas na fogueira', 'Quebrar o gelo', 'Enterrar a cabeça na areia',
      'Fazer vista grossa', 'Perder o fio à meada', 'Dar o braço a torcer', 'Puxar a brasa à sua sardinha', 'Pagar o pato',
      'Engolir sapos', 'Bater com o nariz na porta', 'Estar de trombas', 'Arregaçar as mangas', 'Cair das nuvens',
      'Levar uma tampa', 'Dar à sola', 'Estar com os azeites', 'Andar às aranhas', 'Pôr o dedo na ferida',
      'Ficar de queixo caído', 'Ter a faca e o queijo na mão', 'Ficar em águas de bacalhau', 'Ser um peixe fora de água', 'Dar murros na parede',
      'Bater as botas', 'Ter dor de cotovelo', 'Ficar com água na boca', 'Fazer orelhas moucas', 'Torcer o nariz',
      'Rir a bandeiras despregadas', 'Sacudir a água do capote', 'Dormir a sono solto', 'Apertar o cinto', 'Levantar a lebre',
    ],
  },
  {
    id: 'maerchen',
    name: 'Contos e personagens',
    emoji: '🧚',
    words: [
      'Capuchinho Vermelho', 'Branca de Neve', 'A Gata Borralheira', 'A Bela Adormecida', 'Rapunzel',
      'João e Maria', 'O Príncipe Sapo', 'O Anão Saltarilho', 'Os Músicos de Bremen', 'O Gato das Botas',
      'Pinóquio', 'Peter Pan', 'Alice no País das Maravilhas', 'Robin dos Bosques', 'O Rei Artur',
      'Hércules', 'Zeus', 'Poseidon', 'Medusa', 'Ícaro',
      'Frankenstein', 'Drácula', 'O Pai Natal', 'O Coelhinho da Páscoa', 'A Fada dos Dentes',
      'Um unicórnio', 'Um dragão', 'Um anão', 'Um gigante', 'Uma bruxa',
      'Um feiticeiro', 'Um cavaleiro', 'Um pirata', 'Uma sereia', 'Um vampiro',
      'Um lobisomem', 'Um zombi', 'Um fantasma', 'Um robô', 'Um extraterrestre',
      'Super-Homem', 'Batman', 'Homem-Aranha', 'Hulk', 'Mulher-Maravilha',
      'Yoda', 'Gollum', 'O Grinch', 'Simbad', 'Ali Babá',
    ],
  },
  {
    id: 'ab18',
    name: '18+',
    emoji: '🔥',
    adult: true,
    words: [
      'Striptease', 'Beijo de língua', 'Encontro às cegas', 'Preservativo', 'Lingerie',
      'Pole dance', 'Dança do ventre', 'Lap dance', 'Algemas', 'Kama Sutra',
      'Despedida de solteiro', 'Encontro do Tinder', 'Cantada', 'Levar um fora', 'Namoriscar',
      'Chupão', 'Carta de amor', 'Coração aos saltos', 'Sedução', 'Tapar os olhos',
      'Massagem', 'Banho de espuma', 'Pétalas de rosa', 'Jantar à luz das velas', 'Noite de núpcias',
      'Lua de mel', 'Teste de gravidez', 'Discussão de casal', 'Cena de ciúmes', 'Separação',
      'O ex-namorado', 'Traição', 'Foto embaraçosa', 'Confissão', 'Detetor de mentiras',
      'Shot de vodka', 'Ressaca de manhã', 'Dançar bêbado', 'Karaoke às três da manhã', 'Barriga de cerveja',
      'Banho nu', 'Praia de nudismo', 'Sauna', 'Fazer uma tatuagem', 'Piercing',
      'Mostrar o six-pack', 'Exibir os músculos', 'Admirar-se ao espelho', 'Entrar em casa às escondidas', 'Dividir a conta',
    ],
  },
];
