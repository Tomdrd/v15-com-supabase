/* ═══════════════════════════════════════════════════
   sobral_game.js — Quiz Sobral Cultural v2
═══════════════════════════════════════════════════ */

const SU = 'https://nrohpfggqcbscyoigpiz.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb2hwZmdncWNic2N5b2lncGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzAxMTcsImV4cCI6MjA5MTUwNjExN30.OMNV3gRIEOMY15Ay_7K6M0z938TIinMpgErOTXHSFrA';
const supa = supabase.createClient(SU, SK);

/* ─────────────────────────────────────────────────────────────────────────
   BANCO DE PERGUNTAS — 100 questões sobre Sobral CE
───────────────────────────────────────────────────────────────────────── */
const PERGUNTAS = [
  // ── HISTÓRIA (25 questões) ────────────────────────────────────────────
  { id: 1, cat: 'hist', catLabel: 'História', q: 'Em que ano foi fundada a cidade de Sobral?', opts: ['1773', '1805', '1690', '1821'], correta: 0, curiosidade: 'Sobral foi fundada em 1773, elevada a vila em 1841 e depois à condição de cidade.' },
  { id: 2, cat: 'hist', catLabel: 'História', q: 'Qual fenômeno astronômico histórico foi observado em Sobral em 1919?', opts: ['Eclipse lunar total', 'Eclipse solar que comprovou a Relatividade', 'Passagem do cometa Halley', 'Chuva de meteoros incomum'], correta: 1, curiosidade: 'O eclipse solar de 29 de maio de 1919 permitiu comprovar a Teoria da Relatividade Geral de Einstein, tornando Sobral célebre mundialmente.' },
  { id: 3, cat: 'hist', catLabel: 'História', q: 'Qual era o principal produto da economia sobralense no século XIX?', opts: ['Algodão', 'Cana-de-açúcar', 'Cera de carnaúba', 'Couro bovino'], correta: 0, curiosidade: 'O ciclo do algodão financiou mansões, igrejas e obras que existem até hoje em Sobral.' },
  { id: 4, cat: 'hist', catLabel: 'História', q: 'Em que ano Sobral foi elevada à condição de cidade?', opts: ['1773', '1841', '1800', '1889'], correta: 1, curiosidade: 'Sobral foi elevada de vila à cidade em 1841, já no período imperial brasileiro.' },
  { id: 5, cat: 'hist', catLabel: 'História', q: 'Qual guerra envolveu diretamente Sobral com o envio de voluntários cearenses?', opts: ['Guerra do Paraguai', 'Guerra de Canudos', 'Revolução de 1930', 'Revolta da Armada'], correta: 0, curiosidade: 'Sobral enviou muitos soldados à Guerra do Paraguai (1864–1870), alguns homenageados com monumentos na cidade.' },
  { id: 6, cat: 'hist', catLabel: 'História', q: 'Qual cientista britânico liderou a expedição de 1919 para observar o eclipse em Sobral?', opts: ['Isaac Newton', 'Arthur Eddington', 'Charles Darwin', 'James Clerk Maxwell'], correta: 1, curiosidade: 'Arthur Eddington foi o astrônomo responsável por confirmar a curvatura da luz prevista por Einstein durante o eclipse de 1919.' },
  { id: 7, cat: 'hist', catLabel: 'História', q: 'Como era chamado o núcleo original de Sobral às margens do rio Acaraú?', opts: ['Cohab', 'Terrenos Novos', 'Centro Histórico', 'Dom Expedito'], correta: 1, curiosidade: 'Os Terrenos Novos é o bairro mais antigo de Sobral, onde se formou o núcleo urbano original no século XVIII.' },
  { id: 8, cat: 'hist', catLabel: 'História', q: 'Qual foi o papel de Sobral durante a seca de 1877?', opts: ['Recebeu retirantes de toda a região', 'Ficou isolada por meses', 'Exportou alimentos para o sul', 'Nenhuma seca atingiu a cidade'], correta: 0, curiosidade: 'A Grande Seca de 1877-1879 devastou o Nordeste e Sobral tornou-se ponto de refúgio para milhares de retirantes da região.' },
  { id: 9, cat: 'hist', catLabel: 'História', q: 'Quando foi criada a Diocese de Sobral?', opts: ['1890', '1900', '1915', '1930'], correta: 2, curiosidade: 'A Diocese de Sobral foi criada em 1915, consolidando a importância religiosa e administrativa da cidade no Noroeste cearense.' },
  { id: 10, cat: 'hist', catLabel: 'História', q: 'Qual era o meio de transporte que ligava Sobral ao litoral no início do século XX?', opts: ['Estrada de ferro', 'Rio navegável', 'Estrada de rodagem', 'Linha de telégrafo'], correta: 0, curiosidade: 'A Estrada de Ferro de Sobral (EFS) foi inaugurada em 1882, ligando a cidade ao porto de Camocim e dinamizando o comércio regional.' },
  { id: 11, cat: 'hist', catLabel: 'História', q: 'Qual movimento político de 1817 teve repercussão em Sobral?', opts: ['Revolução Farroupilha', 'Revolução Pernambucana', 'Inconfidência Mineira', 'Balaiada'], correta: 1, curiosidade: 'A Revolução Pernambucana de 1817, de caráter republicano, teve adeptos em Sobral e outras cidades do Ceará.' },
  { id: 12, cat: 'hist', catLabel: 'História', q: 'Qual produto artesanal sobralense foi muito exportado no século XIX?', opts: ['Cerâmica', 'Couro curtido', 'Renda de bilro', 'Tapeçaria'], correta: 1, curiosidade: 'A indústria do couro foi muito importante em Sobral, com a exportação de couros e manufaturas de couro para todo o Brasil.' },
  { id: 13, cat: 'hist', catLabel: 'História', q: 'Em que século foi construída a Igreja da Sé de Sobral?', opts: ['Século XVII', 'Século XVIII', 'Século XIX', 'Século XX'], correta: 1, curiosidade: 'A Igreja de Nossa Senhora da Conceição, conhecida como Sé de Sobral, foi construída no século XVIII e é um dos marcos históricos da cidade.' },
  { id: 14, cat: 'hist', catLabel: 'História', q: 'Qual o nome do primeiro presidente de câmara de Sobral após a independência?', opts: ['José Sabóia', 'Antônio Rodrigues', 'Francisco das Chagas', 'Manuel de Araújo'], correta: 0, curiosidade: 'José Sabóia foi figura de destaque na política de Sobral no período pós-independência, na primeira metade do século XIX.' },
  { id: 15, cat: 'hist', catLabel: 'História', q: 'O eclipse de 1919 foi fundamental para confirmar qual teoria científica?', opts: ['Teoria da Evolução', 'Teoria Atômica', 'Teoria da Relatividade Geral', 'Mecânica Quântica'], correta: 2, curiosidade: 'Albert Einstein já havia publicado sua Teoria da Relatividade Geral em 1915; o eclipse de Sobral em 1919 foi a confirmação experimental definitiva.' },
  { id: 16, cat: 'hist', catLabel: 'História', q: 'Qual conflito do início do século XX envolveu Sobral com o cangaço?', opts: ['Guerra do Contestado', 'Ação do bando de Lampião na região', 'Revolta de Juazeiro', 'Guerrilha do Araguaia'], correta: 1, curiosidade: 'O cangaceiro Lampião e seu bando chegaram a atuar na região noroeste do Ceará, próximo a Sobral, gerando temor e reação das autoridades locais.' },
  { id: 17, cat: 'hist', catLabel: 'História', q: 'Em qual período Sobral foi capital provisória do Ceará?', opts: ['Guerra Holandesa', 'Período Joanino', 'Revolução de 1817', 'Nunca foi capital'], correta: 3, curiosidade: 'Fortaleza sempre foi a capital do Ceará. Sobral é reconhecida como a segunda cidade mais importante do estado, mas nunca exerceu função de capital.' },
  { id: 18, cat: 'hist', catLabel: 'História', q: 'Qual a origem do nome "Sobral"?', opts: ['Sobral de árvores', 'Nome de um fazendeiro português', 'Derivado de "sobre o rio"', 'Homenagem a cidade portuguesa'], correta: 3, curiosidade: 'O nome Sobral foi uma homenagem à cidade de Sobral, em Portugal, de onde vieram muitos dos primeiros colonizadores da região.' },
  { id: 19, cat: 'hist', catLabel: 'História', q: 'Qual família foi a mais influente politicamente em Sobral no século XIX?', opts: ['Família Alencar', 'Família Sabóia', 'Família Monte', 'Família Távora'], correta: 1, curiosidade: 'A família Sabóia exerceu enorme influência política e econômica em Sobral durante o século XIX, ligada ao comércio e à política local.' },
  { id: 20, cat: 'hist', catLabel: 'História', q: 'Qual estrada federal passa por Sobral conectando-a a Fortaleza?', opts: ['BR-116', 'BR-222', 'BR-020', 'CE-085'], correta: 1, curiosidade: 'A BR-222 é a principal via de acesso entre Sobral e Fortaleza, percorrendo aproximadamente 230 km.' },
  { id: 21, cat: 'hist', catLabel: 'História', q: 'Em que ano foi inaugurada a Estrada de Ferro de Sobral?', opts: ['1870', '1882', '1900', '1920'], correta: 1, curiosidade: 'A Estrada de Ferro de Sobral foi inaugurada em 1882, ligando a cidade ao porto de Camocim e integrando Sobral ao comércio marítimo.' },
  { id: 22, cat: 'hist', catLabel: 'História', q: 'Qual evento marcou o início do ciclo de decadência econômica de Sobral no século XX?', opts: ['Primeira Guerra Mundial', 'A crise do algodão e da pecuária', 'A seca de 1932', 'A chegada do trem'], correta: 1, curiosidade: 'A queda nos preços do algodão e as sucessivas secas do século XX reduziram a prosperidade que Sobral havia acumulado no século XIX.' },
  { id: 23, cat: 'hist', catLabel: 'História', q: 'Qual antigo quartel histórico existe em Sobral?', opts: ['Forte dos Remédios', 'Quartel do Corpo de Bombeiros', 'Quartel General da 23ª Brigada', 'Castelo de São Jorge'], correta: 2, curiosidade: 'O Quartel General da 23ª Brigada de Infantaria é uma importante instituição militar estabelecida em Sobral.' },
  { id: 24, cat: 'hist', catLabel: 'História', q: 'Qual movimento cultural dos anos 1920 teve representantes em Sobral?', opts: ['Pré-Rafaelismo', 'Modernismo Brasileiro', 'Romantismo tardio', 'Arte Nouveau'], correta: 1, curiosidade: 'O Modernismo Brasileiro, deflagrado pela Semana de Arte Moderna de 1922, influenciou intelectuais e artistas de Sobral nas décadas seguintes.' },
  { id: 25, cat: 'hist', catLabel: 'História', q: 'Qual era o principal porto de escoamento da produção de Sobral no século XIX?', opts: ['Porto de Fortaleza', 'Porto de Camocim', 'Porto de Acaraú', 'Porto de Sobral'], correta: 1, curiosidade: 'O Porto de Camocim era o principal escoadouro da produção de Sobral, conectado pela Estrada de Ferro inaugurada em 1882.' },

  // ── CULTURA (25 questões) ─────────────────────────────────────────────
  { id: 26, cat: 'cult', catLabel: 'Cultura', q: 'Qual festa popular é uma das mais tradicionais de Sobral, celebrada em junho?', opts: ['Carnaval', 'Festa Junina / São João', 'Festival de Inverno', 'Semana do Folclore'], correta: 1, curiosidade: 'As festas juninas de Sobral reúnem forró, quadrilhas e comidas típicas, sendo patrimônio cultural reconhecido na região.' },
  { id: 27, cat: 'cult', catLabel: 'Cultura', q: 'O Teatro São João, em Sobral, é um dos mais antigos de qual estado?', opts: ['Maranhão', 'Piauí', 'Ceará', 'Paraíba'], correta: 2, curiosidade: 'O Teatro São João foi inaugurado no século XIX e é um dos teatros mais antigos do Ceará, tombado como patrimônio histórico nacional.' },
  { id: 28, cat: 'cult', catLabel: 'Cultura', q: 'Qual artesanato típico da região de Sobral utiliza fibra da carnaúba?', opts: ['Cerâmica marajoara', 'Renda de bilro', 'Chapéus e objetos de palha', 'Tapeçaria persa'], correta: 2, curiosidade: 'A palha da carnaúba, "árvore da vida" do Nordeste, é utilizada na confecção de chapéus, bolsas e artigos artesanais da região de Sobral.' },
  { id: 29, cat: 'cult', catLabel: 'Cultura', q: 'Qual gênero musical nordestino é fortemente associado às festividades de Sobral?', opts: ['Axé', 'Forró', 'Sertanejo', 'Pagode'], correta: 1, curiosidade: 'O forró, criado por Luiz Gonzaga, é a música da alma nordestina. Sobral mantém viva essa tradição em seus festejos juninos e festas populares.' },
  { id: 30, cat: 'cult', catLabel: 'Cultura', q: 'Qual manifestação cultural popular acontece nas ruas de Sobral durante o Natal?', opts: ['Bumba meu boi', 'Reisado', 'Maracatu', 'Coco de roda'], correta: 1, curiosidade: 'O Reisado é uma dança dramática folclórica muito presente no Ceará, especialmente em Sobral, onde grupos se apresentam durante as festas natalinas.' },
  { id: 31, cat: 'cult', catLabel: 'Cultura', q: 'Qual tipo de literatura de cordel trata com frequência de Sobral e seus personagens?', opts: ['Romance de cavalaria', 'Haiku nordestino', 'Folheto de feira', 'Crônica urbana'], correta: 2, curiosidade: 'Os folhetos de cordel vendidos nas feiras de Sobral retratam histórias locais, heróis regionais, secas e personagens da cultura nordestina.' },
  { id: 32, cat: 'cult', catLabel: 'Cultura', q: 'Qual instrumento musical é símbolo do forró praticado em Sobral?', opts: ['Viola caipira', 'Zabumba e sanfona', 'Berimbau', 'Cavaquinho'], correta: 1, curiosidade: 'A zabumba (bombo) e a sanfona (acordeão) são os instrumentos centrais do forró nordestino, presentes em todas as festas de Sobral.' },
  { id: 33, cat: 'cult', catLabel: 'Cultura', q: 'Qual é a padroeira da cidade de Sobral?', opts: ['Nossa Senhora Aparecida', 'Nossa Senhora da Conceição', 'Nossa Senhora de Fátima', 'Nossa Senhora do Carmo'], correta: 1, curiosidade: 'Nossa Senhora da Conceição é a padroeira de Sobral. A Sé Catedral, dedicada a ela, é o principal templo religioso da cidade.' },
  { id: 34, cat: 'cult', catLabel: 'Cultura', q: 'O Museu Diocesano de Sobral guarda obras de qual período histórico?', opts: ['Arte pré-histórica', 'Arte colonial e religiosa', 'Arte modernista', 'Arte contemporânea'], correta: 1, curiosidade: 'O Museu Diocesano de Sobral preserva um acervo valioso de arte sacra colonial, imagens religiosas, paramentos e documentos históricos.' },
  { id: 35, cat: 'cult', catLabel: 'Cultura', q: 'Qual dança típica é realizada durante o São João em Sobral?', opts: ['Frevo', 'Maracatu', 'Quadrilha caipira', 'Xaxado'], correta: 2, curiosidade: 'A quadrilha caipira, com seus casais, noiva e noivo e marcadores, é a dança central das festas juninas de Sobral.' },
  { id: 36, cat: 'cult', catLabel: 'Cultura', q: 'Qual é o prato típico mais consumido nas festas populares de Sobral?', opts: ['Moqueca', 'Baião de dois', 'Acarajé', 'Vatapá'], correta: 1, curiosidade: 'O baião de dois — arroz com feijão verde, carne seca e coalho — é o prato símbolo da culinária cearense, onipresente nas festas de Sobral.' },
  { id: 37, cat: 'cult', catLabel: 'Cultura', q: 'Qual canal de televisão com base em Sobral é afiliado a uma rede nacional?', opts: ['TV Sobral', 'TV Cidade Sobral', 'TV Verdes Mares', 'TV Cultura Sobral'], correta: 2, curiosidade: 'A TV Verdes Mares tem afiliada em Sobral e é a emissora de maior alcance no interior do Ceará, sendo afiliada à Rede Globo.' },
  { id: 38, cat: 'cult', catLabel: 'Cultura', q: 'Qual evento acadêmico-cultural anual movimenta a cidade de Sobral no campo universitário?', opts: ['Carnival de Saberes', 'SEMIC (Semana de Iniciação Científica)', 'Bienal do Livro', 'Festival de Cinema'], correta: 1, curiosidade: 'A SEMIC da UFC em Sobral reúne estudantes, pesquisadores e professores para divulgar pesquisas e fortalecer a cultura científica na região.' },
  { id: 39, cat: 'cult', catLabel: 'Cultura', q: 'Qual expressão artística se destaca no centro histórico de Sobral?', opts: ['Arte abstrata', 'Murais e grafites culturais', 'Esculturas de bronze', 'Instalações neon'], correta: 1, curiosidade: 'O centro histórico de Sobral tem recebido murais e grafites que retratam figuras e elementos da identidade cultural local.' },
  { id: 40, cat: 'cult', catLabel: 'Cultura', q: 'Qual é a bebida típica artesanal associada ao sertão sobralense?', opts: ['Cachaça de cana', 'Vinho de jurubeba', 'Cauim indígena', 'Licor de cumaru'], correta: 0, curiosidade: 'A cachaça artesanal produzida nos engenhos da região de Sobral é uma bebida tradicional consumida especialmente nas festas rurais.' },
  { id: 41, cat: 'cult', catLabel: 'Cultura', q: 'Qual material é usado na construção das casas de taipa vistas no interior de Sobral?', opts: ['Pedra e cal', 'Barro, palha e madeira', 'Concreto e areia', 'Tijolo holandês'], correta: 1, curiosidade: 'A taipa é uma técnica construtiva ancestral que usa barro, palha e ripas de madeira, ainda presente nas zonas rurais ao redor de Sobral.' },
  { id: 42, cat: 'cult', catLabel: 'Cultura', q: 'Qual famoso poeta popular cearense cantou a seca e o sertão próximo a Sobral?', opts: ['Castro Alves', 'Patativa do Assaré', 'Manuel Bandeira', 'Drummond'], correta: 1, curiosidade: 'Patativa do Assaré, poeta popular do Ceará, retratou em versos a seca, o retirante e a vida no sertão cearense, incluindo a região de Sobral.' },
  { id: 43, cat: 'cult', catLabel: 'Cultura', q: 'Qual é a comida típica do café da manhã sobralense?', opts: ['Pão de queijo mineiro', 'Cuscuz com manteiga e leite', 'Tapioca com carne seca', 'Ambas b e c são corretas'], correta: 3, curiosidade: 'O café da manhã cearense é rico: tapioca com carne seca, cuscuz com manteiga e leite são companheiros inseparáveis nas manhãs de Sobral.' },
  { id: 44, cat: 'cult', catLabel: 'Cultura', q: 'Qual banda ou artista de forró tem origem ou forte ligação com a região de Sobral?', opts: ['Mastruz com Leite', 'Edson Gomes', 'Calcinha Preta', 'Banda Calypso'], correta: 0, curiosidade: 'O Mastruz com Leite, grupo pioneiro do forró eletrônico, tem forte raízes no interior do Ceará, com grande público em Sobral.' },
  { id: 45, cat: 'cult', catLabel: 'Cultura', q: 'Qual palácio histórico fica na praça central de Sobral?', opts: ['Palácio do Bispo', 'Palácio do Governo', 'Paço Municipal', 'Solar dos Alexandrinos'], correta: 2, curiosidade: 'O Paço Municipal de Sobral, edificação histórica na praça central, é sede da administração pública e um dos cartões-postais da cidade.' },
  { id: 46, cat: 'cult', catLabel: 'Cultura', q: 'Qual rio banha a cidade de Sobral e é central na identidade cultural local?', opts: ['Rio Jaguaribe', 'Rio Coreaú', 'Rio Acaraú', 'Rio Poti'], correta: 2, curiosidade: 'O rio Acaraú é o elemento natural mais simbólico de Sobral, presente na cultura, na história e no abastecimento d\'água da cidade.' },
  { id: 47, cat: 'cult', catLabel: 'Cultura', q: 'Qual estilo arquitetônico predomina no centro histórico tombado de Sobral?', opts: ['Barroco colonial', 'Neoclássico e eclético', 'Art Déco', 'Modernismo brutalista'], correta: 1, curiosidade: 'O centro histórico de Sobral apresenta edificações do século XIX e início do XX com estilo neoclássico e eclético, resultado da prosperidade do ciclo do algodão.' },
  { id: 48, cat: 'cult', catLabel: 'Cultura', q: 'Qual é a principal praça de Sobral, coração do centro histórico?', opts: ['Praça da República', 'Praça da Sé', 'Praça Dom José', 'Praça Tiradentes'], correta: 1, curiosidade: 'A Praça da Sé de Sobral, ao redor da Catedral de Nossa Senhora da Conceição, é o coração histórico e social da cidade.' },
  { id: 49, cat: 'cult', catLabel: 'Cultura', q: 'Qual instituição cultural promove exposições regulares de arte em Sobral?', opts: ['Pinacoteca de Sobral', 'Centro Cultural Natércia Campos', 'MAUC', 'Galeria Sobral Arte'], correta: 1, curiosidade: 'O Centro Cultural Natércia Campos é um dos espaços de referência em Sobral para exposições de arte, eventos culturais e apresentações.' },
  { id: 50, cat: 'cult', catLabel: 'Cultura', q: 'Qual é o principal jornal impresso de Sobral com décadas de história?', opts: ['O Povo de Sobral', 'Correio da Semana', 'Diário do Norte', 'A Voz do Acaraú'], correta: 1, curiosidade: 'O Correio da Semana é o jornal mais antigo em circulação em Sobral, fundado pela Diocese e com décadas de história na imprensa regional.' },

  // ── PERSONALIDADES (25 questões) ──────────────────────────────────────
  { id: 51, cat: 'pers', catLabel: 'Personalidades', q: 'Qual santo católico nasceu em Sobral e foi beatificado pelo Papa Francisco em 2019?', opts: ['Santo Antônio', 'São Francisco das Chagas', 'José de Anchieta', 'Padre Cícero'], correta: 1, curiosidade: 'José Otávio de Alencar Pimentel, o São Francisco das Chagas (Chagas do Iguatu), é distinto do Padre Ibiapina. Sobral abriga a memória de Ibiapina, nascido em 1806.' },
  { id: 52, cat: 'pers', catLabel: 'Personalidades', q: 'Quem foi o Padre Ibiapina em relação a Sobral?', opts: ['Primeiro padre da cidade', 'Missionário nascido em Sobral que percorreu o Nordeste', 'Bispo fundador da diocese', 'Capelão da Estrada de Ferro'], correta: 1, curiosidade: 'José Maria Ibiapina nasceu em Sobral em 1806 e tornou-se um dos mais importantes missionários do Nordeste, criando casas de caridade e igrejas pelo sertão.' },
  { id: 53, cat: 'pers', catLabel: 'Personalidades', q: 'Quem foi Dom José Tupinambá da Frota?', opts: ['Primeiro prefeito eleito de Sobral', 'Bispo que modernizou a diocese de Sobral', 'General da Guerra do Paraguai', 'Governador do Ceará nascido em Sobral'], correta: 1, curiosidade: 'Dom José Tupinambá da Frota foi bispo de Sobral por décadas e deixou marca profunda na educação e cultura da cidade no século XX.' },
  { id: 54, cat: 'pers', catLabel: 'Personalidades', q: 'O cientista Arthur Eddington veio a Sobral para observar qual evento em 1919?', opts: ['Trânsito de Vênus', 'Eclipse solar total', 'Aurora boreal', 'Formação de nova estrela'], correta: 1, curiosidade: 'Eddington liderou a expedição da Sociedade Real Britânica a Sobral para confirmar a Teoria da Relatividade de Einstein durante o eclipse de 29 de maio de 1919.' },
  { id: 55, cat: 'pers', catLabel: 'Personalidades', q: 'Qual escritora cearense tem obra que retrata o sertão próximo a Sobral?', opts: ['Rachel de Queiroz', 'Clarice Lispector', 'Lygia Fagundes Telles', 'Cora Coralina'], correta: 0, curiosidade: 'Rachel de Queiroz, primeira mulher na Academia Brasileira de Letras, retratou o sertão cearense em obras como O Quinze, com cenas da grande seca.' },
  { id: 56, cat: 'pers', catLabel: 'Personalidades', q: 'Qual médico sobralense se destacou no combate a doenças tropicais no século XX?', opts: ['Oswaldo Cruz', 'Nilo Peçanha', 'Carlos Chagas', 'Hélio Gama'], correta: 3, curiosidade: 'Hélio Gama foi um médico sobralense que se destacou na saúde pública regional, contribuindo para o combate a doenças endêmicas no interior do Ceará.' },
  { id: 57, cat: 'pers', catLabel: 'Personalidades', q: 'Qual político sobralense exerceu mandato de senador da república?', opts: ['José Mendonça Bezerra', 'Cid Gomes', 'Leandro Bezerra Cavalcante', 'Virgílio Távora'], correta: 1, curiosidade: 'Cid Gomes, ex-prefeito de Sobral e ex-governador do Ceará, exerceu mandato de senador pela República Federativa do Brasil.' },
  { id: 58, cat: 'pers', catLabel: 'Personalidades', q: 'Quem foi o primeiro bispo da Diocese de Sobral, criada em 1915?', opts: ['Dom Augusto Álvaro da Silva', 'Dom Hélder Câmara', 'Dom José Tupinambá da Frota', 'Dom Walfrido Teixeira Vieira'], correta: 0, curiosidade: 'Dom Augusto Álvaro da Silva, o "Dom Lustosa", foi o primeiro bispo de Sobral, estruturando a diocese e fortalecendo a tradição religiosa local.' },
  { id: 59, cat: 'pers', catLabel: 'Personalidades', q: 'Qual general brasileiro nascido no Ceará tem ligação histórica com Sobral?', opts: ['Marechal Deodoro', 'Marechal Hermes da Fonseca', 'Cel. Tibúrcio de Sousa', 'Luís Alves de Lima e Silva'], correta: 2, curiosidade: 'O Cel. Francisco Tibúrcio de Sousa, natural do Ceará, foi figura militar com ligações à região de Sobral no século XIX.' },
  { id: 60, cat: 'pers', catLabel: 'Personalidades', q: 'Qual educador fundou importantes escolas em Sobral no início do século XX?', opts: ['Dom Tupinambá', 'Pe. Sabóia de Medeiros', 'Joaquim Nabuco', 'Anísio Teixeira'], correta: 1, curiosidade: 'O Padre Sabóia de Medeiros foi um educador e intelectual sobralense que fundou escolas e contribuiu para o desenvolvimento educacional de Sobral.' },
  { id: 61, cat: 'pers', catLabel: 'Personalidades', q: 'Qual prefeito de Sobral ficou conhecido pela transformação urbana nos anos 2000?', opts: ['Cid Gomes', 'Leônidas Cristino', 'Ivo Gomes', 'Veveu Arruda'], correta: 0, curiosidade: 'Cid Gomes prefeito de Sobral (1997-2004) é reconhecido pelas reformas urbanas, educacionais e de saúde que transformaram a cidade.' },
  { id: 62, cat: 'pers', catLabel: 'Personalidades', q: 'Qual jornalista fundou o jornal Correio da Semana em Sobral?', opts: ['Diocese de Sobral', 'Família Sabóia', 'José de Arimatéia', 'Antônio Bezerra'], correta: 0, curiosidade: 'O Correio da Semana foi fundado pela Diocese de Sobral, ligado à Igreja Católica, e se tornou o jornal mais longevo da cidade.' },
  { id: 63, cat: 'pers', catLabel: 'Personalidades', q: 'Qual músico popular cearense influenciou gerações de artistas da região de Sobral?', opts: ['Luiz Gonzaga', 'Jackson do Pandeiro', 'Dominguinhos', 'Trio Nordestino'], correta: 0, curiosidade: 'Luiz Gonzaga, o "Rei do Baião", influenciou toda a música nordestina e sua obra é presença constante nas festas e tradições de Sobral.' },
  { id: 64, cat: 'pers', catLabel: 'Personalidades', q: 'Qual jogador de futebol nascido em Sobral atuou em times profissionais?', opts: ['Bebeto', 'Ronaldo Fenômeno', 'Wendell Geraldo', 'Ninguém de destaque nacional'], correta: 2, curiosidade: 'Wendell Geraldo e outros jogadores nascidos em Sobral chegaram a atuar em clubes profissionais do futebol cearense e nordestino.' },
  { id: 65, cat: 'pers', catLabel: 'Personalidades', q: 'Qual líder religioso popular do século XIX atuou próximo à região de Sobral?', opts: ['Padre Cícero', 'Antônio Conselheiro', 'Frei Damião', 'Dom Bosco'], correta: 0, curiosidade: 'Padre Cícero Romão Batista, de Juazeiro do Norte, exerceu enorme influência religiosa em todo o Ceará, incluindo os fiéis da região de Sobral.' },
  { id: 66, cat: 'pers', catLabel: 'Personalidades', q: 'Qual professora se destacou pela defesa da educação pública em Sobral?', opts: ['Natércia Campos', 'Maria Eduarda Távora', 'Ana Luz Salgado', 'Cleonice Vasconcelos'], correta: 0, curiosidade: 'Natércia Campos é uma educadora sobralense homenageada na cidade, cujo nome batiza o Centro Cultural de Sobral.' },
  { id: 67, cat: 'pers', catLabel: 'Personalidades', q: 'Qual governador do Ceará tem raízes familiares em Sobral?', opts: ['Ciro Gomes', 'Tasso Jereissati', 'Gonzaga Mota', 'Adauto Bezerra'], correta: 0, curiosidade: 'Ciro Gomes, ex-governador do Ceará e candidato à presidência da República, nasceu em Pindamonhangaba-SP mas tem profundas raízes políticas em Sobral.' },
  { id: 68, cat: 'pers', catLabel: 'Personalidades', q: 'Qual arquiteto deixou obras marcantes no centro histórico de Sobral?', opts: ['Oscar Niemeyer', 'Adolfo Herbster', 'Lúcio Costa', 'João Pessoa Salgado'], correta: 1, curiosidade: 'Adolfo Herbster foi um importante arquiteto cearense do século XIX, responsável por projetos em Fortaleza e influente no estilo das edificações de Sobral.' },
  { id: 69, cat: 'pers', catLabel: 'Personalidades', q: 'Qual frei capuchinho teve atuação missionária marcante no Ceará próximo a Sobral?', opts: ['Frei Damião de Bozzano', 'Frei Caneca', 'Frei Galvão', 'Frei Vicente do Salvador'], correta: 0, curiosidade: 'Frei Damião de Bozzano percorreu o Nordeste por décadas, pregando missões populares em Sobral e cidades próximas, sendo venerado como santo pelo povo.' },
  { id: 70, cat: 'pers', catLabel: 'Personalidades', q: 'Qual nome histórico de Sobral se destacou nas artes plásticas regionais?', opts: ['Chico da Silva', 'Raimundo Cela', 'Mestre Noza', 'João do Valle'], correta: 1, curiosidade: 'Raimundo Cela foi um importante pintor cearense do início do século XX com obras que retratam cenas do interior do Ceará, incluindo paisagens da região de Sobral.' },
  { id: 71, cat: 'pers', catLabel: 'Personalidades', q: 'Qual empresário sobralense se destacou na indústria têxtil regional?', opts: ['Antônio Diogo', 'Francisco Sá', 'João Frederico Renner', 'José Sabóia Neto'], correta: 0, curiosidade: 'Antônio Diogo foi um dos empresários que investiram na indústria têxtil em Sobral, aproveitando a tradição algodoeira da região.' },
  { id: 72, cat: 'pers', catLabel: 'Personalidades', q: 'Qual nome está ligado à fundação da Santa Casa de Misericórdia de Sobral?', opts: ['Dom Lustosa', 'Padre Ibiapina', 'Barão de Sobral', 'Família Sabóia'], correta: 0, curiosidade: 'Dom Lustosa (Dom Augusto Álvaro da Silva), primeiro bispo de Sobral, foi fundamental na criação e consolidação de obras sociais, incluindo a Santa Casa.' },
  { id: 73, cat: 'pers', catLabel: 'Personalidades', q: 'Qual título honorífico foi concedido a Sobral pelo governo federal por sua importância histórica?', opts: ['Cidade Monumento', 'Patrimônio Histórico Nacional', 'Cidade Heroica', 'Tombamento do Centro Histórico'], correta: 3, curiosidade: 'O centro histórico de Sobral foi tombado pelo IPHAN (Instituto do Patrimônio Histórico e Artístico Nacional), reconhecendo seu valor arquitetônico e histórico.' },
  { id: 74, cat: 'pers', catLabel: 'Personalidades', q: 'Qual senador cearense foi originário de Sobral no século XX?', opts: ['Virgílio Távora', 'José Freire', 'Fernandes Távora', 'Carlos Perdigão'], correta: 0, curiosidade: 'Virgílio Távora foi um dos mais influentes políticos cearenses do século XX, tendo ligação com famílias tradicionais de Sobral.' },
  { id: 75, cat: 'pers', catLabel: 'Personalidades', q: 'Qual nome de Sobral se destacou na medicina veterinária regional?', opts: ['João Neto', 'Francisco Eugênio', 'Paulo Sarasate', 'Antônio Justa'], correta: 1, curiosidade: 'Francisco Eugênio foi um médico veterinário sobralense que contribuiu para o desenvolvimento da pecuária regional no século XX.' },

  // ── GEOGRAFIA & CURIOSIDADES (25 questões) ───────────────────────────
  { id: 76, cat: 'geo', catLabel: 'Geografia', q: 'Em qual mesorregião do Ceará está localizada Sobral?', opts: ['Sul Cearense', 'Jaguaribe', 'Noroeste Cearense', 'Sertão Central'], correta: 2, curiosidade: 'Sobral é o principal centro urbano do Noroeste Cearense, funcionando como polo regional de saúde, educação e comércio.' },
  { id: 77, cat: 'geo', catLabel: 'Geografia', q: 'Qual universidade federal tem importante campus em Sobral?', opts: ['UFCE', 'UFC', 'UECE', 'IFCE'], correta: 1, curiosidade: 'A UFC (Universidade Federal do Ceará) tem campus em Sobral desde 2006, sendo hoje um dos maiores polos universitários do interior cearense.' },
  { id: 78, cat: 'geo', catLabel: 'Geografia', q: 'Sobral fica a aproximadamente quantos quilômetros de Fortaleza?', opts: ['80 km', '130 km', '230 km', '320 km'], correta: 2, curiosidade: 'Sobral fica a cerca de 230 km de Fortaleza pela BR-222, uma viagem de aproximadamente 3 horas de carro.' },
  { id: 79, cat: 'geo', catLabel: 'Geografia', q: 'Qual reservatório abastece grande parte da cidade de Sobral?', opts: ['Açude Orós', 'Açude Castanhão', 'Açude Ayres de Sousa', 'Barragem Santa Rosa'], correta: 2, curiosidade: 'O Açude Ayres de Sousa é a principal reserva de água de Sobral, fundamental para o abastecimento urbano e a irrigação.' },
  { id: 80, cat: 'geo', catLabel: 'Geografia', q: 'Qual o clima predominante na região de Sobral?', opts: ['Equatorial úmido', 'Semiárido', 'Subtropical', 'Tropical litorâneo'], correta: 1, curiosidade: 'O clima semiárido de Sobral tem chuvas concentradas de janeiro a abril ("o inverno nordestino"), com longas estiagens no restante do ano.' },
  { id: 81, cat: 'geo', catLabel: 'Geografia', q: 'Qual é a população aproximada de Sobral atualmente?', opts: ['80 mil habitantes', '150 mil habitantes', '210 mil habitantes', '350 mil habitantes'], correta: 2, curiosidade: 'Sobral tem aproximadamente 210 mil habitantes, sendo a segunda maior cidade do Ceará em população e polo de uma região metropolitana.' },
  { id: 82, cat: 'geo', catLabel: 'Geografia', q: 'Qual é a altitude aproximada da sede de Sobral?', opts: ['20 metros', '69 metros', '200 metros', '400 metros'], correta: 1, curiosidade: 'Sobral está a aproximadamente 69 metros de altitude sobre o nível do mar, em terreno relativamente plano do sertão cearense.' },
  { id: 83, cat: 'geo', catLabel: 'Geografia', q: 'Sobral é considerada a segunda maior cidade do Ceará em qual aspecto?', opts: ['Em área territorial', 'Em importância econômica e população', 'Em altitude', 'Em extensão litorânea'], correta: 1, curiosidade: 'Sobral é reconhecida como a segunda cidade mais importante do Ceará em termos populacionais e econômicos, perdendo apenas para Fortaleza.' },
  { id: 84, cat: 'geo', catLabel: 'Geografia', q: 'Qual municípios faz fronteira direta com Sobral ao norte?', opts: ['Tianguá', 'Massapê', 'Meruoca', 'Graça'], correta: 1, curiosidade: 'Massapê fica ao norte de Sobral e é um dos municípios que integram a região metropolitana da "Princesa do Norte".' },
  { id: 85, cat: 'geo', catLabel: 'Geografia', q: 'Qual serra fica próxima a Sobral e é destino de turismo ecológico?', opts: ['Serra da Ibiapaba', 'Serra de Meruoca', 'Serra do Baturité', 'Serra Grande'], correta: 1, curiosidade: 'A Serra de Meruoca, a cerca de 50 km de Sobral, tem clima mais ameno e vegetação de serra, sendo procurada para lazer e turismo ecológico.' },
  { id: 86, cat: 'geo', catLabel: 'Geografia', q: 'Qual sistema de saúde tornou Sobral referência regional?', opts: ['Hospital Geral de Sobral (HGF)', 'Santa Casa com UTI regional', 'HUWC de Sobral', 'Hospital Gonzaguinha'], correta: 1, curiosidade: 'A Santa Casa de Misericórdia de Sobral, com suas UTIs e especialidades, é referência hospitalar para mais de 50 municípios do Noroeste cearense.' },
  { id: 87, cat: 'geo', catLabel: 'Geografia', q: 'Qual rodovia estadual conecta Sobral à Serra da Ibiapaba?', opts: ['CE-176', 'CE-085', 'CE-362', 'CE-257'], correta: 0, curiosidade: 'A CE-176 é a principal estrada que conecta Sobral à Serra da Ibiapaba, passando por municípios serranos e paisagens de grande beleza.' },
  { id: 88, cat: 'geo', catLabel: 'Geografia', q: 'Qual é o bioma predominante na região de Sobral?', opts: ['Mata Atlântica', 'Cerrado', 'Caatinga', 'Pantanal'], correta: 2, curiosidade: 'A Caatinga é o bioma exclusivo do Brasil que caracteriza a região de Sobral, com vegetação adaptada ao clima semiárido.' },
  { id: 89, cat: 'geo', catLabel: 'Geografia', q: 'Qual aeroporto atende a cidade de Sobral?', opts: ['Aeroporto Santos Dumont de Sobral', 'Aeroporto Regional de Sobral', 'Aeroporto Senador Petrônio Portella', 'Não possui aeroporto'], correta: 1, curiosidade: 'Sobral possui o Aeroporto Regional de Sobral, que opera voos domésticos conectando a cidade a Fortaleza e outros centros.' },
  { id: 90, cat: 'geo', catLabel: 'Geografia', q: 'Qual é a temperatura média anual de Sobral?', opts: ['18°C', '26°C', '32°C', '38°C'], correta: 1, curiosidade: 'Sobral tem temperatura média anual em torno de 26-28°C, com máximas que podem ultrapassar 35°C nos meses mais quentes.' },
  { id: 91, cat: 'geo', catLabel: 'Geografia', q: 'Qual curso d\'água, além do Acaraú, passa pelo município de Sobral?', opts: ['Rio Jaguaribe', 'Riacho Melancia', 'Rio Coreaú', 'Rio Poti'], correta: 1, curiosidade: 'O Riacho Melancia é um dos afluentes que contribuem para a bacia hidrográfica do rio Acaraú no município de Sobral.' },
  { id: 92, cat: 'geo', catLabel: 'Geografia', q: 'Qual é a principal atividade econômica do interior do município de Sobral?', opts: ['Mineração', 'Pecuária e agricultura irrigada', 'Pesca artesanal', 'Extrativismo mineral'], correta: 1, curiosidade: 'A pecuária bovina e a agricultura irrigada às margens do rio Acaraú são as principais atividades econômicas nas zonas rurais de Sobral.' },
  { id: 93, cat: 'geo', catLabel: 'Geografia', q: 'Qual polo industrial se desenvolveu em Sobral nas últimas décadas?', opts: ['Polo petroquímico', 'Polo calçadista e têxtil', 'Polo siderúrgico', 'Polo farmacêutico'], correta: 1, curiosidade: 'Sobral desenvolveu um polo calçadista e têxtil significativo, atraindo indústrias e gerando empregos, com incentivos fiscais estaduais.' },
  { id: 94, cat: 'geo', catLabel: 'Geografia', q: 'Quantos municípios integram a Região Metropolitana de Sobral?', opts: ['3 municípios', '8 municípios', '18 municípios', '25 municípios'], correta: 2, curiosidade: 'A Região Metropolitana de Sobral é composta por 18 municípios, integrando o Noroeste cearense sob a liderança urbana de Sobral.' },
  { id: 95, cat: 'geo', catLabel: 'Geografia', q: 'Qual é o apelido histórico de Sobral?', opts: ['Princesa do Norte', 'Rainha do Sertão', 'Coração do Ceará', 'Portal do Noroeste'], correta: 0, curiosidade: '"Princesa do Norte" é o apelido mais tradicional de Sobral, que reflete sua importância histórica, cultural e econômica no norte do Ceará.' },
  { id: 96, cat: 'geo', catLabel: 'Geografia', q: 'Qual parque ecológico fica às margens do rio Acaraú em Sobral?', opts: ['Parque Ecológico do Cocó', 'Parque Ecológico do Acaraú', 'Parque das Dunas', 'Parque Nacional Ubajara'], correta: 1, curiosidade: 'O Parque Ecológico do Acaraú é uma área de lazer e preservação às margens do rio Acaraú, muito frequentada pela população de Sobral.' },
  { id: 97, cat: 'geo', catLabel: 'Geografia', q: 'Qual a extensão territorial aproximada do município de Sobral?', opts: ['500 km²', '2.100 km²', '4.500 km²', '700 km²'], correta: 1, curiosidade: 'O município de Sobral possui área de aproximadamente 2.100 km², incluindo zona urbana, distritos e área rural.' },
  { id: 98, cat: 'geo', catLabel: 'Geografia', q: 'Qual é o IDH (Índice de Desenvolvimento Humano) de Sobral em comparação ao Ceará?', opts: ['Abaixo da média estadual', 'Na média estadual', 'Entre os mais altos do estado', 'O mais alto do estado'], correta: 2, curiosidade: 'Sobral possui um dos maiores IDHs do interior do Ceará, impulsionado por investimentos em saúde, educação e infraestrutura das últimas décadas.' },
  { id: 99, cat: 'geo', catLabel: 'Geografia', q: 'Qual instituição de ensino técnico tem campus em Sobral?', opts: ['SENAI', 'CEFET', 'IFCE', 'Todas as anteriores'], correta: 3, curiosidade: 'Sobral conta com SENAI, SENAC, IFCE (Instituto Federal do Ceará) e outras instituições de ensino técnico e profissionalizante.' },
  { id: 100, cat: 'geo', catLabel: 'Geografia', q: 'Qual é a distância aproximada de Sobral ao litoral cearense mais próximo?', opts: ['20 km', '80 km', '150 km', '230 km'], correta: 1, curiosidade: 'A cidade de Camocim, no litoral do Ceará, fica a cerca de 80 km de Sobral, sendo o ponto costeiro mais acessível para os sobralenses.' },
];

