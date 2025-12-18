# 🎨 GUIA DE MODAIS E LISTAGENS MODERNOS

## ✨ O QUE FOI CRIADO

Criei um **DESIGN SYSTEM COMPLETO** para os modais e listagens do admin:

### 📦 Novos Arquivos CSS
- `css/admin-modals.css` - Modais enterprise profissionais
- `css/admin-tables.css` - Tabelas e listagens modernas

### 🎯 Características
- Modais com animações suaves
- Headers com gradiente e ícones
- Formulários em grid 2/3 colunas
- Upload de imagem com preview
- Thumbnails nas listagens
- Badges coloridos
- Cards mobile responsivos
- Skeleton loading
- Paginação moderna

---

## 📋 ESTRUTURA DO MODAL MODERNO

### HTML Completo de um Modal

```html
<!-- Modal com Overlay -->
<div 
  x-show="modalAberto" 
  class="modal-crud-overlay" 
  @click.self="fecharModal()"
  x-transition
>
  <div class="modal-crud-container">
    
    <!-- HEADER -->
    <div class="modal-crud-header">
      <div class="modal-crud-title-wrapper">
        <div class="modal-crud-icon">
          <span class="material-icons">article</span>
        </div>
        <div class="modal-crud-title-content">
          <h3 x-text="devocionalEditando ? 'Editar Devocional' : 'Novo Devocional'"></h3>
          <p>Preencha os campos abaixo para gerenciar o devocional</p>
        </div>
      </div>
      <button @click="fecharModal()" class="modal-crud-close">
        <span class="material-icons">close</span>
      </button>
    </div>
    
    <!-- BODY -->
    <div class="modal-crud-body">
      
      <!-- SEÇÃO 1: Informações Básicas -->
      <div class="form-section-modal">
        <h4 class="form-section-modal-title">
          <span class="material-icons">info</span>
          Informações Básicas
        </h4>
        
        <div class="form-grid-2">
          <!-- Campo Título -->
          <div class="form-field form-col-span-2">
            <label>
              Título <span class="required">*</span>
            </label>
            <input 
              type="text" 
              x-model="formulario.titulo"
              placeholder="Digite o título"
              required
            >
            <span class="form-helper">Título que aparecerá no site</span>
          </div>
          
          <!-- Campo Texto -->
          <div class="form-field form-col-span-2">
            <label>Texto</label>
            <textarea 
              x-model="formulario.texto"
              placeholder="Digite o conteúdo"
              rows="6"
            ></textarea>
          </div>
        </div>
      </div>
      
      <!-- SEÇÃO 2: Imagem -->
      <div class="form-section-modal">
        <h4 class="form-section-modal-title">
          <span class="material-icons">image</span>
          Imagem
        </h4>
        
        <div class="form-field">
          <label 
            @click="$refs.fileInput.click()"
            class="form-image-upload"
            :class="{'has-image': previewImagem}"
          >
            <template x-if="!previewImagem">
              <div>
                <span class="material-icons">cloud_upload</span>
                <div class="form-image-upload-text">Clique para enviar uma imagem</div>
                <div class="form-image-upload-hint">PNG, JPG ou WEBP (max. 2MB)</div>
              </div>
            </template>
            
            <template x-if="previewImagem">
              <div class="form-image-preview">
                <img :src="previewImagem" alt="Preview">
                <div class="form-image-preview-overlay">
                  <button 
                    type="button"
                    @click.stop="$refs.fileInput.click()"
                    class="btn-change-image"
                  >
                    <span class="material-icons">edit</span>
                    Alterar
                  </button>
                  <button 
                    type="button"
                    @click.stop="removerImagem()"
                    class="btn-remove-image"
                  >
                    <span class="material-icons">delete</span>
                    Remover
                  </button>
                </div>
              </div>
            </template>
            
            <input 
              type="file"
              x-ref="fileInput"
              @change="handleImagemUpload($event)"
              accept="image/*"
              style="display: none;"
            >
          </label>
        </div>
      </div>
      
      <!-- SEÇÃO 3: Configurações -->
      <div class="form-section-modal">
        <h4 class="form-section-modal-title">
          <span class="material-icons">settings</span>
          Configurações
        </h4>
        
        <div class="form-grid-2">
          <!-- Data -->
          <div class="form-field">
            <label>Data de Publicação</label>
            <input type="date" x-model="formulario.data">
          </div>
          
          <!-- Checkbox Ativo -->
          <div class="form-field">
            <label class="form-checkbox">
              <input type="checkbox" x-model="formulario.ativo">
              <span>Publicar imediatamente</span>
            </label>
          </div>
        </div>
      </div>
      
      <!-- SEÇÃO 4: Nível de Acesso -->
      <div class="form-section-modal">
        <h4 class="form-section-modal-title">
          <span class="material-icons">visibility</span>
          Quem pode ver?
        </h4>
        
        <div class="nivel-acesso-modal">
          <div class="nivel-acesso-chips-modal">
            <div 
              @click="toggleNivelAcesso('visitante')"
              class="nivel-chip-modal"
              :class="{'active publico': formulario.nivel_acesso.includes('visitante')}"
            >
              <span class="material-icons">public</span>
              <span>Todos (Público)</span>
            </div>
            
            <div 
              @click="toggleNivelAcesso('membro')"
              class="nivel-chip-modal"
              :class="{'active membros': formulario.nivel_acesso.includes('membro')}"
            >
              <span class="material-icons">group</span>
              <span>Apenas Membros</span>
            </div>
            
            <div 
              @click="toggleNivelAcesso('lideranca')"
              class="nivel-chip-modal"
              :class="{'active lideranca': formulario.nivel_acesso.includes('lideranca')}"
            >
              <span class="material-icons">star</span>
              <span>Liderança</span>
            </div>
            
            <div 
              @click="toggleNivelAcesso('administracao')"
              class="nivel-chip-modal"
              :class="{'active admin': formulario.nivel_acesso.includes('administracao')}"
            >
              <span class="material-icons">shield</span>
              <span>Administradores</span>
            </div>
          </div>
          <span class="form-helper">
            Visitantes não logados só verão itens marcados como "Público"
          </span>
        </div>
      </div>
      
    </div>
    
    <!-- FOOTER -->
    <div class="modal-crud-footer">
      <button 
        type="button"
        @click="fecharModal()"
        class="btn-modal btn-modal-cancel"
      >
        <span class="material-icons">close</span>
        Cancelar
      </button>
      
      <button 
        type="button"
        @click="salvar()"
        class="btn-modal btn-modal-save"
        :class="{'loading': carregando}"
      >
        <span x-show="!carregando" class="material-icons">check</span>
        <div x-show="carregando" class="spinner"></div>
        <span x-text="carregando ? 'Salvando...' : 'Salvar'"></span>
      </button>
    </div>
    
  </div>
</div>
```

