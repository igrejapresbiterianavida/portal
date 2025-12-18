// ============================================
// DEVOCIONAIS.JS - Sistema de Devocionais
// Integração com API da Bíblia
// ============================================

/**
 * Componente Alpine.js para devocionais
 */
function devocionais() {
  return {
    devocional: null,
    versiculoDia: null,
    carregando: true,
    erro: null,
    favoritos: [],
    
    // APIs da Bíblia (gratuitas)
    apis: {
      biblia: 'https://bible-api.com',
      abiblia: 'https://www.abibliadigital.com.br/api'
    },
    
    // Versículos para rotação diária
    versiculosSelecionados: [
      { referencia: 'Salmos 23:1', texto: 'O Senhor é o meu pastor; nada me faltará.' },
      { referencia: 'João 3:16', texto: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.' },
      { referencia: 'Filipenses 4:13', texto: 'Posso todas as coisas naquele que me fortalece.' },
      { referencia: 'Romanos 8:28', texto: 'E sabemos que todas as coisas cooperam para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.' },
      { referencia: 'Isaías 41:10', texto: 'Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.' },
      { referencia: 'Jeremias 29:11', texto: 'Porque eu bem sei os pensamentos que penso de vós, diz o Senhor; pensamentos de paz, e não de mal, para vos dar o fim que esperais.' },
      { referencia: 'Provérbios 3:5-6', texto: 'Confia no Senhor de todo o teu coração, e não te estribes no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.' },
      { referencia: 'Mateus 11:28', texto: 'Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.' },
      { referencia: 'Salmos 46:1', texto: 'Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.' },
      { referencia: 'Romanos 12:2', texto: 'E não vos conformeis com este mundo, mas transformai-vos pela renovação do vosso entendimento, para que experimenteis qual seja a boa, agradável, e perfeita vontade de Deus.' },
      { referencia: 'Salmos 119:105', texto: 'Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.' },
      { referencia: '2 Coríntios 5:17', texto: 'Assim que, se alguém está em Cristo, nova criatura é; as coisas velhas já passaram; eis que tudo se fez novo.' },
      { referencia: 'Gálatas 5:22-23', texto: 'Mas o fruto do Espírito é: amor, gozo, paz, longanimidade, benignidade, bondade, fé, mansidão, temperança.' },
      { referencia: '1 Pedro 5:7', texto: 'Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.' },
      { referencia: 'Efésios 2:8-9', texto: 'Porque pela graça sois salvos, por meio da fé; e isto não vem de vós, é dom de Deus. Não vem das obras, para que ninguém se glorie.' },
      { referencia: 'Hebreus 11:1', texto: 'Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das coisas que se não veem.' },
      { referencia: 'Tiago 1:2-3', texto: 'Meus irmãos, tende grande gozo quando cairdes em várias tentações, sabendo que a prova da vossa fé opera a paciência.' },
      { referencia: 'Salmos 91:1-2', texto: 'Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará. Direi do Senhor: Ele é o meu Deus, o meu refúgio, a minha fortaleza, e nele confiarei.' },
      { referencia: 'João 14:6', texto: 'Disse-lhe Jesus: Eu sou o caminho, a verdade e a vida; ninguém vem ao Pai senão por mim.' },
      { referencia: 'Apocalipse 21:4', texto: 'E Deus limpará de seus olhos toda a lágrima; e não haverá mais morte, nem pranto, nem clamor, nem dor; porque já as primeiras coisas são passadas.' },
      { referencia: '1 João 4:8', texto: 'Aquele que não ama não conhece a Deus; porque Deus é amor.' },
      { referencia: 'Salmos 27:1', texto: 'O Senhor é a minha luz e a minha salvação; a quem temerei? O Senhor é a força da minha vida; de quem me recearei?' },
      { referencia: 'Isaías 40:31', texto: 'Mas os que esperam no Senhor renovarão as forças, subirão com asas como águias; correrão, e não se cansarão; caminharão, e não se fatigarão.' },
      { referencia: 'Mateus 6:33', texto: 'Mas buscai primeiro o reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas.' },
      { referencia: 'Colossenses 3:23', texto: 'E tudo quanto fizerdes, fazei-o de todo o coração, como ao Senhor, e não aos homens.' },
      { referencia: 'Salmos 37:4', texto: 'Deleita-te também no Senhor, e te concederá os desejos do teu coração.' },
      { referencia: '2 Timóteo 1:7', texto: 'Porque Deus não nos deu o espírito de temor, mas de fortaleza, e de amor, e de moderação.' },
      { referencia: '1 Coríntios 10:13', texto: 'Não veio sobre vós tentação, senão humana; mas fiel é Deus, que não vos deixará tentar acima do que podeis, antes com a tentação dará também o escape, para que a possais suportar.' },
      { referencia: 'João 8:32', texto: 'E conhecereis a verdade, e a verdade vos libertará.' },
      { referencia: 'Salmos 139:14', texto: 'Eu te louvarei, porque de um modo assombroso e tão maravilhoso fui feito; maravilhosas são as tuas obras, e a minha alma o sabe muito bem.' }
    ],
    
    async init() {
      this.carregarFavoritos();
      await this.carregarDevocionalDoDia();
    },
    
    async carregarDevocionalDoDia() {
      this.carregando = true;
      this.erro = null;
      
      try {
        // Buscar devocional do banco de dados (se existir)
        if (window.supabaseClient && window.supabaseClient.client) {
          const hoje = new Date().toISOString().split('T')[0];
          
          const { data: devocionalDB, error } = await window.supabaseClient.client
            .from('devocionais')
            .select('*')
            .eq('data', hoje)
            .eq('ativo', true)
            .maybeSingle();
          
          if (!error && devocionalDB) {
            // Verificar nível de acesso
            if (this.podeVerConteudo(devocionalDB.nivel_acesso)) {
              this.devocional = devocionalDB;
              this.versiculoDia = {
                referencia: devocionalDB.versiculo_referencia,
                texto: devocionalDB.versiculo_texto
              };
              return;
            }
          }
        }
        
        // Se não houver devocional específico ou não tem permissão, usar versículo do dia
        this.versiculoDia = this.obterVersiculoDoDia();
        this.devocional = this.gerarDevocionalAutomatico(this.versiculoDia);
        
      } catch (error) {
        console.error('Erro ao carregar devocional:', error);
        // Fallback para versículo local
        this.versiculoDia = this.obterVersiculoDoDia();
        this.devocional = this.gerarDevocionalAutomatico(this.versiculoDia);
      } finally {
        this.carregando = false;
      }
    },
    
    /**
     * Verifica se o usuário pode ver o conteúdo baseado no nível de acesso
     */
    podeVerConteudo(nivelAcesso) {
      // Se não tem nível de acesso definido, é público
      if (!nivelAcesso || nivelAcesso.length === 0) return true;
      if (nivelAcesso.includes('visitante')) return true;
      
      // Verificar se há controle de acesso disponível
      if (window.controleAcesso) {
        return window.controleAcesso.podeAcessar(nivelAcesso);
      }
      
      // Verificar via auth
      const tipoUsuario = this.obterTipoUsuario();
      
      if (tipoUsuario === 'administracao') return true;
      if (nivelAcesso.includes('membro') && ['membro', 'lideranca', 'administracao'].includes(tipoUsuario)) return true;
      if (nivelAcesso.includes('lideranca') && ['lideranca', 'administracao'].includes(tipoUsuario)) return true;
      
      return false;
    },
    
    /**
     * Obtém o tipo do usuário atual
     */
    obterTipoUsuario() {
      // Verificar localStorage
      const usuario = localStorage.getItem('ipvida_usuario');
      if (usuario) {
        try {
          return JSON.parse(usuario).tipo || 'visitante';
        } catch {
          return 'visitante';
        }
      }
      return 'visitante';
    },
    
    obterVersiculoDoDia() {
      // Usar a data atual para selecionar um versículo (rotativo)
      const hoje = new Date();
      const diaDoAno = Math.floor((hoje - new Date(hoje.getFullYear(), 0, 0)) / 86400000);
      const indice = diaDoAno % this.versiculosSelecionados.length;
      return this.versiculosSelecionados[indice];
    },
    
    gerarDevocionalAutomatico(versiculo) {
      const reflexoes = {
        'Salmos 23:1': 'Quando reconhecemos que o Senhor é nosso pastor, encontramos a paz que transcende todo o entendimento. Ele cuida de cada detalhe de nossas vidas.',
        'João 3:16': 'O amor de Deus é incondicional e eterno. Ele nos amou primeiro e continua nos amando, mesmo quando não merecemos.',
        'Filipenses 4:13': 'Nossa força não vem de nós mesmos, mas dAquele que habita em nós. Em Cristo, somos mais que vencedores.',
        'Romanos 8:28': 'Mesmo nas tempestades, Deus está trabalhando para o nosso bem. Ele é o autor de nossa história.',
        'Isaías 41:10': 'O medo não tem lugar quando sabemos que Deus está ao nosso lado. Sua mão forte nos sustenta.',
        'Jeremias 29:11': 'Deus tem um plano maravilhoso para cada um de nós. Um futuro de esperança e não de calamidade.',
        'Provérbios 3:5-6': 'Confiar em Deus significa entregar todas as nossas preocupações a Ele e crer que Ele guiará nossos passos.',
        'Mateus 11:28': 'Jesus nos convida a descansar nEle. Ele carrega nossos fardos e nos dá alívio.'
      };
      
      return {
        titulo: 'Devocional do Dia',
        versiculo_referencia: versiculo.referencia,
        versiculo_texto: versiculo.texto,
        reflexao: reflexoes[versiculo.referencia] || 'Medite nesta palavra e permita que ela transforme seu coração hoje.',
        oracao: 'Senhor, obrigado por Tua Palavra que ilumina nosso caminho. Ajuda-nos a viver segundo os Teus ensinamentos. Em nome de Jesus, amém.',
        data: new Date().toISOString().split('T')[0]
      };
    },
    
    async buscarVersiculoAPI(referencia) {
      try {
        // Tentar API em português
        const response = await fetch(`${this.apis.biblia}/${encodeURIComponent(referencia)}?translation=almeida`);
        if (response.ok) {
          const data = await response.json();
          return {
            referencia: data.reference,
            texto: data.text
          };
        }
      } catch (error) {
        console.error('Erro na API:', error);
      }
      return null;
    },
    
    carregarFavoritos() {
      const salvos = localStorage.getItem('ipvida_versiculos_favoritos');
      if (salvos) {
        try {
          this.favoritos = JSON.parse(salvos);
        } catch {
          this.favoritos = [];
        }
      }
    },
    
    salvarFavoritos() {
      localStorage.setItem('ipvida_versiculos_favoritos', JSON.stringify(this.favoritos));
    },
    
    toggleFavorito(versiculo) {
      const indice = this.favoritos.findIndex(f => f.referencia === versiculo.referencia);
      
      if (indice >= 0) {
        this.favoritos.splice(indice, 1);
      } else {
        this.favoritos.push({
          referencia: versiculo.referencia,
          texto: versiculo.texto,
          adicionadoEm: new Date().toISOString()
        });
      }
      
      this.salvarFavoritos();
    },
    
    isFavorito(referencia) {
      return this.favoritos.some(f => f.referencia === referencia);
    },
    
    compartilhar() {
      if (!this.versiculoDia) return;
      
      const texto = `"${this.versiculoDia.texto}" - ${this.versiculoDia.referencia}\n\nIP Vida - Igreja Presbiteriana`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Versículo do Dia - IP Vida',
          text: texto
        });
      } else {
        // Fallback: copiar para clipboard
        navigator.clipboard.writeText(texto).then(() => {
          if (window.mostrarToast) {
            window.mostrarToast('Versículo copiado!', 'sucesso');
          }
        });
      }
    },
    
    formatarData(data) {
      if (!data) return '';
      return new Date(data).toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };
}

