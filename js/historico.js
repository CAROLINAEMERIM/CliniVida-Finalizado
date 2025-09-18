// Página de Histórico - Conexão com API
document.addEventListener('DOMContentLoaded', function() {
  const tabelaHistorico = document.querySelector('.historico-table tbody');
  const btnPesquisar = document.querySelector('.btn-pesquisar-historico');
  
  // Carregar histórico do paciente
  async function carregarHistorico(dataInicio = null, dataFim = null) {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (!userData || !userData.id) {
        alert('Usuário não encontrado. Faça login novamente.');
        return;
      }
      // Buscar agendamentos e consultas
      const [agendamentos, consultas] = await Promise.all([
        window.scheduleAPI && window.scheduleAPI.getAll ? window.scheduleAPI.getAll() : [],
        window.consultaAPI && window.consultaAPI.getAll ? window.consultaAPI.getAll() : []
      ]);
      // Filtrar por paciente
      const agendamentosPaciente = Array.isArray(agendamentos) ? agendamentos.filter(ag => ag.paciente_id === userData.id) : [];
      const consultasPaciente = Array.isArray(consultas) ? consultas.filter(cons => cons.paciente_id === userData.id) : [];
      // Combinar dados
      let historico = [
        ...agendamentosPaciente.map(ag => ({
          data: ag.data,
          hora: ag.hora,
          tipo: 'Agendamento',
          profissional: ag.profissional ? ag.profissional.nome : 'N/A',
          status: new Date(ag.data + 'T' + ag.hora) > new Date() ? 'Agendado' : 'Realizado',
          observacoes: ag.observacoes || '',
          valor: parseFloat(ag.valor) || 0
        })),
        ...consultasPaciente.map(cons => ({
          data: cons.data,
          hora: cons.hora_inicio,
          tipo: 'Consulta',
          profissional: cons.profissional ? cons.profissional.nome : 'N/A',
          status: 'Realizado',
          observacoes: cons.descricao || '',
          valor: 0
        }))
      ];
      // Filtrar por período se especificado
      if (dataInicio) {
        historico = historico.filter(item => item.data >= dataInicio);
      }
      if (dataFim) {
        historico = historico.filter(item => item.data <= dataFim);
      }
      // Ordenar por data (mais recente primeiro)
      historico.sort((a, b) => {
        const dataA = new Date(a.data + 'T' + (a.hora || '00:00'));
        const dataB = new Date(b.data + 'T' + (b.hora || '00:00'));
        return dataB - dataA;
      });
      preencherTabela(historico);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      alert('Erro ao carregar histórico. Tente novamente.');
    }
  }

  // Armazenar dados dos itens para o modal
  let dadosHistorico = [];

  // Preencher tabela com dados
  function preencherTabela(dados) {
    if (!tabelaHistorico) return;

    // Armazenar dados globalmente para uso no modal
    dadosHistorico = dados;

    if (dados.length === 0) {
      tabelaHistorico.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 20px;">
            Nenhum registro encontrado para o período selecionado.
          </td>
        </tr>
      `;
      return;
    }

    tabelaHistorico.innerHTML = dados.map((item, index) => `
      <tr>
        <td>${window.utils.formatDateForDisplay(item.data)}</td>
        <td>${window.utils.formatTimeForDisplay(item.hora || '00:00')}</td>
        <td>${item.profissional}</td>
        <td>
          <span class="status-badge status-${item.status.toLowerCase()}">
            ${item.status}
          </span>
        </td>
        <td>
          <button class="btn-detalhes" onclick="verDetalhes(${index})">
            Ver Detalhes
          </button>
        </td>
      </tr>
    `).join('');
  }

  // Pesquisar por período
  if (btnPesquisar) {
    btnPesquisar.addEventListener('click', function() {
      const dataInicio = document.getElementById('periodoInicial')?.value;
      const dataFim = document.getElementById('periodoFinal')?.value;
      
      if (dataInicio && dataFim && dataInicio > dataFim) {
        window.utils.showError('A data inicial não pode ser posterior à data final.');
        return;
      }
      
      carregarHistorico(dataInicio, dataFim);
    });
  }

  // Função global para ver detalhes (chamada pelos botões)
  window.verDetalhes = function(index) {
    const dados = dadosHistorico[index];
    if (!dados) return; 
    
    const dataFormatada = window.utils.formatDateForDisplay(dados.data);
    const horarioFormatado = window.utils.formatTimeForDisplay(dados.hora);
    
    // Garantir que valor é um número antes de usar toFixed
    const valor = parseFloat(dados.valor) || 0;
    const valorFormatado = valor > 0 ? `R$ ${valor.toFixed(2)}` : 'Não se aplica';
    
    // Preencher os dados no modal
    document.getElementById('modal-titulo').textContent = `Detalhes - ${dados.tipo}`;
    document.getElementById('modal-data').textContent = dataFormatada;
    document.getElementById('modal-horario').textContent = horarioFormatado;
    document.getElementById('modal-tipo').textContent = dados.tipo;
    document.getElementById('modal-profissional').textContent = dados.profissional;
    document.getElementById('modal-valor').textContent = valorFormatado;
    document.getElementById('modal-observacoes').textContent = dados.observacoes || 'Nenhuma observação registrada';
    
    // Configurar status com classe CSS apropriada
    const statusElement = document.getElementById('modal-status');
    statusElement.textContent = dados.status;
    statusElement.className = `detalhes-status status-${dados.status.toLowerCase()}`;
    
    // Abrir o modal
    const modal = document.getElementById('modal-detalhes-historico');
    if (modal) {
      modal.classList.add('ativo');
    }
  };

  // Carregar histórico inicial
  carregarHistorico();

  // --- INICIO DA MODIFICAÇÃO ---

  // Carregar arquivos do paciente
  async function carregarArquivosPaciente() {
    const arquivosGrid = document.querySelector('#tab-arquivos .arquivos-grid');
    if (!arquivosGrid) return;
    arquivosGrid.innerHTML = '<p class="loading-arquivos">Carregando arquivos...</p>';
    try {
      const arquivos = window.fileAPI && window.fileAPI.getForPatient ? await window.fileAPI.getForPatient() : [];
      if (!arquivos || arquivos.length === 0) {
        arquivosGrid.innerHTML = '<p>Nenhum arquivo recebido.</p>';
        return;
      }
      arquivosGrid.innerHTML = arquivos.map(arquivo => {
        const dataFormatada = window.utils.formatDateForDisplay(arquivo.data_envio || arquivo.createdAt);
        // A API precisa retornar o nome do profissional que enviou
        const nomeProfissional = arquivo.profissional ? arquivo.profissional.nome : 'Profissional';
        
        return `
          <div class="arquivo-card">
              <div class="arquivo-info">
                  <h4>${arquivo.nome || arquivo.filename || 'Arquivo sem nome'}</h4>
                  <p>Enviado por: ${nomeProfissional}</p>
                  <p>Data: ${dataFormatada}</p>
                  ${arquivo.descricao ? `<p class="arquivo-descricao">Descrição: ${arquivo.descricao}</p>` : ''}
              </div>
              <div class="arquivo-acoes">
                  <button class="btn-mini" onclick="baixarArquivo('${arquivo.id}')">Baixar</button>
              </div>
          </div>
        `;
      }).join('');

    } catch (error) {
      console.error('Erro ao carregar arquivos do paciente:', error);
      arquivosGrid.innerHTML = '<p class="error-message" style="color: red;">Erro ao carregar arquivos. Tente novamente mais tarde.</p>';
    }
  }

  // Função para baixar arquivo (deve ser global para o onclick funcionar)
  window.baixarArquivo = async function(arquivoId) {
    try {
        // Criar ou encontrar elemento de feedback específico para downloads
        let feedbackElement = document.querySelector('#arquivos-feedback');
        if (!feedbackElement) {
          feedbackElement = document.createElement('div');
          feedbackElement.id = 'arquivos-feedback';
          feedbackElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            display: none;
          `;
          document.body.appendChild(feedbackElement);
        }
        
        // Mostrar feedback de loading
        feedbackElement.textContent = 'Iniciando download...';
        feedbackElement.style.backgroundColor = '#007bff';
        feedbackElement.style.display = 'block';
        
        await window.fileAPI.download(arquivoId);
        
        // Mostrar feedback de sucesso
        feedbackElement.textContent = '✅ Download iniciado!';
        feedbackElement.style.backgroundColor = '#28a745';
        
        // Esconder após 3 segundos
        setTimeout(() => {
            feedbackElement.style.display = 'none';
        }, 3000);
        
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      
      // Mostrar feedback de erro
      let feedbackElement = document.querySelector('#arquivos-feedback');
      if (feedbackElement) {
        feedbackElement.textContent = '❌ Erro ao baixar arquivo';
        feedbackElement.style.backgroundColor = '#dc3545';
        feedbackElement.style.display = 'block';
        
        setTimeout(() => {
            feedbackElement.style.display = 'none';
        }, 3000);
      } else {
        alert('Não foi possível baixar o arquivo. Tente novamente.');
      }
    }
  }

  // Chamar a função para carregar arquivos quando a aba for clicada
  const tabArquivosBtn = document.querySelector('.tab-btn[onclick="showTab(\'arquivos\')"]');
  if (tabArquivosBtn) {
    tabArquivosBtn.addEventListener('click', () => {
      // Só carrega uma vez para evitar múltiplas chamadas
      if (!tabArquivosBtn.classList.contains('loaded')) {
        carregarArquivosPaciente();
        tabArquivosBtn.classList.add('loaded');
      }
    });
  }
  // --- FIM DA MODIFICAÇÃO ---

  // Adicionar estilos para status
  if (!document.querySelector('#status-styles')) {
    const styles = document.createElement('style');
    styles.id = 'status-styles';
    styles.textContent = `
      .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8em;
        font-weight: 600;
        text-transform: uppercase;
      }
      .status-agendado {
        background-color: #e3f2fd;
        color: #1976d2;
      }
      .status-realizado {
        background-color: #e8f5e8;
        color: #388e3c;
      }
      .btn-detalhes {
        background: #885d9f;
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8em;
      }
      .btn-detalhes:hover {
        background: #6d4685;
      }
    `;
    document.head.appendChild(styles);
  }
});

