// ============================================
// INTERFACE.JS - Manipulação de Interface
// ============================================

// Destacar item ativo no menu ao fazer scroll
window.addEventListener('scroll', () => {
  const secoes = document.querySelectorAll('section[id]');
  const scrollY = window.pageYOffset;

  secoes.forEach(secao => {
    const secaoHeight = secao.offsetHeight;
    const secaoTop = secao.offsetTop - 100;
    const secaoId = secao.getAttribute('id');

    if (scrollY > secaoTop && scrollY <= secaoTop + secaoHeight) {
      document.querySelectorAll('.navbar-item a').forEach(link => {
        link.classList.remove('ativo');
        if (link.getAttribute('href') === `#${secaoId}`) {
          link.classList.add('ativo');
        }
      });
    }
  });
});

// Animação de loading
function mostrarLoading() {
  const loading = document.createElement('div');
  loading.className = 'loading-overlay';
  loading.innerHTML = '<div class="loading-spinner"></div>';
  document.body.appendChild(loading);
}

function esconderLoading() {
  const loading = document.querySelector('.loading-overlay');
  if (loading) {
    loading.remove();
  }
}

// Scroll to top button
const botaoScrollTop = document.createElement('button');
botaoScrollTop.className = 'botao-scroll-top';
botaoScrollTop.innerHTML = '<span class="material-icons">arrow_upward</span>';
botaoScrollTop.style.cssText = `
  position: fixed;
  bottom: 100px;
  right: 30px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--verde-medio);
  color: var(--branco);
  border: none;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  box-shadow: var(--sombra-media);
  z-index: 999;
  transition: var(--transicao-rapida);
`;

document.body.appendChild(botaoScrollTop);

window.addEventListener('scroll', () => {
  if (window.pageYOffset > 300) {
    botaoScrollTop.style.display = 'flex';
  } else {
    botaoScrollTop.style.display = 'none';
  }
});

botaoScrollTop.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

botaoScrollTop.addEventListener('mouseenter', () => {
  botaoScrollTop.style.background = 'var(--verde-escuro)';
  botaoScrollTop.style.transform = 'scale(1.1)';
});

botaoScrollTop.addEventListener('mouseleave', () => {
  botaoScrollTop.style.background = 'var(--verde-medio)';
  botaoScrollTop.style.transform = 'scale(1)';
});
