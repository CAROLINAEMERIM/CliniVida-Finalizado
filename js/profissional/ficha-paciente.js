// Gerenciamento da página de ficha do paciente

// Variáveis globais
let pacienteAtual = null;
let consultasRealizadas = [];
let fichaMedica = null;

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
    
    // Carregar dados do paciente baseado no ID da URL
    carregarDadosPaciente();
}

// Função para carregar dados do paciente
async function carregarDadosPaciente() {
    const urlParams = new URLSearchParams(window.location.search);
    const pacienteId = urlParams.get('id');
    
    if (!pacienteId) {
        console.error('ID do paciente não encontrado na URL');
        alert('Erro: ID do paciente não encontrado');
        window.history.back();
        return;
    }

    try {
        console.log('Carregando dados do paciente ID:', pacienteId);
        
        // Buscar dados do paciente na API
        pacienteAtual = await userAPI.getById(pacienteId);
        window.pacienteAtual = pacienteAtual; // Atualizar também a referência global
        console.log('Dados do paciente carregados:', pacienteAtual);
        
        // Renderizar dados do paciente
        renderizarDadosPaciente();
        
        // Carregar dados adicionais (consultas, fichas, etc.)
        await carregarDadosAdicionais(pacienteId);
        
    } catch (error) {
        console.error('Erro ao carregar dados do paciente:', error);
        
        // Se não conseguir carregar da API, usar dados de exemplo
        if (error.response?.status === 404 || error.code === 'ECONNREFUSED') {
            console.log('API não disponível, carregando dados de exemplo...');
            carregarDadosExemplo(pacienteId);
        } else {
            alert('Erro ao carregar dados do paciente: ' + (error.message || 'Erro desconhecido'));
            window.history.back();
        }
    }
}

// Função para renderizar os dados do paciente na interface
function renderizarDadosPaciente() {
    if (!pacienteAtual) {
        console.error('Nenhum dado de paciente para renderizar');
        return;
    }

    // Verificar se os elementos essenciais existem no DOM
    const elementosEssenciais = ['paciente-info-principal', 'ficha-acoes'];
    const elementosFaltando = elementosEssenciais.filter(className => !document.querySelector('.' + className));
    
    if (elementosFaltando.length > 0) {
        console.error('Elementos DOM não encontrados:', elementosFaltando);
        console.warn('Aguardando DOM estar completamente carregado...');
        setTimeout(() => renderizarDadosPaciente(), 100);
        return;
    }

    // Calcular idade
    const idade = calcularIdade(pacienteAtual.birth_date);
    
    // Atualizar header da ficha
    const pacienteInfoElement = document.querySelector('.paciente-info-principal');
    if (pacienteInfoElement) {
        pacienteInfoElement.innerHTML = `
            <h1 id="nome-paciente">${pacienteAtual.name}</h1>
            <p id="idade-paciente">${idade} anos</p>
            <div class="contatos-paciente">
                <p id="email-paciente">📧 ${pacienteAtual.email}</p>
                <p id="telefone-paciente">📞 ${pacienteAtual.phone}</p>
            </div>
        `;
    }

    // Renderizar dados pessoais
    renderizarDadosPessoais();
    
    // Renderizar histórico clínico
    renderizarHistoricoClinico();
    
    // Renderizar consultas realizadas
    renderizarConsultasRealizadas();
    
    // Renderizar arquivos compartilhados
    renderizarArquivosCompartilhados();
}

const PLANOS = [
  {
    "nome": "Nutrição Essencial",
    "valor": "R$ 180,00",
  },
  {
    "nome": "Treino Básico",
    "valor": "R$ 280,00",
  },
  {
    "nome": "Bem-Estar Completo",
    "valor": "R$ 420,00",
  },
  {
    "nome": "Nutrição Avançada",
    "valor": "R$ 320,00",
  },
  {
    "nome": "Treino Intensivo",
    "valor": "R$ 720,00",
  },
  {
    "nome": "Transformação Total",
    "valor": "R$ 980,00",
  },
  {
    "nome": "Performance Máxima",
    "valor": "R$ 1.100,00",
  },
  {
    "nome": "Acelere Seus Resultados",
    "valor": "R$ 1.390,00",
  }
]