/* ── CONSTANTES ──────────────────────────────────────────────────────────── */
const CATEGORIAS = [
  { id: 'all', label: 'Todas' },
  { id: 'hist', label: 'História' },
  { id: 'cult', label: 'Cultura' },
  { id: 'pers', label: 'Personalidades' },
  { id: 'geo', label: 'Geografia' },
];
const PONTOS_CORRETO = 100;
const PONTOS_VELOCIDADE = 50;
const TEMPO_POR_QUESTAO = 20;
const TOTAL_QUESTOES = 10;
const POR_PAGINA = 4;

/* ── ESTADO ──────────────────────────────────────────────────────────────── */
let USER = null;
let quiz = null;
let rankPag = 0;
let rankAll = [];
let timerInterval = null;
let isMuted = localStorage.getItem('quizMuted') === 'true';

/* ── INIT ────────────────────────────────────────────────────────────────── */
(async () => {
  const { data: { session } } = await supa.auth.getSession();
  if (session) {
    USER = session.user;
    const logout = document.getElementById('drwLogout');
    if (logout) logout.style.display = 'flex';
  }
  renderHub();
  lucide?.createIcons();
})();

supa.auth.onAuthStateChange((_ev, sess) => {
  USER = sess?.user || null;
  const logout = document.getElementById('drwLogout');
  if (logout) logout.style.display = USER ? 'flex' : 'none';
});

