// Gerenciamento de Autenticação Global
document.addEventListener('DOMContentLoaded', function() {
  // Verificar se o usuário está autenticado
  function checkAuth() {
    const token = localStorage.getItem('authToken');
    const userType = localStorage.getItem('userType');
    const userData = localStorage.getItem('userData');
    
    // Se está em uma página que requer autenticação
    const currentPath = window.location.pathname;
    const protectedPages = [
      '/paciente.html',
      '/pages/agendamentos.html',
      '/pages/historico.html',
      '/pages/perfil.html',
      '/pages/plano.html',
      '/pages/ajuda.html'
    ];

    // Páginas da área profissional que requerem autenticação
    const professionalPages = [
      '/profissional/index.html',
      '/profissional/agendamentos.html',
      '/profissional/historico.html',
      '/profissional/pacientes.html',
      '/profissional/perfil.html',
      '/profissional/arquivos.html',
      '/profissional/ficha-paciente.html'
    ];
    
    const isProtectedPage = protectedPages.some(page => 
      currentPath.includes(page) || currentPath.endsWith(page)
    );

    const isProfessionalPage = professionalPages.some(page => 
      currentPath.includes(page) || currentPath.endsWith(page)
    );
    
    // Verificar autenticação para páginas do paciente
    if (isProtectedPage && (!token || !userData)) {
      // Redirecionar para login se não autenticado
      window.location.href = window.location.pathname.includes('/pages/') ? 
        '../index.html' : 'index.html';
      return false;
    }

    // Verificar autenticação para páginas do profissional
    if (isProfessionalPage && (!token || !userData || userType !== 'profissional')) {
      // Redirecionar para login profissional se não autenticado ou não é profissional
      window.location.href = currentPath.includes('/profissional/') ? 
        'login-profissional.html' : 'profissional/login-profissional.html';
      return false;
    }
    
    return true;
  }
  
  // Função global para logout
  window.logout = function() {
    // Limpar todos os dados de autenticação
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userData');
    
    // Limpar dados legados do paciente
    localStorage.removeItem('paciente_nome');
    localStorage.removeItem('paciente_email');
    localStorage.removeItem('paciente_senha');
    localStorage.removeItem('paciente_telefone');
    localStorage.removeItem('paciente_dataNascimento');
    localStorage.removeItem('paciente_genero');
    
    // Limpar dados do profissional
    localStorage.removeItem('profissional_nome');
    localStorage.removeItem('profissional_email');
    localStorage.removeItem('profissional_logado');
    
    // Redirecionar baseado na área atual
    const currentPath = window.location.pathname;
    let redirectPath = 'index.html';
    
    if (currentPath.includes('/pages/')) {
      redirectPath = '../index.html';
    } else if (currentPath.includes('/profissional/')) {
      redirectPath = '../index.html';
    }
    
    window.location.href = redirectPath;
  };
  
  // Adicionar event listeners para todos os botões de sair
  document.addEventListener('click', function(e) {
    if (e.target.id === 'sair' || e.target.closest('#sair')) {
      e.preventDefault();
      logout();
    }
  });
  
  // Verificar autenticação na inicialização
  checkAuth();
  
  // Renovar token periodicamente (opcional)
  // setInterval(() => {
  //   const token = localStorage.getItem('authToken');
  //   if (token) {
  //     // Renovar token se necessário
  //   }
  // }, 300000); // 5 minutos
});

// Interceptor global para redirecionar em caso de erro 401
if (typeof api !== 'undefined') {
  api.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        logout();
      }
      return Promise.reject(error);
    }
  );
}
