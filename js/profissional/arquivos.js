// Verificar autenticação do profissional
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar se está logado como profissional
    const userType = localStorage.getItem('userType');
    const userData = localStorage.getItem('userData');
    
    if (!userData || userType !== 'profissional') {
        window.location.href = 'login.html';
        return;
    }

    const professional = JSON.parse(userData);
    
    // Carregar nome do profissional
    document.getElementById('nome-profissional').textContent = professional.nome || 'Profissional';
    
    // Carregar dados iniciais
    await Promise.all([
        carregarPacientes(),
        carregarArquivos()
    ]);
    
    // Configurar event listeners para o modal de confirmação de exclusão
    configurarEventListenersModal();
});

// Logout
document.getElementById('logout-btn').addEventListener('click', function () {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userData');
    window.location.href = 'login.html';
});

// Carregar lista de pacientes para os selects
async function carregarPacientes() {
    try {
        const pacientes = await userAPI.getAll();
        
        // Atualizar select de destinatário
        const selectDestinatario = document.getElementById('destinatario');
        selectDestinatario.innerHTML = '<option value="">Selecione um paciente</option>';
        
        // Atualizar select de filtro
        const selectFiltro = document.getElementById('filtro-paciente');
        selectFiltro.innerHTML = '<option value="">Todos os pacientes</option>';
        
        pacientes.forEach(paciente => {
            // Select de destinatário no formulário
            const optionDestinatario = document.createElement('option');
            optionDestinatario.value = paciente.id;
            optionDestinatario.textContent = paciente.name;
            selectDestinatario.appendChild(optionDestinatario);
            
            // Select de filtro
            const optionFiltro = document.createElement('option');
            optionFiltro.value = paciente.id;
            optionFiltro.textContent = paciente.name;
            selectFiltro.appendChild(optionFiltro);
        });
        
    } catch (error) {
        console.error('Erro ao carregar pacientes:', error);
        // Para erros de carregamento inicial, vamos usar um elemento geral ou alert como fallback
        const feedbackElement = document.getElementById('feedback-upload') || document.getElementById('feedback-arquivos');
        if (feedbackElement) {
            utils.showError('Erro ao carregar lista de pacientes', feedbackElement);
        } else {
            alert('Erro ao carregar lista de pacientes');
        }
    }
}

// Carregar lista de arquivos
async function carregarArquivos() {
    try {
        const arquivos = await fileAPI.getAll();
        renderizarArquivos(arquivos);
    } catch (error) {
        console.error('Erro ao carregar arquivos:', error);
        const feedbackElement = document.getElementById('feedback-arquivos');
        if (feedbackElement) {
            utils.showError('Erro ao carregar arquivos', feedbackElement);
        }
        
        // Mostrar lista vazia em caso de erro
        document.querySelector('.arquivos-lista').innerHTML = 
            '<p class="no-files">Nenhum arquivo encontrado ou erro ao carregar.</p>';
    }
}

// Renderizar lista de arquivos
function renderizarArquivos(arquivos) {
    const listaArquivos = document.querySelector('.arquivos-lista');
    
    if (!arquivos || arquivos.length === 0) {
        listaArquivos.innerHTML = '<p class="no-files">Nenhum arquivo compartilhado ainda.</p>';
        return;
    }
    
    listaArquivos.innerHTML = arquivos.map(arquivo => {
        // Tentar diferentes campos possíveis para o ID
        const arquivoId = arquivo.id || arquivo._id || arquivo.fileId || arquivo.file_id;
        
        if (!arquivoId) {
            console.warn('Arquivo sem ID válido encontrado:', arquivo);
            return ''; // Pular este arquivo
        }
        
        const icone = obterIconeArquivo(arquivo.categoria || 'outros');
        const dataFormatada = utils.formatDateForDisplay(arquivo.data_envio || arquivo.created_at || arquivo.createdAt);
        
        return `
            <div class="arquivo-item" data-paciente="${arquivo.user_id}" data-tipo="${arquivo.categoria}" data-id="${arquivoId}">
                <div class="arquivo-icon">${icone}</div>
                <div class="arquivo-info">
                    <h4>${arquivo.nome || arquivo.name || arquivo.filename || 'Arquivo sem nome'}</h4>
                    <p><strong>Paciente:</strong> <span class="paciente-nome" data-id="${arquivo.paciente?.id || arquivo.user_id}">${arquivo.paciente?.name || 'Paciente não encontrado'}</span></p>
                    <p><strong>Tipo:</strong> ${formatarTipoArquivo(arquivo.categoria)}</p>
                    <p><strong>Enviado em:</strong> ${dataFormatada}</p>
                    ${arquivo.descricao ? `<p><strong>Descrição:</strong> ${arquivo.descricao}</p>` : ''}
                </div>
                <div class="arquivo-acoes">
                    <button class="btn-mini" onclick="baixarArquivo('${arquivoId}')">Baixar</button>
                    <button class="btn-mini-danger" onclick="excluirArquivo('${arquivoId}')">Excluir</button>
                </div>
            </div>
        `;
    }).filter(html => html !== '').join(''); // Filtrar itens vazios
}

