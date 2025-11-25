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
      status: 'ativo',
      senha: '',
      confirmarSenha: ''
    },
    resetandoSenha: false,
    usuarioResetandoSenha: null,
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
          status: usuario.status || 'ativo',
          senha: '',
          confirmarSenha: ''
        };
      } else {
        this.formulario = {
          nome: '',
          sobrenome: '',
          email: '',
          telefone: '',
          tipo: 'visitante',
          status: 'ativo',
          senha: '',
          confirmarSenha: ''
        };
      }
      this.modalAberto = true;
    },

    fecharModal() {
      this.modalAberto = false;
      this.usuarioEditando = null;
      this.formulario = {
        nome: '',
        sobrenome: '',
        email: '',
        telefone: '',
        tipo: 'visitante',
        status: 'ativo',
        senha: '',
        confirmarSenha: ''
      };
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

      // Validar senha ao criar novo usuário
      if (!this.usuarioEditando && !this.formulario.senha) {
        alert('Ao criar um novo usuário, é necessário definir uma senha');
        return;
      }

      // Validar confirmação de senha ao criar novo usuário
      if (!this.usuarioEditando && this.formulario.senha) {
        if (this.formulario.senha !== this.formulario.confirmarSenha) {
          alert('As senhas não coincidem');
          return;
        }
        if (this.formulario.senha.length < 6) {
          alert('A senha deve ter pelo menos 6 caracteres');
          return;
        }
      }

      this.carregando = true;

      try {
        if (this.usuarioEditando) {
          // Atualizar usuário existente
          const dadosParaAtualizar = {
            nome: this.formulario.nome,
            sobrenome: this.formulario.sobrenome || '',
            telefone: this.formulario.telefone || '',
            tipo: this.formulario.tipo || 'visitante',
            status: this.formulario.status || 'ativo'
          };
          
          // Se tiver senha preenchida, atualizar senha também
          if (this.formulario.senha && this.formulario.senha.length >= 6) {
            if (this.formulario.senha !== this.formulario.confirmarSenha) {
              alert('As senhas não coincidem');
              this.carregando = false;
              return;
            }
            
            // Atualizar senha no Supabase Auth
            if (window.supabaseClient && window.supabaseClient.client && this.usuarioEditando.auth_user_id) {
              // Usar admin API para atualizar senha de outro usuário
              // Isso precisa ser feito via Edge Function com SERVICE_ROLE_KEY
              try {
                await window.supabaseClient.chamarEdgeFunction('atualizar-senha-usuario', {
                  auth_user_id: this.usuarioEditando.auth_user_id,
                  nova_senha: this.formulario.senha
                });
              } catch (erro) {
                console.warn('Erro ao atualizar senha (pode não ter Edge Function):', erro);
                alert('Aviso: Dados atualizados, mas não foi possível atualizar a senha. O usuário pode precisar resetá-la pelo perfil.');
              }
            }
          }
          
          await window.supabaseClient.atualizar('usuarios', this.usuarioEditando.id, dadosParaAtualizar);
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

          // Criar usuário no Supabase Auth primeiro
          let authUserId = null;
          if (window.supabaseClient && window.supabaseClient.client && this.formulario.senha) {
            try {
              const { data: authData, error: authError } = await window.supabaseClient.client.auth.admin.createUser({
                email: this.formulario.email.toLowerCase(),
                password: this.formulario.senha,
                email_confirm: true // Confirmar email automaticamente
              });
              
              if (authError) {
                throw authError;
              }
              
              if (authData && authData.user) {
                authUserId = authData.user.id;
              }
            } catch (authErro) {
              console.error('Erro ao criar usuário no Auth:', authErro);
              // Tentar usar Edge Function se cliente admin não funcionar
              try {
                const result = await window.supabaseClient.chamarEdgeFunction('criar-usuario-auth', {
                  email: this.formulario.email.toLowerCase(),
                  senha: this.formulario.senha,
                  nome: this.formulario.nome,
                  sobrenome: this.formulario.sobrenome || ''
                });
                authUserId = result?.auth_user_id || null;
              } catch (edgeErro) {
                console.error('Erro ao criar usuário via Edge Function:', edgeErro);
                alert('Erro ao criar usuário no sistema de autenticação. Verifique se as Edge Functions estão configuradas.');
                this.carregando = false;
                return;
              }
            }
          }

          // Criar registro na tabela usuarios
          const novoUsuario = {
            nome: this.formulario.nome,
            sobrenome: this.formulario.sobrenome || '',
            email: this.formulario.email.toLowerCase(),
            telefone: this.formulario.telefone || '',
            tipo: this.formulario.tipo || 'visitante',
            status: this.formulario.status || 'ativo',
            auth_user_id: authUserId
          };

          await window.supabaseClient.criar('usuarios', novoUsuario);
          alert('Usuário criado com sucesso! O usuário pode fazer login com email e senha.');
        }

        this.fecharModal();
        await this.carregar();
      } catch (erro) {
        console.error('Erro ao salvar usuário:', erro);
        alert('Erro ao salvar usuário: ' + (erro.message || 'Erro desconhecido'));
      } finally {
        this.carregando = false;
      }
    },
    
    async resetarSenha(usuario) {
      const novaSenha = prompt(`Digite a nova senha para ${usuario.nome}:\n\n(A senha deve ter pelo menos 6 caracteres)`);
      
      if (!novaSenha) {
        return; // Usuário cancelou
      }
      
      if (novaSenha.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres');
        return;
      }
      
      if (!confirm(`Tem certeza que deseja redefinir a senha de ${usuario.nome}?\n\nA nova senha será: ${novaSenha.substring(0, 3)}***`)) {
        return;
      }
      
      this.resetandoSenha = true;
      
      try {
        if (!usuario.auth_user_id) {
          alert('Este usuário não tem conta de autenticação. É necessário criar uma senha pelo formulário de edição.');
          return;
        }
        
        // Resetar senha via Edge Function
        await window.supabaseClient.chamarEdgeFunction('atualizar-senha-usuario', {
          auth_user_id: usuario.auth_user_id,
          nova_senha: novaSenha
        });
        
        alert(`Senha redefinida com sucesso para ${usuario.nome}!\n\nNova senha: ${novaSenha}`);
      } catch (erro) {
        console.error('Erro ao resetar senha:', erro);
        alert('Erro ao resetar senha: ' + (erro.message || 'Erro desconhecido'));
      } finally {
        this.resetandoSenha = false;
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

