// ===== ORQUESTRADOR DO SISTEMA MODERNO ===== //
// Arquivo: js/ui/system-orchestrator.js

const SystemOrchestrator = (function() {
    'use strict';

    // ===== CONFIGURAÇÕES GLOBAIS ===== //
    const config = {
        version: '2.0.0',
        debugMode: false,
        performanceMonitoring: true,
        autoInit: true,
        systems: {
            modernUI: true,
            advancedInteractions: true,
            themeSystem: true,
            enhancedCharts: true,
            dashboardSystem: true
        }
    };

    // ===== STATUS DOS SISTEMAS ===== //
    let systemStatus = {
        modernUI: false,
        advancedInteractions: false,
        themeSystem: false,
        enhancedCharts: false,
        dashboardSystem: false,
        legacy: false
    };

    let initializationOrder = [];
    let startTime = performance.now();

    // ===== VERIFICAÇÃO DE DEPENDÊNCIAS ===== //
    function checkDependencies() {
        const dependencies = {
            jquery: typeof $ !== 'undefined',
            chartjs: typeof Chart !== 'undefined',
            modernUI: typeof ModernUI !== 'undefined',
            advancedInteractions: typeof AdvancedInteractions !== 'undefined',
            themeSystem: typeof ThemeSystem !== 'undefined',
            enhancedCharts: typeof EnhancedCharts !== 'undefined',
            dashboardSystem: typeof DashboardSystem !== 'undefined'
        };

        const missing = Object.keys(dependencies).filter(dep => !dependencies[dep]);
        
        if (missing.length > 0) {
            console.warn('🚨 Dependências ausentes:', missing);
        }

        return { dependencies, missing };
    }

    // ===== SISTEMA DE INICIALIZAÇÃO SEQUENCIAL ===== //
    async function initializeSystem(systemName, initFunction, dependencies = []) {
        try {
            // Verificar dependências
            const missingDeps = dependencies.filter(dep => !systemStatus[dep]);
            if (missingDeps.length > 0) {
                throw new Error(`Dependências não atendidas: ${missingDeps.join(', ')}`);
            }

            console.log(`🚀 Inicializando ${systemName}...`);
            const systemStartTime = performance.now();

            // Executar inicialização
            if (typeof initFunction === 'function') {
                await initFunction();
            }

            const systemEndTime = performance.now();
            const systemTime = systemEndTime - systemStartTime;

            systemStatus[systemName] = true;
            initializationOrder.push({
                system: systemName,
                time: systemTime,
                timestamp: Date.now()
            });

            console.log(`✅ ${systemName} inicializado em ${systemTime.toFixed(2)}ms`);
            
            // Notificar sucesso
            if (window.ModernUI && systemName !== 'modernUI') {
                window.ModernUI.showNotification(`Sistema ${systemName} carregado`, 'success', 1500);
            }

        } catch (error) {
            console.error(`❌ Erro ao inicializar ${systemName}:`, error);
            systemStatus[systemName] = false;
            
            if (window.ModernUI) {
                window.ModernUI.showNotification(`Erro no sistema ${systemName}`, 'error', 3000);
            }
        }
    }

    // ===== INTEGRAÇÃO COM SISTEMAS LEGADOS ===== //
    function integrateLegacySystems() {
        console.log('🔗 Integrando sistemas legados...');

        // Integração com SimuladorFluxoCaixa existente
        if (window.SimuladorFluxoCaixa) {
            const originalSimular = window.SimuladorFluxoCaixa.simular;
            
            window.SimuladorFluxoCaixa.simular = function(dados) {
                // Notificar início da simulação
                if (window.ModernUI) {
                    window.ModernUI.showNotification('Iniciando simulação...', 'info', 2000);
                }

                // Atualizar status no dashboard
                if (window.DashboardSystem) {
                    updateDashboardStatus('simulating');
                }

                try {
                    const resultado = originalSimular.call(this, dados);
                    
                    // Atualizar dashboard com resultados
                    if (window.DashboardSystem && resultado) {
                        const dashboardData = transformResultadoParaDashboard(resultado);
                        window.DashboardSystem.updateDashboardData(dashboardData);
                    }

                    // Notificar sucesso
                    if (window.ModernUI) {
                        window.ModernUI.showNotification('Simulação concluída com sucesso!', 'success', 3000);
                    }

                    return resultado;
                    
                } catch (error) {
                    // Notificar erro
                    if (window.ModernUI) {
                        window.ModernUI.showNotification('Erro na simulação: ' + error.message, 'error', 5000);
                    }
                    
                    updateDashboardStatus('error');
                    throw error;
                }
            };
        }

        // Integração com TabsManager existente
        if (window.TabsManager) {
            const originalSwitchTab = window.TabsManager.switchTab;
            
            window.TabsManager.switchTab = function(tabId) {
                // Aplicar animação de transição
                if (window.ModernUI) {
                    const tabContent = document.getElementById(tabId);
                    if (tabContent) {
                        window.ModernUI.smoothTransition(tabContent, () => {
                            originalSwitchTab.call(this, tabId);
                        });
                    } else {
                        originalSwitchTab.call(this, tabId);
                    }
                } else {
                    originalSwitchTab.call(this, tabId);
                }
            };
        }

        // Integração com exportadores existentes
        if (window.DocumentExporters) {
            const originalExportarPDF = window.DocumentExporters.exportarPDF;
            
            window.DocumentExporters.exportarPDF = function(dados) {
                if (window.ModernUI) {
                    window.ModernUI.showLoading(document.getElementById('btn-exportar-pdf'));
                }

                return originalExportarPDF.call(this, dados).finally(() => {
                    if (window.ModernUI) {
                        window.ModernUI.hideLoading(document.getElementById('btn-exportar-pdf'));
                    }
                });
            };
        }

        systemStatus.legacy = true;
        console.log('✅ Sistemas legados integrados');
    }

    // ===== TRANSFORMAÇÃO DE DADOS ===== //
    function transformResultadoParaDashboard(resultado) {
        return {
            kpiFaturamento: {
                value: resultado.faturamento || 0,
                previousValue: resultado.faturamentoAnterior || 0,
                subtitle: 'Faturamento base da simulação'
            },
            kpiMargem: {
                value: resultado.margemAtual || 0,
                previousValue: resultado.margemAnterior || 0,
                subtitle: 'Margem operacional atual'
            },
            kpiCapitalGiro: {
                value: resultado.capitalGiroAtual || 0,
                previousValue: resultado.capitalGiroAnterior || 0,
                subtitle: 'Necessidade atual de capital'
            },
            kpiImpactoSplit: {
                value: resultado.impactoSplit || 0,
                previousValue: 0,
                subtitle: 'Impacto estimado do Split Payment'
            }
        };
    }

    function updateDashboardStatus(status) {
        const statusElement = document.getElementById('dashboard-status');
        if (statusElement) {
            const indicator = statusElement.querySelector('.status-indicator');
            const text = statusElement.querySelector('span:last-child') || statusElement;
            
            switch (status) {
                case 'simulating':
                    indicator.className = 'status-indicator warning';
                    text.textContent = 'Simulando...';
                    break;
                case 'error':
                    indicator.className = 'status-indicator error';
                    text.textContent = 'Erro no Sistema';
                    break;
                default:
                    indicator.className = 'status-indicator active';
                    text.textContent = 'Sistema Online';
            }
        }
    }

    // ===== SISTEMA DE EVENTOS GLOBAIS ===== //
    function setupGlobalEvents() {
        // Event listeners para comunicação entre sistemas
        window.addEventListener('themeChanged', (e) => {
            console.log('🎨 Tema alterado:', e.detail.theme);
            
            // Atualizar gráficos
            if (window.EnhancedCharts && typeof window.EnhancedCharts.updateChartsTheme === 'function') {
                window.EnhancedCharts.updateChartsTheme(e.detail.config);
            }
            
            // Atualizar dashboard
            if (window.DashboardSystem) {
                // Dashboard se adapta automaticamente via CSS
            }
        });

        window.addEventListener('simulacaoCompleta', (e) => {
            console.log('📊 Simulação completa:', e.detail);
            
            // Atualizar dashboard
            if (window.DashboardSystem && e.detail.resultado) {
                const dashboardData = transformResultadoParaDashboard(e.detail.resultado);
                window.DashboardSystem.updateDashboardData(dashboardData);
            }
        });

        window.addEventListener('beforeunload', () => {
            // Salvar estado dos sistemas
            if (window.AdvancedInteractions && window.AdvancedInteractions.AutoSave) {
                window.AdvancedInteractions.AutoSave.saveCurrentState();
            }
        });

        // Error handling global
        window.addEventListener('error', (e) => {
            console.error('🚨 Erro global capturado:', e.error);
            
            if (window.ModernUI) {
                window.ModernUI.showNotification('Erro inesperado detectado', 'error', 5000);
            }
        });
    }

    // ===== SISTEMA DE SAÚDE E MONITORAMENTO ===== //
    function setupHealthMonitoring() {
        if (!config.performanceMonitoring) return;

        setInterval(() => {
            const health = {
                systems: systemStatus,
                performance: {
                    memory: performance.memory ? {
                        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
                    } : null,
                    timing: performance.now() - startTime
                },
                errors: window.errorCount || 0
            };

            if (config.debugMode) {
                console.log('🔍 Health Check:', health);
            }

            // Alertar se há problemas de performance
            if (health.performance.memory && health.performance.memory.used > 100) {
                console.warn('⚠️ Alto uso de memória detectado');
            }

        }, 30000); // Check a cada 30 segundos
    }

    // ===== UTILITÁRIOS DE DIAGNÓSTICO ===== //
    function runDiagnostics() {
        console.group('🔧 Diagnóstico do Sistema');
        
        // Status dos sistemas
        console.log('📊 Status dos Sistemas:', systemStatus);
        
        // Ordem de inicialização
        console.log('🚀 Ordem de Inicialização:', initializationOrder);
        
        // Dependências
        const deps = checkDependencies();
        console.log('📦 Dependências:', deps);
        
        // Performance
        const totalTime = performance.now() - startTime;
        console.log('⏱️ Tempo Total de Inicialização:', totalTime.toFixed(2) + 'ms');
        
        // Elementos DOM críticos
        const criticalElements = [
            'btn-simular',
            'dashboard-container',
            'theme-selector',
            'chart-container'
        ];
        
        const missingElements = criticalElements.filter(id => !document.getElementById(id));
        if (missingElements.length > 0) {
            console.warn('🚨 Elementos DOM ausentes:', missingElements);
        }
        
        console.groupEnd();
        
        return {
            systems: systemStatus,
            initialization: initializationOrder,
            dependencies: deps,
            performance: totalTime,
            missingElements
        };
    }

    // ===== INTERFACE DE CONTROLE ===== //
    function createControlPanel() {
        if (!config.debugMode) return;

        const panel = document.createElement('div');
        panel.id = 'system-control-panel';
        panel.innerHTML = `
            <div class="control-panel">
                <div class="panel-header">
                    <h3>🔧 Painel de Controle</h3>
                    <button onclick="toggleControlPanel()">×</button>
                </div>
                <div class="panel-content">
                    <button onclick="SystemOrchestrator.runDiagnostics()">🔍 Diagnóstico</button>
                    <button onclick="SystemOrchestrator.restartSystems()">🔄 Reiniciar</button>
                    <button onclick="SystemOrchestrator.exportLogs()">📋 Exportar Logs</button>
                </div>
            </div>
        `;

        panel.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 10000;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            border: 1px solid #ddd;
            display: none;
        `;

        document.body.appendChild(panel);

        // Atalho para mostrar/ocultar (Ctrl+Shift+D)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }
        });
    }

    // ===== INICIALIZAÇÃO PRINCIPAL ===== //
    async function initialize() {
        console.log('🚀 Iniciando Sistema Moderno CapitalFlow Pro v' + config.version);
        startTime = performance.now();

        try {
            // Verificar dependências
            const deps = checkDependencies();
            if (deps.missing.length > 0) {
                console.warn('⚠️ Algumas dependências estão ausentes, continuando...');
            }

            // Inicializar sistemas na ordem correta
            await initializeSystem('modernUI', () => {
                if (window.ModernUI) return window.ModernUI.init();
            });

            await initializeSystem('advancedInteractions', () => {
                if (window.AdvancedInteractions) return window.AdvancedInteractions.init();
            }, ['modernUI']);

            await initializeSystem('themeSystem', () => {
                if (window.ThemeSystem) return window.ThemeSystem.init();
            }, ['modernUI']);

            await initializeSystem('enhancedCharts', () => {
                if (window.EnhancedCharts) return window.EnhancedCharts.init();
            });

            await initializeSystem('dashboardSystem', () => {
                if (window.DashboardSystem) return window.DashboardSystem.init();
            }, ['modernUI', 'enhancedCharts']);

            // Integrar sistemas legados
            integrateLegacySystems();

            // Configurar eventos globais
            setupGlobalEvents();

            // Monitoramento de saúde
            setupHealthMonitoring();

            // Painel de controle (se debug ativo)
            createControlPanel();

            const totalTime = performance.now() - startTime;
            console.log(`🎉 Sistema Moderno inicializado com sucesso em ${totalTime.toFixed(2)}ms`);

            // Notificação de sucesso
            if (window.ModernUI) {
                setTimeout(() => {
                    window.ModernUI.showNotification(
                        `CapitalFlow Pro v${config.version} carregado com sucesso!`, 
                        'success', 
                        3000
                    );
                }, 1000);
            }

        } catch (error) {
            console.error('💥 Erro crítico na inicialização:', error);
            
            // Fallback para modo compatibilidade
            console.log('🔧 Tentando modo de compatibilidade...');
            document.body.classList.add('fallback-mode');
        }
    }

    // ===== FUNÇÕES EXPOSTAS GLOBALMENTE ===== //
    window.toggleControlPanel = function() {
        const panel = document.getElementById('system-control-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    };

    // ===== INTERFACE PÚBLICA ===== //
    return {
        version: config.version,
        init: initialize,
        getSystemStatus: () => systemStatus,
        getInitializationOrder: () => initializationOrder,
        runDiagnostics,
        config,
        
        // Funções de controle
        restartSystems: () => {
            location.reload();
        },
        
        exportLogs: () => {
            const logs = {
                systems: systemStatus,
                initialization: initializationOrder,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                performance: {
                    memory: performance.memory,
                    timing: performance.timing
                }
            };
            
            const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `capitalflow-logs-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        },
        
        // Debug helpers
        enableDebug: () => {
            config.debugMode = true;
            console.log('🔍 Modo debug ativado');
        },
        
        disableDebug: () => {
            config.debugMode = false;
            console.log('🔍 Modo debug desativado');
        }
    };
})();

