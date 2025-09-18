// 1. Scroll suave para âncoras do menu principal
document.querySelectorAll('.menu a[href^="#"]').forEach(link => {
  link.addEventListener('click', function(e) {
    const destino = document.querySelector(this.getAttribute('href'));
    if (destino) {
      e.preventDefault();
      destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// 2. Destacar item do menu conforme a seção visível
window.addEventListener('scroll', () => {
  const secoes = ['#sobre', '#profissionais', '#planos', '#contato'];
  let scrollPos = window.scrollY || window.pageYOffset;
  secoes.forEach(id => {
    const secao = document.querySelector(id);
    const link = document.querySelector(`.menu a[href="${id}"]`);
    if (secao && link) {
      const offsetTop = secao.offsetTop - 130;
      const offsetBottom = offsetTop + secao.offsetHeight;
      if (scrollPos >= offsetTop && scrollPos < offsetBottom) {
        link.classList.add('ativo');
      } else {
        link.classList.remove('ativo');
      }
    }
  });
});

// 3. Mensagem de confirmação ao enviar o formulário de contato
const botaoEnviar = document.querySelector('.enviar-botao');
if (botaoEnviar) {
  botaoEnviar.addEventListener('click', function(e) {
    e.preventDefault(); // Evita o envio padrão do formulário
    alert('Mensagem enviada! Em breve entraremos em contato.');
    // Limpa os campos do formulário após o envio simulado
    const campos = document.querySelectorAll('.campo-tabela');
    campos.forEach(campo => campo.value = '');
  });
}

// 4. Modais (genéricos)
function abrirModal(idModal) {
  const modal = document.getElementById(idModal);
  if (modal) {
    // Limpar mensagem de login se for o modal de login
    if (idModal === 'modal-login') {
      clearLoginMessage();
    }
    modal.classList.add('ativo'); // Adiciona a classe 'ativo' para mostrar e animar
  }
}

function fecharModal(idModal) {
  const modal = document.getElementById(idModal);
  if (modal) {
    modal.classList.remove('ativo'); // Remove a classe 'ativo' para esconder
  }
}

// 5. Modais de login e cadastro com animação
function abrirModalAnimado(idModal, triggerId) {
  const modal = document.getElementById(idModal);
  if (modal) {
    modal.classList.add('ativo');
  }
}

const btnLogin = document.getElementById('abrir-login');
if (btnLogin) {
  btnLogin.addEventListener('click', function(e) {
    e.preventDefault();
    clearLoginMessage(); // Limpar mensagem ao abrir modal
    abrirModal('modal-login');
  });
}

const btnCadastro = document.getElementById('abrir-cadastro');
if (btnCadastro) {
  btnCadastro.addEventListener('click', function(e) {
    e.preventDefault();
    abrirModal('modal-cadastro');
  });
}

// Lógica para fechar modais ao clicar fora do conteúdo
window.addEventListener('click', function(event) {
  const modals = document.querySelectorAll('.modal-plano.ativo');
  modals.forEach(modal => {
    if (event.target === modal) {
      modal.classList.remove('ativo');
    }
  });
});

// Links dentro do modal de login para alternar para o cadastro
const linkCadastro = document.getElementById('abrir-cadastro-link');
if (linkCadastro) {
  linkCadastro.addEventListener('click', function(e) {
    e.preventDefault();
    fecharModal('modal-login');
    setTimeout(() => abrirModal('modal-cadastro'), 350);
  });
}

// Funções para exibir mensagens nos modais
function showLoginMessage(message, type = 'error') {
  const messageDiv = document.getElementById('login-message');
  if (messageDiv) {
    messageDiv.textContent = message;
    messageDiv.className = `login-message ${type}`;
  }
}

function clearLoginMessage() {
  const messageDiv = document.getElementById('login-message');
  if (messageDiv) {
    messageDiv.textContent = '';
    messageDiv.className = 'login-message';
  }
}

// LOGIN
const formLogin = document.getElementById('formLogin');
if (formLogin) {
  formLogin.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Limpar mensagem anterior
    clearLoginMessage();

    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-password').value;

    // Validação básica
    if (!email || !senha) {
      showLoginMessage('Por favor, preencha todos os campos.', 'error');
      return;
    }

    if (!utils.isValidEmail(email)) {
      showLoginMessage('Por favor, insira um email válido.', 'error');
      return;
    }

    try {
      // Desabilitar o botão durante o login para evitar múltiplas tentativas
      const submitBtn = formLogin.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Entrando...';

      // Login sempre como paciente (profissionais têm área separada)
      const response = await userAPI.login({ email, password: senha });

      // Salvar dados do usuário logado
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('userType', 'paciente');
      localStorage.setItem('userData', JSON.stringify(response.user));
      
      showLoginMessage('Login realizado com sucesso! Redirecionando...', 'success');
      
      setTimeout(() => {
        fecharModal('modal-login');
        window.location.href = './paciente.html';
      }, 1500);
      
    } catch (error) {
      console.error('Erro no login:', error);
      const submitBtn = formLogin.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Entrar';
      
      showLoginMessage(error.message || 'Erro ao fazer login. Verifique suas credenciais.', 'error');
    }
  });
}

// CADASTRO
const formCadastro = document.getElementById('formCadastro');
if (formCadastro) {
  formCadastro.addEventListener('submit', async function (e) {
    e.preventDefault();

    const nome = document.getElementById('nome').value;
    const cpf = document.getElementById('cpf').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const telefone = document.getElementById('telefone').value;
    const dataNascimento = document.getElementById('data').value;
    const generoElement = document.querySelector('input[name="genero"]:checked');
    const genero = generoElement ? generoElement.value : '';

    // Validação básica
    const requiredFields = [
      { value: nome, name: 'nome' },
      { value: cpf, name: 'CPF' },
      { value: email, name: 'email' },
      { value: senha, name: 'senha' },
      { value: telefone, name: 'telefone' },
      { value: dataNascimento, name: 'data de nascimento' },
      { value: genero, name: 'gênero' }
    ];

    if (!utils.validateRequired(requiredFields.map(field => ({ value: field.value, name: field.name })))) {
      return;
    }

    if (!utils.isValidEmail(email)) {
      utils.showError('Por favor, insira um email válido.');
      return;
    }

    if (senha.length < 6) {
      utils.showError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      // Mapear o gênero para o formato da API
      let genderAPI = 'O'; // Outros
      if (genero === 'Masculino') genderAPI = 'M';
      else if (genero === 'Feminino') genderAPI = 'F';

      const userData = {
        name: nome,
        cpf: cpf.replace(/\D/g, ''), // Remove formatação
        email,
        password: senha,
        phone: telefone,
        birthDate: utils.formatDateForAPI(dataNascimento),
        gender: genderAPI
      };

      const response = await userAPI.create(userData);
      
      // Salvar dados localmente após sucesso
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('userType', 'paciente');
      localStorage.setItem('userData', JSON.stringify(response.user));

      fecharModal('modal-cadastro');
      utils.showSuccess('Cadastro realizado com sucesso!');
      window.location.href = './paciente.html';
      
    } catch (error) {
      console.error('Erro no cadastro:', error);
      utils.showError(error.message || 'Erro ao realizar cadastro. Tente novamente.');
    }
  });
}

// Lógica para seleção de planos (na página plano.html)
document.addEventListener('DOMContentLoaded', function() {
  const botoesAssinar = document.querySelectorAll('.btn-assinar');
  botoesAssinar.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const planoId = this.getAttribute('data-plano-id');
      const modalId = this.getAttribute('data-modal-id');

      // Remove destaque de todos os planos
      document.querySelectorAll('.plano-card-paciente').forEach(card => {
        card.classList.remove('plano-atual-destaque');
      });

      // Adiciona destaque ao novo plano
      const novoPlanoCard = document.getElementById(planoId);
      if (novoPlanoCard) {
        novoPlanoCard.classList.add('plano-atual-destaque');

        // Atualiza a seção de plano atual
        const planoNome = novoPlanoCard.querySelector('h2').textContent; // Pega o nome do plano
        const planoDesc = novoPlanoCard.querySelector('.descricao-plano').innerHTML; // Pega a descrição HTML
        const planoValor = novoPlanoCard.querySelector('.valor-plano').textContent; // Pega o valor

        document.getElementById('current-plan-name').textContent = planoNome;
        document.getElementById('current-plan-details').innerHTML = planoDesc;
        document.getElementById('current-plan-value').textContent = planoValor + "/mês";
        document.getElementById('current-plan-section').style.display = 'block'; // Mostra a seção de plano atual
      }

      fecharModal(modalId); // Fecha o modal após "assinar"
      alert('Plano assinado com sucesso! (Simulação)');
    });
  });
});

