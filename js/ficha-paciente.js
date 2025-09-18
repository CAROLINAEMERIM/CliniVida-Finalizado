// Gerenciamento da página de ficha do paciente

// Variáveis globais
let pacienteAtual = null;
let fichasData = [];
let consultasData = [];
let arquivosData = [];

// Inicialização da página
document.addEventListener('DOMContentLoaded', function() {
    initFichaPacientePage();
});

// Função principal de inicialização
function initFichaPacientePage() {
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
    
    // Carregar dados do paciente
    carregarDadosPaciente();
}

// Configurar event listeners
function setupEventListeners() {
    // Logout
    document.getElementById('logout-btn').addEventListener('click', function() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userType');
        localStorage.removeItem('userData');
        window.location.href = '../index.html';
    });

    // Submissão do formulário de edição
    const formEditar = document.getElementById('form-editar-paciente');
    if (formEditar) {
        formEditar.addEventListener('submit', salvarEdicaoPaciente);
    }

    // Listeners para calcular IMC automaticamente
    const pesoInput = document.getElementById('edit-peso');
    const alturaInput = document.getElementById('edit-altura');
    
    if (pesoInput) pesoInput.addEventListener('input', calcularIMC);
    if (alturaInput) alturaInput.addEventListener('input', calcularIMC);
}

// Função para carregar dados do paciente
async function carregarDadosPaciente() {
    try {
        // Obter ID do paciente da URL
        const urlParams = new URLSearchParams(window.location.search);
        const pacienteId = urlParams.get('id');
        
        if (!pacienteId) {
            throw new Error('ID do paciente não fornecido');
        }

        console.log('Carregando dados do paciente ID:', pacienteId);

        // Buscar dados do paciente na API
        try {
            pacienteAtual = await userAPI.getById(pacienteId);
            console.log('Dados do paciente carregados:', pacienteAtual);
        } catch (apiError) {
            console.warn('Erro ao buscar na API, usando dados de exemplo:', apiError);
            pacienteAtual = obterDadosExemploPaciente(pacienteId);
        }

        // Preencher interface com dados do paciente
        preencherDadosPaciente();

        // Carregar dados relacionados
        await Promise.all([
            carregarFichasPaciente(pacienteId),
            carregarConsultasPaciente(pacienteId),
            carregarArquivosPaciente(pacienteId)
        ]);

    } catch (error) {
        console.error('Erro ao carregar dados do paciente:', error);
        
        if (typeof utils !== 'undefined' && utils.showError) {
            utils.showError('Erro ao carregar dados do paciente: ' + error.message);
        }
        
        // Redirecionar de volta para lista de pacientes após 3 segundos
        setTimeout(() => {
            window.location.href = 'pacientes.html';
        }, 3000);
    }
}

// Função para obter dados de exemplo do paciente
function obterDadosExemploPaciente(pacienteId) {
    const dadosExemplo = {
        '1': {
            id: 1,
            name: 'Ana Costa',
            email: 'ana.costa@email.com',
            phone: '(11) 99999-9999',
            birthDate: '1985-03-15',
            gender: 'F',
            cpf: '123.456.789-01'
        },
        '2': {
            id: 2,
            name: 'Carlos Lima',
            email: 'carlos.lima@email.com', 
            phone: '(11) 88888-8888',
            birthDate: '1990-07-22',
            gender: 'M',
            cpf: '234.567.890-12'
        },
        '3': {
            id: 3,
            name: 'Maria Silva',
            email: 'maria.silva@email.com',
            phone: '(11) 77777-7777',
            birthDate: '1988-11-08',
            gender: 'F',
            cpf: '345.678.901-23'
        }
    };

    return dadosExemplo[pacienteId] || dadosExemplo['1'];
}

