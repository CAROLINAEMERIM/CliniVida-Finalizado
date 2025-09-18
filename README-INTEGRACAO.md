# CliniVida - Frontend Integrado com API

Este documento descreve as integrações implementadas entre o frontend da CliniVida e a API REST.

## 🔗 Arquivos de Integração

### 1. `js/api.js` - Configuração Principal da API
- Configuração do Axios
- Interceptors para autenticação e tratamento de erros
- Funções para todas as entidades da API:
  - **userAPI**: Operações com usuários/pacientes
  - **professionalAPI**: Operações com profissionais
  - **scheduleAPI**: Operações com agendamentos
  - **fichaAPI**: Operações com fichas médicas
  - **consultaAPI**: Operações with consultas
- Funções utilitárias (formatação, validação, notificações)

### 2. `js/auth.js` - Gerenciamento de Autenticação
- Verificação de autenticação global
- Função de logout padronizada
- Interceptors de redirecionamento
- Proteção de rotas

### 3. Arquivos Específicos por Página

#### `js/script.js` - Página Principal
- Login integrado com API
- Cadastro integrado com API  
- Validações de formulário
- Redirecionamento baseado no tipo de usuário

#### `js/agendamentos.js` - Página de Agendamentos
- Calendário funcional
- Seleção de horários
- Criação de agendamentos via API
- Validações de data e horário

#### `js/historico.js` - Página de Histórico
- Carregamento de agendamentos e consultas
- Filtros por período
- Exibição em tabela
- Status dos agendamentos

#### `js/perfil.js` - Página de Perfil
- Carregamento de dados do usuário
- Atualização de perfil via API
- Alteração de senha
- Validações em tempo real

#### `js/consultas.js` - Área do Profissional
- Carregamento de consultas do dia
- Detalhes da consulta
- Interface para profissionais

## 📋 Funcionalidades Implementadas

### ✅ Autenticação
- [x] Login de usuários e profissionais
- [x] Cadastro de usuários
- [x] Logout com limpeza de dados
- [x] Proteção de rotas
- [x] Redirecionamento automático

### ✅ Agendamentos
- [x] Criação de agendamentos
- [x] Calendário interativo
- [x] Seleção de profissionais
- [x] Validações de data/hora
- [x] Formulário multi-etapas

### ✅ Histórico
- [x] Visualização de agendamentos
- [x] Visualização de consultas
- [x] Filtros por período
- [x] Status dos agendamentos
- [x] Ordenação por data

### ✅ Perfil do Usuário
- [x] Visualização de dados
- [x] Atualização de informações
- [x] Alteração de senha
- [x] Validações de formulário

### 🔄 Área do Profissional
- [x] Visualização de consultas
- [x] Detalhes dos pacientes
- [x] Interface básica

### ⏳ Funcionalidades Futuras
- [ ] Upload de arquivos/imagens
- [ ] Notificações em tempo real
- [ ] Chat entre paciente e profissional
- [ ] Relatórios detalhados
- [ ] Sistema de avaliações

## 🔧 Configuração

### Pré-requisitos
1. API rodando em `http://localhost:8000`
2. Axios CDN incluído nas páginas HTML
3. Arquivos JavaScript carregados na ordem correta

### Ordem de Carregamento dos Scripts
```html
<!-- Axios (CDN) -->
<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
<!-- Configuração da API -->
<script src="js/api.js"></script>
<!-- Autenticação Global -->
<script src="js/auth.js"></script>
<!-- Scripts específicos da página -->
<script src="js/[pagina-especifica].js"></script>
```

## 🔐 Autenticação

### Fluxo de Login
1. Usuário preenche credenciais
2. Sistema identifica tipo (paciente/profissional)  
3. Chama API apropriada (`/user/login` ou `/professional/login`)
4. Salva token e dados no localStorage
5. Redireciona para área apropriada

### Dados Armazenados no LocalStorage
```javascript
localStorage.setItem('authToken', token);
localStorage.setItem('userType', 'paciente'|'profissional');
localStorage.setItem('userData', JSON.stringify(userData));
```

## 📊 Tratamento de Erros

### Interceptors Axios
- **Request**: Adiciona token de autenticação automaticamente
- **Response**: Trata erros 401 (não autorizado) com redirecionamento

### Notificações
- Sucessos: Notificação verde com ✅
- Erros: Notificação vermelha com ❌
- Validações: Foco no campo com erro

## 🎨 Interface

### Estados de Loading
- Botões desabilitados durante requisições
- Indicadores visuais de carregamento
- Mensagens de feedback

### Responsividade
- Layout adaptável para mobile
- Componentes otimizados para touch
- Navegação simplificada em telas pequenas

## 🔄 Sincronização de Dados

### Estratégia
1. **Cache Local**: Dados básicos no localStorage
2. **Refresh na Navegação**: Recarrega dados ao entrar na página
3. **Atualizações Imediatas**: Atualiza localStorage após mudanças

### Consistência
- Dados sempre atualizados da API quando possível
- Fallback para dados locais em caso de erro
- Limpeza automática de dados desatualizados

## 🐛 Debug e Logs

### Console Logs
- Erros de API logados no console
- Dados de resposta em desenvolvimento
- Status de autenticação

### Ferramentas
- Axios interceptors para logs
- LocalStorage inspector
- Network tab para monitoramento

## 📝 Notas de Desenvolvimento

### Boas Práticas Implementadas
- Separação de responsabilidades
- Tratamento consistente de erros
- Validações client-side
- Interface responsiva
- Código modular

### Melhorias Futuras
- Implementar service workers para cache
- Adicionar testes unitários
- Otimizar bundle JavaScript
- Implementar TypeScript
- Adicionar CI/CD pipeline

## 🚀 Deploy

### Variáveis de Ambiente
```javascript
const API_BASE_URL = 'http://localhost:8000'; // Alterar para produção
```

### Checklist de Deploy
- [ ] Alterar URL da API para produção
- [ ] Minificar arquivos JavaScript
- [ ] Configurar HTTPS
- [ ] Testar todas as funcionalidades
- [ ] Configurar CORS na API