/* ── SUPABASE ────────────────────────────────────────────────────────────── */
async function carregarRanking() {
  // Busca todos os scores e filtra o melhor por jogador no cliente
  const { data: scores } = await supa
    .from('game_scores')
    .select('user_id, score, correct, total, played_at')
    .order('score', { ascending: false })
    .limit(200);
  if (!scores || scores.length === 0) return [];

  // Mantém apenas o melhor score de cada jogador (DISTINCT ON user_id)
  const seen = new Set();
  const melhores = scores.filter(s => {
    if (seen.has(s.user_id)) return false;
    seen.add(s.user_id);
    return true;
  });

  const ids = melhores.map(s => s.user_id);
  const { data: perfis } = await supa
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', ids);

  // Busca metadados do auth para pegar avatar do Google OAuth se não tiver no perfil
  const pm = {};
  (perfis || []).forEach(p => { pm[p.id] = p; });

  // Para o usuário logado, prioriza avatar do metadata do Google
  const { data: { user: authUser } } = await supa.auth.getUser().catch(() => ({ data: { user: null } }));
  if (authUser) {
    const googleAvatar = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture;
    if (googleAvatar && pm[authUser.id]) {
      pm[authUser.id] = { ...pm[authUser.id], avatar_url: pm[authUser.id].avatar_url || googleAvatar };
    } else if (googleAvatar && !pm[authUser.id]) {
      pm[authUser.id] = {
        id: authUser.id,
        full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Jogador',
        avatar_url: googleAvatar
      };
    }
  }

  return melhores.map(s => ({ ...s, perfil: pm[s.user_id] || null }));
}

