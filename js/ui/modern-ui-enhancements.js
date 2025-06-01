// ===== SISTEMA DE UI MODERNA ===== //
const ModernUI = (function() {
    'use strict';

    // Configurações globais
    const config = {
        animationDuration: 250,
        scrollThreshold: 100,
        parallaxFactor: 0.5
    };

    // ===== INICIALIZAÇÃO ===== //
    function init() {
        setupModernEffects();
        setupAnimations();
        setupInteractions();
        setupProgressBars();
        setupTooltips();
        setupParallax();
        setupCounters();
        setupGlassmorphism();
        
        console.log('🎨 UI Moderna carregada com sucesso!');
    }

    // ===== EFEITOS MODERNOS ===== //
    function setupModernEffects() {
        // Adicionar classes de animação aos elementos
        document.querySelectorAll('.group-box').forEach((box, index) => {
            box.style.animationDelay = `${index * 100}ms`;
            box.classList.add('animate-slide-up');
        });

        // Efeito de hover nos cartões
        document.querySelectorAll('.result-card, .chart-container').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-8px) scale(1.02)';
                this.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
            });

            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
                this.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
            });
        });

        // Efeito ripple nos botões
        document.querySelectorAll('button, .btn').forEach(button => {
            button.addEventListener('click', function(e) {
                createRippleEffect(e, this);
            });
        });
    }

    // ===== EFEITO RIPPLE ===== //
    function createRippleEffect(e, element) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple 600ms ease-out;
            pointer-events: none;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
        `;

        // Adicionar keyframes do ripple se não existir
        if (!document.querySelector('#ripple-keyframes')) {
            const style = document.createElement('style');
            style.id = 'ripple-keyframes';
            style.textContent = `
                @keyframes ripple {
                    0% { transform: scale(0); opacity: 1; }
                    100% { transform: scale(2); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }

    // ===== ANIMAÇÕES DE ENTRADA ===== //
    function setupAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    element.classList.add('animate-slide-up');
                    observer.unobserve(element);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observar elementos para animação
        document.querySelectorAll('.result-card, .chart-container, .group-box').forEach(el => {
            observer.observe(el);
        });
    }

    // ===== INTERAÇÕES AVANÇADAS ===== //
    function setupInteractions() {
        // Efeito de foco aprimorado para inputs
        document.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('focus', function() {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.15)';
            });

            input.addEventListener('blur', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            });
        });

        // Smooth scroll para navegação interna
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // ===== BARRAS DE PROGRESSO ===== //
    function setupProgressBars() {
        // Criar barras de progresso animadas
        document.querySelectorAll('.result-item .value').forEach(item => {
            if (item.textContent.includes('%')) {
                const percentage = parseFloat(item.textContent);
                if (!isNaN(percentage) && percentage <= 100) {
                    createProgressBar(item, percentage);
                }
            }
        });
    }

    function createProgressBar(element, percentage) {
        const container = element.parentNode;
        container.style.position = 'relative';

        const progressBar = document.createElement('div');
        progressBar.className = 'modern-progress-bar';
        progressBar.innerHTML = `
            <div class="progress-fill" style="width: 0%"></div>
        `;

        progressBar.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: rgba(102, 126, 234, 0.1);
            border-radius: 2px;
            overflow: hidden;
        `;

        const fill = progressBar.querySelector('.progress-fill');
        fill.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 2px;
            transition: width 1s ease-out;
        `;

        container.appendChild(progressBar);

        // Animar preenchimento
        setTimeout(() => {
            fill.style.width = `${Math.min(percentage, 100)}%`;
        }, 500);
    }

    // ===== TOOLTIPS MODERNOS CORRIGIDOS ===== //
    // ===== TOOLTIPS MODERNOS CORRIGIDOS ===== //
    function setupTooltips() {
        let currentTooltip = null;
        let tooltipTimeout = null;

        // Função para mostrar tooltip
        function showModernTooltip(e, text, targetElement) {
            hideModernTooltip(); // Remove tooltip anterior

            const tooltip = document.createElement('div');
            tooltip.className = 'modern-tooltip';
            tooltip.textContent = text;
            tooltip.style.cssText = `
                position: fixed;
                background: rgba(15, 23, 42, 0.95);
                color: white;
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 0.875rem;
                font-weight: 500;
                z-index: 10000;
                pointer-events: none;
                opacity: 0;
                transform: translateY(5px);
                transition: opacity 200ms ease, transform 200ms ease;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                max-width: 250px;
                word-wrap: break-word;
            `;

            document.body.appendChild(tooltip);
            currentTooltip = tooltip;

            // Posicionar tooltip
            updateTooltipPosition(e, tooltip);

            // Animar entrada
            requestAnimationFrame(() => {
                if (tooltip.parentNode) {
                    tooltip.style.opacity = '1';
                    tooltip.style.transform = 'translateY(0)';
                }
            });
        }

        // Função para atualizar posição do tooltip
        function updateTooltipPosition(e, tooltip) {
            if (!tooltip) return;

            const rect = tooltip.getBoundingClientRect();
            const margin = 10;

            let left = e.clientX - rect.width / 2;
            let top = e.clientY - rect.height - margin;

            // Ajustar se sair da tela pela direita
            if (left + rect.width > window.innerWidth - margin) {
                left = window.innerWidth - rect.width - margin;
            }

            // Ajustar se sair da tela pela esquerda
            if (left < margin) {
                left = margin;
            }

            // Ajustar se sair da tela por cima
            if (top < margin) {
                top = e.clientY + margin; // Mostrar abaixo do cursor
            }

            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
        }

        // Função para esconder tooltip
        function hideModernTooltip() {
            if (currentTooltip) {
                currentTooltip.style.opacity = '0';
                currentTooltip.style.transform = 'translateY(5px)';

                setTimeout(() => {
                    if (currentTooltip && currentTooltip.parentNode) {
                        currentTooltip.parentNode.removeChild(currentTooltip);
                    }
                    currentTooltip = null;
                }, 200);
            }
        }

        // Configurar tooltips para elementos existentes
        document.querySelectorAll('[title], [data-tooltip]').forEach(element => {
            const text = element.getAttribute('title') || element.getAttribute('data-tooltip');
            if (text) {
                element.removeAttribute('title'); // Remove tooltip padrão

                // Evento de entrada do mouse
                element.addEventListener('mouseenter', function(e) {
                    // Limpa timeout anterior se existir
                    if (tooltipTimeout) {
                        clearTimeout(tooltipTimeout);
                        tooltipTimeout = null;
                    }

                    // Remove tooltip anterior
                    hideModernTooltip();

                    // Cria novo tooltip após pequeno delay
                    tooltipTimeout = setTimeout(() => {
                        showModernTooltip(e, text, element);
                    }, 300);
                });

                // Evento de saída do mouse
                element.addEventListener('mouseleave', function() {
                    // Cancela criação do tooltip se ainda não foi criado
                    if (tooltipTimeout) {
                        clearTimeout(tooltipTimeout);
                        tooltipTimeout = null;
                    }

                    // Remove tooltip existente
                    hideModernTooltip();
                });

                // Evento de movimento do mouse para reposicionar
                element.addEventListener('mousemove', function(e) {
                    if (currentTooltip) {
                        updateTooltipPosition(e, currentTooltip);
                    }
                });
            }
        });
    }

    // ===== EFEITO PARALLAX ===== //
    function setupParallax() {
        const parallaxElements = document.querySelectorAll('.chart-container, .result-card');
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            
            parallaxElements.forEach((element, index) => {
                const rate = scrolled * config.parallaxFactor * (index % 2 === 0 ? 1 : -1);
                element.style.transform = `translateY(${rate * 0.1}px)`;
            });
        });
    }

    // ===== CONTADORES ANIMADOS ===== //
    function setupCounters() {
        const counters = document.querySelectorAll('.result-item .value');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        });

        counters.forEach(counter => {
            observer.observe(counter);
        });
    }

    function animateCounter(element) {
        const text = element.textContent;
        const number = parseFloat(text.replace(/[^\d.-]/g, ''));
        
        if (!isNaN(number)) {
            let start = 0;
            const duration = 1500;
            const startTime = performance.now();
            
            function updateCounter(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const current = start + (number - start) * easeOut;
                
                // Formatação baseada no texto original
                if (text.includes('R$')) {
                    element.textContent = `R$ ${current.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}`;
                } else if (text.includes('%')) {
                    element.textContent = `${current.toFixed(1)}%`;
                } else {
                    element.textContent = current.toFixed(0);
                }
                
                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                }
            }
            
            requestAnimationFrame(updateCounter);
        }
    }

    // ===== GLASSMORPHISM ===== //
    function setupGlassmorphism() {
        // Aplicar efeito glass aos modais e elementos especiais
        document.querySelectorAll('.modal, .sped-data-indicator').forEach(element => {
            element.style.backdropFilter = 'blur(20px)';
            element.style.background = 'rgba(255, 255, 255, 0.25)';
            element.style.border = '1px solid rgba(255, 255, 255, 0.18)';
        });
    }

    // ===== SISTEMA DE NOTIFICAÇÕES ===== //
    function showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `modern-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentNode.parentNode.remove()">×</button>
            </div>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${getNotificationColor(type)};
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            z-index: 10001;
            opacity: 0;
            transform: translateX(100%);
            transition: all 300ms ease;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            max-width: 400px;
        `;

        document.body.appendChild(notification);

        // Animar entrada
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });

        // Remover automaticamente
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateX(100%)';
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }
    }

    function getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    function getNotificationColor(type) {
        const colors = {
            success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            error: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            warning: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            info: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        };
        return colors[type] || colors.info;
    }

    // ===== LOADING STATES ===== //
    function showLoading(element) {
        element.classList.add('loading');
        element.style.pointerEvents = 'none';
    }

    function hideLoading(element) {
        element.classList.remove('loading');
        element.style.pointerEvents = 'auto';
    }

    // ===== SMOOTH TRANSITIONS ===== //
    function smoothTransition(element, newContent, callback) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            if (typeof newContent === 'string') {
                element.innerHTML = newContent;
            } else if (typeof newContent === 'function') {
                newContent();
            }
            
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
            
            if (callback) callback();
        }, config.animationDuration);
    }

    // ===== INTERFACE PÚBLICA ===== //
    return {
        init,
        showNotification,
        showLoading,
        hideLoading,
        smoothTransition,
        createRippleEffect
    };
})();