// Função para renderizar dados pessoais
function renderizarDadosPessoais() {
    const idade = calcularIdade(pacienteAtual.birth_date);
    const dataFormatada = formatarData(pacienteAtual.birth_date);
    
    const elemento = document.getElementById('dados-pessoais');
    if (!elemento) {
        console.warn('Elemento dados-pessoais não encontrado no DOM');
        return;
    }

    const planoAtual = PLANOS[Number(pacienteAtual.plano) - 1] || { nome: 'Não informado', valor: 'Valor não informado' };
    
    elemento.innerHTML = `
        <div class="dados-grid">
            <div class="dado-item">
                <label>CPF:</label>
                <span>${pacienteAtual.cpf || 'Não informado'}</span>
            </div>
            <div class="dado-item">
                <label>Data de Nascimento:</label>
                <span>${dataFormatada} (${idade} anos)</span>
            </div>
            <div class="dado-item">
                <label>Cidade:</label>
                <span>${pacienteAtual.endereco_cidade || 'Não informado'}</span>
            </div>
            <div class="dado-item">
                <label>Profissão:</label>
                <span>${pacienteAtual.profissao || 'Não informado'}</span>
            </div>
            <div class="dado-item">
                <label>Plano:</label>
                <span>${planoAtual.nome || 'Não informado'} <br> ${planoAtual.valor || 'Valor não informado'}</span>
            </div>
        </div>
    `;
}

// Função para calcular IMC
function calcularIMC(peso, altura) {
    if (!peso || !altura) return null;
    const imc = peso / (altura * altura);
    let classificacao = '';
    
    if (imc < 18.5) classificacao = 'Abaixo do peso';
    else if (imc < 25) classificacao = 'Normal';
    else if (imc < 30) classificacao = 'Sobrepeso';
    else classificacao = 'Obesidade';
    
    return `${imc.toFixed(1)} (${classificacao})`;
}

