// Página de Perfil - Conexão com API

// Mini utils para evitar dependência externa
const perfilUtils = {
  showError: function(message) {
    console.error('Erro:', message);
    alert('Erro: ' + message);
  },
  showSuccess: function(message) {
    console.log('Sucesso:', message);
    alert(message);
  },
  formatDateForAPI: function(dateString) {
    if (!dateString) return null;
    
    // Se já está no formato ISO, retornar como está
    if (dateString.includes('T')) {
      return dateString;
    }
    
    // Converter de YYYY-MM-DD para formato ISO (compatível com backend)
    const date = new Date(dateString + 'T00:00:00.000Z');
    return date.toISOString();
  },
  
  // Validar email
  isValidEmail: function(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  // Validar telefone
  isValidPhone: function(phone) {
    // Remove caracteres não numéricos para validação
    const numbersOnly = phone.replace(/\D/g, '');
    
    // Deve ter 10 ou 11 dígitos
    if (numbersOnly.length < 10 || numbersOnly.length > 11) {
      return false;
    }
    
    // Validar formato básico
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    return phoneRegex.test(phone);
  },
  
  // Limpar máscara do telefone
  cleanPhone: function(phone) {
    return phone.replace(/\D/g, '');
  },
  
  // Formatar telefone para exibição
  formatPhone: function(phone) {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
    } else if (cleaned.length === 11) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
    }
    
    return phone; // Retorna original se não conseguir formatar
  }
};

