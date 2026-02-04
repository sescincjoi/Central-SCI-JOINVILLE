/**
 * AUTH GUARD
 * Central SCI Joinville - Proteção de Conteúdo
 * 
 * Gerencia a exibição de conteúdo baseado em autenticação:
 * - Esconde/mostra elementos [data-auth-required]
 * - Controla acesso por role (admin/user)
 * - Atualiza botão de login/logout
 * - Redireciona se necessário
 */

import authCore from './auth-core.js';

class AuthGuard {
  constructor() {
    this.isInitialized = false;
    
    // Escutar mudanças de autenticação
    authCore.addAuthListener((event, user) => {
      this.handleAuthChange(event, user);
    });
    
    // Inicializar após carregamento da página
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  /**
   * INICIALIZAR
   */
  init() {
    if (this.isInitialized) return;
    
    console.log('🛡️ AuthGuard inicializando...');
    
    // Aplicar proteção inicial
    this.applyProtection();
    
    // Criar botão de auth no header
    this.createAuthButton();
    
    // Adicionar listeners em elementos protegidos
    this.attachClickListeners();
    
    this.isInitialized = true;
    console.log('✅ AuthGuard inicializado');
  }

  /**
   * HANDLE MUDANÇA DE AUTENTICAÇÃO
   */
  handleAuthChange(event, user) {
    console.log('🔄 Auth mudou:', event, user);
    
    // Atualizar proteção de elementos
    this.applyProtection();
    
    // Atualizar botão
    this.updateAuthButton(user);
  }

  /**
   * APLICAR PROTEÇÃO EM ELEMENTOS
   */
  applyProtection() {
    const isAuthenticated = authCore.isAuthenticated();
    const isAdmin = authCore.isAdmin();
    
    // Encontrar todos os elementos protegidos
    const protectedElements = document.querySelectorAll('[data-auth-required]');
    
    protectedElements.forEach(element => {
      const requiredRole = element.getAttribute('data-role');
      const hideMode = element.getAttribute('data-hide-mode') || 'auto';
      
      let hasAccess = false;
      
      // Verificar acesso
      if (!isAuthenticated) {
        hasAccess = false; // Não logado
      } else if (!requiredRole) {
        hasAccess = true; // Apenas requer login
      } else if (requiredRole === 'admin') {
        hasAccess = isAdmin; // Requer admin
      } else if (requiredRole === 'user') {
        hasAccess = true; // Qualquer usuário logado
      }
      
      // Aplicar proteção
      if (hasAccess) {
        // Tem acesso - mostrar
        element.style.display = '';
        element.classList.remove('auth-locked', 'auth-hidden');
      } else {
        // Não tem acesso - esconder ou bloquear
        if (hideMode === 'hidden' || !isAuthenticated) {
          // Esconder completamente
          element.style.display = 'none';
          element.classList.add('auth-hidden');
          element.classList.remove('auth-locked');
        } else if (hideMode === 'locked') {
          // Mostrar mas bloqueado
          element.style.display = '';
          element.classList.add('auth-locked');
          element.classList.remove('auth-hidden');
          this.applyLockedStyle(element);
        } else {
          // Auto: esconde se não logado, bloqueia se sem permissão
          if (!isAuthenticated) {
            element.style.display = 'none';
            element.classList.add('auth-hidden');
          } else {
            element.style.display = '';
            element.classList.add('auth-locked');
            this.applyLockedStyle(element);
          }
        }
      }
    });
  }

  /**
   * APLICAR ESTILO DE BLOQUEADO
   */
  applyLockedStyle(element) {
    // Adicionar overlay se ainda não existe
    if (!element.querySelector('.auth-lock-overlay')) {
      const overlay = document.createElement('div');
      overlay.className = 'auth-lock-overlay';
      overlay.innerHTML = `
        <div class="auth-lock-message">
          <i data-lucide="lock" class="w-6 h-6 mb-2"></i>
          <p class="text-sm font-semibold">Acesso Restrito</p>
          <p class="text-xs text-gray-500 mt-1">Apenas administradores</p>
        </div>
      `;
      
      element.style.position = 'relative';
      element.appendChild(overlay);
      
      // Recriar ícones Lucide
      if (window.lucide) {
        lucide.createIcons();
      }
    }
  }

  /**
   * ADICIONAR LISTENERS EM ELEMENTOS PROTEGIDOS
   */
  attachClickListeners() {
    document.addEventListener('click', (e) => {
      // Verificar se clicou em elemento protegido
      const protectedElement = e.target.closest('[data-auth-required]');
      
      if (protectedElement && !authCore.isAuthenticated()) {
        // Verificar se é interativo (link, botão, etc)
        if (e.target.closest('a, button, [onclick]')) {
          e.preventDefault();
          e.stopPropagation();
          
          // Mostrar modal de login
          window.authUI.openModal('login');
        }
      }
    }, true); // Use capture para pegar antes de outros handlers
  }

  /**
   * CRIAR BOTÃO DE AUTH NO HEADER
   */
  createAuthButton() {
    const container = document.getElementById('auth-button-container');
    if (!container) {
      console.warn('⚠️ Container auth-button-container não encontrado');
      return;
    }
    
    container.innerHTML = `
      <div style="position: relative;">
        <button id="auth-button" class="auth-button login">
          <i data-lucide="user" class="w-4 h-4"></i>
          <span>Entrar</span>
        </button>
        
        <!-- Menu do usuário (oculto inicialmente) -->
        <div id="auth-user-menu" class="auth-user-menu">
          <div class="auth-user-info">
            <div class="auth-user-name" id="auth-user-name">--</div>
            <div class="auth-user-matricula" id="auth-user-matricula">--</div>
            <span class="auth-user-role user" id="auth-user-role">usuário</span>
          </div>
          <a href="../../admin/usuarios.html" class="auth-menu-item" id="auth-menu-admin" style="display: none;">
            <i data-lucide="shield" class="w-4 h-4"></i>
            <span>Painel Admin</span>
          </a>
          <div class="auth-menu-item logout" id="auth-logout-btn">
            <i data-lucide="log-out" class="w-4 h-4"></i>
            <span>Sair</span>
          </div>
        </div>
      </div>
    `;
    
    // Recriar ícones
    if (window.lucide) {
      lucide.createIcons();
    }
    
    // Adicionar event listeners
    const button = document.getElementById('auth-button');
    const menu = document.getElementById('auth-user-menu');
    const logoutBtn = document.getElementById('auth-logout-btn');
    
    button.addEventListener('click', () => {
      if (authCore.isAuthenticated()) {
        // Toggle menu
        menu.classList.toggle('show');
      } else {
        // Abrir modal de login
        window.authUI.openModal('login');
      }
    });
    
    logoutBtn.addEventListener('click', async () => {
      menu.classList.remove('show');
      await authCore.logout();
    });
    
    // Fechar menu ao clicar fora
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#auth-button') && !e.target.closest('#auth-user-menu')) {
        menu.classList.remove('show');
      }
    });
    
    // Atualizar com estado atual
    this.updateAuthButton(authCore.currentUser);
  }

  /**
   * ATUALIZAR BOTÃO DE AUTH
   */
  updateAuthButton(user) {
    const button = document.getElementById('auth-button');
    const menu = document.getElementById('auth-user-menu');
    
    if (!button) return;
    
    if (user) {
      // Usuário logado
      button.className = 'auth-button user';
      button.innerHTML = `
        <i data-lucide="user-check" class="w-4 h-4"></i>
        <span>${user.matricula}</span>
      `;
      
      // Atualizar menu
      document.getElementById('auth-user-name').textContent = user.displayName;
      document.getElementById('auth-user-matricula').textContent = `Matrícula: ${user.matricula}`;
      
      const roleElement = document.getElementById('auth-user-role');
      if (user.role === 'admin') {
        roleElement.textContent = 'administrador';
        roleElement.className = 'auth-user-role admin';
        document.getElementById('auth-menu-admin').style.display = 'flex';
      } else {
        roleElement.textContent = 'usuário';
        roleElement.className = 'auth-user-role user';
        document.getElementById('auth-menu-admin').style.display = 'none';
      }
      
    } else {
      // Usuário não logado
      button.className = 'auth-button login';
      button.innerHTML = `
        <i data-lucide="user" class="w-4 h-4"></i>
        <span>Entrar</span>
      `;
      
      menu.classList.remove('show');
    }
    
    // Recriar ícones
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  /**
   * VERIFICAR SE PÁGINA REQUER AUTH
   */
  checkPageAccess() {
    const body = document.body;
    const requiresAuth = body.hasAttribute('data-auth-required');
    const requiredRole = body.getAttribute('data-role');
    
    if (!requiresAuth) return true;
    
    if (!authCore.isAuthenticated()) {
      // Salvar URL para redirecionar depois
      sessionStorage.setItem('auth_redirect', window.location.pathname);
      
      // Mostrar modal
      window.authUI.openModal('login');
      
      return false;
    }
    
    if (requiredRole === 'admin' && !authCore.isAdmin()) {
      alert('Acesso negado. Apenas administradores.');
      window.location.href = '/';
      return false;
    }
    
    return true;
  }
}

// Criar instância global
const authGuard = new AuthGuard();

// Exportar
export default authGuard;

// Disponibilizar globalmente
window.authGuard = authGuard;

console.log('✅ AuthGuard carregado');