// Lógica para abrir modais de detalhes de planos
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.botao-saiba-mais1, .botao-saiba-mais2, .botao-saiba-mais3, .botao-saiba-mais4, .botao-saiba-mais5, .botao-saiba-mais6, .botao-saiba-mais7, .botao-saiba-mais8').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const modalId = this.getAttribute('data-modal');
      if (modalId) {
        abrirModalAnimado(modalId);
      }
    });
  });
});

// Lógica do calendário de agendamentos
document.addEventListener('DOMContentLoaded', function() {
  const calendarDays = document.getElementById('calendar-days');
  const monthYearDisplay = document.getElementById('month-year');
  const prevMonthBtn = document.getElementById('prevMonth');
  const nextMonthBtn = document.getElementById('nextMonth');

  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();

  function renderCalendar(year, month) {
    calendarDays.innerHTML = ''; // Limpa os dias anteriores
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const numDays = lastDay.getDate();
    const startDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

    monthYearDisplay.textContent = new Date(year, month).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    // Preencher dias vazios no início do mês
    for (let i = 0; i < startDay; i++) {
      const emptyDiv = document.createElement('div');
      calendarDays.appendChild(emptyDiv);
    }

    // Preencher os dias do mês
    for (let day = 1; day <= numDays; day++) {
      const dayDiv = document.createElement('div');
      dayDiv.classList.add('dia-calendario');
      dayDiv.textContent = day;
      // Adicionar lógica para dias indisponíveis (exemplo)
      if (day % 7 === 0 || day % 13 === 0) { // Exemplo: dias 7, 13, 14, 20, 21, 26, 27 são indisponíveis
        dayDiv.classList.add('unavailable');
      } else {
        dayDiv.addEventListener('click', function() {
          // Remove a classe 'selected' de todos os outros dias
          document.querySelectorAll('.dia-calendario.selected').forEach(d => d.classList.remove('selected'));
          this.classList.add('selected'); // Adiciona 'selected' ao dia clicado
        });
      }
      calendarDays.appendChild(dayDiv);
    }
  }

  prevMonthBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar(currentYear, currentMonth);
  });

  nextMonthBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar(currentYear, currentMonth);
  });

  renderCalendar(currentYear, currentMonth); // Renderiza o calendário inicial

  // Lógica para selecionar horários (exemplo)
  document.querySelectorAll('.horario-btn').forEach(button => {
    button.addEventListener('click', function() {
      if (!this.classList.contains('unavailable')) {
        document.querySelectorAll('.horario-btn.active').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
      }
    });
  });
});


