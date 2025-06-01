// ===== SISTEMA DE GRÁFICOS MELHORADOS ===== //
// Arquivo: js/charts/enhanced-charts.js

const EnhancedCharts = (function() {
    'use strict';

    // ===== CONFIGURAÇÕES DE CHARTS ===== //
    const chartConfigs = {
        default: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            family: 'Inter',
                            size: 12,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;

                            if (label.includes('R$') || label.includes('Valor')) {
                                return `${label}: ${formatCurrency(value)}`;
                            } else if (label.includes('%') || label.includes('Percentual')) {
                                return `${label}: ${value.toFixed(2)}%`;
                            }

                            return `${label}: ${value.toLocaleString('pt-BR')}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        lineWidth: 1
                    },
                    ticks: {
                        font: {
                            family: 'Inter',
                            size: 11
                        },
                        color: '#64748b'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        lineWidth: 1
                    },
                    ticks: {
                        font: {
                            family: 'Inter',
                            size: 11
                        },
                        color: '#64748b',
                        callback: function(value) {
                            if (this.chart.data.datasets[0].label?.includes('R$')) {
                                return formatCurrency(value);
                            } else if (this.chart.data.datasets[0].label?.includes('%')) {
                                return value + '%';
                            }
                            return value.toLocaleString('pt-BR');
                        }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    };

    // ===== CORES E GRADIENTES PARA GRÁFICOS ===== //
    const chartColors = {
        primary: '#667eea',
        secondary: '#764ba2',
        success: '#4facfe',
        warning: '#43e97b',
        danger: '#fa709a',
        info: '#f093fb',
        neutral: '#94a3b8'
    };

    function createGradient(ctx, color1, color2 = null) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, color2 || color1);
        gradient.addColorStop(1, color1 + '20');
        return gradient;
    }

    // ===== FORMATAÇÃO DE VALORES ===== //
    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    function formatPercentage(value) {
        return value.toFixed(2) + '%';
    }

    function formatNumber(value) {
        return value.toLocaleString('pt-BR');
    }

    // ===== FUNÇÃO UTILITÁRIA PARA DESTRUIÇÃO SEGURA ===== //
    function destroyExistingChart(canvasOrId) {
        let canvas;

        if (typeof canvasOrId === 'string') {
            canvas = document.getElementById(canvasOrId);
        } else {
            canvas = canvasOrId;
        }

        if (!canvas) {
            console.warn('Canvas não encontrado para destruição:', canvasOrId);
            return false;
        }

        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            existingChart.destroy();
            return true;
        }

        return false;
    }

    // ===== GRÁFICO DE FLUXO DE CAIXA APRIMORADO ===== //
    function createFluxoCaixaChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('Canvas não encontrado:', canvasId);
            return null;
        }

        // Destruir gráfico existente antes de criar novo
        destroyExistingChart(canvas);

        const ctx = canvas.getContext('2d');

        const chartData = {
            labels: data.labels || ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
            datasets: [
                {
                    label: 'Fluxo Atual (R$)',
                    data: data.fluxoAtual || [],
                    borderColor: chartColors.primary,
                    backgroundColor: createGradient(ctx, chartColors.primary),
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: chartColors.primary,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                },
                {
                    label: 'Fluxo com Split Payment (R$)',
                    data: data.fluxoSplit || [],
                    borderColor: chartColors.danger,
                    backgroundColor: createGradient(ctx, chartColors.danger),
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: chartColors.danger,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }
            ]
        };      

        const config = {
            type: 'line',
            data: chartData,
            options: {
                ...chartConfigs.default,
                plugins: {
                    ...chartConfigs.default.plugins,
                    title: {
                        display: true,
                        text: 'Evolução do Fluxo de Caixa',
                        font: {
                            family: 'Inter',
                            size: 16,
                            weight: '700'
                        },
                        color: '#1e293b',
                        padding: 20
                    }
                },
                scales: {
                    ...chartConfigs.default.scales,
                    y: {
                        ...chartConfigs.default.scales.y,
                        title: {
                            display: true,
                            text: 'Valor (R$)',
                            font: {
                                family: 'Inter',
                                size: 12,
                                weight: '600'
                            }
                        }
                    }
                }
            }
        };

        return new Chart(ctx, config);
    }

    // ===== GRÁFICO DE CAPITAL DE GIRO APRIMORADO ===== //
    function createCapitalGiroChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('Canvas não encontrado:', canvasId);
            return null;
        }

        // Destruir gráfico existente antes de criar novo
        destroyExistingChart(canvas);

        const ctx = canvas.getContext('2d');

        const chartData = {
            labels: ['Regime Atual', 'IVA sem Split', 'IVA com Split'],
            datasets: [{
                label: 'Capital de Giro Necessário (R$)',
                data: data.valores || [0, 0, 0],
                backgroundColor: [
                    createGradient(ctx, chartColors.success),
                    createGradient(ctx, chartColors.warning),
                    createGradient(ctx, chartColors.danger)
                ],
                borderColor: [
                    chartColors.success,
                    chartColors.warning,
                    chartColors.danger
                ],
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false
            }]
        };

        const config = {
            type: 'bar',
            data: chartData,
            options: {
                ...chartConfigs.default,
                plugins: {
                    ...chartConfigs.default.plugins,
                    title: {
                        display: true,
                        text: 'Comparação de Capital de Giro',
                        font: {
                            family: 'Inter',
                            size: 16,
                            weight: '700'
                        },
                        color: '#1e293b',
                        padding: 20
                    }
                },
                scales: {
                    ...chartConfigs.default.scales,
                    y: {
                        ...chartConfigs.default.scales.y,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Valor (R$)',
                            font: {
                                family: 'Inter',
                                size: 12,
                                weight: '600'
                            }
                        }
                    }
                }
            }
        };

        return new Chart(ctx, config);
    }

    // ===== GRÁFICO DE PROJEÇÃO TEMPORAL ===== //
    function createProjecaoChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('Canvas não encontrado:', canvasId);
            return null;
        }

        // Destruir gráfico existente antes de criar novo
        destroyExistingChart(canvas);

        const ctx = canvas.getContext('2d');

        const chartData = {
            labels: data.anos || ['2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033'],
            datasets: [
                {
                    label: 'Implementação Split Payment (%)',
                    data: data.percentualImplementacao || [10, 25, 40, 55, 70, 85, 95, 100],
                    type: 'line',
                    borderColor: chartColors.info,
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    tension: 0.4,
                    pointBackgroundColor: chartColors.info,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    yAxisID: 'y1'
                },
                {
                    label: 'Impacto no Capital (R$ mil)',
                    data: data.impactoCapital || [],
                    type: 'bar',
                    backgroundColor: createGradient(ctx, chartColors.danger),
                    borderColor: chartColors.danger,
                    borderWidth: 2,
                    borderRadius: 6,
                    yAxisID: 'y'
                }
            ]
        };

        const config = {
            type: 'bar',
            data: chartData,
            options: {
                ...chartConfigs.default,
                plugins: {
                    ...chartConfigs.default.plugins,
                    title: {
                        display: true,
                        text: 'Projeção de Implementação e Impacto',
                        font: {
                            family: 'Inter',
                            size: 16,
                            weight: '700'
                        },
                        color: '#1e293b',
                        padding: 20
                    }
                },
                scales: {
                    x: chartConfigs.default.scales.x,
                    y: {
                        ...chartConfigs.default.scales.y,
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Impacto (R$ mil)',
                            font: {
                                family: 'Inter',
                                size: 12,
                                weight: '600'
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Implementação (%)',
                            font: {
                                family: 'Inter',
                                size: 12,
                                weight: '600'
                            }
                        },
                        grid: {
                            drawOnChartArea: false
                        },
                        ticks: {
                            font: {
                                family: 'Inter',
                                size: 11
                            },
                            color: '#64748b',
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        };

        return new Chart(ctx, config);
    }

    // ===== GRÁFICO DE DECOMPOSIÇÃO TRIBUTÁRIA ===== //
    function createDecomposicaoChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('Canvas não encontrado:', canvasId);
            return null;
        }

        // Destruir gráfico existente antes de criar novo
        destroyExistingChart(canvas);

        const ctx = canvas.getContext('2d');

        const chartData = {
            labels: data.tributos || ['PIS', 'COFINS', 'ICMS', 'IPI', 'ISS'],
            datasets: [{
                label: 'Distribuição Tributária Atual',
                data: data.valores || [],
                backgroundColor: [
                    chartColors.primary + '80',
                    chartColors.secondary + '80',
                    chartColors.success + '80',
                    chartColors.warning + '80',
                    chartColors.danger + '80'
                ],
                borderColor: [
                    chartColors.primary,
                    chartColors.secondary,
                    chartColors.success,
                    chartColors.warning,
                    chartColors.danger
                ],
                borderWidth: 2,
                hoverOffset: 15
            }]
        };

        const config = {
            type: 'doughnut',
            data: chartData,
            options: {
                ...chartConfigs.default,
                cutout: '60%',
                plugins: {
                    ...chartConfigs.default.plugins,
                    title: {
                        display: true,
                        text: 'Decomposição da Carga Tributária',
                        font: {
                            family: 'Inter',
                            size: 16,
                            weight: '700'
                        },
                        color: '#1e293b',
                        padding: 20
                    },
                    tooltip: {
                        ...chartConfigs.default.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${formatCurrency(context.parsed)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        };

        return new Chart(ctx, config);
    }

    // ===== GRÁFICO DE ANÁLISE DE SENSIBILIDADE ===== //
    function createSensibilidadeChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('Canvas não encontrado:', canvasId);
            return null;
        }

        // Destruir gráfico existente antes de criar novo
        destroyExistingChart(canvas);

        const ctx = canvas.getContext('2d');

        const chartData = {
            labels: data.cenarios || ['Pessimista', 'Conservador', 'Moderado', 'Otimista'],
            datasets: [
                {
                    label: 'Impacto no Capital de Giro (%)',
                    data: data.impactoCapital || [],
                    backgroundColor: createGradient(ctx, chartColors.danger),
                    borderColor: chartColors.danger,
                    borderWidth: 2,
                    borderRadius: 8
                },
                {
                    label: 'Economia Tributária (%)',
                    data: data.economiaTributaria || [],
                    backgroundColor: createGradient(ctx, chartColors.success),
                    borderColor: chartColors.success,
                    borderWidth: 2,
                    borderRadius: 8
                }
            ]
        };

        const config = {
            type: 'bar',
            data: chartData,
            options: {
                ...chartConfigs.default,
                indexAxis: 'y',
                plugins: {
                    ...chartConfigs.default.plugins,
                    title: {
                        display: true,
                        text: 'Análise de Sensibilidade por Cenário',
                        font: {
                            family: 'Inter',
                            size: 16,
                            weight: '700'
                        },
                        color: '#1e293b',
                        padding: 20
                    }
                },
                scales: {
                    x: {
                        ...chartConfigs.default.scales.x,
                        title: {
                            display: true,
                            text: 'Impacto (%)',
                            font: {
                                family: 'Inter',
                                size: 12,
                                weight: '600'
                            }
                        }
                    },
                    y: {
                        ...chartConfigs.default.scales.y,
                        title: {
                            display: true,
                            text: 'Cenários',
                            font: {
                                family: 'Inter',
                                size: 12,
                                weight: '600'
                            }
                        }
                    }
                }
            }
        };

        return new Chart(ctx, config);
    }

    // ===== GRÁFICO DE EVOLUÇÃO ESPECÍFICA DE IMPOSTOS ===== //
    function createEvolucaoImpostosChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('Canvas não encontrado:', canvasId);
            return null;
        }

        // Destruir gráfico existente antes de criar novo
        destroyExistingChart(canvas);

        const ctx = canvas.getContext('2d');

        const chartData = {
            labels: data.anos || ['2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033'],
            datasets: [
                {
                    label: 'PIS/COFINS',
                    data: data.pisCofins || [],
                    borderColor: chartColors.primary,
                    backgroundColor: chartColors.primary + '20',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'ICMS',
                    data: data.icms || [],
                    borderColor: chartColors.success,
                    backgroundColor: chartColors.success + '20',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'IBS/CBS',
                    data: data.ivaDual || [],
                    borderColor: chartColors.warning,
                    backgroundColor: chartColors.warning + '20',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }
            ]
        };

        const config = {
            type: 'line',
            data: chartData,
            options: {
                ...chartConfigs.default,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    ...chartConfigs.default.plugins,
                    title: {
                        display: true,
                        text: 'Evolução dos Impostos Durante a Transição',
                        font: {
                            family: 'Inter',
                            size: 16,
                            weight: '700'
                        },
                        color: '#1e293b',
                        padding: 20
                    }
                },
                scales: {
                    ...chartConfigs.default.scales,
                    y: {
                        ...chartConfigs.default.scales.y,
                        stacked: false,
                        title: {
                            display: true,
                            text: 'Valor (R$)',
                            font: {
                                family: 'Inter',
                                size: 12,
                                weight: '600'
                            }
                        }
                    }
                }
            }
        };

        return new Chart(ctx, config);
    }

    // ===== SISTEMA DE ANIMAÇÕES CUSTOMIZADAS ===== //
    function addCustomAnimations() {
        Chart.register({
            id: 'customAnimations',
            beforeUpdate: function(chart) {
                if (chart.options && chart.options.animation && chart.options.animation.customEntry) {
                    chart.data.datasets.forEach((dataset, i) => {
                        dataset.data.forEach((value, j) => {
                            if (typeof value === 'number' && value > 0) {
                                // Animação de entrada escalonada
                                setTimeout(() => {
                                    chart.update('none');
                                }, (i * 100) + (j * 50));
                            }
                        });
                    });
                }
            }
        });
    }

    // ===== SISTEMA DE EXPORTAÇÃO DE GRÁFICOS ===== //
    function exportChartAsPNG(chartInstance, filename = 'grafico') {
        const canvas = chartInstance.canvas;
        const url = canvas.toDataURL('image/png');

        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function exportAllChartsAsPDF() {
        console.log('Exportando todos os gráficos como PDF...');

        if (window.ModernUI) {
            window.ModernUI.showNotification('Funcionalidade de exportação em desenvolvimento', 'info');
        }
    }

    // ===== SISTEMA DE ATUALIZAÇÃO TEMÁTICA ===== //
    function updateChartsTheme(themeConfig) {
        const charts = Chart.instances;
        Object.values(charts).forEach(chart => {
            if (chart && chart.options) {
                // Atualizar cores dos gráficos baseado no tema
                chart.options.plugins.legend.labels.color = themeConfig.colors.text;
                chart.options.scales.x.ticks.color = themeConfig.colors.textSecondary;
                chart.options.scales.y.ticks.color = themeConfig.colors.textSecondary;

                // Atualizar cores dos datasets
                chart.data.datasets.forEach((dataset, index) => {
                    const colorKeys = Object.keys(chartColors);
                    const colorKey = colorKeys[index % colorKeys.length];
                    const newColor = themeConfig.colors[colorKey] || chartColors[colorKey];

                    if (dataset.borderColor && !Array.isArray(dataset.borderColor)) {
                        dataset.borderColor = newColor;
                    }
                    if (dataset.backgroundColor && !Array.isArray(dataset.backgroundColor)) {
                        dataset.backgroundColor = newColor + '40';
                    }
                });

                chart.update('none');
            }
        });
    }

    // ===== FUNÇÕES DE UTILIDADE ===== //
    function addChartControls(chartContainer, chartInstance) {
        const controls = document.createElement('div');
        controls.className = 'chart-controls';
        controls.innerHTML = `
            <div class="chart-controls-group">
                <button class="chart-control-btn" onclick="toggleChartAnimation('${chartInstance.canvas.id}')">
                    🎬 Toggle Animação
                </button>
                <button class="chart-control-btn" onclick="exportChart('${chartInstance.canvas.id}')">
                    📷 Exportar PNG
                </button>
                <button class="chart-control-btn" onclick="refreshChart('${chartInstance.canvas.id}')">
                    🔄 Atualizar
                </button>
            </div>
        `;

        controls.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            display: flex;
            gap: 8px;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        chartContainer.style.position = 'relative';
        chartContainer.appendChild(controls);

        // Mostrar controles no hover
        chartContainer.addEventListener('mouseenter', () => {
            controls.style.opacity = '1';
        });

        chartContainer.addEventListener('mouseleave', () => {
            controls.style.opacity = '0';
        });
    }

    // ===== FUNÇÕES GLOBAIS EXPOSTAS ===== //
    window.toggleChartAnimation = function(canvasId) {
        const canvas = document.getElementById(canvasId);
        const chart = canvas ? Chart.getChart(canvas) : null;
        if (chart) {
            chart.options.animation.duration = chart.options.animation.duration > 0 ? 0 : 1000;
            chart.update();
        }
    };

    window.exportChart = function(canvasId) {
        const canvas = document.getElementById(canvasId);
        const chart = canvas ? Chart.getChart(canvas) : null;
        if (chart) {
            exportChartAsPNG(chart, canvasId);
        }
    };

    window.refreshChart = function(canvasId) {
        const canvas = document.getElementById(canvasId);
        const chart = canvas ? Chart.getChart(canvas) : null;
        if (chart) {
            chart.update('active');

            if (window.ModernUI) {
                window.ModernUI.showNotification('Gráfico atualizado!', 'success', 1500);
            }
        }
    };

    // ===== INTEGRAÇÃO COM SISTEMA EXISTENTE ===== //
    function enhanceExistingCharts() {
        // Melhorar gráficos existentes adicionando controles
        setTimeout(() => {
            document.querySelectorAll('.chart-container canvas').forEach(canvas => {
                const chart = Chart.getChart(canvas);
                if (chart && !canvas.parentNode.querySelector('.chart-controls')) {
                    addChartControls(canvas.parentNode, chart);
                }
            });
        }, 1000);
    }

    // ===== INICIALIZAÇÃO ===== //
    function init() {
        addCustomAnimations();
        enhanceExistingCharts();

        // Configurar Chart.js defaults
        Chart.defaults.font.family = 'Inter';
        Chart.defaults.color = '#64748b';
        Chart.defaults.borderColor = 'rgba(0, 0, 0, 0.05)';

        console.log('📊 Sistema de Gráficos Melhorados carregado com sucesso!');
    }

    // Exportar na interface pública
    return {
        init,
        createFluxoCaixaChart,
        createCapitalGiroChart,
        createProjecaoChart,
        createDecomposicaoChart,
        createSensibilidadeChart,
        createEvolucaoImpostosChart,
        updateChartsTheme,
        exportChartAsPNG,
        exportAllChartsAsPDF,
        addChartControls,
        destroyExistingChart,
        chartColors
    };
})();

// ===== INICIALIZAÇÃO AUTOMÁTICA ===== //
document.addEventListener('DOMContentLoaded', function() {
// Aguardar Chart.js carregar
if (typeof Chart !== 'undefined') {
EnhancedCharts.init();
} else {
// Aguardar carregamento
const checkChart = setInterval(() => {
if (typeof Chart !== 'undefined') {
clearInterval(checkChart);
EnhancedCharts.init();
}
}, 100);
}
});
// ===== INTEGRAÇÃO COM CHARTMANAGER EXISTENTE ===== //
if (window.ChartManager) {
// Estender ChartManager existente
const originalRenderizarGraficos = window.ChartManager.renderizarGraficos;
window.ChartManager.renderizarGraficos = function(dados) {
    // Chamar função original
    if (originalRenderizarGraficos) {
        originalRenderizarGraficos.call(this, dados);
    }
    
    // Aplicar melhorias
    setTimeout(() => {
        enhanceExistingCharts();
    }, 500);
};

// Adicionar função de atualização de tema
window.ChartManager.updateChartsTheme = EnhancedCharts.updateChartsTheme;
}
// ===== EXPORTAR PARA ESCOPO GLOBAL ===== //
window.EnhancedCharts = EnhancedCharts;