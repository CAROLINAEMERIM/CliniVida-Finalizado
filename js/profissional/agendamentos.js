// Gerenciamento da página de consultas do profissional - Integrado com API

// Logout
document.getElementById('logout-btn')?.addEventListener('click', function () {
    logout();
});

// Carregar dados iniciais da página
document.addEventListener('DOMContentLoaded', function () {
    const nomeProfissional = localStorage.getItem('profissional_nome') || 'Profissional';
    document.getElementById('nome-profissional').textContent = nomeProfissional;

    // Carregar consultas agendadas
    carregarConsultasAgendadas();

    // Carregar lista de pacientes para o formulário
    carregarPacientes();
});

// Função para carregar consultas agendadas do backend
async function carregarConsultasAgendadas() {
    const container = document.getElementById('consultas-container');
    const loadingMessage = document.getElementById('loading-message');
    const noConsultasMessage = document.getElementById('no-consultas-message');

    // Verificar se os elementos essenciais existem
    if (!container) {
        console.error('Elemento consultas-container não encontrado no DOM');
        return;
    }

    try {
        // Obter ID do profissional logado
        const userData = localStorage.getItem('userData');
        let profissionalId = localStorage.getItem('profissional_id') || '1';
        
        // Se tiver userData, usar o ID de lá
        if (userData) {
            const user = JSON.parse(userData);
            profissionalId = user.id || profissionalId;
        }

        // Usar a API do scheduleAPI para buscar consultas
        const consultas = await scheduleAPI.getByProfessional(profissionalId);

        // Esconder mensagem de loading
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }

        if (!consultas || consultas.length === 0) {
            if (noConsultasMessage) {
                noConsultasMessage.style.display = 'block';
            } else {
                // Fallback: mostrar mensagem dentro do container
                container.innerHTML = '<p class="sem-dados">Nenhuma consulta agendada encontrada.</p>';
            }
            return;
        }

        // Esconder mensagem de "sem consultas" se ela existir
        if (noConsultasMessage) {
            noConsultasMessage.style.display = 'none';
        }

        // Limpar container e renderizar consultas
        container.innerHTML = '';
        consultas.forEach(consulta => {
            container.appendChild(criarCardConsulta(consulta));
        });

    } catch (error) {
        console.error('Erro ao carregar consultas:', error);
        
        if (loadingMessage) {
            loadingMessage.innerHTML = '<p style="color: red;">Erro ao carregar consultas. Tente recarregar a página.</p>';
        } else {
            // Fallback: mostrar erro dentro do container
            container.innerHTML = '<p style="color: red;">Erro ao carregar consultas. Tente recarregar a página.</p>';
        }
        
        // Tratamento de erro mais detalhado
        let errorMsg = 'Erro ao carregar consultas. Tente recarregar a página.';
        
        if (error.message) {
            errorMsg = error.message;
        } else if (error.response?.data?.message) {
            errorMsg = error.response.data.message;
        }
        
        loadingMessage.innerHTML = `<p style="color: red;">${errorMsg}</p>`;
    }
}

// Função para criar card de consulta
function criarCardConsulta(consulta) {
    const div = document.createElement('div');
    div.className = 'consulta-card';

    // Formatar data e hora usando as funções utilitárias se disponíveis
    const dataFormatada = utils.formatDateForDisplay ? 
        utils.formatDateForDisplay(consulta.data) : 
        formatarData(consulta.data);
    
    const horaFormatada = utils.formatTimeForDisplay ? 
        utils.formatTimeForDisplay(consulta.hora) : 
        formatarHora(consulta.hora);

    // Suporte a diferentes formatos de dados da API
    const nomePaciente = consulta.paciente.name || 'Paciente não informado';
    const tipoConsulta = consulta.tipo || consulta.type || 'Consulta Nutricional';
    const consultaId = consulta.id || consulta._id;

    div.innerHTML = `
        <div class="consulta-info">
            <div class="data-hora">
                <span class="data">${dataFormatada}</span>
                <span class="hora">${horaFormatada}</span>
            </div>
            <div class="paciente-dados">
                <h3>${nomePaciente}</h3>
                <p>${tipoConsulta}</p>
            </div>
        </div>
        <div class="consulta-acoes">
            <button class="btn btn-detalhes" onclick="abrirDetalhesConsulta(${consultaId})">Ver Detalhes</button>
            <button class="btn btn-secundario" onclick="reagendarConsulta(${consultaId})">Reagendar</button>
        </div>
    `;

    return div;
}

