# Imagens da Programação

Esta pasta contém as imagens para os banners da seção de Programação.

## 📸 Como Adicionar Suas Próprias Imagens

### Passo 1: Adicionar Imagens
Adicione suas fotos nesta pasta com os seguintes nomes:

- `culto.jpg` - Culto de Celebração
- `ebd.jpg` - Escola Bíblica Dominical
- `oracao.jpg` - Reunião de Oração
- `estudo.jpg` - Estudo Bíblico
- `jovens.jpg` - Culto de Jovens
- `infantil.jpg` - Ministério Infantil
- `casais.jpg` - Grupo de Casais
- `social.jpg` - Ação Social

### Passo 2: Atualizar o JavaScript

Edite o arquivo `js/aplicacao.js` e atualize as URLs das imagens:

```javascript
carregarProgramacao() {
  this.programas = [
    {
      id: 1,
      titulo: 'Culto de Celebração e Adoração',
      // ... outras propriedades
      imagem: 'assets/images/programacao/culto.jpg'  // <-- Altere aqui
    },
    // ... outros programas
  ];
}
```

## 🎨 Especificações Técnicas

### Dimensões Recomendadas:
- **Largura:** 800px
- **Altura:** 600px
- **Proporção:** 4:3
- **Formato:** JPG ou PNG
- **Peso máximo:** 500KB por imagem

### Dicas de Fotografia:
✅ Use fotos com boa iluminação
✅ Evite fotos muito escuras (o overlay já escurece)
✅ Prefira fotos com pessoas ou ação (mais engajamento)
✅ Centralize o assunto principal da foto

## 🔧 Alternativas de Imagem

### Opção 1: Imagens Locais (Recomendado)
```javascript
imagem: 'assets/images/programacao/culto.jpg'
```

### Opção 2: Lorem Picsum (Atual)
```javascript
imagem: 'https://picsum.photos/seed/culto1/800/600'
```

### Opção 3: Unsplash Source
```javascript
imagem: 'https://source.unsplash.com/800x600/?church,worship'
```

### Opção 4: Banco de Imagens Gratuitas
- [Unsplash](https://unsplash.com/)
- [Pexels](https://www.pexels.com/)
- [Pixabay](https://pixabay.com/)

## 🎭 Overlay e Cores

Cada banner tem um overlay colorido sobre a imagem:
- A cor é definida por `cor1` e `cor2` no JavaScript
- O overlay tem opacidade de 85% (`dd` em hexadecimal)
- Isso garante que o texto seja sempre legível

## 📝 Exemplo Completo

```javascript
{
  id: 1,
  titulo: 'Culto de Celebração e Adoração',
  dia: '10',
  mes: 'nov',
  horario: '19h30',
  local: 'Templo Principal',
  categoria: 'CULTOS',
  corCategoria: '#1A4731',
  link: '#',
  cor1: '#1A4731',    // Verde escuro
  cor2: '#2D5F4A',    // Verde médio
  imagem: 'assets/images/programacao/culto.jpg'
}
```

## 🚀 Próximos Passos

1. Tire ou selecione fotos dos eventos da sua igreja
2. Edite/otimize as imagens (800x600px)
3. Salve nesta pasta com os nomes sugeridos
4. Atualize as URLs no `js/aplicacao.js`
5. Teste no navegador

**Pronto!** Suas imagens personalizadas estarão nos banners! 🎉