// Função para preencher dados do paciente na interface
function preencherDadosPaciente() {
    if (!pacienteAtual) return;

    // Header da ficha
    const nomeElement = document.getElementById('nome-paciente');
    const idadeElement = document.getElementById('idade-paciente');
    const emailElement = document.getElementById('email-paciente');
    const telefoneElement = document.getElementById('telefone-paciente');

    if (nomeElement) nomeElement.textContent = pacienteAtual.name;
    if (idadeElement) idadeElement.textContent = calcularIdade(pacienteAtual.birth_date) + ' anos';
    if (emailElement) emailElement.textContent = '📧 ' + pacienteAtual.email;
    if (telefoneElement) telefoneElement.textContent = '📞 ' + formatarTelefone(pacienteAtual.phone);

    // Preencher aba de dados pessoais
    preencherDadosPessoais();

    // Preencher formulário de edição
    preencherFormularioEdicao();
}

// Função para preencher dados pessoais na aba
function preencherDadosPessoais() {
    const dadosGrid = document.querySelector('#dados-pessoais .dados-grid');
    if (!dadosGrid) return;
    console.log(pacienteAtual);
    console.log("data",pacienteAtual.birth_date);
    const idade = calcularIdade(pacienteAtual.birth_date);
    const genero = formatarGenero(pacienteAtual.gender);

    dadosGrid.innerHTML = `
        <div class="dado-item">
            <strong>Nome Completo:</strong>
            <span>${pacienteAtual.name}</span>
        </div>
        <div class="dado-item">
            <strong>E-mail:</strong>
            <span>${pacienteAtual.email}</span>
        </div>
        <div class="dado-item">
            <strong>Telefone:</strong>
            <span>${formatarTelefone(pacienteAtual.phone)}</span>
        </div>
        <div class="dado-item">
            <strong>Data de Nascimento:</strong>
            <span>${formatarData(pacienteAtual.birth_date)}</span>
        </div>
        <div class="dado-item">
            <strong>Idade:</strong>
            <span>${idade} anos</span>
        </div>
        <div class="dado-item">
            <strong>Gênero:</strong>
            <span>${genero}</span>
        </div>
        <div class="dado-item">
            <strong>CPF:</strong>
            <span>${pacienteAtual.cpf || 'Não informado'}</span>
        </div>
        <div class="dado-item">
            <strong>Status:</strong>
            <span class="status-badge ${pacienteAtual.status || 'ativo'}">${(pacienteAtual.status || 'ativo').toUpperCase()}</span>
        </div>
    `;
}

// Função para preencher formulário de edição
function preencherFormularioEdicao() {
    // Dados básicos
    const nomeCompletoInput = document.getElementById('edit-nome-completo');
    const emailInput = document.getElementById('edit-email');
    const telefoneInput = document.getElementById('edit-telefone');
    const dataNascimentoInput = document.getElementById('edit-data-nascimento');
    const cpfInput = document.getElementById('edit-cpf');
    const generoSelect = document.getElementById('edit-genero');

    if (nomeCompletoInput) nomeCompletoInput.value = pacienteAtual.name || '';
    if (emailInput) emailInput.value = pacienteAtual.email || '';
    if (telefoneInput) telefoneInput.value = pacienteAtual.phone || '';
    if (dataNascimentoInput) dataNascimentoInput.value = pacienteAtual.birth_date || '';
    if (cpfInput) cpfInput.value = pacienteAtual.cpf || '';

    // Gênero - usar select dropdown
    if (generoSelect && pacienteAtual.gender) {
        generoSelect.value = pacienteAtual.gender;
    }
}

