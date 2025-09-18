// JavaScript para área do Profissional - Integrado com API
document.addEventListener('DOMContentLoaded', function() {
  
  // Verificar autenticação
  function checkProfessionalAuth() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const userType = localStorage.getItem('userType');
    const authToken = localStorage.getItem('authToken');
    
    if (!userData || !authToken || userType !== 'profissional') {
      window.location.href = 'login.html';
      return false;
    }
    
    return userData;
  }
  
  // Inicializar página
  const professionalData = checkProfessionalAuth();
  if (!professionalData) return;
  
  // Atualizar nome do profissional na interface
  const nomeProfissionalElement = document.getElementById('nome-profissional');
  if (nomeProfissionalElement) {
    nomeProfissionalElement.textContent = professionalData.nome || professionalData.name || 'Profissional';
  }
  
  // Função de logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userType');
        localStorage.removeItem('userData');
        window.location.href = 'login.html';
    });
  }
  
  // Carregar dados do dashboard
  async function carregarDashboard() {
    try {
      // Buscar consultas do profissional
      const consultas = await consultaAPI.getAll();
      const consultasProfissional = consultas.filter(c => c.profissional_id === professionalData.id);
      
      // Buscar agendamentos do profissional
      const agendamentos = await scheduleAPI.getAll();
      const agendamentosProfissional = agendamentos.filter(a => a.profissional_id === professionalData.id);
      
      // Buscar último arquivo enviado
      await carregarUltimoArquivo();
      
      // Atualizar dashboard
      atualizarDashboard(consultasProfissional, agendamentosProfissional);
      
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      // Mostrar dados simulados em caso de erro
      mostrarDashboardSimulado();
    }
  }
  
  // Atualizar dados do dashboard
  function atualizarDashboard(consultas, agendamentos) {
    const hoje = new Date();
    const hojeString = hoje.toISOString().split('T')[0];
    
    // Filtrar agendamentos de hoje
    const agendamentosHoje = agendamentos.filter(a => a.data === hojeString);
    
    // Encontrar próximo agendamento
    const proximoAgendamento = agendamentosHoje
      .sort((a, b) => a.hora.localeCompare(b.hora))
      .find(a => {
        const agendamentoTime = new Date(`${hojeString}T${a.hora}`);
        return agendamentoTime > hoje;
      });
    
    // Atualizar próxima consulta
    const proximaConsultaCard = document.querySelector('.proxima-consulta');
    if (proximaConsultaCard && proximoAgendamento) {
      proximaConsultaCard.innerHTML = `
        <h3>🕐 Próxima Consulta</h3>
        <div class="consulta-info">
          <p class="data-hora">Hoje, ${utils.formatTimeForDisplay(proximoAgendamento.hora)}</p>
          <p class="paciente-nome">${proximoAgendamento.paciente?.name || 'Paciente não encontrado'}</p>
          <p class="tipo-consulta">${proximoAgendamento.observacoes || 'Consulta'}</p>
        </div>
        <button class="btn btn-detalhes" onclick="abrirDetalhesAgendamento(${proximoAgendamento.id})">Ver Detalhes</button>
      `;
    } else if (proximaConsultaCard) {
      proximaConsultaCard.innerHTML = `
        <h3>🕐 Próxima Consulta</h3>
        <div class="consulta-info">
          <p class="data-hora">Nenhuma consulta agendada para hoje</p>
        </div>
      `;
    }
    
    // Atualizar agenda de hoje
    const agendaLista = document.querySelector('.agenda-lista');
    if (agendaLista) {
      if (agendamentosHoje.length === 0) {
        agendaLista.innerHTML = '<p>Nenhum agendamento para hoje.</p>';
      } else {
        agendaLista.innerHTML = agendamentosHoje
          .sort((a, b) => a.hora.localeCompare(b.hora))
          .map(agendamento => `
            <div class="agenda-item">
              <div class="horario">${utils.formatTimeForDisplay(agendamento.hora)}</div>
              <div class="paciente">${agendamento.paciente?.name || 'Paciente não encontrado'} - ${agendamento.observacoes || 'Consulta'}</div>
              <button class="btn-mini" onclick="abrirDetalhesAgendamento(${agendamento.id})">Detalhes</button>
            </div>
          `).join('');
      }
    }
  }

  // Carregar último arquivo enviado pelo profissional
  async function carregarUltimoArquivo() {
    try {
      // Buscar todos os arquivos (API já retorna apenas os do profissional logado)
      const arquivos = await fileAPI.getAll();
      
      if (arquivos.length === 0) {
        atualizarCardUltimoArquivo(null);
        return;
      }
      
      // Ordenar por data de criação (mais recente primeiro)
      const ultimoArquivo = arquivos.sort((a, b) => {
        const dataA = new Date(a.createdAt);
        const dataB = new Date(b.createdAt);
        return dataB - dataA;
      })[0];
      
      atualizarCardUltimoArquivo(ultimoArquivo);
      
    } catch (error) {
      console.error('Erro ao carregar último arquivo:', error);
      atualizarCardUltimoArquivo(null);
    }
  }

  // Atualizar card do último arquivo
  function atualizarCardUltimoArquivo(arquivo) {
    const ultimoArquivoCard = document.querySelector('.ultimo-arquivo');
    if (!ultimoArquivoCard) return;
    
    if (!arquivo) {
      ultimoArquivoCard.innerHTML = `
        <h3>📎 Último Arquivo Enviado</h3>
        <div class="plano-info">
          <p class="plano-nome">Nenhum arquivo encontrado</p>
          <p class="plano-data">-</p>
        </div>
        <button class="btn btn-secundario" disabled>Baixar</button>
      `;
      return;
    }
    
    // Formatar data de criação
    const dataArquivo = new Date(arquivo.createdAt || arquivo.created_at || arquivo.data_upload);
    const dataFormatada = dataArquivo.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    ultimoArquivoCard.innerHTML = `
      <h3>📎 Último Arquivo Enviado</h3>
      <div class="plano-info">
        <p class="plano-nome">${arquivo.categoria || 'Arquivo'} - ${arquivo.paciente.name || ''}</p>
        <p class="plano-data">Enviado em ${dataFormatada}</p>
        ${arquivo.descricao ? `<p class="plano-descricao">${arquivo.descricao}</p>` : ''}
      </div>
      <button class="btn btn-secundario" onclick="baixarArquivo(${arquivo.id})">Baixar</button>
    `;
  }

  // Mostrar dashboard simulado em caso de erro
  function mostrarDashboardSimulado() {
    console.log('Mostrando dados simulados do dashboard');
    // Os dados simulados já estão no HTML, então não fazemos nada
  }
  
  // Função global para abrir detalhes do agendamento
  window.abrirDetalhesAgendamento = async function(agendamentoId) {
    try {
      const agendamento = await scheduleAPI.getById(agendamentoId);
      console.log("agendamento", agendamento)
      const modal = document.getElementById('modal-detalhes-consulta') || criarModalDetalhes();
      const conteudo = document.getElementById('detalhes-consulta-conteudo');
      
      // Armazenar o ID do paciente no modal para redirecionamento
      if (agendamento.paciente?.id) {
        modal.setAttribute('data-paciente-id', agendamento.paciente.id);
      }
      
      console.log("modal", modal)
      console.log("conteudo", conteudo)
      if (conteudo) {
        conteudo.innerHTML = `
          <h3>Detalhes do Agendamento</h3>
          <div class="detalhes-grid">
            <div class="detalhe-item">
              <strong>Paciente:</strong>
              <span>${agendamento.paciente?.name || 'N/A'}</span>
            </div>
            <div class="detalhe-item">
              <strong>Data:</strong>
              <span>${utils.formatDateForDisplay(agendamento.data)}</span>
            </div>
            <div class="detalhe-item">
              <strong>Horário:</strong>
              <span>${utils.formatTimeForDisplay(agendamento.hora)}</span>
            </div>
            <div class="detalhe-item">
              <strong>Telefone:</strong>
              <span>${agendamento.paciente?.phone || 'N/A'}</span>
            </div>
            <div class="detalhe-item">
              <strong>Email:</strong>
              <span>${agendamento.paciente?.email || 'N/A'}</span>
            </div>
            <div class="detalhe-item">
              <strong>Forma de Pagamento:</strong>
              <span>${agendamento.forma_pagamento || 'N/A'}</span>
            </div>
            <div class="detalhe-item">
              <strong>Valor:</strong>
              <span>R$ ${formatarValor(agendamento.valor)}</span>
            </div>
            <div class="detalhe-item full-width">
              <strong>Observações:</strong>
              <p>${agendamento.observacoes || 'Sem observações'}</p>
            </div>
          </div>
        `;
        
        modal.style.display = 'block';
      }
      
    } catch (error) {
      console.error('Erro ao carregar detalhes do agendamento:', error);
      utils.showError('Erro ao carregar detalhes do agendamento.');
    }
  };
  
  // Função para criar modal se não existir
  function criarModalDetalhes() {
    const modal = document.createElement('div');
    modal.id = 'modal-detalhes-consulta';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close" onclick="fecharModal('modal-detalhes-consulta')">&times;</span>
        <div id="detalhes-consulta-conteudo"></div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Fechar modal ao clicar fora
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        fecharModal('modal-detalhes-consulta');
      }
    });
    
    return modal;
  }
  
  // Função global para fechar modal
  window.fecharModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
    }
  };
  
  // Função global para iniciar consulta
  window.iniciarConsulta = function(agendamentoId) {
    // Redirecionar para página de consulta ou abrir formulário
    window.location.href = `consultas.html?agendamento=${agendamentoId}`;
  };
  
  // Carregar dashboard se estiver na página principal
  if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/profissional/')) {
    carregarDashboard();
  }
  
  // Função para carregar consultas do dia (página consultas.html)
  async function carregarConsultasDoDia() {
    try {
      const consultas = await consultaAPI.getAll();
      const hoje = new Date().toISOString().split('T')[0];
      
      const consultasHoje = consultas
        .filter(c => c.profissional_id === professionalData.id && c.data === hoje)
        .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
      
      atualizarListaConsultas(consultasHoje);
      
    } catch (error) {
      console.error('Erro ao carregar consultas:', error);
      // Manter dados simulados em caso de erro
    }
  }
  
  // Atualizar lista de consultas
  function atualizarListaConsultas(consultas) {
    const listaElement = document.querySelector('.consultas-lista');
    if (!listaElement) return;

    if (consultas.length === 0) {
      listaElement.innerHTML = `
        <div class="consulta-item">
          <p>Nenhuma consulta agendada para hoje.</p>
        </div>
      `;
      return;
    }

    listaElement.innerHTML = consultas.map(consulta => `
      <div class="consulta-item">
        <div class="consulta-info">
          <h3>${consulta.paciente?.name || 'Paciente não encontrado'}</h3>
          <p><strong>Horário:</strong> ${utils.formatTimeForDisplay(consulta.hora_inicio)} - ${utils.formatTimeForDisplay(consulta.hora_fim)}</p>
          <p><strong>Descrição:</strong> ${consulta.descricao || 'Sem descrição'}</p>
        </div>
        <div class="consulta-acoes">
          <button onclick="abrirDetalhesConsulta(${consulta.id})" class="btn-detalhes">
            Ver Detalhes
          </button>
          <button onclick="editarConsulta(${consulta.id})" class="btn-editar">
            Editar
          </button>
        </div>
      </div>
    `).join('');
  }
  
  // Carregar consultas se estiver na página de consultas
  if (window.location.pathname.includes('consultas.html')) {
    carregarConsultasDoDia();
  }
  
  // Função global para abrir detalhes da consulta
  window.abrirDetalhesConsulta = async function(consultaId) {
    try {
      const consulta = await consultaAPI.getById(consultaId);
      
      const modal = document.getElementById('modal-detalhes-consulta') || criarModalDetalhes();
      const conteudo = document.getElementById('detalhes-consulta-conteudo');
      
      if (conteudo) {
        conteudo.innerHTML = `
          <h3>Detalhes da Consulta</h3>
          <div class="detalhes-grid">
            <div class="detalhe-item">
              <strong>Paciente:</strong>
              <span>${consulta.paciente?.name || 'N/A'}</span>
            </div>
            <div class="detalhe-item">
              <strong>Data:</strong>
              <span>${utils.formatDateForDisplay(consulta.data)}</span>
            </div>
            <div class="detalhe-item">
              <strong>Horário:</strong>
              <span>${utils.formatTimeForDisplay(consulta.hora_inicio)} - ${utils.formatTimeForDisplay(consulta.hora_fim)}</span>
            </div>
            <div class="detalhe-item">
              <strong>Telefone:</strong>
              <span>${consulta.paciente?.phone || 'N/A'}</span>
            </div>
            <div class="detalhe-item">
              <strong>Email:</strong>
              <span>${consulta.paciente?.email || 'N/A'}</span>
            </div>
            <div class="detalhe-item full-width">
              <strong>Descrição:</strong>
              <p>${consulta.descricao || 'Sem descrição'}</p>
            </div>
            <div class="detalhe-item full-width">
              <strong>Orientações:</strong>
              <p>${consulta.orientacao || 'Sem orientações'}</p>
            </div>
            <div class="detalhe-item full-width">
              <strong>Objetivo do Paciente:</strong>
              <p>${consulta.objetivo_paciente || 'Não informado'}</p>
            </div>
          </div>
          <div class="modal-acoes">
            <button onclick="fecharModal('modal-detalhes-consulta')" class="btn-cancelar">
              Fechar
            </button>
            <button onclick="editarConsulta(${consulta.id})" class="btn-editar">
              Editar Consulta
            </button>
          </div>
        `;
        
        modal.style.display = 'block';
      }
      
    } catch (error) {
      console.error('Erro ao carregar detalhes da consulta:', error);
      utils.showError('Erro ao carregar detalhes da consulta.');
    }
  };
  
  // Função global para editar consulta
  window.editarConsulta = function(consultaId) {
    // Implementar edição de consulta
    utils.showError('Funcionalidade de edição será implementada em breve.');
  };

  // Função global para baixar arquivo
  window.baixarArquivo = async function(arquivoId) {
    try {
      await fileAPI.download(arquivoId);
      utils.showSuccess('Arquivo baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      utils.showError('Erro ao baixar arquivo. Tente novamente.');
    }
  };
  
});

