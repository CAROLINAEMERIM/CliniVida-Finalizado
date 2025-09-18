// Página de Perfil do Profissional - JavaScript extraído
// Este arquivo contém toda a lógica de interação da página de perfil do profissional

// Variáveis globais
let currentAvatarUrl = null;
let avatarImageManager = null;
let avatarFileToUpload = null;

// Inicialização da página
document.addEventListener('DOMContentLoaded', function() {
    carregarDadosProfissional();
    
    // Configurar validação de senha em tempo real
    const novaSenhaInput = document.getElementById('nova-senha-prof');
    if (novaSenhaInput) {
        novaSenhaInput.addEventListener('input', function() {
            validarSenhaProfissional(this.value);
        });
    }
});

// ============= FUNCIONALIDADES DE LOGOUT =============

// Logout
document.getElementById('logout-btn').addEventListener('click', function() {
    localStorage.removeItem('profissional_logado');
    window.location.href = '../index.html';
});

// ============= SISTEMA DE NOTIFICAÇÕES =============

function mostrarNotificacao(mensagem, tipo = 'sucesso') {
    const notificacao = document.getElementById('notificacao');
    const textoNotificacao = document.getElementById('notificacao-texto');
    
    textoNotificacao.textContent = mensagem;
    notificacao.className = `notificacao ${tipo} ativo`;
    
    // Auto-fechar após 5 segundos
    setTimeout(() => {
        fecharNotificacao();
    }, 5000);
}

function fecharNotificacao() {
    const notificacao = document.getElementById('notificacao');
    notificacao.classList.remove('ativo');
}

// ============= GERENCIAMENTO DE AVATAR =============

// Função para limpar URL anterior do avatar (evita vazamento de memória)
function limparAvatarAnterior() {
    if (avatarImageManager) {
        avatarImageManager.clear();
    }
    if (currentAvatarUrl && currentAvatarUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentAvatarUrl);
        currentAvatarUrl = null;
    }
}

function carregarAvatarProfissional() {
    const avatarDisplay = document.getElementById('avatar-display-profissional');
    const avatarSalvo = localStorage.getItem('profissional_avatar');
    
    if (avatarSalvo) {
        avatarDisplay.innerHTML = `<img src="${avatarSalvo}" alt="Foto de Perfil" class="perfil-avatar">`;
        currentAvatarUrl = avatarSalvo; // Armazenar para limpeza futura
    } else {
        avatarDisplay.innerHTML = `<div class="avatar-placeholder">👤</div>`;
        currentAvatarUrl = null;
    }
}

// Upload de avatar - apenas preview
document.getElementById('avatar-input-profissional').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
            mostrarNotificacao('Por favor, selecione apenas arquivos de imagem.', 'erro');
            return;
        }
        
        // Validar tamanho do arquivo (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            mostrarNotificacao('O arquivo deve ter no máximo 5MB.', 'erro');
            return;
        }
        
        // Armazenar arquivo para upload posterior
        avatarFileToUpload = file;
        
        // Mostrar preview da imagem
        const reader = new FileReader();
        reader.onload = function(e) {
            const avatarDisplay = document.getElementById('avatar-display-profissional');
            avatarDisplay.innerHTML = `<img src="${e.target.result}" alt="Preview do Avatar" class="perfil-avatar">`;
            
            // Mostrar notificação informando que precisa salvar
            mostrarNotificacao('Avatar selecionado. Clique em "Salvar Alterações" para confirmar.', 'aviso');
        };
        reader.readAsDataURL(file);
    }
});

// Função para cancelar seleção de avatar
function cancelarSelecaoAvatar() {
    avatarFileToUpload = null;
    carregarAvatarProfissional(); // Restaurar avatar anterior
    document.getElementById('avatar-input-profissional').value = ''; // Limpar input
    mostrarNotificacao('Seleção de avatar cancelada.', 'info');
}

// Função para detectar tecla ESC para cancelar seleção
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && avatarFileToUpload) {
        cancelarSelecaoAvatar();
    }
});

// ============= CARREGAMENTO DE DADOS =============