// Função para renderizar histórico clínico
function renderizarHistoricoClinico() {
    const elemento = document.getElementById('historico-clinico');
    if (!elemento) {
        console.warn('Elemento historico-clinico não encontrado no DOM');
        return;
    }
    
    // Verificar se temos dados da última ficha médica
    const temFicha = fichaMedica && Object.keys(fichaMedica).length > 0;
    
    elemento.innerHTML = `
        <div class="historico-header">
            <h3>📋 Dados da Última Ficha Médica</h3>
            <span class="ficha-data">${temFicha ? formatarData(fichaMedica.data || new Date().toISOString()) : 'Nenhuma ficha registrada'}</span>
        </div>
        
        ${temFicha ? `
            <div class="ultima-ficha-dados">
                <div class="ficha-dados-grid">
                    <!-- Dados Antropométricos -->
                    <div class="dados-categoria">
                        <h4>📏 Dados Antropométricos</h4>
                        <div class="categoria-items">
                            <div class="ficha-item">
                                <label>Peso:</label>
                                <span class="valor-destaque">${fichaMedica.peso || pacienteAtual?.peso || 'N/A'}${fichaMedica.peso ? 'kg' : ''}</span>
                            </div>
                            <div class="ficha-item">
                                <label>Altura:</label>
                                <span class="valor-destaque">${fichaMedica.altura || pacienteAtual?.altura || 'N/A'}${fichaMedica.altura ? 'm' : ''}</span>
                            </div>
                            <div class="ficha-item">
                                <label>IMC:</label>
                                <span class="valor-destaque imc-valor">${fichaMedica.imc || calcularIMC(fichaMedica.peso, fichaMedica.altura) || 'N/A'}</span>
                            </div>
                            <div class="ficha-item">
                                <label>% Gordura:</label>
                                <span class="valor-destaque">${fichaMedica.bf || fichaMedica.percentual_gordura || 'N/A'}${(fichaMedica.bf || fichaMedica.percentual_gordura) ? '%' : ''}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Informações Clínicas -->
                    <div class="dados-categoria">
                        <h4>🩺 Informações Clínicas</h4>
                        <div class="categoria-items">
                            <div class="ficha-item">
                                <label>Alergias:</label>
                                <span>${fichaMedica.alergias || pacienteAtual?.alergias?.join(", ") || 'Nenhuma'}</span>
                            </div>
                            <div class="ficha-item">
                                <label>Intolerâncias:</label>
                                <span>${fichaMedica.intolerancias || pacienteAtual?.intolerancias?.join(", ") || 'Nenhuma'}</span>
                            </div>
                            <div class="ficha-item">
                                <label>Comorbidades:</label>
                                <span>${fichaMedica.comorbidades || pacienteAtual?.comorbidades?.join(", ") || 'Nenhuma'}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Objetivo e Observações -->
                    <div class="dados-categoria observacoes-categoria">
                        <h4>🎯 Objetivo e Observações</h4>
                        <div class="categoria-items">
                            <div class="ficha-item full-width">
                                <label>Objetivo Principal:</label>
                                <span>${fichaMedica.objetivo_paciente || pacienteAtual?.objetivo || 'Não definido'}</span>
                            </div>
                            ${fichaMedica.observacoes ? `
                                <div class="ficha-item full-width">
                                    <label>Observações:</label>
                                    <span class="observacoes-texto">${fichaMedica.observacoes}</span>
                                </div>
                            ` : ''}
                            ${fichaMedica.registro ? `
                                <div class="ficha-item full-width">
                                    <label>Registro da Consulta:</label>
                                    <span class="observacoes-texto">${fichaMedica.registro}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        ` : `
            <div class="sem-ficha">
                <div class="sem-ficha-icone">📋</div>
                <h4>Nenhuma ficha médica encontrada</h4>
                <p>Registre a primeira consulta do paciente para visualizar os dados clínicos aqui.</p>
                <button class="btn btn-primario" onclick="abrirModalNovaConsulta()">
                    ✨ Registrar Nova Consulta
                </button>
            </div>
        `}
    `;
}

// Função para renderizar consultas realizadas
function renderizarConsultasRealizadas() {
    const elemento = document.getElementById('consultas-realizadas');
    if (!elemento) {
        console.warn('Elemento consultas-realizadas não encontrado no DOM');
        return;
    }
    
    elemento.innerHTML = `
        <div class="consultas-lista">
            ${consultasRealizadas.length === 0 ? 
                '<p class="sem-dados">Nenhuma consulta realizada ainda.</p>' :
                consultasRealizadas.map(consulta => `
                    <div class="consulta-item">
                        <div class="consulta-header">
                            <span class="consulta-data">${formatarData(consulta.data)} <br> ${consulta.hora_inicio.split(":").slice(0,2).join(":")}</span>
                        </div>
                        <div class="consulta-content">
                            <p><strong>Descrição:</strong> ${consulta.descricao}</p>
                            <p><strong>Objetivo:</strong> ${consulta.objetivo_paciente}</p>
                            <p><strong>Orientação:</strong> ${consulta.orientacao}</p>
                            ${consulta.observacoes ? `<p><strong>Observações:</strong> ${consulta.observacoes}</p>` : ''}
                        </div>
                    </div>
                `).join('')
            }
        </div>
    `;
}

// Função para renderizar arquivos compartilhados
async function renderizarArquivosCompartilhados() {
    const elemento = document.getElementById('arquivos-compartilhados');
    if (!elemento) {
        console.warn('Elemento arquivos-compartilhados não encontrado no DOM');
        return;
    }
    
    // Verificar se temos o paciente atual carregado
    if (!pacienteAtual || !pacienteAtual.id) {
        elemento.innerHTML = `
            <div class="arquivos-lista">
                <p class="sem-dados">Dados do paciente não carregados.</p>
            </div>
        `;
        return;
    }
    
    try {
        // Exibir loading
        elemento.innerHTML = `
            <div class="arquivos-lista">
                <p class="loading">📄 Carregando arquivos...</p>
            </div>
        `;
        
        // Buscar arquivos do paciente via API
        console.log('Buscando arquivos para o paciente ID:', pacienteAtual.id);
        const arquivos = await fileAPI.getAll(pacienteAtual.id);
        console.log('Arquivos carregados:', arquivos);
        
        // Renderizar lista de arquivos
        if (arquivos && arquivos.length > 0) {
            const arquivosHtml = arquivos.map(arquivo => {
                const dataUpload = new Date(arquivo.data_envio).toISOString().slice(0, 10).split('-').reverse().join('/');
                const categoria = arquivo.categoria || 'Geral';
                const descricao = arquivo.descricao || '';
                
                return `
                    <div class="arquivo-item" data-arquivo-id="${arquivo.id}">
                        <div class="arquivo-info">
                            <div class="arquivo-icone">
                                ${obterIconeArquivo(arquivo.nome || arquivo.filename)}
                            </div>
                            <div class="arquivo-detalhes">
                                <h4 class="arquivo-nome">${arquivo.nome || arquivo.filename}</h4>
                                <p class="arquivo-descricao">${descricao}</p>
                                <div class="arquivo-meta">
                                    <span class="arquivo-categoria">📁 ${categoria}</span>
                                    <span class="arquivo-data">📅 ${dataUpload}</span>
                                </div>
                            </div>
                        </div>
                        <div class="arquivo-acoes">
                            <button class="btn-acao btn-download" onclick="baixarArquivo(${arquivo.id}, '${arquivo.nome || arquivo.filename}')" title="Baixar arquivo">
                                ⬇️
                            </button>
                            <button class="btn-acao btn-excluir" onclick="excluirArquivo(${arquivo.id}, '${arquivo.nome || arquivo.filename}')" title="Excluir arquivo">
                                🗑️
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
            
            elemento.innerHTML = `
                <div class="arquivos-lista">
                    <div class="arquivos-header">
                        <h3>Arquivos Compartilhados (${arquivos.length})</h3>
                    </div>
                    <div class="arquivos-grid">
                        ${arquivosHtml}
                    </div>
                </div>
            `;
        } else {
            elemento.innerHTML = `
                <div class="arquivos-lista">
                    <div class="arquivos-header">
                        <h3>Arquivos Compartilhados</h3>
                    </div>
                    <div class="sem-arquivos">
                        <p class="sem-dados">📁 Nenhum arquivo encontrado para este paciente.</p>
                        <p class="sem-dados-subtitulo">Faça upload de exames, relatórios ou outros documentos relevantes.</p>
                    </div>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Erro ao carregar arquivos:', error);
        elemento.innerHTML = `
            <div class="arquivos-lista">
                <div class="arquivos-header">
                    <h3>Arquivos Compartilhados</h3>
                    <button class="btn btn-upload" onclick="uploadArquivo()">📎 Fazer Upload</button>
                </div>
                <div class="erro-arquivos">
                    <p class="erro-dados">❌ Erro ao carregar arquivos: ${error.message || 'Erro desconhecido'}</p>
                    <button class="btn btn-secundario" onclick="renderizarArquivosCompartilhados()">🔄 Tentar Novamente</button>
                </div>
            </div>
        `;
    }
}

// Função para carregar dados adicionais do paciente
async function carregarDadosAdicionais(pacienteId) {
    try {
        // Tentar carregar ficha médica usando o novo endpoint com paciente_id
        try {
            const fichas = (await fichaAPI.getByPaciente(pacienteId)).sort((a, b) => b.id - a.id);
            // Se encontrou fichas, pegar a primeira (mais recente) ou criar uma lógica de seleção
            if (fichas && fichas.length > 0) {
                fichaMedica = fichas[0]; // Usar a primeira ficha encontrada
                console.log('Ficha médica carregada:', fichaMedica);
            } else {
                console.log('Nenhuma ficha médica encontrada para o paciente:', pacienteId);
                fichaMedica = null;
            }
        } catch (error) {
            console.log('Erro ao carregar ficha médica:', error.message);
            // Fallback: tentar usando query parameter
            try {
                const fichas = await fichaAPI.getByPacienteId(pacienteId);
                if (fichas && fichas.length > 0) {
                    fichaMedica = fichas[0];
                    console.log('Ficha médica carregada via query parameter:', fichaMedica);
                } else {
                    fichaMedica = null;
                }
            } catch (fallbackError) {
                console.log('Fallback também falhou:', fallbackError.message);
                fichaMedica = null;
            }
        }

        // Tentar carregar consultas
        try {
            consultasRealizadas = await consultaAPI.getAll();
            // Filtrar consultas do paciente
            consultasRealizadas = consultasRealizadas.filter(consulta => 
                consulta.usuario_id === parseInt(pacienteId) || consulta.paciente_id === parseInt(pacienteId)
            );
            console.log('Consultas carregadas:', consultasRealizadas);
        } catch (error) {
            console.log('Consultas não encontradas:', error.message);
            consultasRealizadas = [];
        }

        // Re-renderizar seções com dados atualizados
        renderizarHistoricoClinico();
        renderizarConsultasRealizadas();

    } catch (error) {
        console.error('Erro ao carregar dados adicionais:', error);
    }
}

// Função para carregar dados adicionais de exemplo
function carregarDadosAdicionaisExemplo() {
    // Ficha médica de exemplo
    fichaMedica = {
        alergias: 'Nenhuma alergia conhecida',
        medicamentos: 'Vitamina D 2000UI - 1x ao dia',
        historico_familiar: 'Hipertensão materna, Diabetes tipo 2 paterno',
        cirurgias: 'Apendicectomia (2015)',
        condicoes_medicas: 'Hipotireoidismo controlado'
    };

    // Consultas de exemplo
    consultasRealizadas = [
        {
            id: 1,
            tipo: 'Consulta de Rotina',
            data: '2024-12-15',
            horario: '14:30',
            queixa_principal: 'Consulta de acompanhamento',
            diagnostico: 'Paciente em bom estado geral',
            tratamento: 'Manter medicação atual',
            observacoes: 'Solicitar exames de rotina em 6 meses'
        },
        {
            id: 2,
            tipo: 'Consulta de Retorno',
            data: '2024-11-20',
            horario: '16:00',
            queixa_principal: 'Dor de cabeça recorrente',
            diagnostico: 'Cefaleia tensional',
            tratamento: 'Analgésico quando necessário, técnicas de relaxamento',
            observacoes: 'Orientações sobre higiene do sono'
        }
    ];

    // Re-renderizar seções com dados de exemplo
    renderizarHistoricoClinico();
    renderizarConsultasRealizadas();
}

// Funções utilitárias
function calcularIdade(dataNascimento) {
    if (!dataNascimento) return 'N/A';
    
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();
    
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }
    
    return idade;
}

function formatarData(dataString) {
    if (!dataString) return 'N/A';
    
    const data = new Date(dataString + 'T00:00:00');
    return data.toLocaleDateString('pt-BR');
}

function uploadArquivo() {
    alert('Funcionalidade de upload será implementada em breve.');
}

// Função para mostrar tabs
function mostrarTab(tabId, buttonElement) {
    // Esconder todas as tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remover classe active de todos os botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar tab selecionada
    const tabElement = document.getElementById(tabId);
    if (tabElement) {
        tabElement.classList.add('active');
    } else {
        console.warn(`Elemento tab com ID "${tabId}" não encontrado no DOM`);
    }
    
    // Adicionar classe active ao botão clicado
    if (buttonElement) {
        buttonElement.classList.add('active');
    } else {
        // Fallback: tentar encontrar o botão pela data-tab ou outro método
        const button = document.querySelector(`[onclick*="${tabId}"]`);
        if (button) {
            button.classList.add('active');
        }
    }
}

// Configurar logout
document.addEventListener('DOMContentLoaded', function() {
    // Configurar logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userType');
            localStorage.removeItem('userData');
            localStorage.removeItem('profissional_logado');
            window.location.href = '../index.html';
        });
    }
});

// ===== FUNÇÕES AUXILIARES PARA ARQUIVOS =====

// Função para formatar tamanho de arquivo
function formatarTamanhoArquivo(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Função para obter ícone baseado na extensão do arquivo
function obterIconeArquivo(nomeArquivo) {
    if (!nomeArquivo) return '📄';
    
    const extensao = nomeArquivo.split('.').pop().toLowerCase();
    
    const icones = {
        // Documentos
        'pdf': '📄',
        'doc': '📝',
        'docx': '📝',
        'txt': '📝',
        'rtf': '📝',
        
        // Planilhas
        'xls': '📊',
        'xlsx': '📊',
        'csv': '📊',
        
        // Imagens
        'jpg': '🖼️',
        'jpeg': '🖼️',
        'png': '🖼️',
        'gif': '🖼️',
        'bmp': '🖼️',
        'svg': '🖼️',
        
        // Arquivos médicos
        'dcm': '🏥', // DICOM
        'dicom': '🏥',
        
        // Outros
        'zip': '📦',
        'rar': '📦',
        '7z': '📦',
        'mp4': '🎥',
        'avi': '🎥',
        'mov': '🎥',
        'mp3': '🎵',
        'wav': '🎵'
    };
    
    return icones[extensao] || '📄';
}

// Função para baixar arquivo
async function baixarArquivo(arquivoId, nomeArquivo) {
    try {
        console.log('Iniciando download do arquivo:', arquivoId, nomeArquivo);
        
        // Mostrar feedback visual
        const btnDownload = document.querySelector(`[onclick*="baixarArquivo(${arquivoId}"]`);
        const textoOriginal = btnDownload?.innerHTML;
        if (btnDownload) {
            btnDownload.innerHTML = '⏳';
            btnDownload.disabled = true;
        }
        
        // Fazer download via API
        await fileAPI.download(arquivoId);
        
        // Restaurar botão
        if (btnDownload) {
            btnDownload.innerHTML = textoOriginal;
            btnDownload.disabled = false;
        }
        
        console.log('Download concluído:', nomeArquivo);
        
    } catch (error) {
        console.error('Erro ao baixar arquivo:', error);
        
        // Restaurar botão em caso de erro
        const btnDownload = document.querySelector(`[onclick*="baixarArquivo(${arquivoId}"]`);
        if (btnDownload) {
            btnDownload.innerHTML = '⬇️';
            btnDownload.disabled = false;
        }
        
        alert('Erro ao baixar arquivo: ' + (error.message || 'Erro desconhecido'));
    }
}

// Função para excluir arquivo
async function excluirArquivo(arquivoId, nomeArquivo) {
    try {
        // Confirmar exclusão
        const confirmacao = confirm(`Deseja realmente excluir o arquivo "${nomeArquivo}"?\n\nEsta ação não pode ser desfeita.`);
        if (!confirmacao) return;
        
        console.log('Excluindo arquivo:', arquivoId, nomeArquivo);
        
        // Mostrar feedback visual
        const btnExcluir = document.querySelector(`[onclick*="excluirArquivo(${arquivoId}"]`);
        const textoOriginal = btnExcluir?.innerHTML;
        if (btnExcluir) {
            btnExcluir.innerHTML = '⏳';
            btnExcluir.disabled = true;
        }
        
        // Excluir via API
        await fileAPI.delete(arquivoId);
        
        // Recarregar lista de arquivos
        await renderizarArquivosCompartilhados();
        
        console.log('Arquivo excluído com sucesso:', nomeArquivo);
        
        // Mostrar mensagem de sucesso
        showCustomMessage(`Arquivo "${nomeArquivo}" excluído com sucesso!`, 'success');
        
    } catch (error) {
        console.error('Erro ao excluir arquivo:', error);
        
        // Restaurar botão em caso de erro
        const btnExcluir = document.querySelector(`[onclick*="excluirArquivo(${arquivoId}"]`);
        if (btnExcluir) {
            btnExcluir.innerHTML = '🗑️';
            btnExcluir.disabled = false;
        }
        
        alert('Erro ao excluir arquivo: ' + (error.message || 'Erro desconhecido'));
    }
}

// Função para mostrar mensagem personalizada (floating)
function showCustomMessage(message, type = 'success') {
    // Criar elemento da mensagem
    const messageDiv = document.createElement('div');
    messageDiv.className = `custom-message ${type}`;
    messageDiv.textContent = message;
    
    // Adicionar estilos inline
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        font-weight: 500;
        font-size: 14px;
        z-index: 10000;
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateX(400px);
        transition: all 0.3s ease;
    `;
    
    // Definir cores baseadas no tipo
    if (type === 'success') {
        messageDiv.style.background = '#d4edda';
        messageDiv.style.color = '#155724';
        messageDiv.style.border = '1px solid #c3e6cb';
    } else if (type === 'error') {
        messageDiv.style.background = '#f8d7da';
        messageDiv.style.color = '#721c24';
        messageDiv.style.border = '1px solid #f5c6cb';
    }
    
    // Adicionar ao body
    document.body.appendChild(messageDiv);
    
    // Animar entrada
    setTimeout(() => {
        messageDiv.style.transform = 'translateX(0)';
    }, 100);
    
    // Remover após 3 segundos
    setTimeout(() => {
        messageDiv.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 3000);
}

// Expor funções para uso global
window.carregarDadosPaciente = carregarDadosPaciente;
window.renderizarArquivosCompartilhados = renderizarArquivosCompartilhados;
window.baixarArquivo = baixarArquivo;
window.excluirArquivo = excluirArquivo;
window.uploadArquivo = uploadArquivo;
// Expor variáveis e funções no escopo global
window.pacienteAtual = pacienteAtual;
window.renderizarDadosPaciente = renderizarDadosPaciente;

// Expor funções de UI
window.mostrarTab = mostrarTab;
window.abrirModalEdicao = abrirModalEdicao;
window.fecharModalEdicao = fecharModalEdicao;
window.abrirModalAgendamento = abrirModalAgendamento;
window.fecharModalAgendamento = fecharModalAgendamento;
window.abrirModalNovaConsulta = abrirModalNovaConsulta;
window.fecharModalNovaConsulta = fecharModalNovaConsulta;

// Função para abrir modal de edição e preencher os campos com os dados do paciente
function abrirModalEdicao() {
    document.getElementById('modal-editar-paciente').style.display = 'flex';

    if (!window.pacienteAtual) {
        console.warn('Paciente não carregado');
        return;
    }
    const p = window.pacienteAtual;

    // Preencher campos de dados básicos
    document.getElementById('edit-nome-completo').value = p.name || '';
    document.getElementById('edit-data-nascimento').value = p.birth_date ? p.birth_date.substring(0, 10) : '';
    document.getElementById('edit-cpf').value = p.cpf || '';
    // Gênero (select)
    if (['M','F','O'].includes(p.gender)) {
        document.getElementById('edit-genero').value = p.gender;
    } else {
        document.getElementById('edit-genero').value = '';
    }
    document.getElementById('edit-email').value = p.email || '';
    document.getElementById('edit-telefone').value = p.phone || '';
    document.getElementById('edit-profissao').value = p.profissao || '';

    // Preencher campos clínicos
    document.getElementById('edit-peso').value = p.peso || '';
    document.getElementById('edit-altura').value = p.altura || '';
    document.getElementById('edit-alergias').value = p.alergias?.join(', ') || '';
    document.getElementById('edit-medicamentos').value = p.medicamentos?.join(', ') || '';
    document.getElementById('edit-comorbidades').value = p.comorbidades?.join(', ') || '';
    document.getElementById('edit-intolerancias').value = p.intolerancias?.join(', ') || '';
    document.getElementById('edit-observacoes-clinicas').value = p.obs || '';
    document.getElementById('edit-rua').value = p.endereco_rua || '';
    document.getElementById('edit-numero').value = p.endereco_numero || '';
    document.getElementById('edit-cidade').value = p.endereco_cidade || '';
    document.getElementById('edit-bairro').value = p.endereco_bairro || '';

    // Calcular IMC automaticamente se peso e altura existirem
    const peso = parseFloat(p.peso);
    const altura = parseFloat(p.altura);
    if (!isNaN(peso) && !isNaN(altura) && altura > 0) {
        const imc = peso / (altura * altura);
        let classificacao = '';
        if (imc < 18.5) classificacao = 'Abaixo do peso';
        else if (imc < 25) classificacao = 'Normal';
        else if (imc < 30) classificacao = 'Sobrepeso';
        else classificacao = 'Obesidade';
        if (document.getElementById('edit-imc')) {
            document.getElementById('edit-imc').value = `${imc.toFixed(1)} (${classificacao})`;
        }
    } else if (document.getElementById('edit-imc')) {
        document.getElementById('edit-imc').value = '';
    }

    // Limpar mensagens anteriores
    if (typeof clearEdicaoMessage === 'function') clearEdicaoMessage();
}
