/**
 * AUTH LOCK - VERSÃO FINAL CORRIGIDA
 * Central SCI Joinville - Sistema de Bloqueio
 * 
 * CORREÇÕES:
 * - Overlay legível e bem posicionado
 * - Blur apenas no conteúdo protegido
 * - Botão de login funcional
 * - Responsivo
 */

export default {
    initialized: false,
    lockedElements: new WeakMap(),
    
    init() {
        console.log('🔒 Aguardando sistema de autenticação...');
        
        const waitForAuth = setInterval(() => {
            if (window.authCore && window.authCore.initialized) {
                clearInterval(waitForAuth);
                this.initialized = true;
                console.log('🔒 Sistema de bloqueio inicializado');
                this.checkAuthAndLock();
                
                window.addEventListener('auth-state-changed', () => {
                    this.checkAuthAndLock();
                });
            }
        }, 100);
        
        setTimeout(() => {
            if (!this.initialized) {
                console.warn('⚠️ Sistema de autenticação não carregou, desbloqueando elementos');
                this.unlockAll();
            }
        }, 10000);
    },

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

    unlockAll() {
        const elements = document.querySelectorAll('[data-auth-required]');
        elements.forEach(element => this.unlock(element));
    },

    lock(element) {
        console.log('🔒 Bloqueando elemento:', element.id || element.className);
        
        element.classList.add('auth-locked');
        
        if (element.querySelector('.auth-lock-overlay')) {
            console.log('⚠️ Elemento já estava bloqueado');
            return;
        }
        
        this.saveAndRemoveInteractivity(element);
        
        // HTML CORRIGIDO DO OVERLAY
        const overlay = document.createElement('div');
        overlay.className = 'auth-lock-overlay';
        
        const message = document.createElement('div');
        message.className = 'auth-lock-message';
        
        // Estrutura HTML clara e legível
        message.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 16px; display: block;">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <p style="font-size: 18px; font-weight: 700; color: #1d1d1f; margin: 0 0 8px 0;">
                Acesso Restrito
            </p>
            <p style="font-size: 14px; color: #6b7280; margin: 0 0 20px 0; line-height: 1.5;">
                Faça login para acessar esta funcionalidade
            </p>
            <button 
                type="button"
                onclick="event.stopPropagation(); window.authUI?.openModal('login');" 
                style="
                    width: 100%;
                    padding: 12px 24px;
                    background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 15px;
                    cursor: pointer;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    transition: all 0.2s ease;
                ">
                Fazer Login
            </button>
        `;
        
        overlay.appendChild(message);
        
        // Garantir posicionamento relativo
        const position = window.getComputedStyle(element).position;
        if (position === 'static') {
            element.style.position = 'relative';
        }
        
        element.appendChild(overlay);
        
        // Hover no botão (usando JavaScript pois inline style não suporta hover)
        const button = message.querySelector('button');
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 8px 20px rgba(0, 122, 255, 0.4)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = 'none';
        });
        button.addEventListener('mousedown', () => {
            button.style.transform = 'scale(0.98)';
        });
        button.addEventListener('mouseup', () => {
            button.style.transform = 'translateY(-2px)';
        });
        
        this.blockAllEvents(element);
        
        console.log('✅ Elemento bloqueado com sucesso');
    },

    unlock(element) {
        console.log('🔓 Desbloqueando elemento:', element.id || element.className);
        
        element.classList.remove('auth-locked');
        
        const overlay = element.querySelector('.auth-lock-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        this.restoreInteractivity(element);
        this.unblockAllEvents(element);
        
        console.log('✅ Elemento desbloqueado com sucesso');
    },

    saveAndRemoveInteractivity(element) {
        const savedData = {
            element: new Map(),
            children: []
        };
        
        const dangerousAttrs = [
            'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout',
            'onfocus', 'onblur', 'onchange', 'onsubmit', 'onkeydown',
            'onkeyup', 'onkeypress', 'href', 'action', 'formaction'
        ];
        
        dangerousAttrs.forEach(attr => {
            const value = element.getAttribute(attr);
            if (value) {
                savedData.element.set(attr, value);
                element.removeAttribute(attr);
            }
        });
        
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
        
        this.lockedElements.set(element, savedData);
        
        console.log(`💾 Salvos ${savedData.element.size} atributos do elemento principal`);
        console.log(`💾 Salvos dados de ${savedData.children.length} elementos filhos`);
    },

    restoreInteractivity(element) {
        const savedData = this.lockedElements.get(element);
        
        if (!savedData) {
            console.warn('⚠️ Nenhum dado salvo encontrado para este elemento');
            return;
        }
        
        savedData.element.forEach((value, attr) => {
            element.setAttribute(attr, value);
        });
        
        savedData.children.forEach(({ element: child, data }) => {
            data.forEach((value, attr) => {
                child.setAttribute(attr, value);
            });
        });
        
        this.lockedElements.delete(element);
        
        console.log(`♻️ Restaurados ${savedData.element.size} atributos do elemento principal`);
        console.log(`♻️ Restaurados dados de ${savedData.children.length} elementos filhos`);
    },

    blockAllEvents(element) {
        const blockEvent = (e) => {
            // Não bloquear cliques no botão de login
            if (e.target.closest('.auth-lock-message button')) {
                return; // Deixa o evento passar
            }
            
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            if (e.type === 'click' && !element.dataset.notificationShown) {
                element.dataset.notificationShown = 'true';
                
                if (window.authUI && window.authUI.showNotification) {
                    window.authUI.showNotification('Faça login para acessar', 'error');
                }
                
                setTimeout(() => {
                    delete element.dataset.notificationShown;
                }, 2000);
            }
            
            return false;
        };
        
        const events = [
            'click', 'dblclick', 'mousedown', 'mouseup',
            'touchstart', 'touchend', 'touchmove',
            'keydown', 'keyup', 'keypress',
            'submit', 'change', 'input',
            'focus', 'blur'
        ];
        
        events.forEach(eventName => {
            element.addEventListener(eventName, blockEvent, true);
        });
        
        element.__blockEventHandler = blockEvent;
        element.__blockedEvents = events;
    },

    unblockAllEvents(element) {
        if (!element.__blockEventHandler || !element.__blockedEvents) return;
        
        element.__blockedEvents.forEach(eventName => {
            element.removeEventListener(eventName, element.__blockEventHandler, true);
        });
        
        delete element.__blockEventHandler;
        delete element.__blockedEvents;
    }
};
