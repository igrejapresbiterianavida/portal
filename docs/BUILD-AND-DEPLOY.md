# 🔐 Build com JavaScript Obfuscator + Deploy no GitHub Pages

Este guia cria um pipeline simples para gerar uma pasta `dist/` com todos os arquivos estáticos e o JavaScript ofuscado (usando `javascript-obfuscator@latest`). Em seguida, mostra como publicar em **GitHub Pages**.

> **Pré-requisitos**
>
> - Node.js 18+ instalado
> - Git configurado e repositório versionado

---

## 1. Inicializar o ambiente Node

```bash
npm init -y
```

## 2. Instalar dependências de build

```bash
npm install --save-dev \
  javascript-obfuscator@latest \
  shx \
  npm-run-all \
  gh-pages
```

| Pacote | Função |
| ------ | ------ |
| `javascript-obfuscator` | Ofuscar os arquivos `.js` |
| `shx` | Comandos shell multiplataforma (`cp`, `rm`, etc.) |
| `npm-run-all` | Executar scripts sequenciais |
| `gh-pages` | Publicar a pasta `dist/` no GitHub Pages |

## 3. Adicionar scripts no `package.json`

```jsonc
"scripts": {
  "build:clean": "shx rm -rf dist && shx mkdir -p dist",
  "build:copy": "shx cp -r assets dist/assets && shx cp -r css dist/css && shx cp -r pagina dist/pagina && shx cp index.html dist/index.html && shx cp manifest.json dist/manifest.json && shx cp browserconfig.xml dist/browserconfig.xml && shx cp -r data dist/data",
  "build:js": "javascript-obfuscator js --output dist/js --config javascript-obfuscator.config.json",
  "build": "npm-run-all build:clean build:copy build:js",
  "deploy": "npm run build && gh-pages -d dist"
}
```

> Ajuste o script `build:copy` se adicionar novos diretórios/arquivos estáticos.

## 4. Criar arquivo de configuração do obfuscator

Arquivo: `javascript-obfuscator.config.json`

```json
{
  "compact": true,
  "controlFlowFlattening": true,
  "controlFlowFlatteningThreshold": 0.8,
  "deadCodeInjection": true,
  "deadCodeInjectionThreshold": 0.4,
  "debugProtection": false,
  "identifierNamesGenerator": "hexadecimal",
  "numbersToExpressions": true,
  "renameGlobals": false,
  "selfDefending": true,
  "simplify": true,
  "splitStrings": true,
  "splitStringsChunkLength": 5,
  "stringArray": true,
  "stringArrayEncoding": ["base64"],
  "stringArrayThreshold": 0.75,
  "target": "browser",
  "transformObjectKeys": true,
  "unicodeEscapeSequence": false
}
```

## 5. Gerar build ofuscada

```bash
npm run build
```

Resultado:

```
dist/
  assets/...
  css/...
  pagina/...
  js/        ← Javascript ofuscado
  index.html
  ...
```

## 6. Deploy no GitHub Pages

1. Configure o repositório remoto no GitHub (ex.: `https://github.com/usuario/portal.git`).
2. Execute:

```bash
git add .
git commit -m "chore: preparar build obfuscada"
npm run deploy
```

O `gh-pages` cria/atualiza o branch `gh-pages` com a pasta `dist/`.

3. No GitHub ➜ *Settings* ➜ *Pages* ➜ selecione `Deploy from a branch` e o branch `gh-pages`.
4. Aguarde alguns minutos. A página ficará disponível em `https://usuario.github.io/portal/`.

## 7. Dicas

- Execute `npm run build` sempre que alterar os arquivos.
- Limpe o branch `gh-pages` apenas através do script para evitar inconsistências.
- O `javascript-obfuscator` aumenta o tempo de build. Se precisar depurar, comente o script `build:js`.
- Use um `.gitignore` para evitar versionar `dist/` e `node_modules/`.

Pronto! Agora você tem uma build ofuscada pronta para GitHub Pages. 🚀