// Lógica de pesquisa de histórico (exemplo na página historico.html)
document.addEventListener('DOMContentLoaded', function() {
  const btnPesquisarHistorico = document.querySelector('.btn-pesquisar-historico');
  if (btnPesquisarHistorico) {
    btnPesquisarHistorico.addEventListener('click', function() {
      const inicio = document.getElementById('periodoInicial').value;
      const fim = document.getElementById('periodoFinal').value;
      // Aqui você faria uma chamada AJAX para buscar os dados e preencher a tabela dinamicamente
    });
  }
});

// Lógica de FAQ (na página ajuda.html)
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', function() {
      const faqItem = this.closest('.faq-item');
      faqItem.classList.toggle('active');

      const faqAnswer = faqItem.querySelector('.faq-answer');
      if (faqItem.classList.contains('active')) {
        faqAnswer.style.maxHeight = faqAnswer.scrollHeight + 'px';
      } else {
        faqAnswer.style.maxHeight = '0';
      }
    });
  });

  // Lógica de pesquisa de FAQ (simples, apenas filtra no front-end)
  const faqSearch = document.getElementById('faqSearch');
  if (faqSearch) {
    faqSearch.addEventListener('keyup', function() {
      const searchTerm = this.value.toLowerCase();
      document.querySelectorAll('.faq-item').forEach(item => {
        const questionText = item.querySelector('.faq-question').textContent.toLowerCase();
        const answerText = item.querySelector('.faq-answer').textContent.toLowerCase();

        if (questionText.includes(searchTerm) || answerText.includes(searchTerm)) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  }
});


// Função de sair (copiada para todas as páginas de paciente)
const sairBtn = document.getElementById('sair');
if (sairBtn) {
  sairBtn.addEventListener('click', function(e) {
    e.preventDefault();
    // Limpa os dados do localStorage ao sair
    localStorage.removeItem('paciente_nome');
    localStorage.removeItem('paciente_email');
    localStorage.removeItem('paciente_senha');
    localStorage.removeItem('paciente_telefone');
    localStorage.removeItem('paciente_dataNascimento');
    localStorage.removeItem('paciente_genero');
    // Redireciona para a página inicial
    window.location.href = "index.html"; // Assumindo que index.html está no mesmo nível ou raiz
  });
}

// Lógica da página Meu Perfil
document.addEventListener('DOMContentLoaded', function() {
  // Preencher campos do perfil com dados do localStorage (se existirem)
  const loginField = document.getElementById('login');
  const nomeField = document.getElementById('nome');
  const telefoneField = document.getElementById('telefone');
  const dataNascimentoField = document.getElementById('dataNascimento');
  const generoMasculinoRadio = document.getElementById('masculino');
  const generoFemininoRadio = document.getElementById('feminino');

  if (loginField) {
    loginField.value = localStorage.getItem('paciente_email') || '';
  }
  if (nomeField) {
    nomeField.value = localStorage.getItem('paciente_nome') || '';
  }
  if (telefoneField) {
    telefoneField.value = localStorage.getItem('paciente_telefone') || '';
  }
  if (dataNascimentoField) {
    dataNascimentoField.value = localStorage.getItem('paciente_dataNascimento') || '';
  }
  if (generoMasculinoRadio && localStorage.getItem('paciente_genero') === 'Masculino') {
    generoMasculinoRadio.checked = true;
  }
  if (generoFemininoRadio && localStorage.getItem('paciente_genero') === 'Feminino') {
    generoFemininoRadio.checked = true;
  }


  // Botão de "fechar" no canto superior direito
  document.querySelector('.fechar-pagina').addEventListener('click', function(e) {
    e.preventDefault();
    window.history.back(); // Volta para a página anterior (paciente.html)
  });

  // Exemplo de como você lidaria com o botão "Alterar senha"
  document.querySelector('.btn-alterar-senha').addEventListener('click', function() {
    alert('Funcionalidade de Alterar Senha será implementada.');
    // Redirecionar para uma página de alteração de senha ou abrir um modal
    // window.location.href = 'alterar_senha.html';
  });

  // Exemplo de como você lidaria com o salvamento do formulário de perfil
  document.querySelector('.form-perfil').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Dados do perfil salvos com sucesso!');
    // Atualizar dados no localStorage (simulação)
    localStorage.setItem('paciente_nome', document.getElementById('nome').value);
    localStorage.setItem('paciente_telefone', document.getElementById('telefone').value);
    localStorage.setItem('paciente_dataNascimento', document.getElementById('dataNascimento').value);
    const generoElementAtual = document.querySelector('input[name="genero"]:checked');
    localStorage.setItem('paciente_genero', generoElementAtual ? generoElementAtual.value : '');


    // Aqui você enviaria os dados do formulário para o backend
    // const formData = new FormData(e.target);
    // fetch('/api/salvar-perfil', { method: 'POST', body: formData })
    //     .then(response => response.json())
    //     .then(data => console.log(data));
  });
});

