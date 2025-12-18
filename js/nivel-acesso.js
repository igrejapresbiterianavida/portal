// ============================================
// NIVEL-ACESSO.JS - Componente de Seleção de Nível de Acesso
// ============================================

/**
 * Componente Alpine.js para seleção de nível de acesso
 * Usado em formulários do admin para definir quem pode ver o conteúdo
 */
function seletorNivelAcesso() {
  return {
    opcoes: [
      { 
        valor: 'visitante', 
        label: 'Visitantes', 
        descricao: 'Visível para qualquer pessoa',
        icone: 'public',
        cor: '#1A4731'
      },
      { 
        valor: 'membro', 
        label: 'Membros', 
        descricao: 'Apenas membros da igreja',
        icone: 'people',
        cor: '#2D5F4A'
      },
      { 
        valor: 'lideranca', 
        label: 'Liderança', 
        descricao: 'Apenas líderes e pastores',
        icone: 'admin_panel_settings',
        cor: '#C8A45C'
      },
      { 
        valor: 'administracao', 
        label: 'Administração', 
        descricao: 'Apenas administradores',
        icone: 'security',
        cor: '#AD0F0E'
      }
    ],
    
    // Valores selecionados
    selecionados: ['visitante', 'membro', 'lideranca', 'administracao'],
    
    /**
     * Inicializa o componente com valores existentes
     * @param {Array|string} valores - Array de níveis ou string única
     */
    init(valores) {
      if (valores) {
        this.selecionados = Array.isArray(valores) ? [...valores] : [valores];
      }
    },
    
    /**
     * Alterna a seleção de um nível
     * @param {string} valor
     */
    toggle(valor) {
      const index = this.selecionados.indexOf(valor);
      
      if (index > -1) {
        // Não permitir remover todos
        if (this.selecionados.length > 1) {
          this.selecionados.splice(index, 1);
        }
      } else {
        this.selecionados.push(valor);
      }
      
      // Ordenar para consistência
      this.ordenar();
    },
    
    /**
     * Verifica se um valor está selecionado
     * @param {string} valor
     * @returns {boolean}
     */
    estaSelecionado(valor) {
      return this.selecionados.includes(valor);
    },
    
    /**
     * Seleciona apenas "todos" (visitante)
     */
    selecionarTodos() {
      this.selecionados = ['visitante', 'membro', 'lideranca', 'administracao'];
    },
    
    /**
     * Seleciona apenas membros e acima
     */
    selecionarMembros() {
      this.selecionados = ['membro', 'lideranca', 'administracao'];
    },
    
    /**
     * Seleciona apenas liderança e admin
     */
    selecionarLideranca() {
      this.selecionados = ['lideranca', 'administracao'];
    },
    
    /**
     * Seleciona apenas admin
     */
    selecionarAdmin() {
      this.selecionados = ['administracao'];
    },
    
    /**
     * Ordena os valores selecionados pela hierarquia
     */
    ordenar() {
      const ordem = ['visitante', 'membro', 'lideranca', 'administracao'];
      this.selecionados.sort((a, b) => ordem.indexOf(a) - ordem.indexOf(b));
    },
    
    /**
     * Retorna os valores selecionados para salvar
     * @returns {Array}
     */
    obterValores() {
      return [...this.selecionados];
    },
    
    /**
     * Retorna um resumo textual da seleção
     * @returns {string}
     */
    obterResumo() {
      if (this.selecionados.includes('visitante')) {
        return 'Público (todos podem ver)';
      }
      if (this.selecionados.length === 3 && !this.selecionados.includes('visitante')) {
        return 'Membros e acima';
      }
      if (this.selecionados.length === 2 && this.selecionados.includes('lideranca') && this.selecionados.includes('administracao')) {
        return 'Apenas liderança';
      }
      if (this.selecionados.length === 1 && this.selecionados[0] === 'administracao') {
        return 'Apenas administração';
      }
      
      return this.selecionados
        .map(v => this.opcoes.find(o => o.valor === v)?.label || v)
        .join(', ');
    },
    
    /**
     * Retorna a cor do badge baseado na seleção
     * @returns {string}
     */
    obterCor() {
      if (this.selecionados.includes('visitante')) return '#1A4731';
      if (this.selecionados.includes('membro')) return '#2D5F4A';
      if (this.selecionados.includes('lideranca')) return '#C8A45C';
      return '#AD0F0E';
    }
  };
}

