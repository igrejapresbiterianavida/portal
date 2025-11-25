# Script para trocar conta do GitHub no Windows

Write-Host "🔐 Removendo credenciais do GitHub..." -ForegroundColor Yellow

# Remover credenciais do Gerenciador de Credenciais do Windows
cmdkey /delete:"LegacyGeneric:target=git:https://github.com" 2>$null
cmdkey /delete:"GitHub - https://api.github.com/igrejapresbiterianavida" 2>$null

Write-Host "✅ Credenciais removidas!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. No próximo comando git (push/pull), você será solicitado a fazer login"
Write-Host "2. Use suas credenciais da nova conta do GitHub"
Write-Host "3. Ou configure um Personal Access Token (recomendado)"
Write-Host ""
Write-Host "💡 Para configurar um token manualmente:" -ForegroundColor Yellow
Write-Host "   git config --global credential.helper manager-core"
Write-Host "   git config --global user.name 'Seu Nome'"
Write-Host "   git config --global user.email 'seu-email@exemplo.com'"

