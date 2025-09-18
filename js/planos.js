// JavaScript para página de planos - Integrado com API
document.addEventListener('DOMContentLoaded', function() {
  
  // Verificar autenticação
  function checkAuth() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const authToken = localStorage.getItem('authToken');
    
    if (!userData || !authToken) {
      console.warn('Usuário não autenticado, redirecionando...');
      window.location.href = '../index.html';
      return null;
    }
    
    return userData;
  }
  
  // Mapeamento dos planos do HTML (IDs 1-8)
  const planosInfo = {
    1: {
      cardId: 'plano-card-1',
      modalId: 'modal1',
      nome: 'Nutrição Essencial',
      descricao: '1x Nutricionista',
      valor: 'R$ 180,00',
      tipo: 'MENSAL'
    },
    2: {
      cardId: 'plano-card-2',
      modalId: 'modal2',
      nome: 'Treino Básico',
      descricao: '4x Personal Trainer',
      valor: 'R$ 280,00',
      tipo: 'MENSAL'
    },
    3: {
      cardId: 'plano-card-3',
      modalId: 'modal3',
      nome: 'Bem-Estar Completo',
      descricao: '1x Nutricionista<br>4x Personal Trainer',
      valor: 'R$ 420,00',
      tipo: 'MENSAL',
      desconto: true
    },
    4: {
      cardId: 'plano-card-4',
      modalId: 'modal4',
      nome: 'Nutrição Avançada',
      descricao: '2x Nutricionista',
      valor: 'R$ 320,00',
      tipo: 'MENSAL'
    },
    5: {
      cardId: 'plano-card-5',
      modalId: 'modal5',
      nome: 'Treino Intensivo',
      descricao: '12x Personal Trainer',
      valor: 'R$ 720,00',
      tipo: 'MENSAL'
    },
    6: {
      cardId: 'plano-card-6',
      modalId: 'modal6',
      nome: 'Transformação Total',
      descricao: '2x Nutricionista<br>12x Personal Trainer',
      valor: 'R$ 980,00',
      tipo: 'MENSAL',
      desconto: true
    },
    7: {
      cardId: 'plano-card-7',
      modalId: 'modal7',
      nome: 'Performance Máxima',
      descricao: '20x Personal Trainer',
      valor: 'R$ 1.100,00',
      tipo: 'MENSAL'
    },
    8: {
      cardId: 'plano-card-8',
      modalId: 'modal8',
      nome: 'Acelere Seus Resultados',
      descricao: '2x Nutricionista<br>20x Personal Trainer',
      valor: 'R$ 1.390,00',
      tipo: 'MENSAL',
      desconto: true
    }
  };
  
  // Inicializar página
  const userData = checkAuth();
  if (!userData) return;
  
  // Carregar plano atual do usuário
  async function carregarPlanoAtual() {
    try {
      console.log('Carregando plano atual do usuário:', userData.id);
      
      const planoAtual = userData.plano;
      console.log('Plano atual recebido:', planoAtual);
      
      if (planoAtual) {
        const planId = parseInt(planoAtual);
        if (planId >= 1 && planId <= 8) {
          mostrarPlanoAtual(planId);
          destacarPlanoAtual(planId);
          
          // Salvar no localStorage para cache
          localStorage.setItem('paciente_plano_id', `plano-card-${planId}`);
        } else {
          console.warn('ID do plano fora do range válido (1-8):', planId);
          esconderSecaoPlanoAtual();
        }
      } else {
        console.log('Nenhum plano encontrado para o usuário');
        esconderSecaoPlanoAtual();
      }
      
    } catch (error) {
      console.error('Erro ao carregar plano atual:', error);
      
      // Tentar usar dados do localStorage como fallback
      const planoLocalStorage = localStorage.getItem('paciente_plano_id');
      if (planoLocalStorage) {
        const planoId = parseInt(planoLocalStorage.replace('plano-card-', ''));
        if (planoId >= 1 && planoId <= 8) {
          console.log('Usando plano do localStorage como fallback:', planoId);
          mostrarPlanoAtual(planoId);
          destacarPlanoAtual(planoId);
        } else {
          esconderSecaoPlanoAtual();
        }
      } else {
        console.log('Nenhum plano encontrado no localStorage');
        esconderSecaoPlanoAtual();
      }
    }
  }
  
  // Mostrar seção do plano atual
  function mostrarPlanoAtual(planId) {
    const plano = planosInfo[planId];
    if (!plano) return;
    
    const currentPlanSection = document.getElementById('current-plan-section');
    const currentPlanName = document.getElementById('current-plan-name');
    const currentPlanDetails = document.getElementById('current-plan-details');
    const currentPlanValue = document.getElementById('current-plan-value');
    
    if (currentPlanSection && currentPlanName && currentPlanDetails && currentPlanValue) {
      currentPlanName.textContent = plano.nome;
      currentPlanDetails.innerHTML = plano.descricao;
      currentPlanValue.textContent = plano.valor + '/mês';
      currentPlanSection.style.display = 'block';
      
      console.log('Plano atual exibido:', plano.nome);
    }
  }
  
  // Esconder seção do plano atual
  function esconderSecaoPlanoAtual() {
    const currentPlanSection = document.getElementById('current-plan-section');
    if (currentPlanSection) {
      currentPlanSection.style.display = 'none';
    }
  }
  
  // Destacar plano atual nos cards
  function destacarPlanoAtual(planId) {
    // Remove destaque de todos os cards
    document.querySelectorAll('.plano-card-paciente').forEach(card => {
      card.classList.remove('plano-atual-destaque');
    });
    
    // Adiciona destaque ao plano atual
    const plano = planosInfo[planId];
    if (plano) {
      const currentCard = document.getElementById(plano.cardId);
      if (currentCard) {
        currentCard.classList.add('plano-atual-destaque');
        console.log('Plano destacado:', plano.cardId);
      }
    }
  }
  
  // Função para assinar um plano
  async function assinarPlano(planId) {
    // Validar ID do plano
    if (!planId || planId < 1 || planId > 8) {
      console.error('ID do plano inválido:', planId);
      alert('❌ Erro: Plano inválido.');
      return;
    }
    
    const planoInfo = planosInfo[planId];
    if (!planoInfo) {
      console.error('Informações do plano não encontradas:', planId);
      alert('❌ Erro: Plano não encontrado.');
      return;
    }
    
    // Confirmar assinatura
    const confirmMessage = `Deseja realmente assinar o plano "${planoInfo.nome}" por ${planoInfo.valor}/mês?`;
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      console.log('Assinando plano:', planId, planoInfo.nome);
      
      // Mostrar loading
      const loadingMsg = document.createElement('div');
      loadingMsg.id = 'loading-plano';
      loadingMsg.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 20px; height: 20px; border: 2px solid #667eea; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <span>Processando assinatura do plano...</span>
        </div>
      `;
      loadingMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px 30px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        text-align: center;
        border: 1px solid #e9ecef;
      `;
      
      // Adicionar CSS da animação de loading
      const style = document.createElement('style');
      style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
      document.head.appendChild(style);
      
      document.body.appendChild(loadingMsg);
      
      // Tentar atualizar plano na API
      let response;
      try {
        response = await planAPI.updateSubscription(userData.id, planId);
        console.log('Plano atualizado via updateSubscription:', response);
      } catch (updateError) {
        console.log('Erro na atualização', updateError);
      }
      
      console.log('Resposta final da API:', response);
      
      // Atualizar localStorage
      localStorage.setItem('paciente_plano_id', `plano-card-${planId}`);
      
      // Atualizar interface
      mostrarPlanoAtual(planId);
      destacarPlanoAtual(planId);
      
      // Remover loading
      document.body.removeChild(loadingMsg);
      document.head.removeChild(style);
      
      alert(`✅ Plano "${planoInfo.nome}" assinado com sucesso!`);
      const quotas = {
        1: { nutricionista: 1, personalTrainer: 0 },
        2: { nutricionista: 0, personalTrainer: 4 },
        3: { nutricionista: 1, personalTrainer: 4 },
        4: { nutricionista: 2, personalTrainer: 0 },
        5: { nutricionista: 0, personalTrainer: 12 },
        6: { nutricionista: 2, personalTrainer: 12 },
        7: { nutricionista: 0, personalTrainer: 20 },
        8: { nutricionista: 2, personalTrainer: 20 }
      };

      const quotaAtual = quotas[planId];
      if (quotaAtual) {
        userData.nutricionista = quotaAtual.nutricionista <= userData.nutricionistaCount;
        userData['personal-trainer'] = quotaAtual.personalTrainer <= userData.personalTrainerCount;
      }
      userData.plano = planId;
      localStorage.setItem('userData', JSON.stringify(userData));
      
    } catch (error) {
      console.error('Erro ao assinar plano:', error);
      
      // Remover loading se existir
      const loadingEl = document.getElementById('loading-plano');
      if (loadingEl) {
        document.body.removeChild(loadingEl);
      }
      
      let errorMessage = 'Erro ao assinar plano. Tente novamente.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      alert('❌ ' + errorMessage);
      
      // Log detalhado para debug
      console.error('Detalhes do erro:', {
        planId,
        userId: userData.id,
        error: error,
        stack: error.stack
      });
    }
  }
  
  // Configurar botões de assinatura
  function configurarBotoesAssinatura() {
    document.querySelectorAll('.btn-assinar-paciente').forEach(button => {
      button.addEventListener('click', async function() {
        const modal = this.closest('.modal-plano-paciente');
        const modalId = modal.id;
        const planId = parseInt(modalId.replace('modal', ''));
        
        if (planId >= 1 && planId <= 8) {
          // Fechar modal
          fecharModal(modalId);
          
          // Assinar plano
          await assinarPlano(planId);
        } else {
          console.error('ID do plano inválido:', planId);
          alert('❌ Erro: Plano inválido.');
        }
      });
    });
  }
  
  // Função de logout
  const sairBtn = document.getElementById('sair');
  if (sairBtn) {
    sairBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      localStorage.removeItem('authToken');
      localStorage.removeItem('userType');
      localStorage.removeItem('userData');
      localStorage.removeItem('paciente_plano_id');
      window.location.href = "../index.html";
    });
  }
  
  // Inicializar página
  carregarPlanoAtual();
  configurarBotoesAssinatura();
  
  console.log('Página de planos inicializada com integração API');
});

// Funções globais para modais (mantidas para compatibilidade)
function abrirModalAnimado(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
  }
}

function fecharModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }
}

// Fechar modal clicando fora
window.onclick = function(event) {
  document.querySelectorAll('.modal-plano-paciente').forEach(modal => {
    if (event.target == modal) {
      fecharModal(modal.id);
    }
  });
};
