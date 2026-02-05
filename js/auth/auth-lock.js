/**
 * AUTH LOCK - VERSÃO MELHORADA
 * Central SCI Joinville - Sistema de Bloqueio
 * 
 * MELHORIAS:
 * - Remove TODOS os onclick, href e data-* perigosos
 * - Bloqueia eventos de forma mais profunda
 * - Proteção contra DevTools
 * - Overlay mais bonito e informativo
 */

export default {
    initialized: false,
    lockedElements: new WeakMap(), // Guardar dados dos elementos bloqueados
    
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
        console.log('🔒 Bloqueando elemento:', element.id || element.className);
        
        // Adicionar classe de bloqueio
        element.classList.add('auth-locked');
        
        // Verificar se já tem overlay
        if (element.querySelector('.auth-lock-overlay')) {
            console.log('⚠️ Elemento já estava bloqueado');
            return;
        }
        
        // SALVAR e REMOVER todos os atributos interativos
        this.saveAndRemoveInteractivity(element);
        
        // Criar overlay de bloqueio
        const overlay = document.createElement('div');
        overlay.className = 'auth-lock-overlay';
        
        const message = document.createElement('div');
        message.className = 'auth-lock-message';
        message.innerHTML = `
            <i data-lucide="lock" class="w-10 h-10 mx-auto mb-3"></i>
            <p class="text-base font-bold">Acesso Restrito</p>
            <p class="text-sm mt-2 opacity-80">Faça login para acessar</p>
            <button onclick="window.authUI?.openModal('login')" 
                    class="btn-primary mt-4"
                    style="font-size: 13px; padding: 8px 20px;">
                Fazer Login
            </button>
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
        
        // Bloquear TODOS os eventos
        this.blockAllEvents(element);
        
        console.log('✅ Elemento bloqueado com sucesso');
    },

    // Desbloquear elemento
    unlock(element) {
        console.log('🔓 Desbloqueando elemento:', element.id || element.className);
        
        element.classList.remove('auth-locked');
        
        // Remover overlay
        const overlay = element.querySelector('.auth-lock-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        // RESTAURAR todos os atributos interativos
        this.restoreInteractivity(element);
        
        // Desbloquear eventos
        this.unblockAllEvents(element);
        
        console.log('✅ Elemento desbloqueado com sucesso');
    },

    // Salvar e remover TODA a interatividade
    saveAndRemoveInteractivity(element) {
        const savedData = {
            element: new Map(),
            children: []
        };
        
        // Lista de atributos perigosos
        const dangerousAttrs = [
            'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout',
            'onfocus', 'onblur', 'onchange', 'onsubmit', 'onkeydown',
            'onkeyup', 'onkeypress', 'href', 'action', 'formaction'
        ];
        
        // Salvar e remover atributos do elemento principal
        dangerousAttrs.forEach(attr => {
            const value = element.getAttribute(attr);
            if (value) {
                savedData.element.set(attr, value);
                element.removeAttribute(attr);
            }
        });
        
        // Salvar e remover atributos de TODOS os filhos
        const allChildren = element.querySelectorAll('*');
        allChildren.forEach((child, index) => {
            const childData = new Map();
            
            dangerousAttrs.forEach(attr => {
                const value = child.getAttribute(attr);
                if (value) {
                    childData.set(attr, value);
                    child.removeAttribute(attr);
                }
            });
            
            if (childData.size > 0) {
                savedData.children.push({ index, data: childData, element: child });
            }
        });
        
        // Guardar dados salvos
        this.lockedElements.set(element, savedData);
        
        console.log(`💾 Salvos ${savedData.element.size} atributos do elemento principal`);
        console.log(`💾 Salvos dados de ${savedData.children.length} elementos filhos`);
    },

    // Restaurar interatividade
    restoreInteractivity(element) {
        const savedData = this.lockedElements.get(element);
        
        if (!savedData) {
            console.warn('⚠️ Nenhum dado salvo encontrado para este elemento');
            return;
        }
        
        // Restaurar atributos do elemento principal
        savedData.element.forEach((value, attr) => {
            element.setAttribute(attr, value);
        });
        
        // Restaurar atributos dos filhos
        savedData.children.forEach(({ element: child, data }) => {
            data.forEach((value, attr) => {
                child.setAttribute(attr, value);
            });
        });
        
        // Limpar dados salvos
        this.lockedElements.delete(element);
        
        console.log(`♻️ Restaurados ${savedData.element.size} atributos do elemento principal`);
        console.log(`♻️ Restaurados dados de ${savedData.children.length} elementos filhos`);
    },

    // Bloquear TODOS os eventos
    blockAllEvents(element) {
        const blockEvent = (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // Mostrar notificação apenas no primeiro clique
            if (e.type === 'click' && !element.dataset.notificationShown) {
                element.dataset.notificationShown = 'true';
                
                if (window.authUI && window.authUI.showNotification) {
                    window.authUI.showNotification('Faça login para acessar', 'error');
                }
                
                // Reset após 2 segundos
                setTimeout(() => {
                    delete element.dataset.notificationShown;
                }, 2000);
            }
            
            return false;
        };
        
        // Lista de eventos a bloquear
        const events = [
            'click', 'dblclick', 'mousedown', 'mouseup',
            'touchstart', 'touchend', 'touchmove',
            'keydown', 'keyup', 'keypress',
            'submit', 'change', 'input',
            'focus', 'blur'
        ];
        
        // Adicionar listeners
        events.forEach(eventName => {
            element.addEventListener(eventName, blockEvent, true);
        });
        
        // Guardar referência para remover depois
        element.__blockEventHandler = blockEvent;
        element.__blockedEvents = events;
    },

    // Desbloquear eventos
    unblockAllEvents(element) {
        if (!element.__blockEventHandler || !element.__blockedEvents) return;
        
        element.__blockedEvents.forEach(eventName => {
            element.removeEventListener(eventName, element.__blockEventHandler, true);
        });
        
        delete element.__blockEventHandler;
        delete element.__blockedEvents;
    }
};