// Obter ícone baseado no tipo de arquivo
function obterIconeArquivo(tipo) {
    const icones = {
        'plano-nutricional': '📄',
        'plano-treino': '🏃',
        'relatorio': '📊',
        'receita': '🍽️',
        'exame': '🔬',
        'outros': '📎'
    };
    return icones[tipo] || '📎';
}

// Formatar tipo de arquivo para exibição
function formatarTipoArquivo(tipo) {
    const tipos = {
        'plano-nutricional': 'Plano Nutricional',
        'plano-treino': 'Plano de Treino',
        'relatorio': 'Relatório',
        'receita': 'Receita',
        'exame': 'Exame',
        'outros': 'Outros'
    };
    return tipos[tipo] || 'Outros';
}

// Upload de arquivo
document.getElementById('upload-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const arquivo = document.getElementById('arquivo').files[0];
    const destinatario = document.getElementById('destinatario').value;
    const tipoArquivo = document.getElementById('tipo-arquivo').value;
    const descricao = document.getElementById('descricao').value;
    const feedbackElement = document.getElementById('feedback-upload');
    const submitButton = e.target.querySelector('button[type="submit"]');

    if (!arquivo || !destinatario || !tipoArquivo) {
        utils.showError('Por favor, preencha todos os campos obrigatórios', feedbackElement);
        return;
    }

    try {
        // Mostrar loading e desabilitar botão
        utils.showLoading('Enviando arquivo...', feedbackElement);
        submitButton.disabled = true;
        
        // Obter dados do profissional logado
        const userData = localStorage.getItem('userData');
        const professional = JSON.parse(userData);
        
        // Enviar arquivo via API com todos os metadados
        await fileAPI.create(
            arquivo,               // fileData
            destinatario,          // user_id (paciente destinatário)
            professional.id,       // profissional_id
            tipoArquivo,          // categoria
            descricao || ''       // descricao
        );
        
        utils.showSuccess(`Arquivo "${arquivo.name}" enviado com sucesso!`, feedbackElement);
        
        // Limpar formulário
        this.reset();
        
        // Recarregar lista de arquivos
        await carregarArquivos();
        
    } catch (error) {
        console.error('Erro ao enviar arquivo:', error);
        utils.showError('Erro ao enviar arquivo. Tente novamente.', feedbackElement);
    } finally {
        // Reabilitar botão
        submitButton.disabled = false;
    }
});

// Variáveis globais para o modal de exclusão
let arquivoParaExcluir = null;
let nomeArquivoParaExcluir = '';

// Excluir arquivo
async function excluirArquivo(arquivoId) {
    // Verificar se o ID não é null ou undefined
    if (!arquivoId || arquivoId === 'undefined' || arquivoId === 'null') {
        console.error('ID do arquivo é inválido:', arquivoId);
        const feedbackElement = document.getElementById('feedback-arquivos');
        utils.showError('Erro: ID do arquivo não encontrado. Recarregue a página e tente novamente.', feedbackElement);
        return;
    }
    
    // Encontrar o nome do arquivo na lista
    const arquivoElement = document.querySelector(`[data-id="${arquivoId}"]`);
    
    if (arquivoElement) {
        const nomeElement = arquivoElement.querySelector('.arquivo-info h4');
        nomeArquivoParaExcluir = nomeElement ? nomeElement.textContent : 'Arquivo';
    } else {
        console.warn('Elemento do arquivo não encontrado na DOM para ID:', arquivoId);
        nomeArquivoParaExcluir = 'Arquivo';
    }
    
    // Armazenar o ID do arquivo para exclusão posterior
    arquivoParaExcluir = arquivoId;
    console.log('Arquivo selecionado para exclusão:', arquivoParaExcluir, nomeArquivoParaExcluir);
    
    // Mostrar o modal de confirmação
    mostrarModalConfirmacao();
}

