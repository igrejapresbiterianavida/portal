# 🌿 IPV Online - Igreja Presbiteriana Vida

Site institucional PWA da **Igreja Presbiteriana Vida** em Campinas-SP.

## 🎯 Sobre o Projeto

Site moderno, responsivo e acessível desenvolvido com:
- **Alpine.js** - Framework reativo leve
- **CSS Puro** - Design system profissional com variáveis CSS
- **PWA** - Progressive Web App com suporte offline
- **APIs** - Integração YouTube, Bíblia Online, EmailJS

## ✨ Funcionalidades

### 📖 Devocionais Diários
- Carrossel com Versículo, Salmo e Provérbio do Dia
- Integração com API Bíblia Digital
- Botão direto para Bíblia Online completa

### 🎥 Cultos Online
- Vídeos do canal YouTube @ipbvida
- Live streaming quando disponível
- Grade responsiva de vídeos

### 📅 Eventos
- Calendário de eventos da igreja
- Cards com imagens e descrições
- Sistema de cadastro via Supabase (planejado)

### ⛪ Doutrinas
- **5 Pontos do Calvinismo (TULIP)**
- **O Que Cremos** - Accordion expansível
- **Confissão de Fé de Westminster** - Página dedicada

### 💰 Contribuições
- QR Code PIX
- Dados bancários completos
- Botão copiar chave PIX

### 📍 Localização
- Google Maps embed
- Botões Waze, Uber, Google Maps
- Horários de cultos
- Informações de contato

### ♿ Acessibilidade
- Aumentar/Diminuir fonte
- Alto contraste
- Narração de página (Text-to-Speech)
- VLibras integrado
- Navegação por teclado
- WCAG 2.1 AA compliant

## 🏗️ Estrutura do Projeto

```
ipvida/
├── assets/
│   └── images/          # Imagens do site
├── css/
│   ├── globais.css      # Variáveis, reset, tipografia
│   ├── componentes.css  # Cards, botões, formulários
│   ├── animacoes.css    # Transições e keyframes
│   ├── mobile.css       # Estilos mobile-first
│   └── desktop.css      # Media queries desktop
├── data/                # 🆕 Dados JSON do site
│   ├── devocionais.json      # Versículos, salmos, provérbios
│   ├── videos.json           # Lista de vídeos do YouTube
│   ├── programacao.json      # Cultos e eventos
│   ├── dados-igreja.json     # Endereço, contato, horários
│   ├── dados-bancarios.json  # PIX e conta bancária
│   ├── redes-sociais.json    # Links das redes sociais
│   ├── README.md             # Documentação dos JSONs
│   ├── GUIA-RAPIDO.md        # Guia de edição rápida
│   └── TEMPLATES.md          # Templates para copiar
├── js/
│   ├── data-manager.js  # 🆕 Gerenciador de dados JSON
│   ├── aplicacao.js     # Lógica principal Alpine.js
│   ├── api-integracao.js # APIs externas
│   ├── acessibilidade.js # Recursos acessibilidade
│   ├── interface.js     # Interações UI
│   └── service-worker.js # PWA offline
├── paginas/
│   └── confissao-fe.html # Confissão Westminster
├── index.html           # Página principal SPA
├── manifest.json        # Configuração PWA
└── README.md           # Este arquivo
```

## 🚀 Como Usar

### Desenvolvimento Local

1. Clone o repositório:
```powershell
git clone https://github.com/squidevs/ipvida.git
cd ipvida
```

2. Abra com um servidor local (ex: Live Server no VS Code)

3. Acesse: `http://localhost:5500`

### 📝 Editando Conteúdo

**Todos os dados do site estão em arquivos JSON na pasta `data/`**

Para atualizar o conteúdo do site:
1. Navegue até a pasta `data/`
2. Edite o arquivo JSON correspondente
3. Consulte o `data/GUIA-RAPIDO.md` para instruções detalhadas
4. Use os templates em `data/TEMPLATES.md`

**Principais arquivos:**
- `dados-igreja.json` - Endereço, telefone, horários
- `dados-bancarios.json` - PIX e conta bancária
- `videos.json` - Vídeos do YouTube
- `programacao.json` - Cultos e eventos
- `redes-sociais.json` - Links das redes sociais

### Deploy

O site é estático e pode ser hospedado em:
- **Netlify** (recomendado)
- **Vercel**
- **GitHub Pages**
- **Firebase Hosting**

## ⚙️ Configurações Necessárias

### YouTube Data API
```javascript
// js/api-integracao.js linha 6
const YOUTUBE_API_KEY = 'SUA_API_KEY_AQUI';
const CANAL_ID = 'UC-XXXXXXXXX';
```

**Como obter:**
1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie projeto "IPV Online"
3. Ative "YouTube Data API v3"
4. Gere chave de API

### Bíblia Online API
Sem necessidade de configuração - API pública da [A Bíblia Digital](https://www.abibliadigital.com.br)

### EmailJS (Opcional)
```javascript
// js/api-integracao.js linha 97
const EMAILJS_SERVICE_ID = 'seu_service_id';
const EMAILJS_TEMPLATE_ID = 'seu_template_id';
const EMAILJS_USER_ID = 'seu_user_id';
```

**Como obter:**
1. Cadastre-se em [EmailJS](https://www.emailjs.com)
2. Configure serviço de email
3. Crie template
4. Copie credenciais

### Supabase (Opcional - Futuro)
Para sistema de autenticação e banco de dados de eventos.

## 🎨 Sistema de Design

### Cores
```css
--verde-escuro: #1A4731   /* Cor principal */
--verde-medio: #2D6A4F    /* Secundária */
--verde-claro: #52B788    /* Destaque */
--dourado: #D4AF37        /* Acentos */
--branco: #FFFFFF         /* Fundo */
--cinza-leve: #E9ECEF     /* Backgrounds alternativos */
```

### Tipografia
- **Principal:** Inter (Google Fonts)
- **Secundária:** Roboto
- Pesos: 300, 400, 600, 700, 900

### Espaçamentos
- XS: 0.5rem (8px)
- SM: 1rem (16px)
- MD: 1.5rem (24px)
- LG: 2rem (32px)
- XL: 3rem (48px)
- XXL: 4rem (64px)

## 📱 Responsividade

- **Mobile:** < 768px (base)
- **Tablet:** 768px - 1023px
- **Desktop:** 1024px - 1439px
- **Large Desktop:** ≥ 1440px

## 📊 Performance

### Metas Lighthouse
- Performance: ≥ 90
- Acessibilidade: ≥ 95
- Best Practices: ≥ 90
- SEO: ≥ 95

### Otimizações
- CSS minificado em produção
- Imagens otimizadas (WebP)
- Lazy loading de imagens
- Service Worker para cache
- Fonts preload

## 🔐 Segurança

- HTTPS obrigatório
- CSP Headers configurados
- Sem inline scripts perigosos
- Sanitização de inputs
- Rate limiting em APIs

## 📄 Licença

© 2025 Igreja Presbiteriana Vida. Todos os direitos reservados.

## 👥 Contato

**Igreja Presbiteriana Vida**
- 📍 Av. Antonio Carlos do Amaral, s/n - Res. Cosmos, Campinas-SP
- 📞 (19) 99516-1006
- 📧 contato@ipvida.com.br
- 📱 Instagram: [@ip.vida](https://instagram.com/ip.vida)
- 📺 YouTube: [@ipbvida](https://youtube.com/@ipbvida)
- 👤 Pastor: Rev. Enéias Mendes [@pr.eneiasmendes](https://instagram.com/pr.eneiasmendes)

---

**Desenvolvido com ❤️ para a glória de Deus**