/**
 * Admin de devocionais
 */
function adminDevocionais() {
  return {
    devocionais: [],
    carregando: true,
    modalAberto: false,
    devocionalEditando: null,
    
    formulario: {
      titulo: '',
      versiculo_referencia: '',
      versiculo_texto: '',
      reflexao: '',
      oracao: '',
      autor: '',
      data: '',
      ativo: true
    },
    
    async init() {
      await this.carregarDevocionais();
    },
    
    async carregarDevocionais() {
      this.carregando = true;
      try {
        if (window.supabaseClient && window.supabaseClient.client) {
          const { data, error } = await window.supabaseClient.client
            .from('devocionais')
            .select('*')
            .order('data', { ascending: false });
          
          if (error) throw error;
          this.devocionais = data || [];
        }
      } catch (error) {
        console.error('Erro ao carregar devocionais:', error);
      } finally {
        this.carregando = false;
      }
    },
    
    abrirNovo() {
      this.devocionalEditando = null;
      this.formulario = {
        titulo: '',
        versiculo_referencia: '',
        versiculo_texto: '',
        reflexao: '',
        oracao: '',
        autor: '',
        data: new Date().toISOString().split('T')[0],
        ativo: true
      };
      this.modalAberto = true;
    },
    
    editar(devocional) {
      this.devocionalEditando = devocional;
      this.formulario = {
        titulo: devocional.titulo,
        versiculo_referencia: devocional.versiculo_referencia,
        versiculo_texto: devocional.versiculo_texto,
        reflexao: devocional.reflexao,
        oracao: devocional.oracao || '',
        autor: devocional.autor || '',
        data: devocional.data,
        ativo: devocional.ativo
      };
      this.modalAberto = true;
    },
    
    async salvar() {
      try {
        const dados = { ...this.formulario };
        
        if (this.devocionalEditando) {
          const { error } = await window.supabaseClient.client
            .from('devocionais')
            .update(dados)
            .eq('id', this.devocionalEditando.id);
          
          if (error) throw error;
        } else {
          const { error } = await window.supabaseClient.client
            .from('devocionais')
            .insert(dados);
          
          if (error) throw error;
        }
        
        this.fecharModal();
        await this.carregarDevocionais();
        
        if (window.mostrarToast) {
          window.mostrarToast('Devocional salvo com sucesso', 'sucesso');
        }
      } catch (error) {
        console.error('Erro ao salvar:', error);
        if (window.mostrarToast) {
          window.mostrarToast('Erro ao salvar devocional', 'erro');
        }
      }
    },
    
    async excluir(devocional) {
      if (!confirm('Excluir este devocional?')) return;
      
      try {
        const { error } = await window.supabaseClient.client
          .from('devocionais')
          .delete()
          .eq('id', devocional.id);
        
        if (error) throw error;
        
        this.devocionais = this.devocionais.filter(d => d.id !== devocional.id);
      } catch (error) {
        console.error('Erro ao excluir:', error);
      }
    },
    
    fecharModal() {
      this.modalAberto = false;
      this.devocionalEditando = null;
    },
    
    formatarData(data) {
      return new Date(data).toLocaleDateString('pt-BR');
    }
  };
}

// Registrar componentes globalmente
window.devocionais = devocionais;
window.adminDevocionais = adminDevocionais;