// Exportar para uso global
window.seletorNivelAcesso = seletorNivelAcesso;

/**
 * Helper para criar HTML do seletor de nível de acesso
 * @returns {string} HTML template
 */
window.templateNivelAcesso = `
<div class="nivel-acesso-container" x-data="seletorNivelAcesso()" x-init="init(formulario.nivel_acesso)">
  <label class="formulario-label">
    <span class="material-icons" style="font-size: 18px; vertical-align: middle;">visibility</span>
    Quem pode ver este conteúdo?
  </label>
  
  <div class="nivel-acesso-atalhos" style="margin-bottom: 10px; display: flex; gap: 8px; flex-wrap: wrap;">
    <button type="button" @click="selecionarTodos()" class="btn-atalho" :class="{'ativo': selecionados.includes('visitante')}">
      <span class="material-icons">public</span> Todos
    </button>
    <button type="button" @click="selecionarMembros()" class="btn-atalho" :class="{'ativo': !selecionados.includes('visitante') && selecionados.includes('membro')}">
      <span class="material-icons">people</span> Membros
    </button>
    <button type="button" @click="selecionarLideranca()" class="btn-atalho" :class="{'ativo': !selecionados.includes('membro') && selecionados.includes('lideranca')}">
      <span class="material-icons">admin_panel_settings</span> Liderança
    </button>
    <button type="button" @click="selecionarAdmin()" class="btn-atalho" :class="{'ativo': selecionados.length === 1 && selecionados[0] === 'administracao'}">
      <span class="material-icons">security</span> Apenas Admin
    </button>
  </div>
  
  <div class="nivel-acesso-opcoes" style="display: flex; flex-wrap: wrap; gap: 10px;">
    <template x-for="opcao in opcoes" :key="opcao.valor">
      <label class="nivel-acesso-opcao" :class="{'selecionado': estaSelecionado(opcao.valor)}" :style="estaSelecionado(opcao.valor) ? 'border-color: ' + opcao.cor + '; background: ' + opcao.cor + '15' : ''">
        <input type="checkbox" 
               :value="opcao.valor" 
               :checked="estaSelecionado(opcao.valor)" 
               @change="toggle(opcao.valor); formulario.nivel_acesso = obterValores()"
               style="display: none;">
        <span class="material-icons" :style="'color: ' + opcao.cor">
          <span x-text="opcao.icone"></span>
        </span>
        <div class="opcao-info">
          <strong x-text="opcao.label"></strong>
          <small x-text="opcao.descricao"></small>
        </div>
        <span class="checkmark" x-show="estaSelecionado(opcao.valor)">
          <span class="material-icons" style="font-size: 16px; color: #10B981;">check</span>
        </span>
      </label>
    </template>
  </div>
  
  <div class="nivel-acesso-resumo" style="margin-top: 10px; padding: 8px 12px; background: #f3f4f6; border-radius: 6px; font-size: 0.85rem;">
    <span class="material-icons" style="font-size: 16px; vertical-align: middle; color: var(--cor-primaria);">info</span>
    <span x-text="obterResumo()"></span>
  </div>
</div>

<style>
.nivel-acesso-container {
  margin-bottom: 20px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

.btn-atalho {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.btn-atalho:hover {
  border-color: var(--cor-primaria);
  color: var(--cor-primaria);
}

.btn-atalho.ativo {
  background: var(--cor-primaria);
  color: white;
  border-color: var(--cor-primaria);
}

.btn-atalho .material-icons {
  font-size: 16px;
}

.nivel-acesso-opcao {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  min-width: 200px;
}

.nivel-acesso-opcao:hover {
  border-color: #9ca3af;
}

.nivel-acesso-opcao.selecionado {
  border-width: 2px;
}

.nivel-acesso-opcao .material-icons {
  font-size: 24px;
}

.opcao-info {
  flex: 1;
}

.opcao-info strong {
  display: block;
  font-size: 0.9rem;
  color: #1f2937;
}

.opcao-info small {
  font-size: 0.75rem;
  color: #6b7280;
}

.checkmark {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #d1fae5;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
`;

console.log('✅ Sistema de Nível de Acesso carregado');