function carregarDadosPerfilProfissional() {
    const nomeProfissional = localStorage.getItem('profissional_nome') || 'Camila Emerim';
    document.getElementById('nome-profissional').textContent = nomeProfissional;
    
    // Carregar outros dados do localStorage se existirem
    const email = localStorage.getItem('profissional_email');
    const telefone = localStorage.getItem('profissional_telefone');
    const data = JSON.parse(localStorage.getItem('userData') || '{}');
    const cr = data.cr || '';
    const valor_consulta = Number(data.valor_consulta || '1');
    const bio = data.bio || '';
    const formacao = data.formacao || '';
    const especializacoes = data.especializacoes || '';
    const experiencia = data.experiencia || '';
    const data_nascimento = data.data_nascimento || '';
    
    if (email) {
        document.getElementById('email-profissional').value = email;
    }
    if (telefone) {
        document.getElementById('telefone-profissional').value = telefone;
    }
    if (cr) {
        document.getElementById('registro-profissional').value = cr;
    }
    console.log('Valor da consulta carregado:', valor_consulta);
    if (valor_consulta) {
        console.log('Valor da consulta carregado:', valor_consulta);
        document.getElementById('valor_consulta').value = valor_consulta;
    }
    if (bio) {
        document.getElementById('bio-profissional').value = bio;
    }
    if (formacao) {
        document.getElementById('formacao').value = formacao;
    }
    if (especializacoes) {
        document.getElementById('especializacoes').value = especializacoes;
    }
    if (experiencia) {
        const experienciaSelect = document.getElementById('experiencia');
        for (let option of experienciaSelect.options) {
            if (option.value === experiencia) {
                option.selected = true;
                break;
            }
        }
    }
    if (data_nascimento) {
        document.getElementById('data-nascimento').value = data_nascimento;
    }
}

async function carregarDadosProfissional() {
    try {
        // Obter dados do profissional do localStorage
        const userData = localStorage.getItem('userData');
        if (!userData) {
            console.error('Dados do profissional não encontrados no localStorage');
            // Carregar dados padrão se não houver dados
            carregarDadosPerfilProfissional();
            return;
        }

        const profissional = JSON.parse(userData);
        const profissionalId = profissional.id;

        if (!profissionalId) {
            console.error('ID do profissional não encontrado');
            // Usar dados do localStorage como fallback
            preencherFormularioProfissional(profissional);
            return;
        }

        // Mostrar indicador de carregamento
        const nomeHeader = document.getElementById('nome-profissional');
        nomeHeader.textContent = 'Carregando...';

        // Buscar dados atualizados do profissional na API
        const response = await professionalAPI.getById(profissionalId);
        const dadosProfissional = response.data || response;

        // Preencher os campos do formulário com os dados da API
        preencherFormularioProfissional(dadosProfissional);
        
        // Garantir que o avatar seja carregado após preencher o formulário
        if (!dadosProfissional.imagem_perfil && !dadosProfissional.avatar && !dadosProfissional.profileImage) {
            carregarAvatarProfissional();
        }
        
        console.log('Dados do profissional carregados com sucesso via API');
        
    } catch (error) {
        console.error('Erro ao carregar dados do profissional:', error);
        
        // Em caso de erro, usar dados do localStorage como fallback
        const userData = localStorage.getItem('userData');
        if (userData) {
            const profissional = JSON.parse(userData);
            preencherFormularioProfissional(profissional);
            
            // Garantir que o avatar seja carregado após preencher o formulário
            if (!profissional.imagem_perfil && !profissional.avatar && !profissional.profileImage) {
                carregarAvatarProfissional();
            }
            
            console.log('Dados carregados do localStorage como fallback');
        } else {
            // Se não há dados no localStorage, usar função original
            carregarDadosPerfilProfissional();
            // Carregar avatar padrão ou do localStorage
            carregarAvatarProfissional();
            console.log('Usando dados padrão');
        }
        
        // Restaurar nome no header
        const nomeHeader = document.getElementById('nome-profissional');
        const nomeSalvo = localStorage.getItem('profissional_nome') || 'Profissional';
        nomeHeader.textContent = nomeSalvo;
    }
}

