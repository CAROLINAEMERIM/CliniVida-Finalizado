// Configuração da API
const API_BASE_URL = 'https://api-tcc-v2pq.onrender.com';

// Instância do Axios com configurações padrão
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 60000
});

// Interceptor para adicionar token de autenticação se existir
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de respostas e erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Erro na API:', error.response?.data || error.message);
    
    // Se token expirado ou não autorizado, redirecionar para login
    // Mas não redirecionar se estivermos já na página de login
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const isLoginPage = currentPath.includes('login') || currentPath.includes('index.html');
      
      if (!isLoginPage) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userType');
        localStorage.removeItem('userData');
        window.location.href = '/index.html';
      }
    }
    
    return Promise.reject(error);
  }
);

// Funções de API - Usuários (Pacientes)
const userAPI = {
  // Criar novo usuário/paciente
  async create(userData) {
    try {
      const response = await api.post('/user', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Login de usuário
  async login(credentials) {
    try {
      const response = await api.post('/user/login', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Listar todos os usuários
  async getAll() {
    try {
      const response = await api.get('/user');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Buscar usuário por ID
  async getById(id) {
    try {
      const response = await api.get(`/user/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Atualizar usuário
  async update(id, userData) {
    try {
      const response = await api.put(`/user/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Deletar usuário
  async delete(id) {
    try {
      const response = await api.delete(`/user/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

// Funções de API - Profissionais
const professionalAPI = {
  // Criar novo profissional
  async create(professionalData) {
    try {
      const response = await api.post('/professional', professionalData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Login de profissional
  async login(credentials) {
    try {
      const response = await api.post('/professional/login', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Listar todos os profissionais
  async getAll() {
    try {
      const response = await api.get('/professional');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Buscar profissional por ID
  async getById(id) {
    try {
      const response = await api.get(`/professional/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Atualizar profissional
  async update(id, professionalData) {
    try {
      const response = await api.put(`/professional/${id}`, professionalData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Deletar profissional
  async delete(id) {
    try {
      const response = await api.delete(`/professional/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Alterar senha do profissional
  async changePassword(id, passwordData) {
    try {
      const response = await api.put(`/professional/${id}/change-password`, passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Atualizar avatar do profissional
  async updateAvatar(id, avatarFormData) {
    try {
      const response = await api.put(`/professional/${id}/profile-image`, avatarFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

// Funções de API - Agendamentos
const scheduleAPI = {
  // Criar novo agendamento
  async create(scheduleData) {
    try {
      const response = await api.post('/schedule', scheduleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Listar todos os agendamentos
  async getAll() {
    try {
      const response = await api.get('/schedule');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Buscar agendamento por ID
  async getById(id) {
    try {
      const response = await api.get(`/schedule/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Buscar agendamentos por profissional
  async getByProfessional(professionalId) {
    try {
      const response = await api.get(`/schedule?profissional_id=${professionalId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Atualizar agendamento
  async update(id, scheduleData) {
    try {
      const response = await api.put(`/schedule/${id}`, scheduleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Deletar agendamento
  async delete(id) {
    try {
      const response = await api.delete(`/schedule/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

// Funções de API - Fichas
const fichaAPI = {
  // Criar nova ficha
  async create(fichaData) {
    try {
      // Validar se paciente_id está presente
      if (!fichaData.paciente_id) {
        console.warn('Tentando criar ficha sem paciente_id. Dados:', fichaData);
        throw new Error('paciente_id é obrigatório para criar uma ficha');
      }
      
      const response = await api.post('/ficha', fichaData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Função utilitária para criar ficha com dados mínimos
  async createForPaciente(pacienteId, dadosAdicionais = {}) {
    try {
      const fichaData = {
        paciente_id: pacienteId,
        data: new Date().toISOString().split('T')[0],
        ...dadosAdicionais
      };
      
      return await this.create(fichaData);
    } catch (error) {
      throw error;
    }
  },

  // Listar todas as fichas
  async getAll() {
    try {
      const response = await api.get('/ficha');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Buscar ficha por ID
  async getById(id) {
    try {
      const response = await api.get(`/ficha/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Buscar fichas por ID do paciente (usando query parameter)
  async getByPacienteId(pacienteId) {
    try {
      const response = await api.get(`/ficha?paciente_id=${pacienteId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Buscar fichas por ID do paciente (usando path parameter)
  async getByPaciente(pacienteId) {
    try {
      const response = await api.get(`/ficha/paciente/${pacienteId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Atualizar ficha
  async update(id, fichaData) {
    try {
      const response = await api.put(`/ficha/${id}`, fichaData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Deletar ficha
  async delete(id) {
    try {
      const response = await api.delete(`/ficha/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

// Funções de API - Consultas
const consultaAPI = {
  // Criar nova consulta
  async create(consultaData) {
    try {
      const response = await api.post('/consulta', consultaData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Listar consultas passadas com filtros
  async getPast(params = {}) {
    try {
      const query = {};
      if (params.data_inicio) query.data_inicio = params.data_inicio;
      if (params.data_fim) query.data_fim = params.data_fim;
      if (params.nome) query.nome = params.nome;
      const response = await api.get('/consulta/past', { params: query });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Listar todas as consultas
  async getAll() {
    try {
      const response = await api.get('/consulta');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Buscar consulta por ID
  async getById(id) {
    try {
      const response = await api.get(`/consulta/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Atualizar consulta
  async update(id, consultaData) {
    try {
      const response = await api.put(`/consulta/${id}`, consultaData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Deletar consulta
  async delete(id) {
    try {
      const response = await api.delete(`/consulta/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

// Funções utilitárias
const utils = {
  // Formatar data para envio à API (YYYY-MM-DD)
  formatDateForAPI(date) {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date;
  },

  // Formatar data para exibição (DD/MM/YYYY)
  formatDateForDisplay(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  },

  // Formatar horário para exibição (HH:mm)
  formatTimeForDisplay(timeString) {
    return timeString.substring(0, 5);
  },

  // Validar email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Mostrar notificação de sucesso
  showSuccess(message, targetElement = null) {
    this.showFeedback(message, 'success', targetElement);
  },

  // Mostrar notificação de erro
  showError(message, targetElement = null) {
    this.showFeedback(message, 'error', targetElement);
  },

  // Mostrar notificação de carregamento
  showLoading(message, targetElement = null) {
    this.showFeedback(message, 'loading', targetElement);
  },

  // Função genérica para mostrar feedback
  showFeedback(message, type, targetElement = null) {
    // Procurar por elemento de feedback específico ou usar um genérico
    let feedbackElement = targetElement;
    
    if (!feedbackElement) {
      feedbackElement = document.getElementById('feedback-agendamento') || 
                       document.querySelector('.feedback-message') ||
                       document.getElementById('feedback-message');
    }
    
    // Se não encontrar elemento de feedback, criar um temporário ou usar alert como fallback
    if (!feedbackElement) {
      if (type === 'success') {
        alert(`✅ ${message}`);
      } else if (type === 'error') {
        alert(`❌ ${message}`);
      } else {
        alert(`ℹ️ ${message}`);
      }
      return;
    }
    
    // Limpar classes anteriores
    feedbackElement.className = 'feedback-message';
    
    // Adicionar classe do tipo
    feedbackElement.classList.add(type);
    
    // Definir a mensagem
    feedbackElement.textContent = message;
    
    // Mostrar o elemento
    feedbackElement.style.display = 'block';
    
    // Para mensagens de sucesso ou erro, esconder automaticamente após 5 segundos
    if (type === 'success' || type === 'error') {
      setTimeout(() => {
        if (feedbackElement) {
          feedbackElement.style.display = 'none';
        }
      }, 5000);
    }
  },

  // Esconder feedback
  hideFeedback(targetElement = null) {
    let feedbackElement = targetElement;
    
    if (!feedbackElement) {
      feedbackElement = document.getElementById('feedback-agendamento') || 
                       document.querySelector('.feedback-message') ||
                       document.getElementById('feedback-message');
    }
    
    if (feedbackElement) {
      feedbackElement.style.display = 'none';
    }
  },

  // Validar formulário
  validateRequired(fields) {
    for (let field of fields) {
      if (!field.value || field.value.trim() === '') {
        field.focus();
        this.showError(`O campo ${field.name || 'obrigatório'} é obrigatório.`);
        return false;
      }
    }
    return true;
  }
};

// Funções de API - Planos
const planAPI = {

  // Atualizar plano do usuário
  async updateSubscription(userId, planId) {
    try {
      const response = await api.put(`/user/${userId}/plano`, {
        plano: planId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

};

// Funções de API - Arquivos
const fileAPI = {
  // Criar arquivo
  async create(fileData, user_id, profissional_id, categoria, descricao) {
    try {
      const formData = new FormData();
      formData.append('file', fileData);
      formData.append('user_id', user_id);
      formData.append('profissional_id', profissional_id);
      formData.append('categoria', categoria);
      formData.append('descricao', descricao);
      const response = await api.post('/file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Listar arquivos
  async getAll(user_id, categoria) {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      const response = await api.get('/file', {
        params: {
          profissional_id: userData.id,
          categoria: categoria,
          user_id: user_id
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Listar arquivos para o paciente logado
  async getForPatient() {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (!userData || !userData.id) {
        throw new Error('Paciente não autenticado.');
      }
      const response = await api.get('/file', {
        params: {
          user_id: userData.id
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  //download
  async download(fileId) {
    try {
      const response = await api.get(`/file/${fileId}`, {
        responseType: 'blob'
      });
      
      // Extrair nome do arquivo do header content-disposition ou usar um padrão
      let filename = `arquivo_${fileId}`;
      const contentDisposition = response.headers['content-disposition'];
      
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename[^;=]*=((['"]).*?\2|[^;]*)/);
        if (matches && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      
      // Criar blob e fazer download
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/octet-stream' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Limpar o URL criado
      URL.revokeObjectURL(url);
      
      return { success: true, filename };
    } catch (error) {
      console.error('Erro ao fazer download do arquivo:', error);
      throw error.response?.data || error;
    }
  },

  // Deletar arquivo
  async delete(fileId) {
    try {
      const response = await api.delete(`/file/${fileId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

// Exportar para uso global
window.userAPI = userAPI;
window.professionalAPI = professionalAPI;
window.scheduleAPI = scheduleAPI;
window.fichaAPI = fichaAPI;
window.consultaAPI = consultaAPI;
window.planAPI = planAPI;
window.fileAPI = fileAPI;
window.utils = utils;