async function carregarMeuHistorico() {
  if (!USER) return [];
  const { data } = await supa
    .from('game_scores')
    .select('score, correct, total, played_at')
    .eq('user_id', USER.id)
    .order('score', { ascending: false })
    .limit(5);
  return data || [];
}

async function salvarPontuacao(score, correct, total) {
  if (!USER) return;
  await supa.from('game_scores').insert({
    user_id: USER.id, score, correct, total, cat: 'all',
    played_at: new Date().toISOString()
  });
}

/* ── TOPBAR ──────────────────────────────────────────────────────────────── */
function toggleDrw() {
  ['hbg', 'dov', 'drw'].forEach(id => document.getElementById(id).classList.toggle('open'));
}
function closeDrw() {
  ['hbg', 'dov', 'drw'].forEach(id => document.getElementById(id).classList.remove('open'));
}
async function doLogout() {
  await supa.auth.signOut();
  USER = null;
  location.reload();
}

/* ── ÁUDIO ───────────────────────────────────────────────────────────────── */
function playAudio(src, volume = 0.9) { // Aumentei o volume padrão para 0.9 para melhor audibilidade
  if (isMuted) return null;
  // Envolve a reprodução em um try-catch para evitar erros caso o navegador
  // bloqueie o autoplay de áudio antes de uma interação do usuário.
  try {
    const audio = new Audio(src);
    audio.volume = volume;
    audio.play()
      .then(() => console.log(`Áudio '${src}' iniciado com sucesso.`))
      .catch(e => console.warn(`Não foi possível tocar o áudio '${src}' (autoplay bloqueado ou outro erro):`, e));
    return audio; // Retorna o objeto de áudio para controle externo, se necessário
  } catch (e) {
    console.error(`Erro ao criar ou iniciar o objeto Audio para '${src}':`, e);
    return null;
  }
}

