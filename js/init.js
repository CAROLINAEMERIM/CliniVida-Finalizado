// Verificação e inicialização da conexão com a API
document.addEventListener('DOMContentLoaded', async function() {
  
  // Verificar se a API está disponível
  async function checkAPIConnection() {
    try {
      // Tenta fazer uma requisição simples para verificar conexão
      const response = await fetch(`${API_BASE_URL}/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('✅ Conexão com API estabelecida com sucesso');
        return true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
      
    } catch (error) {
      console.error('❌ Erro ao conectar com a API:', error);
      
      // Mostrar aviso para o usuário
      const apiWarning = document.createElement('div');
      apiWarning.id = 'api-warning';
      apiWarning.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #f44336;
        color: white;
        text-align: center;
        padding: 10px;
        z-index: 9999;
        font-weight: bold;
      `;
      apiWarning.innerHTML = `
        ⚠️ API não disponível. Algumas funcionalidades podem não funcionar.
        <button onclick="this.parentElement.remove()" style="margin-left: 10px; background: transparent; border: 1px solid white; color: white; padding: 2px 6px; cursor: pointer;">×</button>
      `;
      
      document.body.insertBefore(apiWarning, document.body.firstChild);
      
      // Remover automaticamente após 5 segundos
      setTimeout(() => {
        const warning = document.getElementById('api-warning');
        if (warning) {
          warning.remove();
        }
      }, 5000);
      
      return false;
    }
  }
  
  // Inicializar verificações básicas
  async function initialize() {
    // Verificar conexão com API
    await checkAPIConnection();
    
    // Verificar se há dados de usuário válidos
    const userData = localStorage.getItem('userData');
    const authToken = localStorage.getItem('authToken');
    
    if (userData && authToken) {
      try {
        JSON.parse(userData); // Verificar se é JSON válido
        console.log('ℹ️ Usuário autenticado encontrado');
      } catch (error) {
        console.warn('⚠️ Dados de usuário corrompidos, limpando...');
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userType');
      }
    }
    
    // Log de status do sistema
    console.log(`
🏥 CliniVida Frontend v1.0.0
📡 API Base URL: ${API_BASE_URL}
👤 Usuário: ${userData ? 'Autenticado' : 'Não autenticado'}
📄 Página atual: ${window.location.pathname}
    `);
  }
  
  // Executar inicialização
  await initialize();
});

// Função utilitária para verificar se está online
function checkOnlineStatus() {
  const online = navigator.onLine;
  
  if (!online) {
    const offlineWarning = document.createElement('div');
    offlineWarning.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #ff9800;
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      z-index: 9998;
      font-weight: bold;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    offlineWarning.textContent = '📶 Você está offline';
    document.body.appendChild(offlineWarning);
    
    // Remover quando voltar online
    const handleOnline = () => {
      offlineWarning.remove();
      window.removeEventListener('online', handleOnline);
    };
    window.addEventListener('online', handleOnline);
  }
}

// Verificar status online/offline
window.addEventListener('load', checkOnlineStatus);
window.addEventListener('offline', checkOnlineStatus);

// Função para reload da página se necessário
window.forceReload = function() {
  localStorage.clear();
  window.location.reload();
};