// ===== INICIALIZAÇÃO AUTOMÁTICA ===== //
document.addEventListener('DOMContentLoaded', function() {
    if (SystemOrchestrator.config.autoInit) {
        // Aguardar um pouco para outros scripts carregarem
        setTimeout(() => {
            SystemOrchestrator.init();
        }, 100);
    }
});

// ===== EXPOSIÇÃO GLOBAL ===== //
window.SystemOrchestrator = SystemOrchestrator;

// ===== INFO DE VERSÃO ===== //
console.log(`
🎨 CapitalFlow Pro - Visual Moderno
📦 Versão: ${SystemOrchestrator.version}
🏢 Desenvolvido por: Expertzy Inteligência Tributária
🌟 Sistema de interface moderna para simulação de Split Payment
`);

// ===== COMPATIBILIDADE ===== //
// Garantir que o sistema funcione mesmo se alguns componentes não estiverem disponíveis
window.addEventListener('load', () => {
    // Verificação final de compatibilidade
    if (!document.querySelector('.modern-ui-loaded')) {
        console.warn('⚠️ Sistema moderno não foi totalmente carregado, usando modo compatibilidade');
        document.body.classList.add('compatibility-mode');
    }
});

// ===== EXPORT PARA MÓDULOS ===== //
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SystemOrchestrator;
}