function toggleSound() {
  isMuted = !isMuted;
  localStorage.setItem('quizMuted', isMuted);
  if (isMuted) pararLeitura();
  const btn = document.getElementById('soundBtn');
  if (btn) {
    btn.innerHTML = `<i data-lucide="${isMuted ? 'volume-x' : 'volume-2'}"></i>`;
    lucide.createIcons();
  }
}

/* ── TTS — LEITURA DE PERGUNTAS ──────────────────────────────────────────── */
function lerPergunta(texto, opts = []) {
  if (isMuted) return;
  pararLeitura();
  if (!window.speechSynthesis) return;

  const letras = ['A', 'B', 'C', 'D'];
  // Monta fila: pergunta + cada alternativa
  const textos = [texto, ...opts.map((o, i) => `${letras[i]}. ${o}`)];

  const falar = () => {
    textos.forEach(t => {
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'pt-BR';
      u.rate = 1.2;
      u.pitch = 1.0;
      u.volume = 1.0;
      speechSynthesis.speak(u);
    });
  };

  // Garante que as vozes estejam carregadas antes de falar
  if (speechSynthesis.getVoices().length === 0) {
    speechSynthesis.addEventListener('voiceschanged', falar, { once: true });
  } else {
    falar();
  }
}

function pararLeitura() {
  if (window.speechSynthesis) speechSynthesis.cancel();
}