function preencherFormularioProfissional(dados) {
    // Verificar se dados existem
    if (!dados) {
        console.warn('Nenhum dado fornecido para preencher o formulário');
        return;
    }

    // Preencher campos básicos
    if (dados.name || dados.nome) {
        const nomeCompleto = dados.name || dados.nome || '';
        document.getElementById('nome-completo').value = nomeCompleto;
        document.getElementById('nome-profissional').textContent = nomeCompleto || 'Profissional';
    }

    if (dados.email) {
        document.getElementById('email-profissional').value = dados.email;
    }

    if (dados.phone || dados.telefone) {
        document.getElementById('telefone-profissional').value = dados.phone || dados.telefone || '';
    }

    if (dados.specialty || dados.especialidade) {
        const especialidadeSelect = document.getElementById('especialidade');
        const valorEspecialidade = dados.specialty || dados.especialidade;
        
        // Tentar encontrar a opção correspondente
        for (let option of especialidadeSelect.options) {
            if (option.value === valorEspecialidade || option.text.toLowerCase().includes(valorEspecialidade.toLowerCase())) {
                option.selected = true;
                break;
            }
        }
    }

    if (dados.cr) {
        document.getElementById('registro-profissional').value = dados.cr || '';
    }

    if(dados.fone) {
        document.getElementById('telefone-profissional').value = dados.fone || '';
    }

    if (dados.data_nascimento) {
        document.getElementById('data-nascimento').value = dados.data_nascimento || '';
    }

    if (dados.bio) {
        document.getElementById('bio-profissional').value = dados.bio || '';
    }

    if (dados.formacao) {
        document.getElementById('formacao').value = dados.formacao || '';
    }

    if (dados.valor_consulta) {
        document.getElementById('valor_consulta').value = Number(dados.valor_consulta || '1');
    }

    if (dados.especializacoes) {
        document.getElementById('especializacoes').value = dados.especializacoes || '';
    }

    if (dados.experiencia) {
        const experienciaSelect = document.getElementById('experiencia');
        const valorExperiencia = dados.experiencia;
        
        for (let option of experienciaSelect.options) {
            if (option.value === valorExperiencia) {
                option.selected = true;
                break;
            }
        }
    }

    // Carregar avatar se existir
    let avatarCarregado = false;
    
    // Limpar avatar anterior para evitar vazamento de memória
    limparAvatarAnterior();
    
    // Inicializar gerenciador de imagens se ainda não existir
    if (!avatarImageManager) {
        avatarImageManager = new ImageUrlManager();
    }
    
    // Verificar se há imagem no formato buffer da API
    if (dados.imagem_perfil && dados.imagem_perfil.type === 'Buffer') {
        const imageUrl = bufferToImageUrl(dados.imagem_perfil);
        if (imageUrl) {
            const avatarDisplay = document.getElementById('avatar-display-profissional');
            avatarDisplay.innerHTML = `<img src="${imageUrl}" alt="Foto de Perfil" class="perfil-avatar">`;
            // Salvar a URL no localStorage para uso posterior
            localStorage.setItem('profissional_avatar', imageUrl);
            currentAvatarUrl = imageUrl; // Armazenar para limpeza futura
            avatarImageManager.addUrl(imageUrl); // Gerenciar com ImageUrlManager
            avatarCarregado = true;
        }
    }
    // Verificar formatos alternativos de avatar (compatibilidade)
    else if (dados.avatar || dados.profileImage) {
        const avatarDisplay = document.getElementById('avatar-display-profissional');
        const avatarUrl = dados.avatar || dados.profileImage;
        avatarDisplay.innerHTML = `<img src="${avatarUrl}" alt="Foto de Perfil" class="perfil-avatar">`;
        localStorage.setItem('profissional_avatar', avatarUrl);
        currentAvatarUrl = avatarUrl; // Armazenar para limpeza futura
        avatarCarregado = true;
    }
    
    // Se não conseguiu carregar avatar da API, tentar carregar do localStorage
    if (!avatarCarregado) {
        carregarAvatarProfissional();
    }

    console.log('Formulário preenchido com dados:', dados);
}

// ============= MODAL DE ALTERAÇÃO DE SENHA =============

// Funções do modal de senha
function abrirModalSenhaProfissional() {
    document.getElementById('modal-senha-profissional').classList.add('ativo');
}

function fecharModalSenhaProfissional() {
    document.getElementById('modal-senha-profissional').classList.remove('ativo');
    document.getElementById('form-alterar-senha-profissional').reset();
}

