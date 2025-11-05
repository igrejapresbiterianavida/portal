// ============================================
// ACESSIBILIDADE.JS - Recursos de Acessibilidade
// ============================================

function acessibilidade() {
  return {
    tamanhoFonte: 100,
    contrasteAtivo: false,
    narracaoAtiva: false,
    menuAberto: false,
    synth: null,
    
    init() {
      this.synth = window.speechSynthesis;
      this.restaurarConfiguracoes();
    },
    
    aumentarFonte() {
      if (this.tamanhoFonte < 150) {
        this.tamanhoFonte += 10;
        document.documentElement.style.fontSize = this.tamanhoFonte + '%';
        this.salvarConfiguracoes();
      }
    },
    
    diminuirFonte() {
      if (this.tamanhoFonte > 70) {
        this.tamanhoFonte -= 10;
        document.documentElement.style.fontSize = this.tamanhoFonte + '%';
        this.salvarConfiguracoes();
      }
    },
    
    toggleContraste() {
      this.contrasteAtivo = !this.contrasteAtivo;
      document.body.classList.toggle('alto-contraste', this.contrasteAtivo);
      this.salvarConfiguracoes();
    },
    
    toggleNarracao() {
      this.narracaoAtiva = !this.narracaoAtiva;
      
      if (this.narracaoAtiva) {
        this.narrarPagina();
      } else {
        this.pararNarracao();
      }
    },
    
    narrarPagina() {
      if (!this.synth) return;
      
      // Parar qualquer narração anterior
      this.synth.cancel();
      
      // Pegar todo texto visível da página
      const elementos = document.querySelectorAll('h1, h2, h3, p, a, button');
      let textos = [];
      
      elementos.forEach(el => {
        if (el.offsetParent !== null) { // Apenas elementos visíveis
          const texto = el.textContent.trim();
          if (texto) textos.push(texto);
        }
      });
      
      const textoCompleto = textos.join('. ');
      
      const utterance = new SpeechSynthesisUtterance(textoCompleto);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onend = () => {
        this.narracaoAtiva = false;
      };
      
      this.synth.speak(utterance);
    },
    
    pararNarracao() {
      if (this.synth) {
        this.synth.cancel();
      }
    },
    
    salvarConfiguracoes() {
      localStorage.setItem('acessibilidade', JSON.stringify({
        tamanhoFonte: this.tamanhoFonte,
        contrasteAtivo: this.contrasteAtivo
      }));
    },
    
    restaurarConfiguracoes() {
      const salvo = localStorage.getItem('acessibilidade');
      if (salvo) {
        const config = JSON.parse(salvo);
        this.tamanhoFonte = config.tamanhoFonte || 100;
        this.contrasteAtivo = config.contrasteAtivo || false;
        
        document.documentElement.style.fontSize = this.tamanhoFonte + '%';
        document.body.classList.toggle('alto-contraste', this.contrasteAtivo);
      }
    }
  };
}

// Navegação por Teclado
document.addEventListener('keydown', (e) => {
  // Tab: navegar entre elementos focáveis
  // Esc: fechar modais
  if (e.key === 'Escape') {
    const menuAberto = document.querySelector('.navbar-menu.aberto');
    if (menuAberto) {
      menuAberto.classList.remove('aberto');
    }
  }
});

// Garantir que todos links externos abram em nova aba
document.addEventListener('DOMContentLoaded', () => {
  const linksExternos = document.querySelectorAll('a[href^="http"]');
  linksExternos.forEach(link => {
    if (!link.hostname.includes(window.location.hostname)) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
});