// Adicionar estilos para os modais se não existirem
if (!document.querySelector('#professional-modal-styles')) {
  const styles = document.createElement('style');
  styles.id = 'professional-modal-styles';
  styles.textContent = `
    .modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: rgba(0,0,0,0.4);
    }
    
    .modal-content {
      background-color: #fefefe;
      margin: 5% auto;
      padding: 20px;
      border: none;
      border-radius: 12px;
      width: 90%;
      max-width: 600px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }
    
    .close {
      color: #aaa;
      float: right;
      font-size: 28px;
      font-weight: bold;
      cursor: pointer;
    }
    
    .close:hover,
    .close:focus {
      color: #000;
      text-decoration: none;
    }
    
    .detalhes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    
    .detalhe-item {
      padding: 10px;
      border: 1px solid #e9ecef;
      border-radius: 6px;
    }
    
    .detalhe-item.full-width {
      grid-column: 1 / -1;
    }
    
    .modal-acoes {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 20px;
    }
    
    .btn-cancelar, .btn-editar, .btn-iniciar {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    }
    
    .btn-cancelar {
      background: #6c757d;
      color: white;
    }
    
    .btn-editar {
      background: #17a2b8;
      color: white;
    }
    
    .btn-iniciar {
      background: #28a745;
      color: white;
    }
    
    .plano-descricao {
      font-size: 0.9em;
      color: #6c757d;
      margin-top: 5px;
    }
  `;
  document.head.appendChild(styles);
}

// Função auxiliar para formatar valores monetários
function formatarValor(valor) {
  try {
    if (!valor || valor === null || valor === undefined) {
      return '0,00';
    }
    
    // Converter para número se for string
    const numeroValor = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : parseFloat(valor);
    
    // Verificar se é um número válido
    if (isNaN(numeroValor)) {
      return '0,00';
    }
    
    // Formatar para moeda brasileira
    return numeroValor.toFixed(2).replace('.', ',');
  } catch (error) {
    console.error('Erro ao formatar valor:', error);
    return '0,00';
  }
}

// Tornar função disponível globalmente
window.formatarValor = formatarValor;

// Função global para redirecionar para ficha do paciente
window.redirecionarParaFicha = function() {
  // Obter o ID do paciente armazenado no modal
  const modal = document.getElementById('modal-detalhes-consulta');
  const pacienteId = modal ? modal.getAttribute('data-paciente-id') : null;
  
  if (pacienteId) {
    // Redirecionar para a ficha do paciente com o ID correto
    window.location.href = `ficha-paciente.html?id=${pacienteId}`;
  }
};