// Função para carregar profissionais dinamicamente
async function carregarProfissionais() {
  try {
    // Verificar se a API está disponível
    if (!window.professionalAPI) {
      console.error('API não está disponível');
      mostrarProfissionaisPadrao();
      return;
    }

    // Limpar imagens anteriores para evitar vazamento de memória
    limparImagensAnteriores();

    // Mostrar loading
    const imagensCentraisDiv = document.querySelector('.imagens-centrais');
    if (!imagensCentraisDiv) {
      console.error('Div .imagens-centrais não encontrada');
      return;
    }
    
    imagensCentraisDiv.innerHTML = '<p style="text-align: center; width: 100%; color: #667eea;">Carregando profissionais...</p>';
    
    const response = await professionalAPI.getAll();
    const profissionais = response;
    
    // Limpar conteúdo atual
    imagensCentraisDiv.innerHTML = '';
    
    if (!profissionais || profissionais.length === 0) {
      mostrarProfissionaisPadrao();
      return;
    }
    
    // Criar cards para cada profissional
    profissionais.forEach(profissional => {
      const divImagemComCaixa = document.createElement('div');
      divImagemComCaixa.className = 'imagem-com-caixa';
      
      // Criar elemento da imagem
      const img = document.createElement('img');
      
      // Verificar se o profissional tem foto de perfil
      let imagemUrl = null;
      
      // Verificar se há imagem no formato buffer da API
      if (profissional.imagem_perfil && profissional.imagem_perfil.type === 'Buffer') {
        imagemUrl = bufferToImageUrl(profissional.imagem_perfil);
        if (imagemUrl) {
          profissionaisImageUrls.push(imagemUrl); // Armazenar para limpeza futura
        }
      }
      // Verificar outros formatos de imagem
      else if (profissional.profile_image_url) {
        imagemUrl = profissional.profile_image_url;
      } else if (profissional.avatar) {
        imagemUrl = profissional.avatar;
      }
      
      // Se não tem imagem, usar padrão baseado no gênero
      if (!imagemUrl) {
        if (profissional.genero === 'M' || profissional.genero === 'Masculino') {
          imagemUrl = 'assets/Junior.png'; // Imagem padrão masculina
        } else {
          imagemUrl = 'assets/Camila.png'; // Imagem padrão feminina
        }
      }
      
      img.src = imagemUrl;
      img.alt = profissional.nome || 'Profissional';
      
      // Criar elemento do nome
      const nomeProf = document.createElement('p');
      nomeProf.className = 'nome-prof';
      nomeProf.textContent = profissional.nome || 'Nome não informado';
      
      // Criar elemento da especialidade
      const especialidadeProf = document.createElement('p');
      especialidadeProf.className = 'especialidade-prof';
      
      let especialidadeTexto = '';
      if (profissional.especializacoes) {
        especialidadeTexto += profissional.especializacoes;
      }
      if (profissional.cr) {
        especialidadeTexto += `<br>${profissional.cr}`;
      }
      

      especialidadeProf.innerHTML = especialidadeTexto;

      // Adicionar elementos ao card
      divImagemComCaixa.appendChild(img);
      divImagemComCaixa.appendChild(nomeProf);
      divImagemComCaixa.appendChild(especialidadeProf);
      
      // Adicionar card ao container
      imagensCentraisDiv.appendChild(divImagemComCaixa);
    });
    
  } catch (error) {
    console.error('Erro ao carregar profissionais:', error);
    mostrarProfissionaisPadrao();
  }
}