document.addEventListener('DOMContentLoaded', function() {
  const formPerfil = document.querySelector('.form-perfil-paciente') || document.querySelector('.form-perfil');
  const btnSalvar = document.querySelector('.btn-salvar-perfil');
  const btnAlterarSenha = document.querySelector('.btn-alterar-senha');
  
  // Carregar dados do perfil
  async function carregarPerfil() {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      
      if (!userData || !userData.id) {
        console.error('Usuário não encontrado. Redirecionando para login.');
        perfilUtils.showError('Usuário não encontrado. Faça login novamente.');
        window.location.href = '../index.html';
        return;
      }

      console.log('Carregando dados do usuário ID:', userData.id);

      // Buscar dados atualizados do usuário da API
      const user = await userAPI.getById(userData.id);
      
      console.log('Dados recebidos da API:', user);
      
      // Preencher campos do formulário
      preencherFormulario(user);
      
      // Atualizar localStorage com dados mais recentes
      const updatedUserData = {
        ...userData,
        ...user,
        id: userData.id // Garantir que o ID seja preservado
      };
      localStorage.setItem('userData', JSON.stringify(updatedUserData));
      
    } catch (error) {
      console.error('Erro ao carregar perfil da API:', error);
      
      // Se não conseguir buscar da API, usar dados do localStorage
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (userData) {
        console.log('Usando dados do localStorage como fallback');
        preencherFormulario(userData);
      } else {
        // Fallback: preencher com dados do localStorage padrão
        console.log('Usando dados do localStorage padrão');
        preencherDadosLocalStorage();
      }
    }
  }

  // Preencher formulário com dados do usuário
  function preencherFormulario(user) {
    console.log('Preenchendo formulário com dados:', user);
    
    const campos = {
      'login': user.email,
      'nome': user.name || user.nome,
      'telefone': perfilUtils.formatPhone(user.phone || user.telefone || ''), // Aplicar máscara
      'dataNascimento': formatDateForInput(user.birth_date || user.birthDate || user.dataNascimento)
    };

    Object.entries(campos).forEach(([id, value]) => {
      const campo = document.getElementById(id);
      if (campo && value) {
        campo.value = value;
        console.log(`Campo ${id} preenchido com:`, value);
      }
    });

    // Preencher gênero no select
    const generoSelect = document.getElementById('genero');
    if (generoSelect && (user.gender || user.genero)) {
      const userGender = user.gender || user.genero;
      const generoMap = { 'M': 'Masculino', 'F': 'Feminino', 'O': 'Outro' };
      const generoValue = generoMap[userGender] || userGender;
      console.log('Preenchendo gênero:', userGender, '->', generoValue);
      generoSelect.value = generoValue;
      
      // Verificar se foi definido corretamente
      console.log('Valor definido no select:', generoSelect.value);
    } else {
      console.log('Gênero não encontrado ou select não existe:', { generoSelect, userGender: user.gender });
    }
  }

  // Função auxiliar para formatar data para input
  function formatDateForInput(dateString) {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Data inválida:', dateString);
        return '';
      }
      
      // Retornar no formato YYYY-MM-DD para input type="date"
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.warn('Erro ao formatar data:', dateString, error);
      return '';
    }
  }

  // Função de fallback para preencher dados do localStorage
  function preencherDadosLocalStorage() {
    const campos = {
      'login': localStorage.getItem('paciente_email') || '',
      'nome': localStorage.getItem('paciente_nome') || '',
      'telefone': perfilUtils.formatPhone(localStorage.getItem('paciente_telefone') || ''), // Aplicar máscara
      'dataNascimento': localStorage.getItem('paciente_dataNascimento') || ''
    };

    Object.entries(campos).forEach(([id, value]) => {
      const campo = document.getElementById(id);
      if (campo) {
        campo.value = value;
      }
    });

    // Preencher gênero do localStorage
    const generoSelect = document.getElementById('genero');
    const generoSalvo = localStorage.getItem('paciente_genero') || '';
    if (generoSelect && generoSalvo) {
      generoSelect.value = generoSalvo;
      console.log('Gênero preenchido do localStorage:', generoSalvo);
    }
  }

  // Salvar alterações do perfil
  if (formPerfil) {
    formPerfil.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (!userData || !userData.id) {
        perfilUtils.showError('Usuário não encontrado. Faça login novamente.');
        return;
      }

      // Coletar dados do formulário
      const nome = document.getElementById('nome').value.trim();
      const telefone = document.getElementById('telefone').value.trim();
      const dataNascimento = document.getElementById('dataNascimento').value;
      const generoSelect = document.getElementById('genero');
      const generoValue = generoSelect ? generoSelect.value : '';
      
      // Validação básica
      if (!nome || !telefone) {
        perfilUtils.showError('Por favor, preencha todos os campos obrigatórios (Nome e Telefone).');
        return;
      }

      // Validação do telefone
      if (!perfilUtils.isValidPhone(telefone)) {
        perfilUtils.showError('Por favor, insira um telefone no formato (XX) XXXXX-XXXX.');
        return;
      }

      // Encontrar botão de submit e mostrar loading
      const submitBtn = formPerfil.querySelector('button[type="submit"]') || formPerfil.querySelector('.btn-salvar-perfil');
      const originalText = submitBtn ? submitBtn.textContent : '';
      
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Salvando...';
      }

      try {
        // Mapear gênero do select para API
        let gender = null; // Permitir nulo se não selecionado
        if (generoValue) {
          const generoMap = { 'Masculino': 'M', 'Feminino': 'F', 'Outro': 'O' };
          gender = generoMap[generoValue] || null;
        }

        const updateData = {
          name: nome,
          email: userData.email, // Email não pode ser alterado nesta tela
          phone: perfilUtils.cleanPhone(telefone), // Remover máscara antes de enviar
          birthDate: dataNascimento ? perfilUtils.formatDateForAPI(dataNascimento) : null,
          gender: gender
        };

        console.log('Dados que serão enviados para a API:', updateData);

        const updatedUser = await userAPI.update(userData.id, updateData);
        
        console.log('Resposta da API:', updatedUser);
        
        // Atualizar localStorage com os dados retornados da API
        const newUserData = {
          ...userData,
          ...updatedUser,
          // Garantir que os campos essenciais sejam preservados
          id: userData.id,
          email: userData.email
        };
        
        localStorage.setItem('userData', JSON.stringify(newUserData));
        
        // Também salvar no formato antigo para compatibilidade com outras páginas
        localStorage.setItem('paciente_nome', nome);
        localStorage.setItem('paciente_telefone', telefone);
        localStorage.setItem('paciente_email', userData.email);
        if (dataNascimento) {
          localStorage.setItem('paciente_dataNascimento', dataNascimento);
        }
        if (generoValue) {
          localStorage.setItem('paciente_genero', generoValue);
        }
      } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        
        let errorMessage = 'Erro ao atualizar perfil. Tente novamente.';
        
        if (error.message) {
          errorMessage = error.message;
        } else if (error.error) {
          errorMessage = error.error;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        perfilUtils.showError(errorMessage);
        
      } finally {
        // Restaurar botão
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText || 'Salvar Alterações';
        }
      }
    });
  }

  // Modal de alteração de senha
  const modalSenha = document.querySelector('.modal-senha');
  const btnFecharModal = document.querySelector('.modal-senha-fechar');
  const formSenha = document.querySelector('.form-senha');

  // Abrir modal de alteração de senha
  if (btnAlterarSenha) {
    btnAlterarSenha.addEventListener('click', function() {
      if (modalSenha) {
        modalSenha.classList.add('ativo');
      }
    });
  }

  // Fechar modal de senha
  if (btnFecharModal) {
    btnFecharModal.addEventListener('click', function() {
      if (modalSenha) {
        modalSenha.classList.remove('ativo');
        limparFormularioSenha();
      }
    });
  }

  // Fechar modal clicando fora
  if (modalSenha) {
    modalSenha.addEventListener('click', function(e) {
      if (e.target === modalSenha) {
        modalSenha.classList.remove('ativo');
        limparFormularioSenha();
      }
    });
  }

  // Salvar nova senha
  if (formSenha) {
    formSenha.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const senhaAtual = document.getElementById('senha-atual').value;
      const novaSenha = document.getElementById('nova-senha').value;
      const confirmarSenha = document.getElementById('confirmar-senha').value;

      // Validações
      if (!senhaAtual || !novaSenha || !confirmarSenha) {
        perfilUtils.showError('Por favor, preencha todos os campos.');
        return;
      }

      if (novaSenha !== confirmarSenha) {
        perfilUtils.showError('A nova senha e a confirmação não coincidem.');
        return;
      }

      if (novaSenha.length < 6) {
        perfilUtils.showError('A nova senha deve ter pelo menos 6 caracteres.');
        return;
      }

      try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        
        // Primeiro, validar senha atual fazendo login
        await userAPI.login({
          email: userData.email,
          password: senhaAtual
        });

        // Se chegou aqui, senha atual está correta
        // Atualizar com nova senha
        await userAPI.update(userData.id, {
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          birthDate: userData.birthDate,
          gender: userData.gender,
          password: novaSenha
        });

        modalSenha.classList.remove('ativo');
        limparFormularioSenha();
        perfilUtils.showSuccess('Senha alterada com sucesso!');
        
      } catch (error) {
        console.error('Erro ao alterar senha:', error);
        if (error.status === 401) {
          perfilUtils.showError('Senha atual incorreta.');
        } else {
          perfilUtils.showError(error.message || 'Erro ao alterar senha. Tente novamente.');
        }
      }
    });
  }

  // Limpar formulário de senha
  function limparFormularioSenha() {
    if (formSenha) {
      formSenha.reset();
    }
  }

  // Validação em tempo real da confirmação de senha
  const novaSenhaInput = document.getElementById('nova-senha');
  const confirmarSenhaInput = document.getElementById('confirmar-senha');
  
  if (novaSenhaInput && confirmarSenhaInput) {
    confirmarSenhaInput.addEventListener('input', function() {
      const novaSenha = novaSenhaInput.value;
      const confirmarSenha = this.value;
      
      if (confirmarSenha && novaSenha !== confirmarSenha) {
        this.setCustomValidity('As senhas não coincidem');
      } else {
        this.setCustomValidity('');
      }
    });
  }

  // Upload de avatar (funcionalidade futura)
  const avatarUpload = document.querySelector('.avatar-upload-input');
  if (avatarUpload) {
    avatarUpload.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        // Implementar upload de avatar
        perfilUtils.showError('Upload de avatar será implementado em breve.');
      }
    });
  }
  
  // Aplicar máscara de telefone aprimorada
  const telefoneInput = document.getElementById('telefone');
  if (telefoneInput) {
    // Função para aplicar máscara
    function aplicarMascaraTelefone(value) {
      // Remove todos os caracteres não numéricos
      value = value.replace(/\D/g, '');
      
      // Limita a 11 dígitos
      value = value.substring(0, 11);
      
      // Aplica a máscara baseada no comprimento
      if (value.length === 0) {
        return '';
      } else if (value.length <= 2) {
        return `(${value}`;
      } else if (value.length <= 6) {
        return `(${value.substring(0, 2)}) ${value.substring(2)}`;
      } else if (value.length <= 10) {
        return `(${value.substring(0, 2)}) ${value.substring(2, 6)}-${value.substring(6)}`;
      } else {
        // Para 11 dígitos (celular com 9 na frente)
        return `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7)}`;
      }
    }
    
    // Event listener para input
    telefoneInput.addEventListener('input', function(e) {
      const cursorPosition = e.target.selectionStart;
      const oldValue = e.target.value;
      const newValue = aplicarMascaraTelefone(e.target.value);
      
      e.target.value = newValue;
      
      // Ajustar posição do cursor para uma melhor experiência
      let newCursorPosition = cursorPosition;
      
      // Se o valor ficou mais longo (caractere de máscara foi adicionado)
      if (newValue.length > oldValue.length) {
        newCursorPosition = cursorPosition + (newValue.length - oldValue.length);
      }
      
      // Definir nova posição do cursor
      setTimeout(() => {
        e.target.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    });
    
    // Event listener para keydown (para lidar com backspace melhor)
    telefoneInput.addEventListener('keydown', function(e) {
      // Permitir teclas de navegação
      const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'Home', 'End', 'ArrowLeft', 'ArrowRight', 'Clear', 'Copy', 'Paste'];
      
      if (allowedKeys.indexOf(e.key) !== -1 ||
          // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
          (e.key === 'a' && e.ctrlKey === true) ||
          (e.key === 'c' && e.ctrlKey === true) ||
          (e.key === 'v' && e.ctrlKey === true) ||
          (e.key === 'x' && e.ctrlKey === true) ||
          // Permitir números
          (e.key >= '0' && e.key <= '9')) {
        return;
      }
      
      // Bloquear outras teclas
      e.preventDefault();
    });
    
    // Event listener para paste
    telefoneInput.addEventListener('paste', function(e) {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData('text');
      const maskedValue = aplicarMascaraTelefone(paste);
      e.target.value = maskedValue;
      
      // Trigger input event para validações
      e.target.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  // Inicializar página
  console.log('Inicializando perfil.js...');
  
  // Verificar se há token de autenticação
  const authToken = localStorage.getItem('authToken');
  if (!authToken) {
    console.warn('Token de autenticação não encontrado');
    perfilUtils.showError('Você precisa estar logado para acessar esta página.');
    setTimeout(() => {
      window.location.href = '../index.html';
    }, 2000);
    return;
  }
  
  carregarPerfil();
});