// Fechar modal clicando fora
window.addEventListener('click', function(event) {
    const modal = document.getElementById('modal-senha-profissional');
    if (event.target === modal) {
        fecharModalSenhaProfissional();
    }
});

// Validação e alteração de senha
document.getElementById('form-alterar-senha-profissional').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const senhaAtual = document.getElementById('senha-atual-prof').value;
    const novaSenha = document.getElementById('nova-senha-prof').value;
    const confirmarSenha = document.getElementById('confirmar-senha-prof').value;
    
    // Validar se as senhas coincidem
    if (novaSenha !== confirmarSenha) {
        mostrarNotificacao('As senhas não coincidem!', 'erro');
        return;
    }
    
    // Validar requisitos da senha
    if (!validarSenhaProfissional(novaSenha)) {
        mostrarNotificacao('A nova senha não atende aos requisitos de segurança!', 'erro');
        return;
    }
    
    // Mostrar indicador de carregamento
    const botaoSalvar = this.querySelector('button[type="submit"]');
    const textoOriginalBotao = botaoSalvar.textContent;
    botaoSalvar.textContent = 'Alterando senha...';
    botaoSalvar.disabled = true;
    
    try {
        // Obter ID do profissional
        const userData = localStorage.getItem('userData');
        if (!userData) {
            mostrarNotificacao('Erro: Dados do profissional não encontrados', 'erro');
            return;
        }

        const profissional = JSON.parse(userData);
        const profissionalId = profissional.id;

        if (!profissionalId) {
            mostrarNotificacao('Erro: ID do profissional não encontrado', 'erro');
            return;
        }

        // Preparar dados para envio
        const passwordData = {
            senhaAtual: senhaAtual,
            novaSenha: novaSenha,
            confirmacaoSenha: confirmarSenha
        };

        // Chamar a API para alterar a senha
        await professionalAPI.changePassword(profissionalId, passwordData);
        
        mostrarNotificacao('Senha alterada com sucesso!', 'sucesso');
        fecharModalSenhaProfissional();
        
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        
        let mensagemErro = 'Erro ao alterar senha';
        
        if (error.message) {
            mensagemErro = error.message;
        } else if (error.response?.data?.message) {
            mensagemErro = error.response.data.message;
        } else if (typeof error === 'string') {
            mensagemErro = error;
        }
        
        mostrarNotificacao(mensagemErro, 'erro');
    } finally {
        // Restaurar botão
        botaoSalvar.textContent = textoOriginalBotao;
        botaoSalvar.disabled = false;
    }
});