// Função para carregar fichas do paciente
async function carregarFichasPaciente(pacienteId) {
    try {
        console.log('Carregando fichas do paciente:', pacienteId);
        
        // Tentar buscar fichas da API usando o novo endpoint
        try {
            // Primeiro, tentar usar o endpoint com path parameter
            const fichasPaciente = await fichaAPI.getByPaciente(pacienteId);
            fichasData = fichasPaciente || [];
            console.log('Fichas carregadas via endpoint específico do paciente:', fichasData);
        } catch (apiError) {
            console.warn('Erro ao buscar fichas via endpoint específico, tentando fallback:', apiError);
            
            try {
                // Fallback: usar query parameter
                const fichasPacienteQuery = await fichaAPI.getByPacienteId(pacienteId);
                fichasData = fichasPacienteQuery || [];
                console.log('Fichas carregadas via query parameter:', fichasData);
            } catch (fallbackError) {
                console.warn('Erro no fallback, usando getAll e filtrando:', fallbackError);
                
                // Último fallback: buscar todas e filtrar localmente
                try {
                    const todasFichas = await fichaAPI.getAll();
                    fichasData = todasFichas.filter(ficha => 
                        ficha.paciente_id === parseInt(pacienteId) || 
                        ficha.usuario_id === parseInt(pacienteId)
                    );
                    console.log('Fichas filtradas localmente:', fichasData);
                } catch (lastError) {
                    console.warn('Todos os métodos falharam, usando dados de exemplo:', lastError);
                    fichasData = obterFichasExemplo(pacienteId);
                }
            }
        }

        preencherHistoricoClinico();
        
    } catch (error) {
        console.error('Erro ao carregar fichas:', error);
        fichasData = [];
    }
}

// Função para carregar consultas do paciente
async function carregarConsultasPaciente(pacienteId) {
    try {
        console.log('Carregando consultas do paciente:', pacienteId);
        
        try {
            const todasConsultas = await consultaAPI.getAll();
            consultasData = todasConsultas.filter(consulta => consulta.paciente_id == pacienteId);
        } catch (apiError) {
            console.warn('Erro ao buscar consultas na API:', apiError);
            consultasData = obterConsultasExemplo(pacienteId);
        }

        preencherConsultasRealizadas();
        
    } catch (error) {
        console.error('Erro ao carregar consultas:', error);
        consultasData = [];
    }
}

// Função para carregar arquivos do paciente  
async function carregarArquivosPaciente(pacienteId) {
    try {
        console.log('Carregando arquivos do paciente:', pacienteId);
        
        // Se existe API de arquivos, usar ela
        if (typeof window.fileAPI !== 'undefined') {
            arquivosData = await window.fileAPI.getByUser(pacienteId);
        } else {
            arquivosData = obterArquivosExemplo(pacienteId);
        }

        preencherArquivosCompartilhados();
        
    } catch (error) {
        console.error('Erro ao carregar arquivos:', error);
        arquivosData = [];
    }
}

// Função para preencher histórico clínico
function preencherHistoricoClinico() {
    const historicoGrid = document.querySelector('#historico-clinico .historico-clinico-grid');
    if (!historicoGrid) return;

    let ultimaFicha = null;
    console.log("fichas", fichasData)
    if (fichasData.length > 0) {
        ultimaFicha = fichasData.sort((a, b) => new Date(b.data) - new Date(a.data))[0];
        console.log("última ficha", ultimaFicha);
    }


    historicoGrid.innerHTML = `
        <div class="dado-item">
            <strong>Último Peso:</strong>
            <span>${ultimaFicha ? ultimaFicha.peso + ' kg' : 'Não registrado'}</span>
        </div>
        <div class="dado-item">
            <strong>Última Altura:</strong>
            <span>${ultimaFicha ? ultimaFicha.altura + ' m' : 'Não registrada'}</span>
        </div>
        <div class="dado-item">
            <strong>IMC Atual:</strong>
            <span>${ultimaFicha ? ultimaFicha.imc : 'Não calculado'}</span>
        </div>
        <div class="dado-item">
            <strong>Última Avaliação:</strong>
            <span>${ultimaFicha ? formatarData(ultimaFicha.data) : 'Nunca realizada'}</span>
        </div>
        <div class="dado-item">
            <strong>Total de Fichas:</strong>
            <span>${fichasData.length}</span>
        </div>
    `;

    // Preencher dados no formulário de edição histórico clínico
    if (ultimaFicha) {
        const pesoInput = document.getElementById('edit-peso');
        const alturaInput = document.getElementById('edit-altura');
        const imcInput = document.getElementById('edit-imc');

        if (pesoInput) pesoInput.value = ultimaFicha.peso || '';
        if (alturaInput) alturaInput.value = ultimaFicha.altura || '';
        if (imcInput) imcInput.value = ultimaFicha.imc || '';
    }
}

