// ============================================
// UPLOAD-IMAGENS.JS - Sistema de Upload de Imagens
// ============================================

/**
 * Componente Alpine.js para upload de imagens
 */
function uploadImagens() {
  return {
    arquivoSelecionado: null,
    previewUrl: null,
    carregando: false,
    progresso: 0,
    erro: null,
    imagensRecentes: [],
    
    // Configurações
    maxSize: 5 * 1024 * 1024, // 5MB
    tiposPermitidos: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    
    async init() {
      await this.carregarImagensRecentes();
    },
    
    async carregarImagensRecentes() {
      try {
        if (window.supabaseClient && window.supabaseClient.client) {
          const { data, error } = await window.supabaseClient.client
            .storage
            .from('imagens')
            .list('uploads', {
              limit: 20,
              offset: 0,
              sortBy: { column: 'created_at', order: 'desc' }
            });
          
          if (error) throw error;
          
          this.imagensRecentes = (data || [])
            .filter(f => f.name !== '.emptyFolderPlaceholder')
            .map(f => ({
              nome: f.name,
              url: this.obterUrlPublica(`uploads/${f.name}`),
              tamanho: this.formatarTamanho(f.metadata?.size || 0),
              criado: f.created_at
            }));
        }
      } catch (error) {
        console.error('Erro ao carregar imagens:', error);
      }
    },
    
    selecionarArquivo(event) {
      const arquivo = event.target.files[0];
      if (!arquivo) return;
      
      this.erro = null;
      
      // Validar tipo
      if (!this.tiposPermitidos.includes(arquivo.type)) {
        this.erro = 'Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WEBP.';
        return;
      }
      
      // Validar tamanho
      if (arquivo.size > this.maxSize) {
        this.erro = `Arquivo muito grande. Máximo: ${this.formatarTamanho(this.maxSize)}`;
        return;
      }
      
      this.arquivoSelecionado = arquivo;
      
      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(arquivo);
    },
    
    async fazerUpload(pasta = 'uploads') {
      if (!this.arquivoSelecionado) {
        this.erro = 'Selecione um arquivo primeiro';
        return null;
      }
      
      this.carregando = true;
      this.progresso = 0;
      this.erro = null;
      
      try {
        // Gerar nome único
        const extensao = this.arquivoSelecionado.name.split('.').pop();
        const nomeArquivo = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${extensao}`;
        const caminho = `${pasta}/${nomeArquivo}`;
        
        // Simular progresso (Supabase não oferece progresso real)
        const intervaloProgresso = setInterval(() => {
          if (this.progresso < 90) {
            this.progresso += 10;
          }
        }, 200);
        
        // Fazer upload
        const { data, error } = await window.supabaseClient.client
          .storage
          .from('imagens')
          .upload(caminho, this.arquivoSelecionado, {
            cacheControl: '3600',
            upsert: false
          });
        
        clearInterval(intervaloProgresso);
        
        if (error) throw error;
        
        this.progresso = 100;
        
        // Obter URL pública
        const urlPublica = this.obterUrlPublica(caminho);
        
        // Atualizar lista de imagens recentes
        await this.carregarImagensRecentes();
        
        // Limpar seleção
        this.limpar();
        
        if (window.mostrarToast) {
          window.mostrarToast('Imagem enviada com sucesso!', 'sucesso');
        }
        
        return urlPublica;
        
      } catch (error) {
        console.error('Erro no upload:', error);
        this.erro = error.message || 'Erro ao enviar imagem';
        return null;
      } finally {
        this.carregando = false;
      }
    },
    
    obterUrlPublica(caminho) {
      if (!window.supabaseClient || !window.supabaseClient.client) return '';
      
      const { data } = window.supabaseClient.client
        .storage
        .from('imagens')
        .getPublicUrl(caminho);
      
      return data?.publicUrl || '';
    },
    
    async excluirImagem(caminho) {
      if (!confirm('Excluir esta imagem?')) return;
      
      try {
        const { error } = await window.supabaseClient.client
          .storage
          .from('imagens')
          .remove([caminho]);
        
        if (error) throw error;
        
        await this.carregarImagensRecentes();
        
        if (window.mostrarToast) {
          window.mostrarToast('Imagem excluída', 'sucesso');
        }
      } catch (error) {
        console.error('Erro ao excluir:', error);
      }
    },
    
    copiarUrl(url) {
      navigator.clipboard.writeText(url).then(() => {
        if (window.mostrarToast) {
          window.mostrarToast('URL copiada!', 'sucesso');
        }
      });
    },
    
    limpar() {
      this.arquivoSelecionado = null;
      this.previewUrl = null;
      this.progresso = 0;
      this.erro = null;
      
      // Limpar input file
      const input = document.querySelector('input[type="file"]');
      if (input) input.value = '';
    },
    
    formatarTamanho(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    formatarData(data) {
      if (!data) return '';
      return new Date(data).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };
}

/**
 * Componente para campo de imagem em formulários
 */
function campoImagem(valorInicial = '') {
  return {
    url: valorInicial,
    arquivoSelecionado: null,
    previewUrl: null,
    carregando: false,
    erro: null,
    modalAberto: false,
    imagensBiblioteca: [],
    abaAtiva: 'upload', // 'upload' ou 'biblioteca'
    
    init() {
      if (this.url) {
        this.previewUrl = this.url;
      }
    },
    
    abrirModal() {
      this.modalAberto = true;
      if (this.abaAtiva === 'biblioteca') {
        this.carregarBiblioteca();
      }
    },
    
    fecharModal() {
      this.modalAberto = false;
      this.arquivoSelecionado = null;
      this.erro = null;
    },
    
    async carregarBiblioteca() {
      try {
        if (window.supabaseClient && window.supabaseClient.client) {
          const { data, error } = await window.supabaseClient.client
            .storage
            .from('imagens')
            .list('uploads', {
              limit: 50,
              sortBy: { column: 'created_at', order: 'desc' }
            });
          
          if (error) throw error;
          
          this.imagensBiblioteca = (data || [])
            .filter(f => f.name !== '.emptyFolderPlaceholder')
            .map(f => ({
              nome: f.name,
              url: this.obterUrlPublica(`uploads/${f.name}`)
            }));
        }
      } catch (error) {
        console.error('Erro ao carregar biblioteca:', error);
      }
    },
    
    trocarAba(aba) {
      this.abaAtiva = aba;
      if (aba === 'biblioteca') {
        this.carregarBiblioteca();
      }
    },
    
    selecionarArquivo(event) {
      const arquivo = event.target.files[0];
      if (!arquivo) return;
      
      this.erro = null;
      
      const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!tiposPermitidos.includes(arquivo.type)) {
        this.erro = 'Tipo de arquivo não permitido';
        return;
      }
      
      if (arquivo.size > 5 * 1024 * 1024) {
        this.erro = 'Arquivo muito grande (máx: 5MB)';
        return;
      }
      
      this.arquivoSelecionado = arquivo;
    },
    
    async confirmarUpload() {
      if (!this.arquivoSelecionado) return;
      
      this.carregando = true;
      this.erro = null;
      
      try {
        const extensao = this.arquivoSelecionado.name.split('.').pop();
        const nomeArquivo = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${extensao}`;
        const caminho = `uploads/${nomeArquivo}`;
        
        const { data, error } = await window.supabaseClient.client
          .storage
          .from('imagens')
          .upload(caminho, this.arquivoSelecionado, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (error) throw error;
        
        const urlPublica = this.obterUrlPublica(caminho);
        this.selecionarImagem(urlPublica);
        
      } catch (error) {
        console.error('Erro no upload:', error);
        this.erro = error.message || 'Erro ao enviar imagem';
      } finally {
        this.carregando = false;
      }
    },
    
    selecionarImagem(url) {
      this.url = url;
      this.previewUrl = url;
      this.fecharModal();
      
      // Disparar evento para formulário
      this.$dispatch('imagem-selecionada', { url: url });
    },
    
    removerImagem() {
      this.url = '';
      this.previewUrl = null;
      this.$dispatch('imagem-selecionada', { url: '' });
    },
    
    obterUrlPublica(caminho) {
      if (!window.supabaseClient || !window.supabaseClient.client) return '';
      
      const { data } = window.supabaseClient.client
        .storage
        .from('imagens')
        .getPublicUrl(caminho);
      
      return data?.publicUrl || '';
    }
  };
}

/**
 * Inicializar drag and drop global
 */
function initDragAndDrop() {
  document.addEventListener('DOMContentLoaded', () => {
    const dropZones = document.querySelectorAll('[data-upload-zone]');
    
    dropZones.forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
      });
      
      zone.addEventListener('dragleave', () => {
        zone.classList.remove('drag-over');
      });
      
      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          const input = zone.querySelector('input[type="file"]');
          if (input) {
            // Criar novo evento com os arquivos
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(files[0]);
            input.files = dataTransfer.files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      });
    });
  });
}

// Inicializar
initDragAndDrop();

// Registrar componentes globalmente
window.uploadImagens = uploadImagens;
window.campoImagem = campoImagem;

