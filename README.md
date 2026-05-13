# Sobral Cultural

**Sobral Cultural** é uma aplicação web de mapeamento cultural e turístico da cidade de Sobral, Ceará. O projeto permite explorar pontos turísticos, eventos, instituições culturais e mais, tudo integrado a um mapa interativo e painéis informativos com recursos de geolocalização.

## 🚀 Tecnologias e Stack

A aplicação foi construída com um foco em leveza, performance e arquitetura *Serverless* (BaaS), sem a necessidade de um *framework* frontend complexo ou build de empacotamento.

### Frontend
- **HTML5, CSS3, JavaScript (Vanilla/ES6)**: Base do projeto. O CSS utiliza variáveis para *theming* e é otimizado com *Mobile First*.
- **[Leaflet (v1.9.4)](https://leafletjs.com/)**: Biblioteca open-source para mapas interativos. A base de mapas utilizada é o CartoDB Dark.
- **[Lucide Icons](https://lucide.dev/)**: Utilizado para a iconografia do sistema de forma dinâmica e leve.
- **[Google Fonts](https://fonts.google.com/)**: Tipografia principal baseada na fonte *Plus Jakarta Sans*.

### Backend (BaaS)
- **[Supabase](https://supabase.com/)**: Atua como o *backend-as-a-service* completo da aplicação, provendo:
  - **Banco de Dados (PostgreSQL)**: Armazenamento das informações de locais, eventos, notícias e reações dos usuários.
  - **Autenticação**: Gerenciamento de login e controle de sessão de usuários comuns e administradores.
  - **Storage**: Armazenamento de mídia (ex: imagens de pontos turísticos, enviadas otimizadas em formato WebP).
  - **Realtime**: Assinatura de mudanças via `postgres_changes` para atualização em tempo real de marcadores e listas.

### Hospedagem / Deploy
- **[Vercel](https://vercel.com/)**: Hospedagem estática com configuração definida no arquivo `vercel.json` (redirecionamentos, rewrites e configurações simples).

---

## ⚡ Performance e Caching

O Sobral Cultural implementa uma arquitetura agressiva de performance para garantir pontuações acima de 70+ no Mobile e 80+ no Desktop (PageSpeed Insights):

- **Cache Local Síncrono (`cache.js`)**: Entidades estáticas e listas grandes (como Pontos Turísticos e Notícias) são salvas no `localStorage` com política de *Time-to-Live* (TTL). O script de cache é injetado síncronamente no `<head>` para evitar condições de corrida (Race Conditions), provendo dados instantâneos ao inicializar a página.
- **Invalidação em Tempo Real (Realtime Invalidation)**: Através de *listeners* do `postgres_changes`, o cache local detecta alterações e é apagado automaticamente sempre que houver manipulações pelo painel administrativo, forçando um *refresh* transparente dos dados.
- **Proxy Dinâmico de Imagens (CDN)**: Para evitar penalizações de peso (Payloads), requisições de imagens originárias de portais de notícias externos são automaticamente roteadas através da CDN pública `wsrv.nl`. O roteador converte as imagens (muitas vezes *JPGs* pesados) para `WebP` on-the-fly, as redimensionando para 800px, garantindo reduções de até 65% em peso.
- **Preload de Maior Tempo de Renderização (LCP)**: Um script acoplado ao cabeçalho interroga o *localStorage* em busca da imagem de capa (primeiro item do carrossel), gerando uma requisição do tipo `<link rel="preload" as="image" fetchpriority="high">` imediatamente no carregamento da página, contornando a demora de descoberta.
- **Zero CLS (Cumulative Layout Shift)**: A renderização do layout foi projetada definindo estruturalmente propriedades dimensionais e classes antecipadas (`has-carousel`), garantindo estabilidade absoluta e pontuação perfeita de CLS durante o bloqueio da renderização principal.

---

## ⚙️ Requisitos Técnicos

- **Navegador Moderno:** Suporte a ES6 modules, CSS Variables, Fetch API e recursos básicos de geolocalização.
- **Node.js (Opcional - Apenas para rotinas administrativas):** A raiz do projeto não depende de Node.js para rodar. Entretanto, scripts auxiliares de conversão e otimização de imagens (`converter_webp.js` e `otimizar_supabase.js`) exigem um ambiente Node.js.

---

## 💻 Guia de Instalação e Execução Local

### 1. Clonando o repositório
Abra seu terminal e faça o clone do projeto:
```bash
git clone https://github.com/seu-usuario/sobralcultural.git
cd sobralcultural
```

### 2. Rodando a Aplicação
Como o projeto não utiliza bundlers (como Vite ou Webpack), você pode servi-lo utilizando qualquer servidor HTTP estático local. 

**Opção A - Extensão do VS Code:**
- Instale a extensão **Live Server**.
- Abra o arquivo `index.html` e clique no botão "Go Live" no rodapé do editor.

**Opção B - Usando Python (se instalado):**
```bash
python3 -m http.server 3000
```

**Opção C - Usando Node.js (se instalado):**
```bash
npx serve .
```

Acesse a aplicação pelo navegador no endereço `http://localhost:3000` ou na porta especificada pelo seu servidor local.

### 3. Configuração do Supabase (Apenas para migrações e scripts)
As credenciais de consumo do Supabase estão configuradas via JavaScript. Para usar os scripts administrativos locais, crie um arquivo `.env` na raiz do projeto copiando o exemplo:

```bash
cp .env.example .env
```
Abra o arquivo `.env` e insira sua chave secreta `SUPABASE_SERVICE_KEY`.

---

## 📚 Documentação da API / Banco de Dados

Como a aplicação adota uma arquitetura Serverless consumindo o Supabase através de seu Client SDK (`@supabase/supabase-js`), não existe uma "API REST" tradicional. As chamadas são feitas diretamente via WebSockets (Realtime) e RPC/Queries. 

Abaixo estão os principais modelos e tabelas utilizados no banco PostgreSQL do Supabase:

### Tabela: `spots` (Pontos Turísticos e Eventos)
Responsável por guardar os locais no mapa.
- `id` (uuid): Identificador único.
- `name` (text): Nome do local ou evento.
- `cat` (text): Categoria (ex: *religioso, cultura, historico, natureza, lazer, eventos*).
- `color` (text): Código hexadecimal para renderização do ícone.
- `lat` / `lng` (float): Coordenadas de geolocalização.
- `description` / `address` / `horario` / `entrada` (text): Metadados de detalhes.
- `photo` (text): URL da imagem de capa (preferencialmente vinda do Supabase Storage).
- `type` (text): Diferenciador de tipo (ex: `spot` ou `event`).
- `event_date` / `event_end` (date): Datas caso o tipo seja de evento.
- `is_featured` (boolean): Flag de destaque (exibido no carrossel).
- `blog_title`, `blog_content`, `blog_author`, `blog_date` (text): Dados do conteúdo interno/blog do spot.

### Tabela: `news` (Notícias)
Conteúdo editorial que aparece como destaque ou num *feed*.
- `id` (uuid)
- `title` (text)
- `cover_image` (text)
- `is_published` (boolean)
- `is_featured` (boolean)
- `created_at` (timestamp)

### Tabela: `reactions` (Interações do Usuário)
Engajamento dos usuários logados com os pontos turísticos.
- `id` (uuid)
- `user_id` (uuid): FK referenciando o `auth.users` do Supabase.
- `spot_id` (uuid): FK referenciando um `spots.id`.
- `reaction` (text): Tipo de reação (`like`, `been` para "Eu fui", `going` para "Eu vou").

### Tabela: `profiles`
Informações e controle de papéis dos usuários.
- `id` (uuid): FK para o sistema de autenticação nativo.
- `role` (text): Permissões (ex: `admin` que libera o link do painel administrativo no menu lateral).

> **Aviso de Segurança**: As políticas do banco de dados (Row Level Security - RLS) do Supabase devem estar rigorosamente configuradas para evitar inserções de dados diretamente pelo client, restringindo acessos e exclusões apenas a usuários autenticados com as devidas *roles*.
