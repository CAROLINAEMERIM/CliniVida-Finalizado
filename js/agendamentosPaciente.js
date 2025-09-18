// Página de Agendamentos - Conexão com API
document.addEventListener('DOMContentLoaded', function() {
  let selectedDate = null;
  let selectedTime = null;
  let selectedProfissional = null;
  let valorConsulta = 200; // Valor fixo para simplificação
  let currentStep = 1;
  let totalSteps = 4; // profissional, data, horário, informações
  let profissionaisData = []; // Armazenar dados dos profissionais da API

  // Controle do carrossel de profissionais
  let currentProfissionalIndex = 0;
  let profissionaisCards = [];
  let profissionaisContainer = null;
  let indicadores = [];
  let prevBtn = null;
  let nextBtn = null;

  // Carregar profissionais da API
  async function carregarProfissionaisAPI() {
    try {
      console.log('Carregando profissionais da API...');
      const response = await professionalAPI.getAll();
      console.log('Profissionais recebidos da API:', response);
      profissionaisData = response;
      
      if (profissionaisData && profissionaisData.length > 0) {
        console.log(`Encontrados ${profissionaisData.length} profissionais`);
        
        // Log das imagens recebidas para debugging
        profissionaisData.forEach((prof, index) => {
          console.log(`Profissional ${index + 1} (${prof.nome}):`, {
            id: prof.id,
            nome: prof.nome,
            temImagem: !!prof.imagem_perfil,
            tipoImagem: prof.imagem_perfil ? typeof prof.imagem_perfil : 'N/A',
            isBuffer: prof.imagem_perfil && prof.imagem_perfil.type === 'Buffer'
          });
        });
        
        await criarCarrosselProfissionais();
        inicializarCarrossel();
      } else {
        console.warn('Nenhum profissional encontrado na API, usando dados hardcoded');
        usarProfissionaisHardcoded();
      }
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
      console.log('Usando profissionais hardcoded como fallback');
      usarProfissionaisHardcoded();
    }
  }

  // Função para usar profissionais hardcoded como fallback
  function usarProfissionaisHardcoded() {
    profissionaisData = [
      {
        id: 1,
        nome: 'Dra. Maria Silva',
        tipo: 'Nutricionista',
        cr: 'CRN-1234',
        fone: '(11) 99999-9999',
        email: 'maria@clinivida.com'
      },
      {
        id: 2,
        nome: 'Dr. João Santos',
        tipo: 'Personal Trainer',
        cr: 'CREF-5678',
        fone: '(11) 88888-8888',
        email: 'joao@clinivida.com'
      }
    ];
    
    criarCarrosselProfissionais();
    inicializarCarrossel();
  }

  // Criar o HTML do carrossel baseado nos dados da API
  async function criarCarrosselProfissionais() {
    const profissionaisContainer = document.querySelector('.profissionais-container');
    const indicadoresContainer = document.querySelector('.profissional-indicadores');
    
    if (!profissionaisContainer || !indicadoresContainer) {
      console.error('Containers do carrossel não encontrados');
      return;
    }

    // Limpar containers
    profissionaisContainer.innerHTML = '';
    indicadoresContainer.innerHTML = '';

    // Ajustar largura do container baseado no número de profissionais
    const numProfissionais = profissionaisData.length;
    profissionaisContainer.style.width = `${numProfissionais * 100}%`;

    // Gerenciador de URLs de imagem para evitar vazamentos de memória
    let imageManager = null;
    if (typeof ImageUrlManager !== 'undefined') {
      imageManager = new ImageUrlManager();
    } else {
      console.warn('ImageUrlManager não disponível, URLs de blob não serão gerenciadas');
    }

    // Criar cards dos profissionais
    for (let index = 0; index < profissionaisData.length; index++) {
      const prof = profissionaisData[index];
      const profCard = document.createElement('div');
      
      // APENAS o primeiro card ativo, todos os outros ocultos
      const classes = index === 0 ? 'profissional-card active' : 'profissional-card hidden';
      
      profCard.className = classes;
      profCard.dataset.profissionalId = prof.id;
      profCard.style.flex = `0 0 ${100 / numProfissionais}%`;

      // Preparar dados do profissional da API
      const nome = prof.nome || 'Nome não informado';
      const tipo = prof.tipo || 'Especialidade não informada';
      const registro = prof.cr || 'Registro não informado';
      const telefone = prof.fone || 'Telefone não informado';

      let valor = Number(prof.valor_consulta) || 100.00; // Valor padrão
      valorConsulta = valor; // Atualizar valor global
      
      // Imagem padrão como fallback
      const imagemPadrao = '../assets/Camila.png';
      let imagemPerfil = imagemPadrao;

      // Processar imagem de perfil do banco de dados
      if (prof.imagem_perfil) {
        try {
          console.log(`Processando imagem de perfil para ${nome}:`, prof.imagem_perfil);
          
          // Verificar se as funções do imageUtils estão disponíveis
          if (typeof bufferToImageUrl === 'undefined') {
            console.warn('imageUtils.js não carregado, usando imagem padrão');
            imagemPerfil = imagemPadrao;
          }
          // Se for um buffer da API, converter para URL
          else if (prof.imagem_perfil.type === 'Buffer' && prof.imagem_perfil.data) {
            const imageUrl = bufferToImageUrl(prof.imagem_perfil);
            if (imageUrl) {
              imagemPerfil = imageUrl;
              if (imageManager) imageManager.addUrl(imageUrl); // Adicionar ao gerenciador
              console.log(`Imagem convertida com sucesso para ${nome}`);
            } else {
              console.warn(`Falha ao converter buffer para ${nome}, usando imagem padrão`);
            }
          }
          // Se for uma string (URL ou base64), usar diretamente
          else if (typeof prof.imagem_perfil === 'string') {
            // Verificar se é base64
            if (prof.imagem_perfil.startsWith('data:image/')) {
              imagemPerfil = prof.imagem_perfil;
            }
            // Se for base64 sem prefixo, converter
            else if (prof.imagem_perfil.match(/^[A-Za-z0-9+/]+={0,2}$/) && typeof base64ToImageUrl !== 'undefined') {
              const convertedUrl = base64ToImageUrl(prof.imagem_perfil);
              if (convertedUrl) {
                imagemPerfil = convertedUrl;
                if (imageManager) imageManager.addUrl(convertedUrl);
              }
            }
            // Se for URL normal, usar diretamente
            else {
              imagemPerfil = prof.imagem_perfil;
            }
          }
        } catch (error) {
          console.error(`Erro ao processar imagem para ${nome}:`, error);
          imagemPerfil = imagemPadrao; // Usar imagem padrão em caso de erro
        }
      }

      const tipoMap = {
        nutricionista: 'Nutricionista',
        'personal-trainer': 'Personal Trainer',
      }

      const userData = JSON.parse(localStorage.getItem('userData'));

      profCard.innerHTML = `
        <div class="profissional-foto">
          <img src="${imagemPerfil}" alt="${nome}" 
               onerror="this.src='${imagemPadrao}'; console.log('Erro ao carregar imagem para ${nome}, usando padrão');"
               onload="console.log('Imagem carregada com sucesso para ${nome}');">
        </div>
        <div class="profissional-info">
          <h3>${nome}</h3>
          <p class="profissional-especialidade">${tipoMap[tipo] || tipo}</p>
          <p class="profissional-registro">${registro}</p>
          <p class="profissional-contato">${telefone}</p>
          
          ${userData[tipo] ? `<div class="profissional-valor">
            <span class="valor">R$ ${valor.toFixed(2).replace('.', ',')}</span>
            <span class="consulta-tipo">por consulta</span>
          </div>` : ''}
        </div>
      `;

      profissionaisContainer.appendChild(profCard);

      // Criar indicador
      const indicador = document.createElement('span');
      indicador.className = `indicador ${index === 0 ? 'active' : ''}`;
      indicador.dataset.index = index;
      indicadoresContainer.appendChild(indicador);
    }

    // Atualizar referências dos elementos
    profissionaisCards = document.querySelectorAll('.profissional-card');
    indicadores = document.querySelectorAll('.indicador');
    
    // Definir o primeiro profissional como selecionado
    if (profissionaisData.length > 0) {
      selectedProfissional = profissionaisData[0].id;
    }

    // Armazenar o gerenciador de imagens para limpeza posterior se necessário
    if (imageManager) {
      window.profissionaisImageManager = imageManager;
    }
  }

  function inicializarCarrossel() {
    profissionaisContainer = document.querySelector('.profissionais-container');
    prevBtn = document.getElementById('prev-profissional');
    nextBtn = document.getElementById('next-profissional');
    
    if (!profissionaisContainer) {
      console.error('Container de profissionais não encontrado');
      return;
    }

    // Event listeners para o carrossel
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        currentProfissionalIndex = currentProfissionalIndex > 0 ? 
          currentProfissionalIndex - 1 : 
          profissionaisCards.length - 1;
        atualizarCarrossel();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentProfissionalIndex = currentProfissionalIndex < profissionaisCards.length - 1 ? 
          currentProfissionalIndex + 1 : 
          0;
        atualizarCarrossel();
      });
    }

    // Event listeners para os indicadores
    indicadores.forEach((indicador, index) => {
      indicador.addEventListener('click', () => {
        currentProfissionalIndex = index;
        atualizarCarrossel();
      });
    });

    // Navegação por teclado no carrossel
    document.addEventListener('keydown', (e) => {
      const etapaProfissional = document.getElementById('etapa-profissional');
      if (etapaProfissional && etapaProfissional.style.display !== 'none') {
        if (e.key === 'ArrowLeft') {
          prevBtn?.click();
        } else if (e.key === 'ArrowRight') {
          nextBtn?.click();
        }
      }
    });

    // Inicializar carrossel
    atualizarCarrossel();
  }

  function atualizarCarrossel() {
    if (!profissionaisContainer || !profissionaisCards.length) return;

    const numProfissionais = profissionaisCards.length;
    // Atualizar posição do container
    const translateX = -currentProfissionalIndex * (100 / numProfissionais);
    profissionaisContainer.style.transform = `translateX(${translateX}%)`;

    // Atualizar cards - APENAS o ativo fica visível
    profissionaisCards.forEach((card, index) => {
      // Remover todas as classes de estado
      card.classList.remove('active', 'adjacent', 'hidden');
      
      if (index === currentProfissionalIndex) {
        // APENAS o card ativo fica visível
        card.classList.add('active');
        selectedProfissional = parseInt(card.dataset.profissionalId);
        valorConsulta = Number(profissionaisData.find(p => p.id === selectedProfissional)?.valor_consulta) || 200;
      } else {
        // TODOS os outros cards ficam totalmente ocultos
        card.classList.add('hidden');
      }
    });

    // Atualizar indicadores
    indicadores.forEach((indicador, index) => {
      if (index === currentProfissionalIndex) {
        indicador.classList.add('active');
      } else {
        indicador.classList.remove('active');
      }
    });
  }

  // Inicializar a aplicação
  carregarProfissionaisAPI();

  // Dados dos profissionais (podem vir da API posteriormente)
  const profissionais = [
    { id: 1, nome: 'Dra. Maria Silva', tipo: 'Nutricionista', cr: 'CRN-1234' },
    { id: 2, nome: 'Dr. João Santos', tipo: 'Personal Trainer', cr: 'CREF-5678' }
  ];

  // Carregar profissionais no formulário
  function carregarProfissionais() {
    const selectProfissional = document.getElementById('profissional');
    if (selectProfissional) {
      profissionais.forEach(prof => {
        const option = document.createElement('option');
        option.value = prof.id;
        option.textContent = `${prof.nome} - ${prof.tipo}`;
        selectProfissional.appendChild(option);
      });
    }
  }

  // Configuração do calendário
  const calendarDays = document.getElementById('calendar-days');
  const monthYearDisplay = document.getElementById('month-year');
  const prevMonthBtn = document.getElementById('prevMonth');
  const nextMonthBtn = document.getElementById('nextMonth');

  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();

  function renderCalendar(year, month) {
    if (!calendarDays) return;

    calendarDays.innerHTML = '';
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const numDays = lastDay.getDate();
    const startDay = firstDay.getDay();
    const today = new Date();

    if (monthYearDisplay) {
      monthYearDisplay.textContent = new Date(year, month).toLocaleString('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
      });
    }

    let currentRow = document.createElement('tr');
    calendarDays.appendChild(currentRow);
    let cellCount = 0;

    // Preencher dias vazios no início do mês
    for (let i = 0; i < startDay; i++) {
      const emptyCell = document.createElement('td');
      currentRow.appendChild(emptyCell);
      cellCount++;
    }

    // Preencher os dias do mês
    for (let day = 1; day <= numDays; day++) {
      // Se já temos 7 células na linha, criar nova linha
      if (cellCount === 7) {
        currentRow = document.createElement('tr');
        calendarDays.appendChild(currentRow);
        cellCount = 0;
      }

      const dayCell = document.createElement('td');
      dayCell.textContent = day;
      
      const currentDate = new Date(year, month, day);
      
      // Verificar se é dia passado
      if (currentDate < today.setHours(0, 0, 0, 0)) {
        dayCell.classList.add('past-day');
      }
      // Verificar se é fim de semana (exemplo de indisponibilidade)
      else if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        dayCell.classList.add('unavailable-day');
      }
      // Dias disponíveis
      else {
        dayCell.classList.add('available-day');
        dayCell.addEventListener('click', function() {
          // Remove seleção anterior
          document.querySelectorAll('.calendar td.selected-day').forEach(td => {
            td.classList.remove('selected-day');
          });
          
          // Adiciona seleção atual
          this.classList.add('selected-day');
          selectedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          
          // Atualizar display da data selecionada
          const dataDisplay = document.querySelector('.data-selecionada');
          if (dataDisplay) {
            dataDisplay.innerHTML = `
              <strong>Data selecionada:</strong> ${currentDate.toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            `;
          }
        });
      }
      
      currentRow.appendChild(dayCell);
      cellCount++;
    }

    // Preencher células vazias no final se necessário
    while (cellCount < 7 && cellCount > 0) {
      const emptyCell = document.createElement('td');
      currentRow.appendChild(emptyCell);
      cellCount++;
    }
  }

  // Navegação do calendário
  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar(currentYear, currentMonth);
    });
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar(currentYear, currentMonth);
    });
  }

  // Seleção de horários
  document.querySelectorAll('.horario-btn').forEach(button => {
    button.addEventListener('click', function() {
      if (!this.classList.contains('unavailable')) {
        // Remove seleção anterior
        document.querySelectorAll('.horario-btn.active').forEach(b => b.classList.remove('active'));
        
        // Adiciona seleção atual
        this.classList.add('active');
        selectedTime = this.textContent;
      }
    });
  });

  // Função para buscar horários ocupados de um profissional em uma data
  async function buscarHorariosOcupados(profissionalId, data) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/schedule/occupied-times`,
        { params: { profissional_id: profissionalId, date: data } }
      );
      return response.data.bookedTimes || [];
    } catch (error) {
      console.error('Erro ao buscar horários ocupados:', error);
      return [];
    }
  }

  // Função para renderizar horários disponíveis, integrando horários ocupados
  async function renderizarHorarios(profissionalId, dataSelecionada) {
    const horariosGrid = document.querySelector('.horarios-grid');
    if (!horariosGrid) return;
    horariosGrid.innerHTML = '';

    // Exemplo de horários disponíveis (pode ser customizado)
    const horariosDisponiveis = [
      '08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'
    ];

    // Buscar horários ocupados na API
    const horariosOcupados = await buscarHorariosOcupados(profissionalId, dataSelecionada);

    horariosDisponiveis.forEach(horario => {
      const btn = document.createElement('button');
      btn.className = 'horario-btn';
      btn.textContent = horario;
      if (horariosOcupados.includes(horario)) {
        btn.className = 'horario-btn unavailable';
      }
      btn.addEventListener('click', function() {
        if (!btn.className.includes('unavailable')) {
          document.querySelectorAll('.horario-btn.active').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          // Aqui você pode salvar o horário selecionado em uma variável global
          selectedTime = horario;
        }
      });
      horariosGrid.appendChild(btn);
    });
  }

  // Navegação entre etapas
  function showStep(stepNumber) {
    // Esconder todas as etapas
    document.querySelectorAll('.agenda-step').forEach(step => {
      step.classList.remove('active');
    });
    
    // Mostrar etapa atual
    const currentStepElement = document.getElementById(`step-${stepNumber}`);
    if (currentStepElement) {
      currentStepElement.classList.add('active');
    }
    
    currentStep = stepNumber;
  }

  // Botão próximo
  document.querySelectorAll('.btn-proximo').forEach(button => {
    button.addEventListener('click', function() {
      const feedbackElement = document.getElementById('feedback-agendamento');
      
      // Validações por etapa
      if (currentStep === 1) {
        // Etapa profissional
        if (!selectedProfissional) {
          utils.showError('Por favor, selecione um profissional.', feedbackElement);
          return;
        }
      } else if (currentStep === 2) {
        // Etapa data
        if (!selectedDate) {
          utils.showError('Por favor, selecione uma data.', feedbackElement);
          return;
        }
      } else if (currentStep === 3) {
        // Etapa horário
        if (!selectedTime) {
          utils.showError('Por favor, selecione um horário.', feedbackElement);
          return;
        }
      }
      
      // Esconder feedback se passou nas validações
      utils.hideFeedback(feedbackElement);
      
      if (currentStep < totalSteps) {
        currentStep++;
      }
    });
  });

  // Botão voltar
  document.querySelectorAll('.btn-voltar').forEach(button => {
    button.addEventListener('click', function() {
      if (currentStep > 1) {
        currentStep--;
      }
    });
  });

  // Confirmar agendamento
  document.querySelector('.btn-confirmar-agendamento')?.addEventListener('click', async function() {
    const formaPagamento = "PIX";
    const valor = valorConsulta;
    const observacoes = document.getElementById('observacoes')?.value || '';
    const feedbackElement = document.getElementById('feedback-agendamento');
    
    // Validação
    if (!selectedProfissional) {
      utils.showError('Por favor, selecione um profissional.', feedbackElement);
      return;
    }
    
    if (!selectedDate) {
      utils.showError('Por favor, selecione uma data.', feedbackElement);
      return;
    }
    
    if (!selectedTime) {
      utils.showError('Por favor, selecione um horário.', feedbackElement);
      return;
    }
    
    if (!formaPagamento) {
      utils.showError('Por favor, selecione a forma de pagamento.', feedbackElement);
      return;
    }

    // Mostrar loading
    utils.showLoading('Criando seu agendamento...', feedbackElement);
    
    // Desabilitar botão durante o processamento
    this.disabled = true;
    this.textContent = 'PROCESSANDO...';

    try {
      const agendamentoData = {
        data: selectedDate,
        hora: selectedTime,
        forma_pagamento: formaPagamento,
        valor: valor,
        observacoes: observacoes,
        profissional_id: parseInt(selectedProfissional),
        paciente_id: Number(JSON.parse(localStorage.getItem('userData'))?.id || "1")
      };

      const response = await scheduleAPI.create(agendamentoData);
      console.log('Agendamento criado:', response);
      
      utils.showSuccess('Agendamento realizado com sucesso! Redirecionando para o histórico...', feedbackElement);
      
      // Resetar formulário
      selectedDate = null;
      selectedTime = null;
      selectedProfissional = null;
      
      // Redirecionar para página de agendamentos ou histórico
      setTimeout(() => {
        window.location.href = './historico.html';
      }, 3000);
      
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      
      // Determinar mensagem de erro mais específica
      let errorMessage = 'Erro ao criar agendamento. Tente novamente.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      utils.showError(errorMessage, feedbackElement);
      
    } finally {
      // Reabilitar botão
      this.disabled = false;
      this.textContent = 'CONFIRMAR AGENDAMENTO';
    }
  });

  // Inicialização
  carregarProfissionais();
  renderCalendar(currentYear, currentMonth);
  showStep(1);

  // Função para limpar URLs de imagens ao sair da página
  function limparImagensProfissionais() {
    if (window.profissionaisImageManager) {
      console.log('Limpando URLs de imagens dos profissionais...');
      window.profissionaisImageManager.clear();
    }
  }

  // Limpar imagens ao sair da página
  window.addEventListener('beforeunload', limparImagensProfissionais);
  window.addEventListener('pagehide', limparImagensProfissionais);

  // Exemplo de integração: chamar renderizarHorarios ao avançar para etapa de horários
  // Supondo que selectedProfissional e selectedDate estejam definidos globalmente

  // Função para avançar para etapa de horários
  async function irParaEtapaHorarios() {
    // Certifique-se de que selectedProfissional e selectedDate estão definidos
    if (!window.selectedProfissional || !window.selectedDate) {
      alert('Selecione o profissional e a data antes de escolher o horário.');
      return;
    }
    // Exibe a etapa de horários
    showNextStep('etapa-horario');
    // Renderiza os horários disponíveis, desabilitando os ocupados
    await renderizarHorarios(selectedProfissional, selectedDate);
  }

  // Exemplo: adicionar evento ao botão de avançar da etapa de data
  const btnProximoData = document.querySelector('#etapa-data .btn.btn-proximo');
  if (btnProximoData) {
    btnProximoData.addEventListener('click', async function() {
      // Obter profissional selecionado
      const profissionalSelecionado = window.selectedProfissional || obterProfissionalSelecionado();
      const dataSelecionada = selectedDate || obterDataSelecionada();
      console.log('Profissional selecionado:', profissionalSelecionado);
      console.log('Data selecionada:', dataSelecionada);
      if (!profissionalSelecionado || !dataSelecionada) {
        alert('Selecione o profissional e a data antes de avançar.');
        return;
      }
      window.selectedProfissional = profissionalSelecionado;
      window.selectedDate = dataSelecionada;
      await irParaEtapaHorarios();
    });
  }

  // Funções utilitárias para obter seleção atual (ajuste conforme seu HTML)
  function obterProfissionalSelecionado() {
    // Exemplo: supondo que há um card ou select com data-profissional-id
    const cardAtivo = document.querySelector('.profissional-card.active');
    if (cardAtivo) return cardAtivo.dataset.profissionalId;
    // Ou, se for um select:
    // const select = document.getElementById('profissional');
    // return select ? select.value : null;
    return null;
  }
  function obterDataSelecionada() {
    // Exemplo: supondo que há um elemento com classe selected-day
    const diaSelecionado = document.querySelector('.calendar td.selected-day');
    console.log('Dia selecionado (elemento):', diaSelecionado?.dataset?.date);
    if (diaSelecionado) return diaSelecionado.dataset.date;
    // Ou, se for um input de data:
    // const input = document.getElementById('data-consulta');
    // return input ? input.value : null;
    return null;
  }
});
