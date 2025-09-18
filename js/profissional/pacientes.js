// Gerenciamento da página de pacientes do profissional

// Variáveis globais
let pacientesData = [];
let pacientesFiltrados = [];

// Inicialização da página
document.addEventListener('DOMContentLoaded', function() {
    initPacientesPage();
});

// Função principal de inicialização
function initPacientesPage() {
    // Verificar autenticação
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (!userData.id || localStorage.getItem('userType') !== 'profissional') {
        window.location.href = '../index.html';
        return;
    }

    // Carregar nome do profissional
    const nomeProfissional = userData.nome || localStorage.getItem('profissional_nome') || 'Profissional';
    document.getElementById('nome-profissional').textContent = nomeProfissional;
    
    // Configurar event listeners
    setupEventListeners();
    
    // Carregar pacientes
    carregarPacientes();
}

// Configurar event listeners
function setupEventListeners() {
    // Logout
    document.getElementById('logout-btn').addEventListener('click', function() {
        localStorage.removeItem('profissional_logado');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userType');
        localStorage.removeItem('userData');
        window.location.href = '../index.html';
    });

    // Filtros
    document.querySelector('.btn-filtrar').addEventListener('click', aplicarFiltros);
    document.getElementById('buscar-nome').addEventListener('input', aplicarFiltros);
    document.getElementById('filtro-status').addEventListener('change', aplicarFiltros);
}

// Função para carregar pacientes da API
async function carregarPacientes() {
    const loadingElement = document.getElementById('loading-pacientes');
    const erroElement = document.getElementById('erro-pacientes');
    const tabelaElement = document.getElementById('tabela-pacientes');
    
    try {
        // Mostrar loading
        showLoading(true);
        
        // Buscar ID do profissional logado
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const professionalId = userData.id;
        
        if (!professionalId) {
            throw new Error('ID do profissional não encontrado');
        }
        
        console.log('Carregando pacientes do profissional:', professionalId);
        
        // Tentar buscar pacientes diretamente
        try {
            pacientesData = await userAPI.getAll();
            console.log('Pacientes carregados diretamente:', pacientesData);
        } catch (directError) {
            console.log('Endpoint direto não disponível, tentando via agendamentos...');
            
            // Se não conseguir buscar diretamente, buscar via agendamentos
            const agendamentos = await scheduleAPI.getByProfessional(professionalId);
            console.log('Agendamentos encontrados:', agendamentos);
            
            // Extrair IDs únicos de pacientes dos agendamentos
            const pacienteIds = [...new Set(
                agendamentos
                    .filter(agendamento => agendamento.usuario_id || agendamento.paciente_id)
                    .map(agendamento => agendamento.usuario_id || agendamento.paciente_id)
            )];
            
            console.log('IDs de pacientes encontrados:', pacienteIds);
            
            // Buscar dados completos dos pacientes
            if (pacienteIds.length > 0) {
                const pacientesPromises = pacienteIds.map(id => userAPI.getById(id));
                const pacientesResults = await Promise.allSettled(pacientesPromises);
                
                pacientesData = pacientesResults
                    .filter(result => result.status === 'fulfilled')
                    .map(result => result.value);
                    
                console.log('Dados completos dos pacientes:', pacientesData);
            } else {
                pacientesData = [];
            }
        }
        
        // Verificar se retornou dados válidos
        if (!Array.isArray(pacientesData)) {
            console.warn('Dados retornados não são um array:', pacientesData);
            pacientesData = [];
        }
        
        pacientesFiltrados = [...pacientesData];
        
        // Renderizar tabela
        renderizarTabelaPacientes();
        
        // Mostrar tabela
        showLoading(false);
        showError(false);
        showTable(true);
        
        console.log(`${pacientesData.length} pacientes carregados com sucesso`);
        
    } catch (error) {
        console.error('Erro ao carregar pacientes:', error);
        
        // Mostrar erro
        showLoading(false);
        showTable(false);
        
        // Verificar se é erro de conectividade ou API não disponível
        if (error.code === 'ECONNREFUSED' || 
            error.message.includes('Network Error') ||
            error.response?.status === 404 ||
            error.message.includes('ID do profissional não encontrado')) {
        } else {
            showError(true);
            if (typeof utils !== 'undefined' && utils.showError) {
                utils.showError('Erro ao carregar pacientes: ' + (error.message || 'Erro desconhecido'));
            } else {
                console.error('Erro ao carregar pacientes:', error.message || 'Erro desconhecido');
            }
        }
    }
}