---

## 📊 ESTRUTURA DA LISTAGEM MODERNA

### HTML de Tabela com Thumbnails

```html
<!-- Filtros e Busca -->
<div class="table-filters">
  <div class="search-input-wrapper">
    <span class="material-icons">search</span>
    <input 
      type="text"
      x-model="busca"
      class="search-input"
      placeholder="Buscar devocionais..."
    >
  </div>
  
  <select x-model="filtroStatus" class="filter-select">
    <option value="todos">Todos os status</option>
    <option value="ativo">Ativos</option>
    <option value="inativo">Inativos</option>
  </select>
  
  <button @click="abrirModal()" class="btn-modal btn-modal-save">
    <span class="material-icons">add</span>
    Novo Devocional
  </button>
</div>

<!-- Tabela Desktop -->
<div class="table-container">
  <table class="table-modern table-desktop">
    <thead>
      <tr>
        <th>Devocional</th>
        <th>Data</th>
        <th>Status</th>
        <th>Visibilidade</th>
        <th style="text-align: center;">Ações</th>
      </tr>
    </thead>
    <tbody>
      <!-- Loading Skeleton -->
      <template x-if="carregando">
        <tr>
          <td colspan="5">
            <div style="display: flex; gap: 16px; padding: 8px 0;">
              <div class="skeleton-thumbnail"></div>
              <div style="flex: 1;">
                <div class="skeleton-line medium" style="margin-bottom: 8px;"></div>
                <div class="skeleton-line short"></div>
              </div>
            </div>
          </td>
        </tr>
      </template>
      
      <!-- Dados -->
      <template x-if="!carregando && devocionais.length > 0">
        <template x-for="item in devocionais" :key="item.id">
          <tr>
            <!-- Coluna com Thumbnail -->
            <td>
              <div class="table-cell-media">
                <img 
                  :src="item.imagem_url || '../assets/images/placeholder.jpg'" 
                  :alt="item.titulo"
                  class="table-thumbnail"
                >
                <div class="table-media-content">
                  <div class="table-media-title" x-text="item.titulo"></div>
                  <div class="table-media-subtitle" x-text="item.texto?.substring(0, 60) + '...'"></div>
                </div>
              </div>
            </td>
            
            <!-- Data -->
            <td>
              <span x-text="new Date(item.data).toLocaleDateString('pt-BR')"></span>
            </td>
            
            <!-- Status -->
            <td>
              <span 
                class="table-badge"
                :class="item.ativo ? 'badge-success' : 'badge-danger'"
                x-text="item.ativo ? 'Ativo' : 'Inativo'"
              ></span>
            </td>
            
            <!-- Visibilidade -->
            <td>
              <template x-if="item.nivel_acesso?.includes('visitante')">
                <span class="table-badge badge-publico">Público</span>
              </template>
              <template x-if="item.nivel_acesso?.includes('membro') && !item.nivel_acesso?.includes('visitante')">
                <span class="table-badge badge-membros">Membros</span>
              </template>
            </td>
            
            <!-- Ações -->
            <td>
              <div class="table-actions">
                <button 
                  @click="abrirModal(item)" 
                  class="table-btn btn-edit"
                >
                  <span class="material-icons">edit</span>
                  Editar
                </button>
                <button 
                  @click="deletar(item.id)" 
                  class="table-btn btn-delete"
                >
                  <span class="material-icons">delete</span>
                  Deletar
                </button>
              </div>
            </td>
          </tr>
        </template>
      </template>
      
      <!-- Empty State -->
      <template x-if="!carregando && devocionais.length === 0">
        <tr>
          <td colspan="5">
            <div class="table-empty">
              <div class="table-empty-icon">
                <span class="material-icons">inbox</span>
              </div>
              <h3 class="table-empty-title">Nenhum devocional encontrado</h3>
              <p class="table-empty-text">Clique no botão "Novo Devocional" para adicionar o primeiro item</p>
              <button @click="abrirModal()" class="btn-modal btn-modal-save">
                <span class="material-icons">add</span>
                Criar Primeiro Devocional
              </button>
            </div>
          </td>
        </tr>
      </template>
    </tbody>
  </table>
</div>

<!-- Cards Mobile -->
<div class="table-mobile">
  <template x-for="item in devocionais" :key="item.id">
    <div class="table-card-mobile">
      <div class="table-card-mobile-header">
        <img 
          :src="item.imagem_url || '../assets/images/placeholder.jpg'" 
          :alt="item.titulo"
          class="table-thumbnail"
        >
        <div style="flex: 1;">
          <div class="table-media-title" x-text="item.titulo"></div>
          <span 
            class="table-badge"
            :class="item.ativo ? 'badge-success' : 'badge-danger'"
            x-text="item.ativo ? 'Ativo' : 'Inativo'"
          ></span>
        </div>
      </div>
      
      <div class="table-card-mobile-body">
        <div class="table-card-mobile-field">
          <div class="table-card-mobile-label">Data</div>
          <div class="table-card-mobile-value" x-text="new Date(item.data).toLocaleDateString('pt-BR')"></div>
        </div>
        
        <div class="table-card-mobile-field">
          <div class="table-card-mobile-label">Visibilidade</div>
          <div class="table-card-mobile-value">
            <span 
              class="table-badge"
              :class="item.nivel_acesso?.includes('visitante') ? 'badge-publico' : 'badge-membros'"
              x-text="item.nivel_acesso?.includes('visitante') ? 'Público' : 'Membros'"
            ></span>
          </div>
        </div>
      </div>
      
      <div class="table-card-mobile-footer">
        <button @click="abrirModal(item)" class="table-btn btn-edit">
          <span class="material-icons">edit</span>
          Editar
        </button>
        <button @click="deletar(item.id)" class="table-btn btn-delete">
          <span class="material-icons">delete</span>
          Deletar
        </button>
      </div>
    </div>
  </template>
</div>

<!-- Paginação -->
<div class="pagination-modern">
  <button 
    @click="paginaAtual--" 
    :disabled="paginaAtual === 1"
    class="pagination-btn"
  >
    <span class="material-icons">chevron_left</span>
  </button>
  
  <button 
    @click="paginaAtual = 1"
    class="pagination-btn"
    :class="{'active': paginaAtual === 1}"
  >
    1
  </button>
  
  <button 
    @click="paginaAtual = 2"
    class="pagination-btn"
    :class="{'active': paginaAtual === 2}"
    x-show="totalPaginas >= 2"
  >
    2
  </button>
  
  <button 
    @click="paginaAtual++" 
    :disabled="paginaAtual === totalPaginas"
    class="pagination-btn"
  >
    <span class="material-icons">chevron_right</span>
  </button>
  
  <span class="pagination-info">
    Página <strong x-text="paginaAtual"></strong> de <strong x-text="totalPaginas"></strong>
  </span>
</div>
```