function validarSenhaProfissional(senha) {
    const regras = {
        minLength: senha.length >= 8,
        hasUpper: /[A-Z]/.test(senha),
        hasLower: /[a-z]/.test(senha),
        hasNumber: /\d/.test(senha),
        hasSpecial: /[!@#$%^&*]/.test(senha)
    };
    
    // Atualizar indicadores visuais
    Object.keys(regras).forEach(regra => {
        const item = document.querySelector(`[data-regra="${regra}"]`);
        if (item) {
            const icone = item.querySelector('.validacao-icone');
            if (regras[regra]) {
                item.classList.add('valido');
                icone.textContent = '✅';
            } else {
                item.classList.remove('valido');
                icone.textContent = '❌';
            }
        }
    });
    
    return Object.values(regras).every(regra => regra);
}

// ============= SALVAMENTO DO FORMULÁRIO =============

// Salvamento do formulário de perfil
document.getElementById('form-perfil-profissional').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Mostrar indicador de carregamento
    const botaoSalvar = this.querySelector('button[type="submit"]');
    const textoOriginalBotao = botaoSalvar.textContent;
    botaoSalvar.textContent = 'Salvando...';
    botaoSalvar.disabled = true;
    
    try {
        // Obter ID do profissional
        const userData = localStorage.getItem('userData');
        if (!userData) {
            throw new Error('Dados do profissional não encontrados');
        }

        const profissional = JSON.parse(userData);
        const profissionalId = profissional.id;

        if (!profissionalId) {
            throw new Error('ID do profissional não encontrado');
        }

        // Preparar dados para envio
        const dadosAtualizados = {
            valor_consulta: Number(document.getElementById('valor_consulta').value) || 1,
            name: document.getElementById('nome-completo').value,
            email: document.getElementById('email-profissional').value,
            phone: document.getElementById('telefone-profissional').value,
            tipo: document.getElementById('especialidade').value,
            cr: document.getElementById('registro-profissional').value,
            data_nascimento: document.getElementById('data-nascimento').value,
            bio: document.getElementById('bio-profissional').value,
            formacao: document.getElementById('formacao').value,
            especializacoes: document.getElementById('especializacoes').value,
            experiencia: document.getElementById('experiencia').value,
        };

        // Atualizar via API
        await professionalAPI.update(profissionalId, dadosAtualizados);
        
        // Upload do avatar se houver um arquivo selecionado
        let avatarUploadSuccess = true;
        if (avatarFileToUpload) {
            try {
                const formData = new FormData();
                formData.append('image', avatarFileToUpload);
                
                const response = await professionalAPI.updateAvatar(profissionalId, formData);
                
                // Se a API retornar a URL da imagem, usar ela
                if (response.avatar || response.avatarUrl || response.data?.avatar) {
                    const avatarUrl = response.avatar || response.avatarUrl || response.data.avatar;
                    localStorage.setItem('profissional_avatar', avatarUrl);
                }
                
                // Limpar arquivo temporário
                avatarFileToUpload = null;
                
                console.log('Avatar atualizado com sucesso');
            } catch (avatarError) {
                console.error('Erro ao fazer upload do avatar:', avatarError);
                avatarUploadSuccess = false;
            }
        }
        
        // Atualizar dados no localStorage
        const novosUserData = { ...profissional, ...dadosAtualizados };
        localStorage.setItem('userData', JSON.stringify(novosUserData));
        
        // Atualizar campos específicos no localStorage para compatibilidade
        localStorage.setItem('profissional_nome', dadosAtualizados.name);
        localStorage.setItem('profissional_email', dadosAtualizados.email);
        localStorage.setItem('profissional_telefone', dadosAtualizados.phone);
        localStorage.setItem('profissional_especialidade', dadosAtualizados.tipo);
        localStorage.setItem('profissional_registro', dadosAtualizados.cr);
        
        // Mostrar notificação de sucesso
        if (avatarUploadSuccess) {
            mostrarNotificacao('Dados do perfil salvos com sucesso!', 'sucesso');
        } else {
            mostrarNotificacao('Dados salvos, mas houve erro no upload do avatar.', 'aviso');
        }
        
        // Atualizar nome no header
        document.getElementById('nome-profissional').textContent = dadosAtualizados.name;
        
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        
        // Fallback: salvar apenas no localStorage
        localStorage.setItem('profissional_nome', document.getElementById('nome-completo').value);
        localStorage.setItem('profissional_email', document.getElementById('email-profissional').value);
        localStorage.setItem('profissional_telefone', document.getElementById('telefone-profissional').value);
        localStorage.setItem('profissional_especialidade', document.getElementById('especialidade').value);
        localStorage.setItem('profissional_registro', document.getElementById('registro-profissional').value);
        
        const mensagemErro = error.message || 'Erro de conexão com o servidor';
        mostrarNotificacao(`Dados salvos localmente. ${mensagemErro}`, 'aviso');
        
        // Atualizar nome no header
        document.getElementById('nome-profissional').textContent = document.getElementById('nome-completo').value;
    } finally {
        // Restaurar botão
        botaoSalvar.textContent = textoOriginalBotao;
        botaoSalvar.disabled = false;
    }
});

// ============= LIMPEZA DE MEMÓRIA =============

// Limpar URLs de blob quando a página for descarregada
window.addEventListener('beforeunload', function() {
    if (avatarImageManager) {
        avatarImageManager.clear();
    }
    limparAvatarAnterior();
});

// ============= FUNÇÕES EXPOSTAS GLOBALMENTE =============

// Expor funções que podem ser chamadas pelo HTML
window.abrirModalSenhaProfissional = abrirModalSenhaProfissional;
window.fecharModalSenhaProfissional = fecharModalSenhaProfissional;
window.cancelarSelecaoAvatar = cancelarSelecaoAvatar;