// ===== INICIALIZAÇÃO AUTOMÁTICA ===== //
document.addEventListener('DOMContentLoaded', function() {
    ModernUI.init();
});

// ===== INTEGRAÇÃO COM SISTEMA EXISTENTE ===== //
if (window.TabsManager) {
    const originalSwitchTab = window.TabsManager.switchTab;
    window.TabsManager.switchTab = function(tabId) {
        const tabContent = document.getElementById(tabId);
        if (tabContent) {
            ModernUI.smoothTransition(tabContent, () => {
                originalSwitchTab.call(this, tabId);
            });
        } else {
            originalSwitchTab.call(this, tabId);
        }
    };
}

// ===== MELHORIAS PARA SIMULAÇÃO ===== //
if (window.SimuladorFluxoCaixa) {
    const originalSimular = window.SimuladorFluxoCaixa.simular;
    window.SimuladorFluxoCaixa.simular = function(dados) {
        const btnSimular = document.getElementById('btn-simular');
        
        if (btnSimular) {
            ModernUI.showLoading(btnSimular);
            btnSimular.textContent = 'Simulando...';
        }

        try {
            const resultado = originalSimular.call(this, dados);
            
            if (btnSimular) {
                ModernUI.hideLoading(btnSimular);
                btnSimular.textContent = '🚀 Simular Split Payment';
            }

            ModernUI.showNotification('Simulação concluída com sucesso!', 'success');
            return resultado;
            
        } catch (error) {
            if (btnSimular) {
                ModernUI.hideLoading(btnSimular);
                btnSimular.textContent = '🚀 Simular Split Payment';
            }
            
            ModernUI.showNotification('Erro na simulação: ' + error.message, 'error');
            throw error;
        }
    };
}