// Função para carregar pacientes do backend
async function carregarPacientes() {
    const select = document.getElementById('paciente-select');

    try {
        const pacientes = await userAPI.getAll();

        // Limpar opções existentes
        select.innerHTML = '<option value="">Selecione um paciente</option>';

        // Verificar se há pacientes
        if (pacientes.length === 0) {
            select.innerHTML = '<option value="">Nenhum paciente cadastrado</option>';
            return;
        }

        // Adicionar pacientes
        pacientes.forEach(paciente => {
            if (paciente && paciente.id) {
                const option = document.createElement('option');
                option.value = paciente.id;
                option.textContent = paciente.name;
                select.appendChild(option);
            } else {
                console.warn("Paciente com formato inválido:", paciente);
            }
        });

    } catch (error) {
        console.error('Erro ao carregar pacientes:', error.response.message);
        select.innerHTML = '<option value="">Erro ao carregar pacientes</option>';
    }
}

// Função para abrir detalhes da consulta
async function abrirDetalhesConsulta(consultaId) {
    const modal = document.getElementById('modal-detalhes-consulta');
    const conteudo = document.getElementById('detalhes-consulta-conteudo');

    try {
        // Mostrar loading no modal
        conteudo.innerHTML = '<p>Carregando detalhes da consulta...</p>';
        modal.style.display = 'flex';

        // Usar a API do scheduleAPI para buscar detalhes
        const consulta = await scheduleAPI.getById(consultaId);

        // Armazenar o ID do paciente no modal para redirecionamento
        if (consulta.paciente?.id) {
            modal.setAttribute('data-paciente-id', consulta.paciente.id);
        } else if (consulta.paciente_id) {
            modal.setAttribute('data-paciente-id', consulta.paciente_id);
        }

        // Formatar data e hora usando as funções utilitárias
        const dataFormatada = utils.formatDateForDisplay(consulta.data) || formatarData(consulta.data);
        const horaFormatada = utils.formatTimeForDisplay(consulta.hora) || formatarHora(consulta.hora);

        conteudo.innerHTML = `
            <div class="detalhes-grid">
                <div class="detalhe-item">
                    <strong>Paciente:</strong> ${consulta.paciente.name || 'Não informado'}
                </div>
                <div class="detalhe-item">
                    <strong>Data:</strong> ${dataFormatada}
                </div>
                <div class="detalhe-item">
                    <strong>Horário:</strong> ${horaFormatada}
                </div>
                <div class="detalhe-item">
                    <strong>Tipo:</strong> ${consulta.tipo || consulta.type || 'Consulta Nutricional'}
                </div>
                <div class="detalhe-item">
                    <strong>Telefone:</strong> ${consulta.paciente.phone || 'Não informado'}
                </div>
                <div class="detalhe-item">
                    <strong>Valor:</strong> ${consulta.valor ? formatarMoeda(consulta.valor) : 'Não informado'}
                </div>
                <div class="detalhe-item observacoes">
                    <strong>Observações:</strong><br>
                    ${consulta.observacoes || consulta.notes || 'Nenhuma observação registrada.'}
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Erro ao carregar detalhes da consulta:', error);
        
        let errorMsg = 'Erro ao carregar detalhes da consulta.';
        if (error.message) {
            errorMsg = error.message;
        } else if (error.response?.data?.message) {
            errorMsg = error.response.data.message;
        }
        
        conteudo.innerHTML = `<p style="color: red;">${errorMsg}</p>`;
    }
}

// Função para fechar modal
function fecharModal(modalId) {
    const modalElement = document.getElementById(modalId);
    if (!modalElement) {
        console.warn(`Modal com ID "${modalId}" não encontrado`);
        return;
    }

    // Se for o modal de nova consulta, resetar para o estado inicial
    if (modalId === 'modal-nova-consulta') {
        resetModalNovaConsulta();
    }
    
    modalElement.style.display = 'none';
}

// Fechar modal clicando fora
window.onclick = function (event) {
    const modalDetalhes = document.getElementById('modal-detalhes-consulta');
    const modalNovaConsulta = document.getElementById('modal-nova-consulta');

    if (event.target === modalDetalhes) {
        fecharModal('modal-detalhes-consulta');
    }
    if (event.target === modalNovaConsulta) {
        fecharModal('modal-nova-consulta');
    }
}

// Função para abrir formulário de novo agendamento
function abrirFormularioNovaConsulta() {
    resetModalNovaConsulta();
    
    const modal = document.getElementById('modal-nova-consulta');
    const dataConsultaInput = document.getElementById('data-consulta');
    const valorConsultaInput = document.getElementById('valor-consulta');

    if (!modal) {
        console.error('Modal de nova consulta não encontrado');
        return;
    }

    if (valorConsultaInput) {
        valorConsultaInput.value = JSON.parse(localStorage.getItem('userData')).valor_consulta;
    }

    if (dataConsultaInput) {
        const hoje = new Date();
        const dataMinima = hoje.toISOString().split('T')[0];
        dataConsultaInput.setAttribute('min', dataMinima);
    }

    modal.style.display = 'flex';
}

// Função para resetar o modal para o estado inicial
function resetModalNovaConsulta() {
    const modal = document.getElementById('modal-nova-consulta');
    const form = document.getElementById('form-nova-consulta');
    const feedbackElement = document.getElementById('feedback-modal-consulta');
    
    if (!modal || !form) {
        console.warn('Modal ou formulário de nova consulta não encontrado');
        return;
    }
    
    // Resetar o formulário
    form.reset();
    
    // Esconder feedback
    if (feedbackElement) {
        feedbackElement.style.display = 'none';
    }
    
    // Restaurar título original
    const tituloModal = modal.querySelector('h2');
    tituloModal.textContent = 'Agendar Nova Consulta';
    
    // Restaurar texto do botão
    const submitButton = modal.querySelector('button[type="submit"]');
    submitButton.textContent = 'Agendar Consulta';
    submitButton.disabled = false;
    
    // Remover o atributo de consulta ID
    modal.removeAttribute('data-consulta-id');
}

// Gerenciar seleção de paciente
document.getElementById('paciente-select')?.addEventListener('change', function () {
    const pacienteId = this.value;

    console.log('Paciente selecionado:', pacienteId);

    
});

// Submissão do formulário de nova consulta
const formNovaConsulta = document.getElementById('form-nova-consulta');
if (formNovaConsulta) {
    formNovaConsulta.addEventListener('submit', async function (e) {
        e.preventDefault();

        const modal = document.getElementById('modal-nova-consulta');
        if (!modal) {
            console.error('Modal de nova consulta não encontrado');
            return;
        }
    const consultaId = modal.getAttribute('data-consulta-id'); // Verifica se é reagendamento
    const isReagendamento = consultaId !== null;

    // Obter ID do profissional logado
    const userData = localStorage.getItem('userData');
    let profissionalId = localStorage.getItem('profissional_id') || "1";
    
    if (userData) {
        const user = JSON.parse(userData);
        profissionalId = user.id || profissionalId;
    }

    const formData = {
        paciente_id: document.getElementById('paciente-select').value,
        data: document.getElementById('data-consulta').value,
        hora: document.getElementById('horaInicio-consulta').value,
        observacoes: document.getElementById('observacoes').value,
        valor: document.getElementById('valor-consulta').value,
        forma_pagamento: document.getElementById('formaPagamento-consulta').value,
        profissional_id: profissionalId
    };

    // Validar se o horário não está no passado
    const dataConsulta = new Date(formData.data + 'T' + formData.hora);
    const agora = new Date();
    const feedbackElement = document.getElementById('feedback-modal-consulta');

    if (dataConsulta <= agora) {
        utils.showError('Por favor, selecione uma data e horário futuros.', feedbackElement);
        return;
    }

    // Mostrar loading
    utils.showLoading('Processando...', feedbackElement);
    
    // Desabilitar botão durante o processamento
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Processando...';

    try {
        let response;
        
        if (isReagendamento) {
            // Atualizar consulta existente
            response = await scheduleAPI.update(consultaId, formData);
            utils.showSuccess('Consulta reagendada com sucesso!', feedbackElement);
        } else {
            // Criar nova consulta
            response = await scheduleAPI.create(formData);
            utils.showSuccess('Consulta agendada com sucesso!', feedbackElement);
        }

        console.log('Consulta processada:', response);

        // Aguardar um pouco antes de fechar o modal
        setTimeout(() => {
            // Resetar o modal para o estado inicial
            resetModalNovaConsulta();
            fecharModal('modal-nova-consulta');
            
            // Recarregar a lista de consultas
            carregarConsultasAgendadas();
        }, 2000);
        
    } catch (error) {
        console.error('Erro ao processar consulta:', error);
        
        let errorMsg = isReagendamento ? 
            'Erro ao reagendar consulta. Verifique sua conexão e tente novamente.' :
            'Erro ao agendar consulta. Verifique sua conexão e tente novamente.';
            
        if (error.message) {
            errorMsg = error.message;
        } else if (error.response?.data?.message) {
            errorMsg = error.response.data.message;
        }
        
        utils.showError(errorMsg, feedbackElement);
        
    } finally {
        // Reabilitar botão
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
    });
} else {
    console.error('Formulário de nova consulta não encontrado no DOM');
}

// Filtros
const btnFiltrar = document.querySelector('.btn-filtrar');
if (btnFiltrar) {
    btnFiltrar.addEventListener('click', async function () {
        const dataFiltro = document.getElementById('filtro-data')?.value;
        const pacienteFiltro = document.getElementById('filtro-paciente')?.value?.toLowerCase() || '';

    try {
        // Obter ID do profissional logado
        const userData = localStorage.getItem('userData');
        let profissionalId = localStorage.getItem('profissional_id') || '1';
        
        if (userData) {
            const user = JSON.parse(userData);
            profissionalId = user.id || profissionalId;
        }

        // Buscar todas as consultas do profissional usando a API
        const todasConsultas = await scheduleAPI.getByProfessional(profissionalId);

        // Aplicar filtros localmente
        let consultasFiltradas = todasConsultas;

        if (dataFiltro) {
            consultasFiltradas = consultasFiltradas.filter(consulta => {
                const dataConsulta = new Date(consulta.data).toISOString().split('T')[0];
                return dataConsulta === dataFiltro;
            });
        }

        if (pacienteFiltro) {
            consultasFiltradas = consultasFiltradas.filter(consulta => {
                const nomePaciente = (consulta.paciente_nome || consulta.patient_name || '').toLowerCase();
                return nomePaciente.includes(pacienteFiltro);
            });
        }

        // Atualizar a interface
        const container = document.getElementById('consultas-container');
        const noConsultasMessage = document.getElementById('no-consultas-message');

        // Verificar se os elementos existem no DOM
        if (!container) {
            console.error('Elemento consultas-container não encontrado');
            return;
        }

        // Limpar container
        container.innerHTML = '';

        if (consultasFiltradas.length === 0) {
            if (noConsultasMessage) {
                noConsultasMessage.style.display = 'block';
            } else {
                // Fallback: mostrar mensagem dentro do container
                container.innerHTML = '<p class="sem-dados">Nenhuma consulta encontrada para os filtros aplicados.</p>';
            }
        } else {
            if (noConsultasMessage) {
                noConsultasMessage.style.display = 'none';
            }
            consultasFiltradas.forEach(consulta => {
                container.appendChild(criarCardConsulta(consulta));
            });
        }

    } catch (error) {
        console.error('Erro ao filtrar consultas:', error);
        
        let errorMsg = 'Erro ao aplicar filtros. Tente novamente.';
        if (error.message) {
            errorMsg = error.message;
        } else if (error.response?.data?.message) {
            errorMsg = error.response.data.message;
        }
        
        // Usar feedback visual em vez de alert
        const feedbackElement = document.getElementById('feedback-page');
        utils.showError(errorMsg, feedbackElement);
    }
    });
} else {
    console.error('Botão de filtrar não encontrado no DOM');
}

// Função para reagendar consulta
async function reagendarConsulta(consultaId) {
    try {
        // Buscar detalhes da consulta atual
        const consulta = await scheduleAPI.getById(consultaId);
        
        // Abrir o modal de nova consulta
        const modal = document.getElementById('modal-nova-consulta');
        
        // Alterar o título do modal para indicar que é um reagendamento
        const tituloModal = modal.querySelector('h2');
        tituloModal.textContent = 'Reagendar Consulta';
        
        // Aguardar um pouco para garantir que os pacientes foram carregados
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Preencher os campos do formulário com os dados atuais
        const pacienteId = consulta.paciente_id || consulta.paciente?.id;
        if (pacienteId) {
            document.getElementById('paciente-select').value = pacienteId;
        }
        
        // Formatar data para o campo input (YYYY-MM-DD)
        if (consulta.data) {
            const dataConsulta = new Date(consulta.data);
            const dataFormatada = dataConsulta.toISOString().split('T')[0];
            document.getElementById('data-consulta').value = dataFormatada;
        }
        
        // Formatar hora para o campo input (HH:MM)
        if (consulta.hora) {
            let horaFormatada = consulta.hora;
            if (horaFormatada && horaFormatada.includes(':')) {
                horaFormatada = horaFormatada.substring(0, 5);
            }
            document.getElementById('horaInicio-consulta').value = horaFormatada;
        }
        
        document.getElementById('valor-consulta').value = consulta.valor || '';
        document.getElementById('formaPagamento-consulta').value = consulta.forma_pagamento || '';
        document.getElementById('observacoes').value = consulta.observacoes || consulta.notes || '';
        
        // Configurar data mínima (hoje)
        const hoje = new Date();
        const dataMinima = hoje.toISOString().split('T')[0];
        document.getElementById('data-consulta').setAttribute('min', dataMinima);
        
        // Armazenar o ID da consulta para usar na atualização
        modal.setAttribute('data-consulta-id', consultaId);
        
        // Mostrar o modal
        modal.style.display = 'flex';
        
        // Alterar o botão de submit para "Reagendar"
        const submitButton = modal.querySelector('button[type="submit"]');
        submitButton.textContent = 'Reagendar Consulta';
        
    } catch (error) {
        console.error('Erro ao carregar dados da consulta para reagendamento:', error);
        
        let errorMsg = 'Erro ao carregar dados da consulta.';
        if (error.message) {
            errorMsg = error.message;
        } else if (error.response?.data?.message) {
            errorMsg = error.response.data.message;
        }
        
        // Usar o sistema de feedback em vez de alert
        const feedbackElement = document.getElementById('feedback-modal-consulta');
        if (feedbackElement) {
            // Abrir o modal primeiro para mostrar o erro
            const modal = document.getElementById('modal-nova-consulta');
            modal.style.display = 'flex';
            utils.showError(errorMsg, feedbackElement);
        } else {
            // Fallback para alert se o elemento não existir
            alert(errorMsg);
        }
    }
}

// Funções auxiliares
function formatarData(data) {
    if (!data) return 'Data não informada';

    try {
        const date = new Date(data);
        return date.toLocaleDateString('pt-BR');
    } catch (error) {
        return data;
    }
}

function formatarHora(hora) {
    if (!hora) return 'Hora não informada';

    try {
        // Se a hora já estiver no formato HH:MM, retorna como está
        if (hora.match(/^\d{2}:\d{2}/)) {
            return hora.substring(0, 5);
        }

        // Se for um timestamp, formata
        const date = new Date(hora);
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return hora;
    }
}

function formatarMoeda(valor) {
    if (!valor) return 'R$ 0,00';

    try {
        const numero = parseFloat(valor);
        return numero.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    } catch (error) {
        return `R$ ${valor}`;
    }
}

// Função global para redirecionamento à ficha do paciente com ID específico
function redirecionarParaFicha() {
    const modal = document.querySelector('[data-paciente-id]');
    const pacienteId = modal ? modal.getAttribute('data-paciente-id') : null;
    
    if (pacienteId) {
        window.location.href = `ficha-paciente.html?id=${pacienteId}`;
    }
}

// Função global para compartilhar arquivo específico do paciente
function compartilharArquivo() {
    const modal = document.querySelector('[data-paciente-id]');
    const pacienteId = modal ? modal.getAttribute('data-paciente-id') : null;
    
    if (pacienteId) {
        window.location.href = `arquivos.html?id=${pacienteId}`;
    } else {
        console.warn('ID do paciente não encontrado para compartilhamento');
        // Fallback - redirecionar sem parâmetro
        window.location.href = 'arquivos.html';
    }
}