---

## 🎨 ÍCONES RECOMENDADOS POR CRUD

```javascript
// Devocionais
icon: 'article' ou 'menu_book'

// Vídeos
icon: 'video_library' ou 'play_circle'

// Programação
icon: 'event' ou 'calendar_today'

// Eventos
icon: 'celebration' ou 'campaign'

// Visitantes
icon: 'people' ou 'person_add'

// Usuários
icon: 'manage_accounts' ou 'badge'

// Redes Sociais
icon: 'share' ou 'language'

// Turmas
icon: 'school' ou 'groups'

// Dados da Igreja
icon: 'church' ou 'home'
```

---

## 🚀 APLICAR EM TODOS OS CRUDs

1. **Substitua** os modais antigos pela estrutura nova
2. **Adicione** thumbnails nas tabelas
3. **Use** os badges coloridos
4. **Implemente** cards mobile
5. **Adicione** paginação moderna

**TODOS** os modais e listagens devem seguir esse padrão!

---

## ✅ CHECKLIST

- [ ] Devocionais - Modal + Listagem
- [ ] Vídeos - Modal + Listagem
- [ ] Programação - Modal + Listagem  
- [ ] Eventos - Modal + Listagem
- [ ] Visitantes - Modal + Listagem
- [ ] Usuários - Modal + Listagem
- [ ] Redes Sociais - Modal + Listagem
- [ ] Turmas - Modal + Listagem
- [ ] Dados da Igreja - Modal + Listagem

---

**IMPORTANTE**: Os CSS já estão criados e importados no `admin.html`. Basta substituir o HTML dos modais e tabelas pelo novo padrão!