// Função para mostrar profissionais padrão em caso de erro
function mostrarProfissionaisPadrao() {
  const imagensCentraisDiv = document.querySelector('.imagens-centrais');
  if (!imagensCentraisDiv) return;
  
  imagensCentraisDiv.innerHTML = `
    <div class="imagem-com-caixa">
      <img src="assets/Junior.png" alt="Junior">
      <p class="nome-prof">Reni Pereira Teixeira Junior</p>
      <p class="especialidade-prof">Personal Trainer<br>CREF 030913-G/SC</p>
    </div>
    <div class="imagem-com-caixa">
      <img src="assets/Camila.png" alt="Camila">
      <p class="nome-prof">Camila Cardoso Emerim</p>
      <p class="especialidade-prof">Nutricionista<br>CRN-10 10656</p>
    </div>
  `;
}

// Array para armazenar URLs de blob criadas (para limpeza de memória)
let profissionaisImageUrls = [];

// Função para limpar URLs de blob anteriores
function limparImagensAnteriores() {
  profissionaisImageUrls.forEach(url => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });
  profissionaisImageUrls = [];
}

// Carregar profissionais quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
  // Verificar se estamos na página principal (index.html)
  if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
    // Aguardar um pouco para garantir que a API está carregada
    setTimeout(() => {
      carregarProfissionais();
    }, 1000);
  }
});

// Limpar URLs de blob quando a página for descarregada
window.addEventListener('beforeunload', function() {
  if (imageManager) {
    imageManager.clear();
  }
  limparImagensAnteriores();
});