// Função para preencher consultas realizadas
function preencherConsultasRealizadas() {
    const consultasList = document.querySelector('#consultas-realizadas .consultas-lista');
    if (!consultasList) return;

    if (consultasData.length === 0) {
        consultasList.innerHTML = `
            <div class="consulta-item">
                <p>Nenhuma consulta registrada ainda.</p>
            </div>
        `;
        return;
    }

    // Ordenar consultas por data (mais recentes primeiro)
    const consultasOrdenadas = consultasData.sort((a, b) => new Date(b.data) - new Date(a.data));

    consultasList.innerHTML = consultasOrdenadas.map(consulta => `
        <div class="consulta-item">
            <div class="consulta-header">
                <strong>${formatarData(consulta.data)}</strong>
                <span class="consulta-horario">${consulta.hora_inicio} - ${consulta.hora_fim}</span>
            </div>
            <div class="consulta-tipo">
                <span class="tipo-badge">${consulta.tipo || 'Consulta Geral'}</span>
            </div>
            <div class="consulta-descricao">
                <p><strong>Descrição:</strong> ${consulta.descricao || 'Sem descrição'}</p>
                ${consulta.orientacao ? `<p><strong>Orientações:</strong> ${consulta.orientacao}</p>` : ''}
            </div>
        </div>
    `).join('');
}

// Função para preencher arquivos compartilhados
function preencherArquivosCompartilhados() {
    const arquivosList = document.querySelector('#arquivos-compartilhados .arquivos-lista');
    if (!arquivosList) return;

    if (arquivosData.length === 0) {
        arquivosList.innerHTML = `
            <div class="arquivo-item">
                <p>Nenhum arquivo compartilhado ainda.</p>
            </div>
        `;
        return;
    }

    arquivosList.innerHTML = arquivosData.map(arquivo => `
        <div class="arquivo-item">
            <div class="arquivo-icon">📄</div>
            <div class="arquivo-info">
                <strong>${arquivo.nome || 'Documento'}</strong>
                <p>${arquivo.categoria || 'Documento Geral'}</p>
                <small>Enviado em ${formatarData(arquivo.data_upload)}</small>
            </div>
            <div class="arquivo-acoes">
                <button class="btn-mini" onclick="baixarArquivo(${arquivo.id})">Baixar</button>
            </div>
        </div>
    `).join('');
}

