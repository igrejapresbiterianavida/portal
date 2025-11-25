// Script para ofuscar todos os arquivos JavaScript
const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

// Carregar configuração
const config = JSON.parse(fs.readFileSync('javascript-obfuscator.config.json', 'utf8'));

// Diretórios
const sourceDir = path.join(__dirname, 'js');
const outputDir = path.join(__dirname, 'dist', 'js');

// Criar diretório de saída se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Listar todos os arquivos .js
const files = fs.readdirSync(sourceDir).filter(file => file.endsWith('.js'));

console.log(`🔐 Ofuscando ${files.length} arquivos JavaScript...\n`);

files.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const outputPath = path.join(outputDir, file);
  
  try {
    const code = fs.readFileSync(sourcePath, 'utf8');
    const obfuscationResult = JavaScriptObfuscator.obfuscate(code, config);
    
    fs.writeFileSync(outputPath, obfuscationResult.getObfuscatedCode(), 'utf8');
    console.log(`✅ ${file}`);
  } catch (error) {
    console.error(`❌ Erro ao ofuscar ${file}:`, error.message);
    process.exit(1);
  }
});

console.log(`\n✨ Ofuscação concluída! Arquivos salvos em dist/js/`);