// Mostrar modal de confirmação
function mostrarModalConfirmacao() {
    const modal = document.getElementById('modal-confirmar-exclusao');
    const nomeArquivo = document.getElementById('nome-arquivo-exclusao');
    
    nomeArquivo.textContent = nomeArquivoParaExcluir;
    modal.style.display = 'block';
}

// Fechar modal de confirmação
function fecharModalConfirmacao() {
    const modal = document.getElementById('modal-confirmar-exclusao');
    modal.style.display = 'none';
}

// Executar exclusão confirmada
async function executarExclusao() {
    if (!arquivoParaExcluir) {
        console.error('Nenhum arquivo selecionado para exclusão');
        return;
    }
    
    const feedbackElement = document.getElementById('feedback-arquivos');
    const confirmarBtn = document.getElementById('confirmar-exclusao');
    
    try {
        // Fechar modal
        fecharModalConfirmacao();
        
        // Mostrar loading e desabilitar botão de confirmar
        utils.showLoading('Excluindo arquivo...', feedbackElement);
        confirmarBtn.disabled = true;
        
        await fileAPI.delete(arquivoParaExcluir);
        
        utils.showSuccess(`Arquivo "${nomeArquivoParaExcluir}" excluído com sucesso!`, feedbackElement);
        
        // Recarregar lista
        await carregarArquivos();
        
        nomeArquivoParaExcluir = '';
        arquivoParaExcluir = null;
    } catch (error) {
        console.error('Erro ao excluir arquivo:', error);
        console.error('ID que foi enviado para exclusão:', arquivoParaExcluir);
        utils.showError('Erro ao excluir arquivo. Verifique se o arquivo ainda existe e tente novamente.', feedbackElement);
    } finally {
        confirmarBtn.disabled = false;
        arquivoParaExcluir = null;
        nomeArquivoParaExcluir = '';
    }
}

// Baixar arquivo
function baixarArquivo(arquivoId) {
    const feedbackElement = document.getElementById('feedback-arquivos');
    
    try {
        utils.showLoading('Iniciando download...', feedbackElement);
        
        fileAPI.download(arquivoId);
        
        // Mostrar sucesso e ocultar após um tempo menor para downloads
        utils.showSuccess('Download iniciado!', feedbackElement);
        setTimeout(() => {
            utils.hideFeedback(feedbackElement);
        }, 2000);
        
    } catch (error) {
        console.error('Erro ao baixar arquivo:', error);
        utils.showError('Erro ao baixar arquivo. Tente novamente.', feedbackElement);
    }
}

// Filtros
document.getElementById('filtro-paciente').addEventListener('change', aplicarFiltros);
document.getElementById('filtro-tipo').addEventListener('change', aplicarFiltros);

function aplicarFiltros() {
    const filtroPaciente = document.getElementById('filtro-paciente').value;
    const filtroTipo = document.getElementById('filtro-tipo').value;

    const arquivos = document.querySelectorAll('.arquivo-item');

    arquivos.forEach(arquivo => {
        const paciente = arquivo.dataset.paciente;
        const tipo = arquivo.dataset.tipo; // corresponde ao campo categoria

        let mostrar = true;

        if (filtroPaciente && paciente !== filtroPaciente) {
            mostrar = false;
        }

        if (filtroTipo && tipo !== filtroTipo) {
            mostrar = false;
        }

        arquivo.style.display = mostrar ? 'flex' : 'none';
    });
}

// Função para limpar filtros
function limparFiltros() {
    document.getElementById('filtro-paciente').value = '';
    document.getElementById('filtro-tipo').value = '';
    aplicarFiltros();
}

// Configurar event listeners para o modal de confirmação de exclusão
function configurarEventListenersModal() {
    // Fechar modal ao clicar no X
    document.getElementById('fechar-modal-exclusao').addEventListener('click', fecharModalConfirmacao);
    
    // Cancelar exclusão
    document.getElementById('cancelar-exclusao').addEventListener('click', fecharModalConfirmacao);
    
    // Confirmar exclusão
    document.getElementById('confirmar-exclusao').addEventListener('click', executarExclusao);
    
    // Fechar modal ao clicar fora dele
    document.getElementById('modal-confirmar-exclusao').addEventListener('click', function(e) {
        if (e.target === this) {
            fecharModalConfirmacao();
        }
    });
    
    // Fechar modal com tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('modal-confirmar-exclusao');
            if (modal.style.display === 'block') {
                fecharModalConfirmacao();
            }
        }
    });
}