/* ── TOAST ───────────────────────────────────────────────────────────────── */
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  clearTimeout(t._to);
  t._to = setTimeout(() => t.className = 'toast', 3000);
}

/* ── RENDER HUB ──────────────────────────────────────────────────────────── */
async function renderHub() {
  if (!USER) { renderGate(); return; }
  const root = document.getElementById('root');
  root.innerHTML = '<div class="page-loader"><div class="lsp"></div></div>';

  const [ranking, historico] = await Promise.all([carregarRanking(), carregarMeuHistorico()]);
  rankAll = ranking;
  rankPag = 0;

  const melhor = historico[0] || null;
  const minhaPos = melhor ? (ranking.findIndex(r => r.user_id === USER.id) + 1) : 0;

  root.innerHTML = `
    <div class="hub">
      <div class="hub-hero">
        <div class="hub-illus">
          <div class="hub-illus-ring">
            <i data-lucide="trophy" style="width:52px;height:52px;stroke-width:1.3"></i>
          </div>
        </div>
        <h1 class="hub-title">Quiz <em>Sobral</em></h1>
        <p class="hub-sub">Teste seus conhecimentos sobre a história, cultura, personalidades e geografia da "Princesa do Norte"!</p>

        <div class="hub-pills">
          <span class="hub-pill"><i data-lucide="layers" style="width:13px;height:13px"></i> 100 perguntas</span>
          <span class="hub-pill"><i data-lucide="shuffle" style="width:13px;height:13px"></i> Sorteio aleatório</span>
          <span class="hub-pill"><i data-lucide="timer" style="width:13px;height:13px"></i> 20s por questão</span>
          <span class="hub-pill"><i data-lucide="zap" style="width:13px;height:13px"></i> Bônus de velocidade</span>
        </div>

        <div class="hub-stats">
          <div class="hstat">
            <div class="hstat-n">${TOTAL_QUESTOES}</div>
            <div class="hstat-l">Por rodada</div>
          </div>
          <div class="hstat">
            <div class="hstat-n">${melhor ? melhor.score : '—'}</div>
            <div class="hstat-l">Seu recorde</div>
          </div>
          <div class="hstat">
            <div class="hstat-n">${minhaPos ? '#' + minhaPos : '—'}</div>
            <div class="hstat-l">Seu rank</div>
          </div>
        </div>

        <div class="hub-cta">
          <button class="btn btn-primary btn-lg" onclick="iniciarQuiz()">
            <i data-lucide="play-circle"></i> Jogar agora
          </button>
        </div>
      </div>

      <div class="hub-cols">
        ${renderRankingCard()}
        ${renderMyScoreCard(melhor, historico)}
      </div>
    </div>
  `;
  lucide?.createIcons();
}

/* ── GATE ────────────────────────────────────────────────────────────────── */
function renderGate() {
  document.getElementById('root').innerHTML = `
    <div class="gate">
      <div class="gate-illus">
        <i data-lucide="lock" style="width:52px;height:52px;stroke-width:1.3"></i>
      </div>
      <h2>Faça login para jogar</h2>
      <p>O Quiz Sobral é exclusivo para membros. Crie sua conta gratuitamente e dispute um lugar no ranking!</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
        <a href="sobral_login.html?redirect=sobral_game.html" class="btn btn-primary btn-lg">
          <i data-lucide="log-in"></i> Entrar / Cadastrar
        </a>
        <a href="index.html" class="btn btn-secondary">
          <i data-lucide="map"></i> Ver o mapa
        </a>
      </div>
    </div>
  `;
  lucide?.createIcons();
}

