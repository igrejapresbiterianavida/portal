// ============================================
// ADMIN-CRUD-USUARIOS.JS - CRUD de Usuários
// ============================================

// ==================== CRUD USUÁRIOS ====================
function crudUsuarios() {
  return {
    usuarios: [],
    usuarioEditando: null,
    modalAberto: false,
    carregando: false,
    formulario: {
      nome: '',
      sobrenome: '',
      email: '',
      telefone: '',
      tipo: 'visitante',
      status: 'ativo'
    },
    tipos: [
      { valor: 'visitante', label: 'Visitante' },
      { valor: 'membro', label: 'Membro' },
      { valor: 'lideranca', label: 'Liderança' },
      { valor: 'administracao', label: 'Administração' }
    ],

    async init() {
      await this.carregar();
    },

    async carregar() {
      this.carregando = true;
      try {
        this.usuarios = await window.supabaseClient.listar('usuarios', {
          ordem: { campo: 'data_criacao', ascendente: false }
        });
      } catch (erro) {
        console.error('Erro ao carregar usuários:', erro);
        alert('Erro ao carregar usuários');
      } finally {
        this.carregando = false;
      }
    },

    abrirModal(usuario = null) {
      this.usuarioEditando = usuario;
      if (usuario) {
        this.formulario = {
          nome: usuario.nome || '',
          sobrenome: usuario.sobrenome || '',
          email: usuario.email || '',
          telefone: usuario.telefone || '',
          tipo: usuario.tipo || 'visitante',
          status: usuario.status || 'ativo'
        };
      } else {
        this.formulario = {
          nome: '',
          sobrenome: '',
          email: '',
          telefone: '',
          tipo: 'visitante',
          status: 'ativo'
        };
      }
      this.modalAberto = true;
    },

    fecharModal() {
      this.modalAberto = false;
      this.usuarioEditando = null;
      this.formulario = {};
    },

    async salvar() {
      if (!this.formulario.nome || !this.formulario.email) {
        alert('Nome e email são obrigatórios');
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.formulario.email)) {
        alert('Por favor, insira um email válido');
        return;
      }

      this.carregando = true;

      try {
        if (this.usuarioEditando) {
          // Atualizar usuário existente
          await window.supabaseClient.atualizar('usuarios', this.usuarioEditando.id, this.formulario);
          alert('Usuário atualizado com sucesso!');
        } else {
          // Criar novo usuário
          // Verificar se já existe um usuário com este email
          const usuariosExistentes = await window.supabaseClient.listar('usuarios');
          const emailExistente = usuariosExistentes.find(u => u.email.toLowerCase() === this.formulario.email.toLowerCase());
          
          if (emailExistente) {
            alert('Já existe um usuário com este email');
            this.carregando = false;
            return;
          }

          // Criar novo usuário (sem auth_user_id - será vinculado quando fizer login)
          const novoUsuario = {
            nome: this.formulario.nome,
            sobrenome: this.formulario.sobrenome || '',
            email: this.formulario.email.toLowerCase(),
            telefone: this.formulario.telefone || '',
            tipo: this.formulario.tipo || 'visitante',
            status: this.formulario.status || 'ativo'
          };

          await window.supabaseClient.criar('usuarios', novoUsuario);
          alert('Usuário criado com sucesso! O usuário poderá fazer login com Google usando este email.');
        }

        this.fecharModal();
        await this.carregar();
      } catch (erro) {
        console.error('Erro ao salvar usuário:', erro);
        alert('Erro ao salvar usuário: ' + erro.message);
      } finally {
        this.carregando = false;
      }
    },

    async deletar(id) {
      if (!confirm('Tem certeza que deseja deletar este usuário? Esta ação não pode ser desfeita.')) return;

      this.carregando = true;
      try {
        // Primeiro, buscar o auth_user_id do usuário
        const usuario = this.usuarios.find(u => u.id === id);
        if (!usuario) {
          throw new Error('Usuário não encontrado');
        }

        const authUserId = usuario.auth_user_id;
        
        if (!authUserId) {
          // Se não tem auth_user_id, deletar apenas de usuarios
          await window.supabaseClient.deletar('usuarios', id);
        } else {
          // Deletar de auth.users primeiro (vai acionar CASCADE e deletar de usuarios também)
          // Usar função RPC que tem permissão para deletar de auth.users
          const { error: rpcError } = await window.supabaseClient.client
            .rpc('deletar_usuario_auth', { auth_user_id_param: authUserId });
          
          if (rpcError) {
            // Se a função RPC não existir ou der erro, tentar deletar apenas de usuarios
            console.warn('Erro ao deletar via RPC, tentando deletar apenas de usuarios:', rpcError);
            await window.supabaseClient.deletar('usuarios', id);
          }
        }
        
        await this.carregar();
        alert('Usuário deletado com sucesso!');
      } catch (erro) {
        console.error('Erro ao deletar:', erro);
        alert('Erro ao deletar usuário: ' + erro.message);
      } finally {
        this.carregando = false;
      }
    },

    async alterarTipo(usuarioId, novoTipo) {
      if (!confirm(`Alterar tipo do usuário para "${novoTipo}"?`)) return;

      this.carregando = true;
      try {
        await window.supabaseClient.atualizar('usuarios', usuarioId, { tipo: novoTipo });
        await this.carregar();
        alert('Tipo do usuário alterado com sucesso!');
      } catch (erro) {
        console.error('Erro ao alterar tipo:', erro);
        alert('Erro ao alterar tipo: ' + erro.message);
      } finally {
        this.carregando = false;
      }
    },

    async alterarStatus(usuarioId, novoStatus) {
      this.carregando = true;
      try {
        await window.supabaseClient.atualizar('usuarios', usuarioId, { status: novoStatus });
        await this.carregar();
        alert('Status do usuário alterado com sucesso!');
      } catch (erro) {
        console.error('Erro ao alterar status:', erro);
        alert('Erro ao alterar status: ' + erro.message);
      } finally {
        this.carregando = false;
      }
    },

    formatarData(dataString) {
      if (!dataString) return '-';
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    },

    getLabelTipo(tipo) {
      const tipoObj = this.tipos.find(t => t.valor === tipo);
      return tipoObj ? tipoObj.label : tipo;
    }
  };
}

