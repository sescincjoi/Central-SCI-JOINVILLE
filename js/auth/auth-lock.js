// Sistema de bloqueio para elementos não autenticados
export default {
    initialized: false,
    
    // Inicializar sistema de locks
    init() {
        console.log('🔒 Aguardando sistema de autenticação...');
        
        // Aguardar o authCore estar pronto
        const waitForAuth = setInterval(() => {
            if (window.authCore && window.authCore.initialized) {
                clearInterval(waitForAuth);
                this.initialized = true;
                console.log('🔒 Sistema de bloqueio inicializado');
                this.checkAuthAndLock();
                
                // Escutar mudanças de autenticação
                window.addEventListener('auth-state-changed', () => {
                    this.checkAuthAndLock();
                });
            }
        }, 100);
        
        // Timeout de segurança (10 segundos)
        setTimeout(() => {
            if (!this.initialized) {
                console.warn('⚠️ Sistema de autenticação não carregou, desbloqueando elementos');
                this.unlockAll();
            }
        }, 10000);
    },

    // Verificar autenticação e aplicar locks
    checkAuthAndLock() {
        const isAuthenticated = window.authCore?.currentUser !== null;
        const elements = document.querySelectorAll('[data-auth-required]');
        
        console.log(`🔒 Verificando bloqueios: ${isAuthenticated ? 'LOGADO' : 'NÃO LOGADO'}`);
        console.log(`🔒 Elementos protegidos: ${elements.length}`);
        
        elements.forEach(element => {
            if (isAuthenticated) {
                this.unlock(element);
            } else {
                this.lock(element);
            }
        });
    },

    // Desbloquear todos os elementos (fallback)
    unlockAll() {
        const elements = document.querySelectorAll('[data-auth-required]');
        elements.forEach(element => this.unlock(element));
    },

    // Bloquear elemento
    lock(element) {
        // Adicionar classe de bloqueio
        element.classList.add('auth-locked');
        
        // Verificar se já tem overlay
        if (element.querySelector('.auth-lock-overlay')) return;
        
        // Criar overlay de bloqueio
        const overlay = document.createElement('div');
        overlay.className = 'auth-lock-overlay';
        
        const message = document.createElement('div');
        message.className = 'auth-lock-message';
        message.innerHTML = `
            <i data-lucide="lock" class="w-8 h-8 mx-auto mb-2"></i>
            <p class="text-sm font-semibold">Login necessário</p>
            <p class="text-xs mt-1">Faça login para acessar</p>
        `;
        
        overlay.appendChild(message);
        
        // Posicionar elemento como relative se necessário
        const position = window.getComputedStyle(element).position;
        if (position === 'static') {
            element.style.position = 'relative';
        }
        
        element.appendChild(overlay);
        
        // Atualizar ícones Lucide
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        // Bloquear cliques
        element.addEventListener('click', this.handleBlockedClick, true);
    },

    // Desbloquear elemento
    unlock(element) {
        element.classList.remove('auth-locked');
        
        // Remover overlay
        const overlay = element.querySelector('.auth-lock-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        // Remover bloqueio de cliques
        element.removeEventListener('click', this.handleBlockedClick, true);
    },

    // Tratar clique em elemento bloqueado
    handleBlockedClick(event) {
        event.preventDefault();
        event.stopPropagation();
        
        // Mostrar notificação
        if (window.authUI && window.authUI.showNotification) {
            window.authUI.showNotification('Faça login para acessar esta funcionalidade', 'error');
        } else {
            alert('Faça login para acessar esta funcionalidade');
        }
        
        return false;
    }
};