/* ── RANKING CARD ────────────────────────────────────────────────────────── */
function renderRankingCard() {
  const total = rankAll.length;
  const paginas = Math.ceil(total / POR_PAGINA);
  const inicio = rankPag * POR_PAGINA;
  const pagina = rankAll.slice(inicio, inicio + POR_PAGINA);

  const rows = total === 0
    ? `<div class="rank-empty">
         <i data-lucide="medal" style="width:32px;height:32px"></i>
         <span>Ainda sem pontuações.<br>Seja o primeiro!</span>
       </div>`
    : pagina.map((r, i) => {
      const pos = inicio + i + 1;
      const posClass = pos === 1 ? 'gold' : pos === 2 ? 'silver' : pos === 3 ? 'bronze' : 'other';
      const avatarBorder = pos === 1 ? 'g' : pos === 2 ? 's' : pos === 3 ? 'b' : '';
      const nome = r.perfil?.full_name || 'Jogador';
      const iniciais = nome.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
      const avatarHtml = r.perfil?.avatar_url
        ? `<img src="${r.perfil.avatar_url}" alt="${nome}" loading="lazy">`
        : iniciais;
      const isMe = USER && r.user_id === USER.id;
      const pct = Math.round((r.correct / r.total) * 100);
      const data = new Date(r.played_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      return `
          <a href="sobral_perfil.html?id=${r.user_id}" class="rank-row ${isMe ? 'me' : ''}">
            <div class="rank-pos ${posClass}">${pos}</div>
            <div class="rank-avatar ${avatarBorder}">${avatarHtml}</div>
            <div class="rank-info">
              <div class="rank-name">${nome}${isMe ? ' <span style="color:var(--ochre);font-size:10px;font-weight:400">(você)</span>' : ''}</div>
              <div class="rank-meta">${pct}% de acertos · ${data}</div>
            </div>
            <div class="rank-score">
              <div class="rank-pts">${r.score}</div>
              <div class="rank-label">pts</div>
            </div>
          </a>`;
    }).join('');

  const paginacao = total > POR_PAGINA ? `
    <div class="rank-pagination">
      <button class="rank-page-btn" onclick="mudaPag(-1)" ${rankPag === 0 ? 'disabled' : ''}>
        <i data-lucide="chevron-left" style="width:14px;height:14px"></i> Anterior
      </button>
      <span class="rank-page-info">Pág. ${rankPag + 1} / ${paginas}</span>
      <button class="rank-page-btn" onclick="mudaPag(1)" ${rankPag >= paginas - 1 ? 'disabled' : ''}>
        Próximo <i data-lucide="chevron-right" style="width:14px;height:14px"></i>
      </button>
    </div>` : '';

  return `
    <div class="rank-card">
      <div class="rank-card-head">
        <i data-lucide="trophy" style="color:var(--gold);width:17px;height:17px"></i>
        <h3>Ranking Geral</h3>
        ${total > 0 ? `<span>${total} jogador${total > 1 ? 'es' : ''}</span>` : ''}
      </div>
      <div class="rank-list" id="rankList">${rows}</div>
      ${paginacao}
    </div>`;
}

function mudaPag(dir) {
  const paginas = Math.ceil(rankAll.length / POR_PAGINA);
  rankPag = Math.max(0, Math.min(paginas - 1, rankPag + dir));
  // re-render só o card
  const hub = document.querySelector('.hub-cols');
  if (hub) {
    hub.children[0].outerHTML = renderRankingCard();
    lucide?.createIcons();
  }
}

/* ── MY SCORE CARD ───────────────────────────────────────────────────────── */
function renderMyScoreCard(melhor, historico) {
  if (!melhor) return `
    <div class="my-score-card">
      <h3><i data-lucide="star" style="width:17px;height:17px;color:var(--ochre)"></i> Sua Pontuação</h3>
      <div class="score-empty">
        <i data-lucide="target" style="width:40px;height:40px"></i>
        <p style="font-size:13px">Você ainda não jogou.<br>Comece agora e entre no ranking!</p>
      </div>
    </div>`;

  const pct = Math.round((melhor.correct / melhor.total) * 100);

  const histRows = historico.slice(0, 3).map(h => {
    const p = Math.round((h.correct / h.total) * 100);
    const d = new Date(h.played_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `<div class="history-row">
      <div class="history-pts">${h.score}</div>
      <div class="history-bar-wrap"><div class="history-bar" style="width:${p}%"></div></div>
      <div class="history-pct">${p}%</div>
      <div class="history-date">${d}</div>
    </div>`;
  }).join('');

  return `
    <div class="my-score-card">
      <h3><i data-lucide="star" style="width:17px;height:17px;color:var(--ochre)"></i> Sua Melhor Pontuação</h3>
      <div class="score-grid">
        <div class="score-box">
          <div class="score-box-n">${melhor.score}</div>
          <div class="score-box-l">Recorde pts</div>
        </div>
        <div class="score-box blue">
          <div class="score-box-n">${pct}%</div>
          <div class="score-box-l">Acertos</div>
        </div>
      </div>
      ${historico.length > 1 ? `
      <div class="history-section">
        <div class="history-label">
          <i data-lucide="clock" style="width:11px;height:11px"></i> Últimas partidas
        </div>
        ${histRows}
      </div>` : ''}
    </div>`;
}

/* ── QUIZ ENGINE ─────────────────────────────────────────────────────────── */
function sortearPerguntas() {
  const pool = [...PERGUNTAS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  // ordenar por dificuldade aproximada (geo/cult = fácil, hist/pers = difícil)
  const order = { cult: 0, geo: 1, hist: 2, pers: 3 };
  return pool
    .slice(0, TOTAL_QUESTOES)
    .sort((a, b) => (order[a.cat] || 0) - (order[b.cat] || 0));
}

function iniciarQuiz() {
  if (!USER) { renderGate(); return; }
  clearInterval(timerInterval);
  quiz = {
    perguntas: sortearPerguntas(),
    idx: 0, score: 0, correct: 0,
    streak: 0, maxStreak: 0,
    tempoRestante: TEMPO_POR_QUESTAO,
    timerWarningPlayed: false, // Novo estado para controlar o som de aviso do timer
    respondeu: false,
  };
  renderQuestao();
}

/* ── QUESTÃO ─────────────────────────────────────────────────────────────── */
function renderQuestao() {
  const p = quiz.perguntas[quiz.idx];
  const total = quiz.perguntas.length;
  const pct = Math.round((quiz.idx / total) * 100);
  const letras = ['A', 'B', 'C', 'D'];
  const CIRC = 113.1; // 2π × 18

  const streakHtml = quiz.streak >= 2
    ? `<div class="streak-badge show ${quiz.streak >= 3 ? 'fire' : ''}">
         <i data-lucide="flame" style="width:13px;height:13px"></i> ${quiz.streak}x
       </div>`
    : `<div class="streak-badge"></div>`;

  document.getElementById('root').innerHTML = `
    <div class="quiz-wrap">
      <div class="quiz-header">
        <div class="quiz-prog">
          <div class="prog-label">
            <span>Questão ${quiz.idx + 1} de ${total}</span>
            <span class="prog-pts">${quiz.score} pts</span>
          </div>
          <div class="prog-bar"><div class="prog-fill" style="width:${pct}%"></div></div>
        </div>
        ${streakHtml}
        <button class="quiz-sound-btn" id="soundBtn" onclick="toggleSound()" title="Ativar/desativar som">
          <i data-lucide="${isMuted ? 'volume-x' : 'volume-2'}"></i>
        </button>
        <div class="quiz-timer-wrap">
          <svg class="quiz-timer-svg" viewBox="0 0 44 44">
            <circle class="timer-bg" cx="22" cy="22" r="18"/>
            <circle class="timer-arc" id="timerArc" cx="22" cy="22" r="18"
              style="stroke-dashoffset:0"/>
          </svg>
          <div class="quiz-timer-num" id="timerNum">${TEMPO_POR_QUESTAO}</div>
        </div>
      </div>

      <div class="quiz-card">
        <div class="quiz-cat ${p.cat}">
          <i data-lucide="${catIcon(p.cat)}" style="width:12px;height:12px"></i>
          ${p.catLabel}
        </div>
        <div class="quiz-q">${p.q}</div>
        <div class="quiz-options" id="opts">
          ${p.opts.map((o, i) => `
            <button class="opt" id="opt${i}" onclick="responder(${i})">
              <span class="opt-letter">${letras[i]}</span>
              <span class="opt-text">${o}</span>
            </button>`).join('')}
        </div>
        <div class="quiz-feedback" id="feedback"></div>
        <div class="quiz-next">
          <button class="btn btn-primary" id="btnNext" style="display:none" onclick="proximaQuestao()">
            ${quiz.idx + 1 < total
      ? 'Próxima <i data-lucide="arrow-right" style="width:15px;height:15px"></i>'
      : 'Ver resultado <i data-lucide="flag" style="width:15px;height:15px"></i>'}
          </button>
        </div>
      </div>
    </div>
  `;
  lucide?.createIcons();
  iniciarTimer();
  lerPergunta(p.q, p.opts);
}

function catIcon(cat) {
  return { hist: 'scroll', cult: 'music', pers: 'user', geo: 'map-pin' }[cat] || 'help-circle';
}

/* ── TIMER ───────────────────────────────────────────────────────────────── */
function iniciarTimer() {
  quiz.tempoRestante = TEMPO_POR_QUESTAO;
  quiz.respondeu = false;
  clearInterval(timerInterval);
  const CIRC = 113.1;

  timerInterval = setInterval(() => {
    quiz.tempoRestante--;
    const num = document.getElementById('timerNum');
    const arc = document.getElementById('timerArc');
    if (num) {
      num.textContent = quiz.tempoRestante;
      const offset = CIRC * (1 - quiz.tempoRestante / TEMPO_POR_QUESTAO);
      if (arc) arc.style.strokeDashoffset = offset;
      if (quiz.tempoRestante <= 5) {
        num.classList.add('warn');
        if (arc) arc.classList.add('warn');
        if (quiz.tempoRestante === 5 && !quiz.timerWarningPlayed) {
          playAudio('timer.mp3');
          quiz.timerWarningPlayed = true;
        }
      }
    }
    if (quiz.tempoRestante <= 0) {
      clearInterval(timerInterval);
      if (!quiz.respondeu) timeOut();
    }
  }, 1000);
}

function timeOut() {
  pararLeitura();
  quiz.respondeu = true;
  quiz.streak = 0;
  const p = quiz.perguntas[quiz.idx];
  document.querySelectorAll('.opt').forEach(b => b.disabled = true);
  document.getElementById('opt' + p.correta)?.classList.add('missed');
  mostrarFeedback(false,
    `<i data-lucide="timer-off" style="width:15px;height:15px;flex-shrink:0;margin-top:1px"></i>`,
    `Tempo esgotado! A resposta correta era: <strong>${p.opts[p.correta]}</strong>`,
    p.curiosidade
  );
  mostrarBotaoNext();
}

function responder(idx) {
  if (quiz.respondeu) return;
  quiz.respondeu = true;
  clearInterval(timerInterval);
  pararLeitura();

  const p = quiz.perguntas[quiz.idx];
  const correto = idx === p.correta;
  const tempoUsado = TEMPO_POR_QUESTAO - quiz.tempoRestante;
  document.querySelectorAll('.opt').forEach(b => b.disabled = true);

  if (correto) {
    quiz.correct++;
    quiz.streak++;
    quiz.maxStreak = Math.max(quiz.maxStreak, quiz.streak);
    const bonus = tempoUsado < 5 ? PONTOS_VELOCIDADE : 0;
    quiz.score += PONTOS_CORRETO + bonus;
    document.getElementById('opt' + idx).classList.add('correct');
    playAudio('acerto-mi.mp3');
    const bonusMsg = bonus > 0
      ? `<span style="color:var(--gold);font-size:11.5px"> +${bonus} bônus velocidade!</span>`
      : '';
    mostrarFeedback(true,
      `<i data-lucide="check-circle" style="width:15px;height:15px;flex-shrink:0;margin-top:1px"></i>`,
      `Correto! +${PONTOS_CORRETO} pontos${bonusMsg}`,
      p.curiosidade
    );
  } else {
    quiz.streak = 0;
    playAudio('errou2.mp3');
    document.getElementById('opt' + idx).classList.add('wrong');
    document.getElementById('opt' + p.correta)?.classList.add('missed');
    mostrarFeedback(false,
      `<i data-lucide="x-circle" style="width:15px;height:15px;flex-shrink:0;margin-top:1px"></i>`,
      `Incorreto! A resposta era: <strong>${p.opts[p.correta]}</strong>`,
      p.curiosidade
    );
  }
  mostrarBotaoNext();
}

function mostrarFeedback(ok, iconHtml, textoHtml, curiosidade) {
  const fb = document.getElementById('feedback');
  if (!fb) return;
  fb.className = `quiz-feedback show ${ok ? 'ok' : 'ko'}`;
  fb.innerHTML = `${iconHtml}<div class="fb-body">${textoHtml}<small>${curiosidade}</small></div>`;
  lucide?.createIcons();
}

function mostrarBotaoNext() {
  const btn = document.getElementById('btnNext');
  if (btn) { btn.style.display = 'inline-flex'; lucide?.createIcons(); }
}

async function proximaQuestao() {
  pararLeitura();
  quiz.idx++;
  if (quiz.idx >= quiz.perguntas.length) {
    await encerrarQuiz();
  } else {
    renderQuestao();
  }
}

/* ── RESULTADO ───────────────────────────────────────────────────────────── */
async function encerrarQuiz() {
  playAudio('parabens.mp3');
  clearInterval(timerInterval);
  const total = quiz.perguntas.length;
  const pct = Math.round((quiz.correct / total) * 100);

  // verifica recorde ANTES de salvar
  const hist = await carregarMeuHistorico();
  const recordeAnterior = hist[0]?.score || 0;
  const novoRecorde = quiz.score > recordeAnterior;

  await salvarPontuacao(quiz.score, quiz.correct, total);

  let grade, titulo, sub;
  if (pct >= 90) { grade = 's'; titulo = 'Sobralense de verdade!'; sub = 'Conhecimento digno de um historiador local!'; }
  else if (pct >= 70) { grade = 'a'; titulo = 'Muito bem!'; sub = 'Você conhece bem a Princesa do Norte!'; }
  else if (pct >= 50) { grade = 'b'; titulo = 'Bom começo!'; sub = 'Continue explorando a história de Sobral.'; }
  else { grade = 'c'; titulo = 'Continue estudando!'; sub = 'Há muito a descobrir sobre Sobral. Tente novamente!'; }

  const iconResult = {
    s: `<i data-lucide="trophy" style="width:52px;height:52px;color:var(--gold);stroke-width:1.2"></i>`,
    a: `<i data-lucide="star" style="width:52px;height:52px;color:var(--gold);stroke-width:1.2"></i>`,
    b: `<i data-lucide="thumbs-up" style="width:52px;height:52px;color:var(--ochre);stroke-width:1.2"></i>`,
    c: `<i data-lucide="book-open" style="width:52px;height:52px;color:var(--muted);stroke-width:1.2"></i>`,
  }[grade];

  document.getElementById('root').innerHTML = `
    <div class="result-wrap">
      ${novoRecorde ? '<div class="confetti-wrap" id="confetti"></div>' : ''}
      <div class="result-illus ${grade}">${iconResult}</div>
      <h1 class="result-title">${titulo}</h1>
      <p class="result-sub">${sub}</p>

      <div class="result-score">${quiz.score}</div>
      <div class="result-score-label">pontos</div>
      ${novoRecorde ? `
        <div class="result-record">
          <i data-lucide="sparkles" style="width:13px;height:13px"></i> Novo recorde pessoal!
        </div>` : '<div style="margin-bottom:22px"></div>'}

      <div class="result-grid">
        <div class="result-box ${novoRecorde ? 'nr' : ''}">
          <div class="result-box-n">${quiz.correct}/${total}</div>
          <div class="result-box-l">Acertos</div>
        </div>
        <div class="result-box">
          <div class="result-box-n">${pct}%</div>
          <div class="result-box-l">Aproveit.</div>
        </div>
        <div class="result-box">
          <div class="result-box-n">${quiz.maxStreak}x</div>
          <div class="result-box-l">Sequência</div>
        </div>
      </div>

      <div class="result-actions">
        <button class="btn btn-secondary" onclick="renderHub()">
          <i data-lucide="trophy"></i> Ver ranking
        </button>
        <button class="btn btn-share" onclick="compartilhar(${quiz.score}, ${pct})">
          <i data-lucide="share-2"></i> Compartilhar
        </button>
      </div>
    </div>
  `;
  lucide?.createIcons();
  if (novoRecorde) lancarConfetti();
}

/* ── COMPARTILHAR ────────────────────────────────────────────────────────── */
function compartilhar(score, pct) {
  const texto = `🏆 Fiz ${score} pontos no Quiz Sobral Cultural!\n${pct}% de acertos — teste você também!\n${location.origin + location.pathname}`;
  if (navigator.share) {
    navigator.share({ title: 'Quiz Sobral', text: texto }).catch(() => { });
  } else {
    navigator.clipboard?.writeText(texto);
    showToast('Resultado copiado!', 'ok');
  }
}

/* ── CONFETTI ────────────────────────────────────────────────────────────── */
function lancarConfetti() {
  const wrap = document.getElementById('confetti');
  if (!wrap) return;
  const cores = ['#C8871A', '#D4A843', '#B54A2A', '#1B6B6B', '#F5EDD8', '#8fce6b', '#5ec8c8'];
  for (let i = 0; i < 70; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.cssText = `left:${Math.random() * 100}%;top:-10px;
      background:${cores[Math.floor(Math.random() * cores.length)]};
      animation-delay:${Math.random() * 1.8}s;
      animation-duration:${1.5 + Math.random() * 1.5}s;
      width:${5 + Math.random() * 8}px;height:${5 + Math.random() * 8}px;
      border-radius:${Math.random() > .5 ? '50%' : '2px'};`;
    wrap.appendChild(p);
  }
  setTimeout(() => { if (wrap) wrap.innerHTML = ''; }, 4500);
}