// Função para renderizar a tabela de pacientes
function renderizarTabelaPacientes() {
    const tbody = document.getElementById('pacientes-tbody');
    tbody.innerHTML = '';
    
    if (pacientesFiltrados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 20px; color: #666;">
                    ${pacientesData.length === 0 ? 'Nenhum paciente cadastrado' : 'Nenhum paciente encontrado com os filtros aplicados'}
                </td>
            </tr>
        `;
        return;
    }
    
    pacientesFiltrados.forEach(paciente => {
        const row = document.createElement('tr');
        row.setAttribute('data-status', paciente.status || 'ativo');
        
        // Usar nome correto baseado na estrutura da API
        const nomePaciente = paciente.name || 'Nome não informado';
        const emailPaciente = paciente.email || 'Não informado';
        const telefonePaciente = paciente.phone || '';
        
        row.innerHTML = `
            <td>${nomePaciente}</td>
            <td>${emailPaciente}</td>
            <td>${formatarTelefone(telefonePaciente)}</td>
            <td>
                <div class="acoes-tabela">
                    <button class="btn-mini" onclick="verFichaPaciente(${paciente.id})">Ver Ficha</button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Função para aplicar filtros
function aplicarFiltros() {
    const buscarNome = document.getElementById('buscar-nome').value.toLowerCase().trim();
    const filtroStatus = document.getElementById('filtro-status').value;
    
    pacientesFiltrados = pacientesData.filter(paciente => {
        let incluir = true;
        
        // Usar nome correto baseado na estrutura da API
        const nomePaciente = (paciente.nome || paciente.name || '').toLowerCase();
        
        // Filtro por nome
        if (buscarNome && !nomePaciente.includes(buscarNome)) {
            incluir = false;
        }
        
        // Filtro por status
        if (filtroStatus && (paciente.status || 'ativo') !== filtroStatus) {
            incluir = false;
        }
        
        return incluir;
    });
    
    renderizarTabelaPacientes();
}

// Função para ver ficha do paciente
function verFichaPaciente(pacienteId) {
    // Redireciona para a página de ficha do paciente
    window.location.href = `ficha-paciente.html?id=${pacienteId}`;
}

// Função para abrir modal de agendamento (será implementada no modal)
function abrirModalAgendamento(nomePaciente, pacienteId) {
    // Esta função será chamada quando o modal de agendamento estiver implementado
    if (typeof window.abrirModalAgendamento === 'function') {
        window.abrirModalAgendamento(nomePaciente, pacienteId);
    } else {
        console.log('Modal de agendamento não disponível ainda');
        alert(`Agendamento para ${nomePaciente} (ID: ${pacienteId}) será implementado em breve.`);
    }
}

// Funções utilitárias
function formatarTelefone(telefone) {
    if (!telefone) return 'Não informado';
    
    // Se já estiver formatado, retornar como está
    if (telefone.includes('(') && telefone.includes(')')) {
        return telefone;
    }
    
    // Remover tudo que não for número
    const apenasNumeros = telefone.replace(/\D/g, '');
    
    // Formatar baseado no tamanho
    if (apenasNumeros.length === 11) {
        return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7)}`;
    } else if (apenasNumeros.length === 10) {
        return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 6)}-${apenasNumeros.slice(6)}`;
    } else if (apenasNumeros.length >= 8) {
        return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`;
    }
    
    return telefone;
}

function generateSlug(nome) {
    return nome.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/(^-+)|(-+$)/g, '');
}

function showLoading(show) {
    document.getElementById('loading-pacientes').style.display = show ? 'block' : 'none';
}

function showError(show) {
    document.getElementById('erro-pacientes').style.display = show ? 'block' : 'none';
}

function showTable(show) {
    document.getElementById('tabela-pacientes').style.display = show ? 'table' : 'none';
}

// Função para recarregar pacientes (chamada pelo botão de erro)
function recarregarPacientes() {
    carregarPacientes();
}

// Expor função para uso global
window.carregarPacientes = carregarPacientes;
window.recarregarPacientes = recarregarPacientes;
window.verFichaPaciente = verFichaPaciente;
window.abrirModalAgendamento = abrirModalAgendamento;
