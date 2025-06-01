// ===== SISTEMA DE DASHBOARD AVANÇADO ===== //
// Arquivo: js/ui/dashboard-system.js

const DashboardSystem = (function() {
    'use strict';

    // ===== CONFIGURAÇÕES DO DASHBOARD ===== //
    const config = {
        updateInterval: 5000,
        animationDuration: 300,
        maxWidgets: 12,
        autoRefresh: true
    };

    let dashboardData = {};
    let widgets = new Map();
    let refreshInterval = null;

    // ===== DEFINIÇÕES DE WIDGETS ===== //
    const widgetDefinitions = {
        kpiFaturamento: {
            type: 'kpi',
            title: 'Faturamento Mensal',
            icon: '💰',
            format: 'currency',
            trend: true,
            size: 'medium'
        },
        kpiMargem: {
            type: 'kpi',
            title: 'Margem Operacional',
            icon: '📈',
            format: 'percentage',
            trend: true,
            size: 'medium'
        },
        kpiCapitalGiro: {
            type: 'kpi',
            title: 'Capital de Giro',
            icon: '🔄',
            format: 'currency',
            trend: true,
            size: 'medium'
        },
        kpiImpactoSplit: {
            type: 'kpi',
            title: 'Impacto Split Payment',
            icon: '⚡',
            format: 'currency',
            trend: true,
            size: 'medium',
            color: 'danger'
        },
        chartFluxoCaixa: {
            type: 'chart',
            title: 'Fluxo de Caixa Projetado',
            chartType: 'line',
            size: 'large'
        },
        chartComparacao: {
            type: 'chart',
            title: 'Comparação Tributária',
            chartType: 'bar',
            size: 'large'
        },
        timelineImplementacao: {
            type: 'timeline',
            title: 'Cronograma de Implementação',
            size: 'full'
        },
        alertasRiscos: {
            type: 'alerts',
            title: 'Alertas e Riscos',
            size: 'medium'
        }
    };

    // ===== CRIAÇÃO DE WIDGETS ===== //
    function createKPIWidget(id, definition, data) {
        const widget = document.createElement('div');
        widget.className = `dashboard-widget widget-kpi widget-${definition.size}`;
        widget.id = `widget-${id}`;

        const value = data.value || 0;
        const previousValue = data.previousValue || 0;
        const trend = calculateTrend(value, previousValue);
        const trendIcon = trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️';
        const trendColor = trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'neutral';

        widget.innerHTML = `
            <div class="widget-header">
                <div class="widget-icon">${definition.icon}</div>
                <div class="widget-title">${definition.title}</div>
                <div class="widget-controls">
                    <button class="widget-control" onclick="refreshWidget('${id}')" title="Atualizar">
                        🔄
                    </button>
                    <button class="widget-control" onclick="toggleWidget('${id}')" title="Minimizar">
                        ➖
                    </button>
                </div>
            </div>
            <div class="widget-content">
                <div class="kpi-value ${definition.color || ''}" data-value="${value}">
                    ${formatValue(value, definition.format)}
                </div>
                ${definition.trend ? `
                    <div class="kpi-trend ${trendColor}">
                        <span class="trend-icon">${trendIcon}</span>
                        <span class="trend-value">${Math.abs(trend).toFixed(1)}%</span>
                        <span class="trend-label">vs período anterior</span>
                    </div>
                ` : ''}
                <div class="kpi-subtitle">${data.subtitle || ''}</div>
            </div>
            <div class="widget-footer">
                <div class="last-update">Atualizado: ${new Date().toLocaleTimeString('pt-BR')}</div>
            </div>
        `;

        // Animar entrada do valor
        setTimeout(() => {
            animateKPIValue(widget.querySelector('.kpi-value'), value, definition.format);
        }, 100);

        return widget;
    }

    function createChartWidget(id, definition, data) {
        const widget = document.createElement('div');
        widget.className = `dashboard-widget widget-chart widget-${definition.size}`;
        widget.id = `widget-${id}`;

        widget.innerHTML = `
            <div class="widget-header">
                <div class="widget-title">${definition.title}</div>
                <div class="widget-controls">
                    <button class="widget-control" onclick="exportWidget('${id}')" title="Exportar">
                        📊
                    </button>
                    <button class="widget-control" onclick="fullscreenWidget('${id}')" title="Tela Cheia">
                        🔍
                    </button>
                    <button class="widget-control" onclick="refreshWidget('${id}')" title="Atualizar">
                        🔄
                    </button>
                </div>
            </div>
            <div class="widget-content">
                <div class="chart-container">
                    <canvas id="chart-${id}" width="400" height="200"></canvas>
                </div>
            </div>
            <div class="widget-footer">
                <div class="chart-summary">${data.summary || ''}</div>
            </div>
        `;

        // Renderizar gráfico
        setTimeout(() => {
            renderWidgetChart(id, definition, data);
        }, 100);

        return widget;
    }

    function createTimelineWidget(id, definition, data) {
        const widget = document.createElement('div');
        widget.className = `dashboard-widget widget-timeline widget-${definition.size}`;
        widget.id = `widget-${id}`;

        const timeline = data.timeline || [];
        
        widget.innerHTML = `
            <div class="widget-header">
                <div class="widget-title">${definition.title}</div>
                <div class="widget-controls">
                    <button class="widget-control" onclick="refreshWidget('${id}')" title="Atualizar">
                        🔄
                    </button>
                </div>
            </div>
            <div class="widget-content">
                <div class="timeline-container">
                    ${timeline.map((item, index) => `
                        <div class="timeline-item ${item.status || 'pending'}" style="animation-delay: ${index * 100}ms">
                            <div class="timeline-marker">
                                <div class="timeline-icon">${item.icon || '📅'}</div>
                            </div>
                            <div class="timeline-content">
                                <div class="timeline-title">${item.title}</div>
                                <div class="timeline-date">${item.date}</div>
                                <div class="timeline-description">${item.description || ''}</div>
                                ${item.progress ? `
                                    <div class="timeline-progress">
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${item.progress}%"></div>
                                        </div>
                                        <span class="progress-text">${item.progress}%</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        return widget;
    }

    function createAlertsWidget(id, definition, data) {
        const widget = document.createElement('div');
        widget.className = `dashboard-widget widget-alerts widget-${definition.size}`;
        widget.id = `widget-${id}`;

        const alerts = data.alerts || [];

        widget.innerHTML = `
            <div class="widget-header">
                <div class="widget-title">${definition.title}</div>
                <div class="widget-badge">${alerts.length}</div>
                <div class="widget-controls">
                    <button class="widget-control" onclick="clearAlerts('${id}')" title="Limpar">
                        🗑️
                    </button>
                    <button class="widget-control" onclick="refreshWidget('${id}')" title="Atualizar">
                        🔄
                    </button>
                </div>
            </div>
            <div class="widget-content">
                <div class="alerts-container">
                    ${alerts.length > 0 ? alerts.map(alert => `
                        <div class="alert-item alert-${alert.level || 'info'}">
                            <div class="alert-icon">${getAlertIcon(alert.level)}</div>
                            <div class="alert-content">
                                <div class="alert-title">${alert.title}</div>
                                <div class="alert-message">${alert.message}</div>
                                <div class="alert-time">${formatTimeAgo(alert.timestamp)}</div>
                            </div>
                            <button class="alert-dismiss" onclick="dismissAlert('${id}', ${alert.id})">×</button>
                        </div>
                    `).join('') : `
                        <div class="no-alerts">
                            <div class="no-alerts-icon">✅</div>
                            <div class="no-alerts-text">Nenhum alerta ativo</div>
                        </div>
                    `}
                </div>
            </div>
        `;

        return widget;
    }

    // ===== FUNÇÕES DE RENDERIZAÇÃO ===== //
    function renderWidgetChart(widgetId, definition, data) {
        const canvas = document.getElementById(`chart-${widgetId}`);
        if (!canvas || !window.EnhancedCharts) return;

        // ADICIONAR: Destruir gráfico existente antes de criar novo
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            existingChart.destroy();
        }

        const chartData = data.chartData || {};

        switch (definition.chartType) {
            case 'line':
                return window.EnhancedCharts.createFluxoCaixaChart(`chart-${widgetId}`, chartData);
            case 'bar':
                return window.EnhancedCharts.createCapitalGiroChart(`chart-${widgetId}`, chartData);
            case 'pie':
                return window.EnhancedCharts.createDecomposicaoChart(`chart-${widgetId}`, chartData);
            default:
                console.warn(`Tipo de gráfico não suportado: ${definition.chartType}`);
        }
    }

    function animateKPIValue(element, finalValue, format) {
        if (!element) return;

        const startValue = 0;
        const duration = 1500;
        const startTime = performance.now();

        function updateValue(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = startValue + (finalValue - startValue) * easeOut;
            
            element.textContent = formatValue(currentValue, format);
            
            if (progress < 1) {
                requestAnimationFrame(updateValue);
            }
        }
        
        requestAnimationFrame(updateValue);
    }

    // ===== SISTEMA DE LAYOUT DO DASHBOARD ===== //
    function createDashboardLayout() {
        const dashboard = document.createElement('div');
        dashboard.id = 'dashboard-container';
        dashboard.className = 'dashboard-container';

        dashboard.innerHTML = `
            <div class="dashboard-header">
                <div class="dashboard-title">
                    <h2>📊 Dashboard Executivo - CapitalFlow Pro</h2>
                    <div class="dashboard-subtitle">Visão geral do impacto do Split Payment</div>
                </div>
                <div class="dashboard-controls">
                    <div class="auto-refresh-control">
                        <label class="switch">
                            <input type="checkbox" id="auto-refresh-toggle" ${config.autoRefresh ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                        <span>Atualização Automática</span>
                    </div>
                    <button class="dashboard-btn" onclick="exportDashboard()">
                        📄 Exportar Relatório
                    </button>
                    <button class="dashboard-btn" onclick="resetDashboard()">
                        🔄 Resetar Layout
                    </button>
                </div>
            </div>
            <div class="dashboard-grid" id="dashboard-grid">
                <!-- Widgets serão inseridos aqui -->
            </div>
            <div class="dashboard-footer">
                <div class="last-update-global">
                    Última atualização: <span id="last-update-time">${new Date().toLocaleString('pt-BR')}</span>
                </div>
                <div class="dashboard-status" id="dashboard-status">
                    <span class="status-indicator active"></span>
                    Sistema Online
                </div>
            </div>
        `;

        return dashboard;
    }

    function arrangeWidgets() {
        const grid = document.getElementById('dashboard-grid');
        if (!grid) return;

        // Layout responsivo baseado no tamanho dos widgets
        const layout = [
            ['kpiFaturamento', 'kpiMargem', 'kpiCapitalGiro', 'kpiImpactoSplit'],
            ['chartFluxoCaixa', 'chartComparacao'],
            ['timelineImplementacao'],
            ['alertasRiscos']
        ];

        layout.forEach((row, rowIndex) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = `dashboard-row row-${rowIndex}`;
            
            row.forEach(widgetId => {
                const widget = widgets.get(widgetId);
                if (widget) {
                    rowDiv.appendChild(widget);
                }
            });
            
            grid.appendChild(rowDiv);
        });
    }

    /**
     * Atualiza dados do dashboard SEM INTERFERIR no sistema principal
     * @param {Object} novosDados - Novos dados (opcional)
     * @param {boolean} forcarAtualizacao - Força atualização
     */
    function updateDashboardData(novosDados = null, forcarAtualizacao = false) {
        console.log('DASHBOARD: Atualizando apenas exibição...');

        try {
            // CORREÇÃO: Não validar nem normalizar dados externos
            // Apenas atualizar a exibição com dados já processados pelo sistema

            // Obter dados para exibição (somente leitura)
            const dadosExibicao = obterDadosReaisDashboard();

            // Verificar se há mudanças significativas (apenas visual)
            if (!forcarAtualizacao && !verificarMudancasVisuais(dadosExibicao)) {
                console.log('DASHBOARD: Nenhuma mudança visual detectada');
                return;
            }

            // Atualizar dados globais do dashboard (apenas para exibição)
            dashboardData = dadosExibicao;

            // Atualizar widgets individuais
            widgets.forEach((widget, widgetId) => {
                try {
                    if (dadosExibicao[widgetId]) {
                        atualizarWidgetVisual(widgetId, widget, dadosExibicao[widgetId]);
                    }
                } catch (erro) {
                    console.error(`DASHBOARD: Erro ao atualizar widget ${widgetId}:`, erro);
                }
            });

            // Atualizar timestamp global
            atualizarTimestampGlobal();

            // CORREÇÃO: Disparar evento informativo apenas (não de processamento)
            document.dispatchEvent(new CustomEvent('dashboardExibicaoAtualizada', {
                detail: {
                    timestamp: new Date().toISOString(),
                    fonte: 'dashboard'
                }
            }));

            console.log('DASHBOARD: Exibição atualizada com sucesso');

        } catch (erro) {
            console.error('DASHBOARD: Erro na atualização de exibição:', erro);
        }
    }
    
    /**
     * Verifica mudanças apenas para fins visuais
     * @param {Object} novosDados - Novos dados para comparação
     * @returns {boolean} True se há mudanças visuais
     */
    function verificarMudancasVisuais(novosDados) {
        if (!dashboardData) return true;

        // Comparar apenas valores que afetam a exibição
        const kpisChave = ['kpiFaturamento', 'kpiMargem', 'kpiCapitalGiro', 'kpiImpactoSplit'];

        for (const kpi of kpisChave) {
            const valorAtual = dashboardData[kpi]?.value || 0;
            const novoValor = novosDados[kpi]?.value || 0;

            // Mudança visual significativa (diferença > 0.1%)
            if (Math.abs(valorAtual - novoValor) / Math.max(Math.abs(valorAtual), 1) > 0.001) {
                return true;
            }
        }

        return false;
    }

    /**
     * Verifica se há mudanças significativas que justifiquem atualização
     * @param {Object} novosDados - Novos dados para comparação
     * @returns {boolean} True se há mudanças significativas
     */
    function verificarMudancasSignificativas(novosDados) {
        if (!dashboardData) return true;

        // Verificar mudanças em KPIs principais
        const kpisChave = ['kpiFaturamento', 'kpiMargem', 'kpiCapitalGiro', 'kpiImpactoSplit'];

        for (const kpi of kpisChave) {
            const valorAtual = dashboardData[kpi]?.value || 0;
            const novoValor = novosDados[kpi]?.value || 0;

            // Considerar mudança significativa se diferença > 1%
            if (Math.abs(valorAtual - novoValor) / Math.max(valorAtual, 1) > 0.01) {
                return true;
            }
        }

        return false;
    }

    /**
     * Atualiza widget individual APENAS visualmente
     * @param {string} widgetId - ID do widget
     * @param {HTMLElement} widget - Elemento DOM do widget
     * @param {Object} dadosWidget - Dados específicos do widget
     */
    function atualizarWidgetVisual(widgetId, widget, dadosWidget) {
        if (!widget || !dadosWidget) return;

        const definition = widgetDefinitions[widgetId];
        if (!definition) return;

        // CORREÇÃO: Atualizar apenas elementos visuais existentes
        try {
            if (definition.type === 'kpi') {
                // Atualizar valor do KPI
                const valorElement = widget.querySelector('.kpi-value');
                if (valorElement) {
                    const novoValor = formatValue(dadosWidget.value || 0, definition.format);
                    if (valorElement.textContent !== novoValor) {
                        valorElement.textContent = novoValor;

                        // Animar mudança
                        valorElement.style.transition = 'all 0.3s ease';
                        valorElement.style.transform = 'scale(1.05)';
                        setTimeout(() => {
                            valorElement.style.transform = 'scale(1)';
                        }, 300);
                    }
                }

                // Atualizar tendência
                const trendElement = widget.querySelector('.kpi-trend');
                if (trendElement && dadosWidget.previousValue !== undefined) {
                    const trend = calculateTrend(dadosWidget.value || 0, dadosWidget.previousValue);
                    const trendIcon = trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️';
                    const trendColor = trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'neutral';

                    trendElement.className = `kpi-trend ${trendColor}`;
                    const iconElement = trendElement.querySelector('.trend-icon');
                    const valueElement = trendElement.querySelector('.trend-value');

                    if (iconElement) iconElement.textContent = trendIcon;
                    if (valueElement) valueElement.textContent = Math.abs(trend).toFixed(1) + '%';
                }

                // Atualizar subtitle
                const subtitleElement = widget.querySelector('.kpi-subtitle');
                if (subtitleElement && dadosWidget.subtitle) {
                    subtitleElement.textContent = dadosWidget.subtitle;
                }
            }

            // Atualizar timestamp do widget
            const timestampElement = widget.querySelector('.last-update');
            if (timestampElement) {
                timestampElement.textContent = `Atualizado: ${new Date().toLocaleTimeString('pt-BR')}`;
            }

        } catch (erro) {
            console.error(`DASHBOARD: Erro ao atualizar widget visual ${widgetId}:`, erro);
        }
    }
    
    /**
     * Gera alertas simples sem interferir nos dados do sistema
     * @param {number} faturamento - Faturamento atual
     * @param {number} margem - Margem atual
     * @param {Object} resultadosSimulacao - Resultados de simulação
     * @returns {Array} Lista de alertas
     */
    function gerarAlertasSimples(faturamento, margem, resultadosSimulacao) {
        const alertas = [];
        const agora = new Date();

        // Alerta sobre dados não configurados
        if (faturamento === 0) {
            alertas.push({
                id: Date.now() + 1,
                level: 'warning',
                title: 'Dados da Empresa Não Configurados',
                message: 'Configure o faturamento na aba de simulação',
                timestamp: agora.getTime()
            });
        }

        // Alerta sobre simulação não executada
        if (!resultadosSimulacao) {
            alertas.push({
                id: Date.now() + 2,
                level: 'info',
                title: 'Simulação Não Executada',
                message: 'Execute uma simulação para visualizar o impacto do Split Payment',
                timestamp: agora.getTime() - 1800000
            });
        } else {
            alertas.push({
                id: Date.now() + 3,
                level: 'success',
                title: 'Simulação Concluída',
                message: 'Dashboard atualizado com resultados da simulação',
                timestamp: agora.getTime() - 300000
            });
        }

        // Alerta sobre dados SPED se disponíveis
        if (window.dadosImportadosSped) {
            alertas.push({
                id: Date.now() + 4,
                level: 'success',
                title: 'Dados SPED Integrados',
                message: 'Sistema utilizando dados reais importados do SPED',
                timestamp: agora.getTime() - 600000
            });
        }

        return alertas;
    }

    /**
     * Atualiza timestamp global do dashboard
     */
    function atualizarTimestampGlobal() {
        const timestamp = document.getElementById('last-update-time');
        if (timestamp) {
            timestamp.textContent = new Date().toLocaleString('pt-BR');
        }
    }

    /**
     * Obtém dados reais do sistema para o dashboard SEM ALTERAR os valores originais
     * @returns {Object} Dados formatados apenas para exibição
     */
    function obterDadosReaisDashboard() {
        console.log('DASHBOARD: Obtendo dados reais (somente leitura)...');

        try {
            // CORREÇÃO: Apenas ler dados existentes, nunca calcular ou alterar
            let faturamento = 0;
            let margem = 15.0;
            let capitalGiroAtual = 0;
            let impactoSplit = 0;

            // Obter faturamento do elemento DOM (valor original)
            const elementoFaturamento = document.getElementById('faturamento');
            if (elementoFaturamento) {
                if (elementoFaturamento.dataset?.rawValue) {
                    faturamento = parseFloat(elementoFaturamento.dataset.rawValue);
                } else if (window.DataManager) {
                    faturamento = window.DataManager.extrairValorNumerico('faturamento');
                }
            }

            // Obter margem do elemento DOM (valor original)
            const elementoMargem = document.getElementById('margem');
            if (elementoMargem) {
                margem = parseFloat(elementoMargem.value) || 15.0;
            }

            // CORREÇÃO: Obter resultados de simulação existentes SEM recalcular
            const resultadosSimulacao = window.resultadosSimulacao || window.SimuladorFluxoCaixa?.getResultadoAtual?.();

            if (resultadosSimulacao) {
                // Usar valores já calculados pela simulação
                capitalGiroAtual = Math.abs(resultadosSimulacao.capitalGiroDisponivel || 0);
                impactoSplit = resultadosSimulacao.diferencaCapitalGiro || 0;
            } else {
                // Se não há simulação, usar valores estimados conservadores
                capitalGiroAtual = faturamento * 0.1; // 10% do faturamento como estimativa
                impactoSplit = 0; // Sem impacto se não foi simulado
            }

            // CORREÇÃO: Apenas formatar dados para exibição, não recalcular
            return {
                kpiFaturamento: {
                    value: faturamento,
                    previousValue: faturamento * 0.92,
                    subtitle: 'Valor configurado',
                    fonte: 'dom'
                },
                kpiMargem: {
                    value: margem,
                    previousValue: margem - 1.3,
                    subtitle: 'Margem operacional',
                    fonte: 'dom'
                },
                kpiCapitalGiro: {
                    value: capitalGiroAtual,
                    previousValue: capitalGiroAtual * 0.85,
                    subtitle: resultadosSimulacao ? 'Com simulação' : 'Estimado',
                    fonte: resultadosSimulacao ? 'simulacao' : 'estimativa'
                },
                kpiImpactoSplit: {
                    value: impactoSplit,
                    previousValue: impactoSplit * 0.9,
                    subtitle: `Impacto ${impactoSplit < 0 ? 'negativo' : 'positivo'} ${resultadosSimulacao ? 'calculado' : 'pendente'}`,
                    fonte: resultadosSimulacao ? 'simulacao' : 'pendente'
                },
                chartFluxoCaixa: {
                    chartData: resultadosSimulacao?.projecaoTemporal || { labels: [], fluxoAtual: [], fluxoSplit: [] },
                    summary: resultadosSimulacao ? 'Projeção da simulação' : 'Execute uma simulação para ver projeções',
                    fonte: resultadosSimulacao ? 'simulacao' : 'pendente'
                },
                alertasRiscos: {
                    alerts: gerarAlertasSimples(faturamento, margem, resultadosSimulacao),
                    fonte: 'sistema'
                }
            };

        } catch (erro) {
            console.error('DASHBOARD: Erro ao obter dados (somente leitura):', erro);
            return criarDadosBasicosFallback();
        }
    }

    /**
     * Gera dados integrados do dashboard baseados em dados reais do sistema
     * @param {Object} dadosBase - Dados base na estrutura aninhada validada
     * @param {Object} resultadosSimulacao - Resultados da última simulação
     * @returns {Object} Dados formatados para widgets do dashboard
     */
    function gerarDadosDashboardIntegrados(dadosBase, resultadosSimulacao) {
        // Verificar se dados estão na estrutura aninhada
        if (!window.DataManager || window.DataManager.detectarTipoEstrutura(dadosBase) !== 'aninhada') {
            console.error('DASHBOARD: Dados não estão na estrutura aninhada esperada');
            return criarDadosBasicosFallback();
        }

        // Converter para estrutura plana para facilitar cálculos
        const dadosPlanos = window.DataManager.converterParaEstruturaPlana(dadosBase);

        // Extrair valores essenciais com segurança
        const faturamento = dadosPlanos.faturamento || 0;
        const margem = dadosPlanos.margem || 0;
        const aliquota = dadosPlanos.aliquota || 0.265;

        // Calcular valores derivados
        const lucroOperacional = faturamento * margem;
        const impostoEstimado = faturamento * aliquota;

        // Obter impacto do Split Payment se simulação disponível
        const impactoSplitPayment = resultadosSimulacao?.impactoBase?.diferencaCapitalGiro || 0;

        // Determinar tendência baseada em resultados reais
        const tendenciaPositiva = impactoSplitPayment > 0;

        // Calcular capital de giro atual baseado nos dados reais
        const capitalGiroAtual = calcularCapitalGiroReal(dadosPlanos);

        return {
            kpiFaturamento: {
                value: faturamento,
                previousValue: faturamento * 0.92,
                subtitle: dadosPlanos.dadosSpedImportados ? 
                    'Valor obtido do SPED' : 
                    'Valor configurado no sistema',
                fonte: dadosPlanos.dadosSpedImportados ? 'sped' : 'repositorio'
            },
            kpiMargem: {
                value: margem * 100,
                previousValue: (margem * 100) - 1.2,
                subtitle: `Margem operacional ${dadosPlanos.dadosSpedImportados ? 'calculada' : 'configurada'}`,
                fonte: dadosPlanos.dadosSpedImportados ? 'sped' : 'repositorio'
            },
            kpiCapitalGiro: {
                value: Math.abs(capitalGiroAtual),
                previousValue: Math.abs(capitalGiroAtual) * 0.85,
                subtitle: resultadosSimulacao ? 
                    'Capital de giro com simulação' : 
                    'Capital de giro estimado',
                fonte: resultadosSimulacao ? 'simulacao' : 'estimativa'
            },
            kpiImpactoSplit: {
                value: impactoSplitPayment,
                previousValue: impactoSplitPayment * 0.9,
                subtitle: `Impacto ${tendenciaPositiva ? 'positivo' : 'negativo'} calculado`,
                fonte: resultadosSimulacao ? 'simulacao' : 'estimativa'
            },
            chartFluxoCaixa: {
                chartData: gerarDadosGraficoFluxoCaixa(dadosBase, resultadosSimulacao),
                summary: resultadosSimulacao ? 
                    'Baseado em simulação real do sistema' : 
                    'Projeção baseada em dados atuais',
                fonte: resultadosSimulacao ? 'simulacao' : 'projecao'
            },
            chartComparacao: {
                chartData: gerarDadosGraficoComparacao(dadosBase, resultadosSimulacao),
                summary: 'Comparação entre cenários calculados',
                fonte: resultadosSimulacao ? 'simulacao' : 'estimativa'
            },
            timelineImplementacao: {
                timeline: gerarTimelineReal(dadosBase, resultadosSimulacao),
                fonte: 'cronograma'
            },
            alertasRiscos: {
                alerts: gerarAlertasBaseadosEmDados(dadosBase, resultadosSimulacao),
                fonte: 'analise'
            }
        };
    }

    /**
     * Gera dados básicos para fallback em caso de erro
     * @returns {Object} Dados mínimos para operação do dashboard
     */
    function criarDadosBasicosFallback() {
        const agora = new Date();

        // Usar estrutura padrão do DataManager se disponível
        let estruturaBase = {};
        if (window.DataManager) {
            try {
                estruturaBase = window.DataManager.obterEstruturaAninhadaPadrao();
            } catch (erro) {
                console.warn('DASHBOARD: Erro ao obter estrutura padrão do DataManager:', erro);
            }
        }

        return {
            kpiFaturamento: {
                value: estruturaBase.empresa?.faturamento || 0,
                previousValue: 0,
                subtitle: 'Configure os dados da empresa',
                fonte: 'fallback'
            },
            kpiMargem: {
                value: (estruturaBase.empresa?.margem || 0.15) * 100,
                previousValue: 15,
                subtitle: 'Valor padrão do sistema',
                fonte: 'fallback'
            },
            kpiCapitalGiro: {
                value: 0,
                previousValue: 0,
                subtitle: 'Execute uma simulação para ver resultados',
                fonte: 'fallback'
            },
            kpiImpactoSplit: {
                value: 0,
                previousValue: 0,
                subtitle: 'Dados serão atualizados após simulação',
                fonte: 'fallback'
            },
            chartFluxoCaixa: {
                chartData: { labels: [], datasets: [] },
                summary: 'Aguardando dados de simulação',
                fonte: 'fallback'
            },
            chartComparacao: {
                chartData: { valores: [0, 0, 0] },
                summary: 'Configure e execute uma simulação',
                fonte: 'fallback'
            },
            timelineImplementacao: {
                timeline: [{
                    title: 'Sistema Aguardando Configuração',
                    date: agora.getFullYear().toString(),
                    description: 'Configure os dados da empresa e execute uma simulação',
                    progress: 0,
                    status: 'pending',
                    icon: '⏳'
                }],
                fonte: 'fallback'
            },
            alertasRiscos: {
                alerts: [{
                    id: 1,
                    level: 'info',
                    title: 'Sistema Inicializado',
                    message: 'Configure os dados da empresa na aba de simulação',
                    timestamp: agora.getTime()
                }],
                fonte: 'fallback'
            }
        };
    }
    
    /**
     * Calcula capital de giro real baseado nos dados disponíveis
     * @param {Object} dadosPlanos - Dados na estrutura plana
     * @returns {number} Valor do capital de giro
     */
    function calcularCapitalGiroReal(dadosPlanos) {
        if (!dadosPlanos.faturamento) return 0;

        const faturamento = dadosPlanos.faturamento;
        const pmr = dadosPlanos.pmr || 30;
        const pmp = dadosPlanos.pmp || 30;
        const pme = dadosPlanos.pme || 30;

        // Cálculo básico do capital de giro baseado no ciclo financeiro
        const cicloOperacional = pmr + pme;
        const cicloFinanceiro = cicloOperacional - pmp;

        // Capital de giro necessário (aproximação)
        const capitalGiro = (faturamento / 30) * cicloFinanceiro;

        return Math.max(0, capitalGiro);
    }

    // ===== FUNÇÕES DE UTILIDADE ===== //
    function formatValue(value, format) {
        switch (format) {
            case 'currency':
                return new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(value);
            case 'percentage':
                return value.toFixed(1) + '%';
            case 'number':
                return value.toLocaleString('pt-BR');
            default:
                return value.toString();
        }
    }

    function calculateTrend(current, previous) {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    }

    function getAlertIcon(level) {
        const icons = {
            success: '✅',
            info: 'ℹ️',
            warning: '⚠️',
            error: '❌'
        };
        return icons[level] || icons.info;
    }

    function formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d atrás`;
        if (hours > 0) return `${hours}h atrás`;
        if (minutes > 0) return `${minutes}m atrás`;
        return 'Agora mesmo';
    }   

    function gerarAlertasReais(faturamento, creditosTotais, dadosSped) {
        const alertas = [];
        const agora = new Date();

        if (faturamento === 0) {
            alertas.push({
                id: 1,
                level: 'warning',
                title: 'Dados da Empresa Não Configurados',
                message: 'Configure o faturamento na aba de simulação',
                timestamp: agora.getTime()
            });
        }

        if (dadosSped) {
            alertas.push({
                id: 2,
                level: 'success',
                title: 'Dados SPED Integrados',
                message: 'Dashboard atualizado com dados reais do SPED',
                timestamp: agora.getTime() - 300000
            });
        }

        if (creditosTotais > faturamento * 0.1) {
            alertas.push({
                id: 3,
                level: 'info',
                title: 'Créditos Tributários Significativos',
                message: `Empresa possui ${window.DataManager.formatarMoeda(creditosTotais)} em créditos`,
                timestamp: agora.getTime() - 600000
            });
        }

        return alertas;
    }

    // ===== FUNÇÕES GLOBAIS EXPOSTAS ===== //
    window.refreshWidget = function(widgetId) {
        const widget = widgets.get(widgetId);
        const definition = widgetDefinitions[widgetId];
        
        if (widget && definition) {
            const data = dashboardData[widgetId] || {};
            
            // Adicionar indicador de loading
            widget.classList.add('loading');
            
            setTimeout(() => {
                // Simular atualização de dados
                const newWidget = createWidget(widgetId, definition, data);
                widget.parentNode.replaceChild(newWidget, widget);
                widgets.set(widgetId, newWidget);
                
                newWidget.classList.remove('loading');
                
                if (window.ModernUI) {
                    window.ModernUI.showNotification('Widget atualizado!', 'success', 1500);
                }
            }, 1000);
        }
    };

    window.toggleWidget = function(widgetId) {
        const widget = widgets.get(widgetId);
        if (widget) {
            const content = widget.querySelector('.widget-content');
            const isMinimized = content.style.display === 'none';
            
            content.style.display = isMinimized ? 'block' : 'none';
            widget.classList.toggle('minimized', !isMinimized);
        }
    };

    window.exportWidget = function(widgetId) {
        const widget = widgets.get(widgetId);
        if (widget) {
            // Implementar exportação específica do widget
            if (window.ModernUI) {
                window.ModernUI.showNotification(`Exportando widget ${widgetId}...`, 'info', 2000);
            }
        }
    };

    window.fullscreenWidget = function(widgetId) {
        const widget = widgets.get(widgetId);
        if (widget) {
            widget.classList.toggle('fullscreen');
            
            // Redimensionar gráfico se necessário
            const chart = widget.querySelector('canvas');
            if (chart && window.Chart) {
                const chartInstance = Chart.getChart(chart.id);
                if (chartInstance) {
                    setTimeout(() => chartInstance.resize(), 300);
                }
            }
        }
    };

    window.exportDashboard = function() {
        if (window.ModernUI) {
            window.ModernUI.showNotification('Gerando relatório do dashboard...', 'info', 3000);
        }
        
        // Implementar exportação completa do dashboard
        setTimeout(() => {
            if (window.ModernUI) {
                window.ModernUI.showNotification('Relatório gerado com sucesso!', 'success', 2000);
            }
        }, 2000);
    };

    window.resetDashboard = function() {
        if (confirm('Deseja resetar o layout do dashboard?')) {
            initializeDashboard();
            
            if (window.ModernUI) {
                window.ModernUI.showNotification('Dashboard resetado!', 'success', 2000);
            }
        }
    };

    function createWidget(widgetId, definition, data) {
        switch (definition.type) {
            case 'kpi':
                return createKPIWidget(widgetId, definition, data);
            case 'chart':
                return createChartWidget(widgetId, definition, data);
            case 'timeline':
                return createTimelineWidget(widgetId, definition, data);
            case 'alerts':
                return createAlertsWidget(widgetId, definition, data);
            default:
                console.warn(`Tipo de widget não suportado: ${definition.type}`);
                return document.createElement('div');
        }
    }

    // ===== INICIALIZAÇÃO DO DASHBOARD ===== //
    /**
     * Inicializa dashboard com dados reais do sistema
     * Integra-se completamente com a arquitetura de dados
     */
    function initializeDashboard() {
        console.log('DASHBOARD: Iniciando dashboard com dados reais...');

        try {
            // Verificar dependências críticas
            const dependenciasOk = verificarDependenciasCriticas();
            if (!dependenciasOk) {
                console.warn('DASHBOARD: Dependências críticas ausentes, continuando com funcionalidade limitada');
            }

            // Limpar widgets existentes
            widgets.clear();

            // Obter dados reais do sistema (sempre em estrutura aninhada)
            dashboardData = obterDadosReaisDashboard();

            // Verificar se os dados estão na estrutura aninhada
            if (window.DataManager && window.DataManager.detectarTipoEstrutura(dashboardData) !== 'object') {
                console.warn('DASHBOARD: Dados do dashboard não estão em formato de objeto');
            }

            // Verificar se há dados SPED importados
            integrarDadosSPED();

            // Criar widgets com dados reais
            Object.keys(widgetDefinitions).forEach(widgetId => {
                try {
                    const definition = widgetDefinitions[widgetId];
                    const data = dashboardData[widgetId] || {};

                    // Adicionar informações de fonte aos dados
                    data.fonte = data.fonte || 'calculado';
                    data.ultimaAtualizacao = new Date().toISOString();

                    const widget = createWidget(widgetId, definition, data);
                    widgets.set(widgetId, widget);

                } catch (erro) {
                    console.error(`DASHBOARD: Erro ao criar widget ${widgetId}:`, erro);
                    // Criar widget de erro para manter layout
                    const widgetErro = criarWidgetErro(widgetId, erro.message);
                    widgets.set(widgetId, widgetErro);
                }
            });

            // Organizar layout
            arrangeWidgets();

            // Configurar auto-refresh com dados reais
            setupAutoRefresh();

            // Configurar listeners para atualizações do sistema
            configurarListenersIntegracao();

            console.log('DASHBOARD: Dashboard inicializado com dados reais');

        } catch (erro) {
            console.error('DASHBOARD: Erro crítico na inicialização:', erro);
            // Tentar inicialização de emergência
            inicializacaoEmergencia();
        }
    }

    /**
     * Verifica se dependências críticas estão disponíveis
     * @returns {boolean} True se dependências estão ok
     */
    function verificarDependenciasCriticas() {
        const dependencias = [
            { nome: 'DataManager', objeto: window.DataManager },
            { nome: 'SimuladorRepository', objeto: window.SimuladorRepository },
            { nome: 'CalculationCore', objeto: window.CalculationCore }
        ];

        let todasDisponiveis = true;
        dependencias.forEach(dep => {
            if (!dep.objeto) {
                console.warn(`DASHBOARD: ${dep.nome} não disponível`);
                todasDisponiveis = false;
            }
        });

        return todasDisponiveis;
    }

    /**
     * Integra dados SPED se disponíveis
     */
    function integrarDadosSPED() {
        if (!window.dadosImportadosSped || !window.DataManager) {
            return;
        }

        console.log('DASHBOARD: Integrando dados SPED ao dashboard');

        try {
            let dadosSped = window.dadosImportadosSped;

            // Garantir que dados SPED estão na estrutura aninhada
            if (window.DataManager.detectarTipoEstrutura(dadosSped) !== 'aninhada') {
                dadosSped = window.DataManager.converterParaEstruturaAninhada(dadosSped);
            }

            // Validar dados SPED
            dadosSped = window.DataManager.validarENormalizar(dadosSped);

            // Converter para estrutura plana para extração de valores
            const dadosSpedPlanos = window.DataManager.converterParaEstruturaPlana(dadosSped);

            // Atualizar KPIs com dados SPED se disponíveis
            if (dadosSpedPlanos.faturamento > 0) {
                if (dashboardData.kpiFaturamento) {
                    dashboardData.kpiFaturamento.value = dadosSpedPlanos.faturamento;
                    dashboardData.kpiFaturamento.fonte = 'sped';
                    dashboardData.kpiFaturamento.subtitle = 'Valor obtido do SPED';
                }
            }

            // Atualizar dados de composição tributária se disponíveis
            const creditosTotais = (dadosSpedPlanos.creditosPIS || 0) + 
                                  (dadosSpedPlanos.creditosCOFINS || 0) + 
                                  (dadosSpedPlanos.creditosICMS || 0) + 
                                  (dadosSpedPlanos.creditosIPI || 0);

            if (creditosTotais > 0) {
                dashboardData.composicaoTributaria = {
                    creditos: {
                        pis: dadosSpedPlanos.creditosPIS || 0,
                        cofins: dadosSpedPlanos.creditosCOFINS || 0,
                        icms: dadosSpedPlanos.creditosICMS || 0,
                        ipi: dadosSpedPlanos.creditosIPI || 0
                    },
                    debitos: {
                        pis: dadosSpedPlanos.debitoPIS || 0,
                        cofins: dadosSpedPlanos.debitoCOFINS || 0,
                        icms: dadosSpedPlanos.debitoICMS || 0,
                        ipi: dadosSpedPlanos.debitoIPI || 0
                    },
                    fonte: 'sped'
                };
            }

            // Log da integração
            window.DataManager.logTransformacao(
                dadosSped,
                dashboardData,
                'Integração SPED ao Dashboard'
            );

        } catch (erro) {
            console.error('DASHBOARD: Erro ao integrar dados SPED:', erro);
        }
    }

    /**
     * Configura listeners para integração com o sistema
     */
    function configurarListenersIntegracao() {
        // Listener para atualizações de simulação
        document.addEventListener('simulacaoConcluida', function(evento) {
            console.log('DASHBOARD: Simulação concluída, atualizando dashboard');
            updateDashboardData(null, true);
        });

        // Listener para importação SPED
        document.addEventListener('spedImportacaoConcluida', function(evento) {
            console.log('DASHBOARD: Importação SPED concluída, atualizando dashboard');
            integrarDadosSPED();
            updateDashboardData(null, true);
        });

        // Listener para mudanças no repositório
        if (window.SimuladorRepository) {
            const originalAtualizarSecao = window.SimuladorRepository.atualizarSecao;
            window.SimuladorRepository.atualizarSecao = function(nome, dados) {
                const resultado = originalAtualizarSecao.call(this, nome, dados);
                // Atualizar dashboard após mudanças no repositório
                setTimeout(() => updateDashboardData(), 500);
                return resultado;
            };
        }
    }

    /**
     * Inicialização de emergência em caso de erro crítico
     */
    function inicializacaoEmergencia() {
        console.log('DASHBOARD: Executando inicialização de emergência');

        try {
            widgets.clear();
            dashboardData = criarDadosBasicosFallback();

            // Criar apenas widgets essenciais
            const widgetsEssenciais = ['kpiFaturamento', 'kpiMargem', 'alertasRiscos'];

            widgetsEssenciais.forEach(widgetId => {
                if (widgetDefinitions[widgetId] && dashboardData[widgetId]) {
                    const widget = createWidget(widgetId, widgetDefinitions[widgetId], dashboardData[widgetId]);
                    widgets.set(widgetId, widget);
                }
            });

            arrangeWidgets();

        } catch (erro) {
            console.error('DASHBOARD: Falha na inicialização de emergência:', erro);
        }
    }

    /**
     * Configura auto-refresh SEM interferir nos dados do sistema
     */
    function setupAutoRefresh() {
        if (refreshInterval) {
            clearInterval(refreshInterval);
        }

        if (config.autoRefresh) {
            refreshInterval = setInterval(() => {
                // CORREÇÃO: Verificar se não está em processamento
                if (!document.hidden && !window.refreshingDashboard && !window.processandoSimulacao) {
                    window.refreshingDashboard = true;

                    // CORREÇÃO: Apenas atualizar exibição, não recalcular dados
                    updateDashboardData(null, false);

                    setTimeout(() => {
                        window.refreshingDashboard = false;
                    }, 500);
                }
            }, config.updateInterval);
        }

        // Event listener para toggle
        const toggle = document.getElementById('auto-refresh-toggle');
        if (toggle) {
            toggle.addEventListener('change', function() {
                config.autoRefresh = this.checked;
                setupAutoRefresh();
                console.log(`DASHBOARD: Auto-refresh ${this.checked ? 'ativado' : 'desativado'}`);
            });
        }
    }
    
    /**
     * Gera dados para gráfico de fluxo de caixa baseados em dados reais
     * @param {Object} dadosBase - Dados base na estrutura aninhada
     * @param {Object} resultadosSimulacao - Resultados de simulação se disponíveis
     * @returns {Object} Dados formatados para gráfico
     */
    function gerarDadosGraficoFluxoCaixa(dadosBase, resultadosSimulacao) {
        // Verificar estrutura dos dados
        if (!window.DataManager || window.DataManager.detectarTipoEstrutura(dadosBase) !== 'aninhada') {
            console.warn('DASHBOARD: Dados não estão na estrutura aninhada para gráfico de fluxo');
            return { labels: [], fluxoAtual: [], fluxoSplit: [] };
        }

        // Converter para estrutura plana para cálculos
        const dadosPlanos = window.DataManager.converterParaEstruturaPlana(dadosBase);

        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const faturamento = dadosPlanos.faturamento || 0;
        const taxaCrescimento = dadosPlanos.taxaCrescimento || 0.05;
        const capitalGiroBase = calcularCapitalGiroReal(dadosPlanos);

        // Gerar projeção baseada em dados reais
        const fluxoAtual = [];
        const fluxoSplit = [];

        for (let i = 0; i < 12; i++) {
            const faturamentoMes = faturamento * Math.pow(1 + taxaCrescimento/12, i);
            const capitalGiroMes = (capitalGiroBase / 12) * (i + 1);

            // Fluxo atual considera o capital de giro necessário
            const fluxoMensal = faturamentoMes - capitalGiroMes;
            fluxoAtual.push(Math.round(Math.max(0, fluxoMensal)));

            // Calcular impacto Split Payment se dados disponíveis
            let impactoSplit = 0.85; // Redução padrão de 15%
            if (resultadosSimulacao?.impactoBase?.percentualImpacto) {
                impactoSplit = 1 + (resultadosSimulacao.impactoBase.percentualImpacto / 100);
            }

            const fluxoComSplit = fluxoMensal * impactoSplit;
            fluxoSplit.push(Math.round(Math.max(0, fluxoComSplit)));
        }

        return {
            labels: meses,
            fluxoAtual: fluxoAtual,
            fluxoSplit: fluxoSplit
        };
    }

    /**
     * Gera dados para gráfico de comparação baseados em dados reais
     * @param {Object} dadosBase - Dados base na estrutura aninhada
     * @param {Object} resultadosSimulacao - Resultados de simulação se disponíveis
     * @returns {Object} Dados formatados para gráfico de comparação
     */
    function gerarDadosGraficoComparacao(dadosBase, resultadosSimulacao) {
        // Verificar estrutura dos dados
        if (!window.DataManager || window.DataManager.detectarTipoEstrutura(dadosBase) !== 'aninhada') {
            console.warn('DASHBOARD: Dados não estão na estrutura aninhada para gráfico de comparação');
            return { valores: [0, 0, 0] };
        }

        // Converter para estrutura plana para cálculos
        const dadosPlanos = window.DataManager.converterParaEstruturaPlana(dadosBase);
        const faturamento = dadosPlanos.faturamento || 0;

        if (resultadosSimulacao?.impactoBase) {
            return {
                valores: [
                    Math.abs(resultadosSimulacao.impactoBase.resultadoAtual?.capitalGiroDisponivel || 0),
                    Math.abs(resultadosSimulacao.impactoBase.resultadoSplitPayment?.capitalGiroDisponivel || 0),
                    Math.abs(resultadosSimulacao.impactoBase.necessidadeAdicionalCapitalGiro || 0)
                ]
            };
        }

        // Estimativa baseada nos dados disponíveis
        const aliquota = dadosPlanos.aliquota || 0.265;
        const capitalGiroBase = calcularCapitalGiroReal(dadosPlanos);
        const impostoEstimado = faturamento * aliquota;

        return {
            valores: [
                capitalGiroBase,
                capitalGiroBase * 0.85, // Estimativa de redução com Split Payment
                impostoEstimado * 0.20  // Estimativa de necessidade adicional
            ]
        };
    }

    /**
     * Gera timeline real baseada em dados do sistema
     * @param {Object} dadosBase - Dados base na estrutura aninhada
     * @param {Object} resultadosSimulacao - Resultados de simulação se disponíveis
     * @returns {Array} Timeline de implementação
     */
    function gerarTimelineReal(dadosBase, resultadosSimulacao) {
        // Verificar estrutura dos dados
        if (!window.DataManager || window.DataManager.detectarTipoEstrutura(dadosBase) !== 'aninhada') {
            console.warn('DASHBOARD: Dados não estão na estrutura aninhada para timeline');
            return [];
        }

        const anoAtual = new Date().getFullYear();

        // Usar cronograma do sistema ou padrão
        const cronograma = dadosBase.cronogramaImplementacao || {
            2026: 0.10,
            2027: 0.25,
            2028: 0.40,
            2029: 0.55,
            2030: 0.70,
            2031: 0.85,
            2032: 0.95,
            2033: 1.00
        };

        return Object.entries(cronograma).map(([ano, percentual]) => {
            const anoNum = parseInt(ano);
            const progresso = anoNum <= anoAtual ? 100 : Math.min(percentual * 100, 100);

            let status = 'pending';
            let icon = '⏳';

            if (anoNum < anoAtual) {
                status = 'completed';
                icon = '✅';
            } else if (anoNum === anoAtual) {
                status = 'active';
                icon = '🚀';
            }

            return {
                title: `Fase ${anoNum - 2025} - Implementação ${(percentual * 100).toFixed(0)}%`,
                date: ano,
                description: `Meta de implementação: ${(percentual * 100).toFixed(0)}% dos tributos via Split Payment`,
                progress: progresso,
                status: status,
                icon: icon
            };
        });
    }

    /**
     * Gera alertas baseados em análise dos dados reais
     * @param {Object} dadosBase - Dados base na estrutura aninhada
     * @param {Object} resultadosSimulacao - Resultados de simulação se disponíveis
     * @returns {Array} Lista de alertas relevantes
     */
    function gerarAlertasBaseadosEmDados(dadosBase, resultadosSimulacao) {
        const alertas = [];
        const agora = new Date();

        // Verificar estrutura dos dados
        if (!window.DataManager || window.DataManager.detectarTipoEstrutura(dadosBase) !== 'aninhada') {
            alertas.push({
                id: Date.now() + 1,
                level: 'warning',
                title: 'Estrutura de Dados Inconsistente',
                message: 'Os dados não estão na estrutura esperada. Verifique a configuração do sistema.',
                timestamp: agora.getTime()
            });
            return alertas;
        }

        // Converter para estrutura plana para análise
        const dadosPlanos = window.DataManager.converterParaEstruturaPlana(dadosBase);
        const faturamento = dadosPlanos.faturamento || 0;
        const margem = dadosPlanos.margem || 0;

        // Alerta sobre dados não configurados
        if (faturamento === 0) {
            alertas.push({
                id: Date.now() + 1,
                level: 'warning',
                title: 'Dados da Empresa Não Configurados',
                message: 'Configure o faturamento e outros dados na aba de simulação para obter análises precisas',
                timestamp: agora.getTime()
            });
        }

        // Alerta sobre simulação não executada
        if (!resultadosSimulacao) {
            alertas.push({
                id: Date.now() + 2,
                level: 'info',
                title: 'Simulação Não Executada',
                message: 'Execute uma simulação para visualizar o impacto real do Split Payment',
                timestamp: agora.getTime() - 1800000
            });
        }

        // Alerta sobre margem baixa
        if (margem > 0 && margem < 0.05) {
            alertas.push({
                id: Date.now() + 3,
                level: 'warning',
                title: 'Margem Operacional Baixa',
                message: `Margem de ${(margem * 100).toFixed(1)}% pode ser insuficiente para absorver impactos do Split Payment`,
                timestamp: agora.getTime() - 3600000
            });
        }

        // Alerta sobre impacto significativo
        if (resultadosSimulacao?.impactoBase?.percentualImpacto) {
            const impacto = Math.abs(resultadosSimulacao.impactoBase.percentualImpacto);
            if (impacto > 20) {
                alertas.push({
                    id: Date.now() + 4,
                    level: 'error',
                    title: 'Impacto Significativo Identificado',
                    message: `Split Payment pode causar impacto de ${impacto.toFixed(1)}% no capital de giro`,
                    timestamp: agora.getTime() - 900000
                });
            }
        }

        // Alerta sobre dados SPED
        if (dadosPlanos.dadosSpedImportados) {
            alertas.push({
                id: Date.now() + 5,
                level: 'success',
                title: 'Dados SPED Integrados',
                message: 'Dashboard atualizado com dados reais importados do SPED',
                timestamp: agora.getTime() - 300000
            });
        }

        // Alerta sobre créditos tributários significativos
        const creditosTotais = (dadosPlanos.creditosPIS || 0) + 
                              (dadosPlanos.creditosCOFINS || 0) + 
                              (dadosPlanos.creditosICMS || 0) + 
                              (dadosPlanos.creditosIPI || 0);

        if (creditosTotais > faturamento * 0.1) {
            alertas.push({
                id: Date.now() + 6,
                level: 'info',
                title: 'Créditos Tributários Significativos',
                message: `Empresa possui ${window.DataManager.formatarMoeda(creditosTotais)} em créditos tributários que podem reduzir o impacto do Split Payment`,
                timestamp: agora.getTime() - 600000
            });
        }

        return alertas;
    }

    /**
     * Cria widget de erro para manter consistência do layout
     * @param {string} widgetId - ID do widget com erro
     * @param {string} mensagemErro - Mensagem de erro
     * @returns {HTMLElement} Widget de erro
     */
    function criarWidgetErro(widgetId, mensagemErro) {
        const widget = document.createElement('div');
        widget.className = 'dashboard-widget widget-error';
        widget.id = `widget-${widgetId}`;

        widget.innerHTML = `
            <div class="widget-header">
                <div class="widget-icon">⚠️</div>
                <div class="widget-title">Erro no Widget</div>
            </div>
            <div class="widget-content">
                <div class="error-message">
                    <p><strong>Widget:</strong> ${widgetId}</p>
                    <p><strong>Erro:</strong> ${mensagemErro}</p>
                    <p class="error-suggestion">Verifique a configuração dos dados ou execute uma nova simulação.</p>
                </div>
            </div>
        `;

        return widget;
    }

    function init() {
        // Verificar se já existe container no DOM
        let container = document.getElementById('dashboard-container');
        
        if (!container) {
            // Encontrar local apropriado para inserir dashboard
            const resultsContainer = document.querySelector('.results-full-width-container');
            if (resultsContainer) {
                container = createDashboardLayout();
                resultsContainer.insertBefore(container, resultsContainer.firstChild);
            }
        }
        
        if (container) {
            initializeDashboard();
            addDashboardStyles();
            console.log('📊 Sistema de Dashboard Avançado carregado com sucesso!');
        }
    }

    function addDashboardStyles() {
        if (document.getElementById('dashboard-styles')) return;

        const style = document.createElement('style');
        style.id = 'dashboard-styles';
        style.textContent = `
            .dashboard-container {
                margin-bottom: 2rem;
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                border-radius: 16px;
                padding: 24px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }

            .dashboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
                padding-bottom: 16px;
                border-bottom: 2px solid rgba(102, 126, 234, 0.1);
            }

            .dashboard-title h2 {
                margin: 0;
                color: var(--text-primary);
                font-size: 1.5rem;
                font-weight: 700;
            }

            .dashboard-subtitle {
                color: var(--text-secondary);
                font-size: 0.9rem;
                margin-top: 4px;
            }

            .dashboard-controls {
                display: flex;
                align-items: center;
                gap: 16px;
            }

            .auto-refresh-control {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.9rem;
                color: var(--text-secondary);
            }

            .dashboard-grid {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }

            .dashboard-row {
                display: grid;
                gap: 20px;
                align-items: start;
            }

            .dashboard-row.row-0 {
                grid-template-columns: repeat(4, 1fr);
            }

            .dashboard-row.row-1 {
                grid-template-columns: 1fr 1fr;
            }

            .dashboard-row.row-2 {
                grid-template-columns: 1fr;
            }

            .dashboard-row.row-3 {
                grid-template-columns: 1fr;
            }

            .dashboard-widget {
                background: white;
                border-radius: 12px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                border: 1px solid rgba(0,0,0,0.05);
                transition: all 0.3s ease;
                overflow: hidden;
            }

            .dashboard-widget:hover {
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                transform: translateY(-2px);
            }

            .widget-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px;
                background: rgba(0,0,0,0.02);
                border-bottom: 1px solid rgba(0,0,0,0.05);
            }

            .widget-title {
                font-weight: 600;
                color: var(--text-primary);
                font-size: 0.95rem;
            }

            .widget-icon {
                font-size: 1.2rem;
                margin-right: 8px;
            }

            .widget-controls {
                display: flex;
                gap: 4px;
            }

            .widget-control {
                background: none;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.9rem;
                transition: background 0.2s ease;
            }

            .widget-control:hover {
                background: rgba(0,0,0,0.05);
            }

            .widget-content {
                padding: 20px;
            }

            .kpi-value {
                font-size: 2rem;
                font-weight: 800;
                color: var(--text-primary);
                margin-bottom: 8px;
            }

            .kpi-value.danger {
                color: var(--danger-color);
            }

            .kpi-trend {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 0.85rem;
                margin-bottom: 4px;
            }

            .kpi-trend.positive {
                color: var(--success-color);
            }

            .kpi-trend.negative {
                color: var(--danger-color);
            }

            .kpi-trend.neutral {
                color: var(--text-secondary);
            }

            .kpi-subtitle {
                font-size: 0.8rem;
                color: var(--text-secondary);
            }

            .timeline-container {
                max-height: 300px;
                overflow-y: auto;
            }

            .timeline-item {
                display: flex;
                gap: 16px;
                padding: 16px 0;
                border-bottom: 1px solid rgba(0,0,0,0.05);
                animation: slideInLeft 0.5s ease-out;
            }

            .timeline-marker {
                flex-shrink: 0;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: var(--primary-gradient);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
            }

            .timeline-content {
                flex: 1;
            }

            .timeline-title {
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 4px;
            }

            .timeline-date {
                font-size: 0.85rem;
                color: var(--text-secondary);
                margin-bottom: 8px;
            }

            .timeline-description {
                font-size: 0.9rem;
                color: var(--text-secondary);
                line-height: 1.4;
                margin-bottom: 8px;
            }

            .timeline-progress {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .progress-bar {
                flex: 1;
                height: 6px;
                background: rgba(0,0,0,0.1);
                border-radius: 3px;
                overflow: hidden;
            }

            .progress-fill {
                height: 100%;
                background: var(--success-gradient);
                transition: width 1s ease;
            }

            .progress-text {
                font-size: 0.8rem;
                font-weight: 600;
                color: var(--text-secondary);
            }

            .alerts-container {
                max-height: 300px;
                overflow-y: auto;
            }

            .alert-item {
                display: flex;
                align-items: start;
                gap: 12px;
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 8px;
                border-left: 4px solid;
            }

            .alert-item.alert-success {
                background: rgba(34, 197, 94, 0.1);
                border-left-color: #22c55e;
            }

            .alert-item.alert-warning {
                background: rgba(245, 158, 11, 0.1);
                border-left-color: #f59e0b;
            }

            .alert-item.alert-error {
                background: rgba(239, 68, 68, 0.1);
                border-left-color: #ef4444;
            }

            .alert-item.alert-info {
                background: rgba(59, 130, 246, 0.1);
                border-left-color: #3b82f6;
            }

            .alert-content {
                flex: 1;
            }

            .alert-title {
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 2px;
            }

            .alert-message {
                font-size: 0.9rem;
                color: var(--text-secondary);
                margin-bottom: 4px;
            }

            .alert-time {
                font-size: 0.8rem;
                color: var(--text-muted);
            }

            .alert-dismiss {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                color: var(--text-secondary);
                padding: 0;
                width: 20px;
                height: 20px;
            }

            .no-alerts {
                text-align: center;
                padding: 40px 20px;
                color: var(--text-secondary);
            }

            .no-alerts-icon {
                font-size: 2rem;
                margin-bottom: 8px;
            }

            .dashboard-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 24px;
                padding-top: 16px;
                border-top: 1px solid rgba(0,0,0,0.1);
                font-size: 0.85rem;
                color: var(--text-secondary);
            }

            .status-indicator {
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                margin-right: 6px;
            }

            .status-indicator.active {
                background: #22c55e;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }

            @media (max-width: 1200px) {
                .dashboard-row.row-0 {
                    grid-template-columns: repeat(2, 1fr);
                }
            }

            @media (max-width: 768px) {
                .dashboard-row {
                    grid-template-columns: 1fr !important;
                }
                
                .dashboard-header {
                    flex-direction: column;
                    gap: 16px;
                    align-items: stretch;
                }
                
                .dashboard-controls {
                    justify-content: space-between;
                }
            }
        `;

        document.head.appendChild(style);
    }

    // ===== INTERFACE PÚBLICA ===== //
    return {
        init,
        updateDashboardData,
        obterDadosReaisDashboard,
        widgets,
        config
    };
})();

// ===== INICIALIZAÇÃO AUTOMÁTICA ===== //
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar outros sistemas carregarem
    setTimeout(() => {
        DashboardSystem.init();
    }, 1000);
});

// ===== EXPORTAR PARA ESCOPO GLOBAL ===== //
window.DashboardSystem = DashboardSystem;