// Função para salvar edição do paciente
async function salvarEdicaoPaciente(e) {
    e.preventDefault();

    try {
        // Coletar dados do formulário
        const nomeInput = document.getElementById('edit-nome-completo');
        const emailInput = document.getElementById('edit-email');
        const telefoneInput = document.getElementById('edit-telefone');
        const dataNascimentoInput = document.getElementById('edit-data-nascimento');
        const cpfInput = document.getElementById('edit-cpf');
        const generoSelect = document.getElementById('edit-genero');
        const profissaoInput = document.getElementById('edit-profissao');
        const enderecoRuaInput = document.getElementById('edit-rua');
        const enderecoNumeroInput = document.getElementById('edit-numero');
        const enderecoCidadeInput = document.getElementById('edit-cidade');
        const enderecoBairroInput = document.getElementById('edit-bairro');
        const pesoInput = document.getElementById('edit-peso');
        const alturaInput = document.getElementById('edit-altura');
        const alergiasInput = document.getElementById('edit-alergias');
        const medicamentosInput = document.getElementById('edit-medicamentos');
        const comorbidadesInput = document.getElementById('edit-comorbidades');
        const intoleranciasInput = document.getElementById('edit-intolerancias');
        const observacoesClinicasInput = document.getElementById('edit-observacoes-clinicas');

        // Validar campos obrigatórios
        if (!nomeInput?.value.trim()) {
            throw new Error('Nome é obrigatório');
        }

        if (!emailInput?.value.trim()) {
            throw new Error('Email é obrigatório');
        }

        if (!generoSelect?.value) {
            throw new Error('Gênero é obrigatório');
        }

        if (!dataNascimentoInput?.value) {
            throw new Error('Data de nascimento é obrigatória');
        }

        if (!cpfInput?.value.trim()) {
            throw new Error('CPF é obrigatório');
        }

        if (!enderecoBairroInput?.value.trim() || !enderecoCidadeInput?.value.trim() || !enderecoRuaInput?.value.trim() || !enderecoNumeroInput?.value.trim()) {
            throw new Error('Endereço é obrigatório');
        }

        if(!pesoInput?.value || isNaN(parseFloat(pesoInput.value)) || parseFloat(pesoInput.value) <= 0) {
            throw new Error('Peso deve ser um número positivo');
        }

        if(!alturaInput?.value || isNaN(parseFloat(alturaInput.value)) || parseFloat(alturaInput.value) <= 0) {
            throw new Error('Altura deve ser um número positivo');
        }


        const dadosBasicos = {
            name: nomeInput.value.trim(),
            email: emailInput.value.trim(),
            phone: telefoneInput?.value.trim() || '',
            birthDate: dataNascimentoInput?.value || '',
            gender: generoSelect.value, // M, F ou O
            cpf: cpfInput?.value.trim() || '',
            alergias: alergiasInput?.value.trim() || '',
            medicamentos: medicamentosInput?.value.trim() || '',
            comorbidades: comorbidadesInput?.value.trim() || '',
            intolerancias: intoleranciasInput?.value.trim() || '',
            profissao: profissaoInput?.value.trim() || '',
            endereco_rua: enderecoRuaInput?.value.trim() || '',
            endereco_numero: enderecoNumeroInput?.value?.trim()?.toString() || '',
            endereco_cidade: enderecoCidadeInput?.value.trim() || '',
            endereco_bairro: enderecoBairroInput?.value.trim() || '',
            obs: observacoesClinicasInput?.value.trim() || ''
        };

        console.log('Salvando dados básicos:', dadosBasicos);

        // Atualizar paciente na API
        const pacienteAtualizado = await userAPI.update(pacienteAtual.id, dadosBasicos);
        console.log('Paciente atualizado:', pacienteAtualizado);

        // Verificar se tem dados de histórico clínico para salvar
        const peso = document.getElementById('edit-peso').value;
        const altura = document.getElementById('edit-altura').value;

        if (peso && altura) {
            const imc = calcularIMCValor(peso, altura);
            const dadosFicha = {
                paciente_id: pacienteAtual.id, // Adicionar o paciente_id
                data: new Date().toISOString().split('T')[0],
                peso: parseFloat(peso),
                altura: parseFloat(altura),
                imc: imc,
                observacoes: 'Atualização via edição de ficha',
                registro: 'Dados atualizados pelo profissional'
            };

            console.log('Salvando nova ficha:', dadosFicha);
            
            try {
                await fichaAPI.create(dadosFicha);
                console.log('Nova ficha criada com sucesso');
            } catch (fichaError) {
                console.warn('Erro ao criar ficha, mas paciente foi atualizado:', fichaError);
            }
        }

        // Atualizar dados locais
        pacienteAtual = { ...pacienteAtual, ...dadosBasicos };

        // Atualizar interface
        preencherDadosPaciente();
        
        // Recarregar dados relacionados
        await carregarFichasPaciente(pacienteAtual.id);

        // Fechar modal e mostrar sucesso
        fecharModalEdicao();

    } catch (error) {
        console.error('Erro ao salvar dados do paciente:', error);
        
        if (typeof utils !== 'undefined' && utils.showError) {
            utils.showError('Erro ao salvar dados: ' + (error.message || 'Erro desconhecido'));
        } else {
            alert('Erro ao salvar dados: ' + (error.message || 'Erro desconhecido'));
        }
    }
}