// ===== THEME SWITCHER (BONUS) ===== //
const ThemeSwitcher = {
    init() {
        this.createToggle();
        this.loadTheme();
    },

    createToggle() {
        const toggle = document.createElement('button');
        toggle.id = 'theme-toggle';
        toggle.innerHTML = '🌙';
        toggle.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: var(--primary-gradient);
            color: white;
            border: none;
            font-size: 20px;
            cursor: pointer;
            box-shadow: var(--shadow-lg);
            z-index: 9998;
            transition: all var(--transition-normal);
        `;

        toggle.addEventListener('click', () => this.toggleTheme());
        document.body.appendChild(toggle);
    },

    toggleTheme() {
        const isDark = document.body.classList.toggle('dark-theme');
        const toggle = document.getElementById('theme-toggle');
        
        toggle.innerHTML = isDark ? '☀️' : '🌙';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        if (isDark) {
            this.applyDarkTheme();
        } else {
            this.removeDarkTheme();
        }
    },

    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            document.getElementById('theme-toggle').innerHTML = '☀️';
            this.applyDarkTheme();
        }
    },

    applyDarkTheme() {
        const style = document.createElement('style');
        style.id = 'dark-theme-styles';
        style.textContent = `
            .dark-theme {
                --bg-primary: #1e293b;
                --bg-secondary: #334155;
                --bg-tertiary: #475569;
                --text-primary: #f8fafc;
                --text-secondary: #cbd5e1;
                --gray-200: #475569;
                --gray-300: #64748b;
            }
        `;
        document.head.appendChild(style);
    },

    removeDarkTheme() {
        const darkStyles = document.getElementById('dark-theme-styles');
        if (darkStyles) {
            darkStyles.remove();
        }
    }
};

// Inicializar theme switcher
document.addEventListener('DOMContentLoaded', () => {
    ThemeSwitcher.init();
});

// ===== PERFORMANCE MONITORING ===== //
const PerformanceMonitor = {
    init() {
        this.startTime = performance.now();
        this.logPerformance();
    },

    logPerformance() {
        window.addEventListener('load', () => {
            const loadTime = performance.now() - this.startTime;
            console.log(`🚀 UI Moderna carregada em ${loadTime.toFixed(2)}ms`);
            
            // Log de recursos carregados
            const resources = performance.getEntriesByType('resource');
            console.log(`📦 ${resources.length} recursos carregados`);
        });
    }
};

PerformanceMonitor.init();