# Instruções para aplicar os fixes

## Fix 1 — `sobral_perfil.js` (SPOTS_MAP is not defined)

Abra o arquivo `sobral_perfil.js` no GitHub ou editor.  
Encontre as primeiras linhas (topo do arquivo):

```js
let currentTab='mymap';
let currentFavFilter='all';
let profileMap=null;
```

**Adicione a linha abaixo de `let profileMap=null;`:**

```js
let SPOTS_MAP={}; // fix: cache global de spots
```

Resultado final do topo do arquivo:
```js
let currentTab='mymap';
let currentFavFilter='all';
let profileMap=null;
let SPOTS_MAP={}; // fix: cache global de spots
```

---

## Fix 2 — `navigate.js` (novo arquivo — tela branca na navegação)

Crie um novo arquivo chamado `navigate.js` na raiz do repositório  
com o conteúdo do arquivo `navigate.js` fornecido.

Depois, adicione `<script src="navigate.js"></script>` em **todos os HTMLs**,  
logo após a linha `<script src="head.js"></script>`:

```html
<script src="head.js"></script>
<script src="navigate.js"></script>  ← adicionar esta linha
```

Arquivos HTML a atualizar:
- index.html
- sobral_perfil.html
- sobral_login.html
- sobral_admin.html
- sobral_post.html
- sobral_submeter.html
- sobral_contato.html
- sobral_sobre.html
- sobral_noticias.html
- sobral_game.html
- sobral_termos.html

---

## Como fazer pelo GitHub Web (sem terminal)

1. Acesse https://github.com/Tomdrd/v15-com-supabase
2. Clique no arquivo que quer editar
3. Clique no ícone de lápis ✏️ (Edit this file)
4. Faça a alteração
5. Clique em "Commit changes"