// Funções utilitárias
function calcularIdade(dataNascimento) {
    if (!dataNascimento) return '?';
    
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }
    
    return idade;
}

function formatarGenero(genero) {
    const generos = {
        'M': 'Masculino',
        'F': 'Feminino',
        'O': 'Outro'
    };
    return generos[genero] || 'Não informado';
}

function formatarData(dataString) {
    if (!dataString) return 'Data inválida';
    
    const data = new Date(dataString + 'T00:00:00');
    return data.toLocaleDateString('pt-BR');
}

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
    }
    
    return telefone;
}

function calcularIMC() {
    const peso = parseFloat(document.getElementById('edit-peso').value);
    const altura = parseFloat(document.getElementById('edit-altura').value);
    
    if (peso && altura) {
        const imc = calcularIMCValor(peso, altura);
        const imcInput = document.getElementById('edit-imc');
        if (imcInput) {
            imcInput.value = imc.toFixed(2);
        }
    }
}

function calcularIMCValor(peso, altura) {
    return peso / (altura * altura);
}

// Dados de exemplo para quando a API não estiver disponível
function obterFichasExemplo(pacienteId) {
    return [
        {
            id: 1,
            data: '2024-01-15',
            peso: 70,
            altura: 1.65,
            imc: 25.71,
            observacoes: 'Paciente em boa forma física',
            paciente_id: parseInt(pacienteId)
        }
    ];
}

function obterConsultasExemplo(pacienteId) {
    return [
        {
            id: 1,
            data: '2024-01-15',
            hora_inicio: '14:00',
            hora_fim: '15:00',
            descricao: 'Consulta de rotina',
            orientacao: 'Manter dieta equilibrada e exercícios regulares',
            tipo: 'Consulta Nutricional',
            paciente_id: parseInt(pacienteId)
        }
    ];
}

function obterArquivosExemplo(pacienteId) {
    return [
        {
            id: 1,
            nome: 'Plano Alimentar Janeiro 2024.pdf',
            categoria: 'Plano Nutricional',
            data_upload: '2024-01-15',
            user_id: parseInt(pacienteId)
        }
    ];
}

// Funções expostas globalmente (já existentes no HTML)
window.mostrarTab = function(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
};

window.abrirModalEdicao = function() {
    document.getElementById('modal-editar-paciente').style.display = 'flex';
    calcularIMC();
};

window.fecharModalEdicao = function() {
    document.getElementById('modal-editar-paciente').style.display = 'none';
};

window.mostrarTabModal = function(tabId) {
    document.querySelectorAll('.modal-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.modal-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
};

window.baixarArquivo = function(arquivoId) {
    console.log('Baixando arquivo ID:', arquivoId);
    if (typeof window.fileAPI !== 'undefined') {
        window.open(`${API_BASE_URL}/file/${arquivoId}`, '_blank');
    } else {
        alert('Funcionalidade de download será implementada em breve.');
    }
};

window.adicionarAnotacao = function() {
    const textoInput = document.getElementById('nova-anotacao-texto');
    console.log(textoInput);
    const texto = textoInput.value.trim();
    console.log(texto);
    if (!texto) {
        alert('Por favor, digite uma anotação.');
        return;
    }
    
    const hoje = new Date().toLocaleDateString('pt-BR');
    const novaAnotacao = document.createElement('div');
    novaAnotacao.className = 'anotacao-item';
    novaAnotacao.innerHTML = `
        <div class="anotacao-header">
            <strong>${hoje}</strong>
            <button class="btn-mini-danger" onclick="this.parentElement.parentElement.remove()">Excluir</button>
        </div>
        <p>${texto}</p>
    `;
    
    const anotacoesList = document.querySelector('.anotacoes-lista');
    anotacoesList.insertBefore(novaAnotacao, anotacoesList.firstChild);
    
    textoInput.value = '';
    
    if (typeof utils !== 'undefined' && utils.showSuccess) {
        utils.showSuccess('Anotação adicionada com sucesso!');
    } else {
        alert('Anotação adicionada com sucesso!');
    }
};
