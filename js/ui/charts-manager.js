/**
 * @fileoverview Gerenciador de gráficos para o simulador de Split Payment
 * @module charts-manager
 * @author Expertzy Inteligência Tributária
 * @version 1.0.0
 */

// Namespace global para o gerenciador de gráficos
window.ChartManager = (function() {
    // Armazenar referências para os gráficos
    let _charts = {};
    
    /**
     * Inicializar o gerenciador de gráficos
     */
    function inicializar() {
        console.log('Inicializando gerenciador de gráficos...');
        
        // Verificar se Chart.js está disponível
        if (typeof Chart === 'undefined') {
            console.error('Chart.js não está disponível. Os gráficos não serão renderizados.');
            return;
        }
        
        // Configurar defaults para todos os gráficos
        Chart.defaults.font.family = "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
        Chart.defaults.color = '#505050';
        Chart.defaults.elements.line.borderWidth = 2;
        Chart.defaults.elements.point.radius = 3;
        
        console.log('Gerenciador de gráficos inicializado');
    }
    
    /**
     * Destrói um gráfico de forma segura e completa
     * @param {string} canvasId - ID do canvas
     * @returns {boolean} - Se a destruição foi bem-sucedida
     */
    function destruirGraficoSeguro(canvasId) {
        try {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.warn(`Canvas ${canvasId} não encontrado`);
                return false;
            }

            // Método 1: Usar Chart.getChart()
            let existingChart = Chart.getChart(canvas);
            if (existingChart) {
                existingChart.destroy();
                console.log(`Gráfico ${canvasId} destruído via Chart.getChart()`);
            }

            // Método 2: Verificar se há instância no registro interno
            if (_charts[canvasId.replace('grafico-', '')]) {
                _charts[canvasId.replace('grafico-', '')].destroy();
                delete _charts[canvasId.replace('grafico-', '')];
                console.log(`Gráfico ${canvasId} destruído via _charts`);
            }

            // Método 3: Verificar todas as instâncias ativas do Chart.js
            Chart.instances.forEach((instance, index) => {
                if (instance.canvas && instance.canvas.id === canvasId) {
                    instance.destroy();
                    console.log(`Gráfico ${canvasId} destruído via Chart.instances[${index}]`);
                }
            });

            // Método 4: Limpar completamente o canvas
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }

            // Verificação final
            const finalCheck = Chart.getChart(canvas);
            if (finalCheck) {
                console.error(`ERRO: Gráfico ${canvasId} ainda existe após destruição`);
                return false;
            }

            console.log(`Canvas ${canvasId} completamente limpo`);
            return true;

        } catch (error) {
            console.error(`Erro crítico ao destruir gráfico ${canvasId}:`, error);
            return false;
        }
    }
    
    /**
     * Aguarda o canvas estar disponível para uso
     * @param {string} canvasId - ID do canvas
     * @param {number} maxTentativas - Máximo de tentativas
     * @returns {Promise<boolean>} - Se o canvas está disponível
     */
    function aguardarCanvasDisponivel(canvasId, maxTentativas = 10) {
        return new Promise((resolve) => {
            let tentativas = 0;

            const verificar = () => {
                tentativas++;
                const canvas = document.getElementById(canvasId);

                if (!canvas) {
                    console.error(`Canvas ${canvasId} não existe no DOM`);
                    resolve(false);
                    return;
                }

                const existingChart = Chart.getChart(canvas);

                if (!existingChart) {
                    console.log(`Canvas ${canvasId} disponível após ${tentativas} tentativas`);
                    resolve(true);
                } else if (tentativas >= maxTentativas) {
                    console.error(`Canvas ${canvasId} ainda ocupado após ${maxTentativas} tentativas`);
                    resolve(false);
                } else {
                    console.log(`Canvas ${canvasId} ainda ocupado, tentativa ${tentativas}/${maxTentativas}`);
                    setTimeout(verificar, 100);
                }
            };

            verificar();
        });
    }
    
    /**
     * Renderizar todos os gráficos com base nos resultados da simulação
     * @param {Object} resultados - Resultados da simulação
     */
    async function renderizarGraficos(resultados) {
        console.log('Renderizando gráficos com os resultados:', resultados);

        if (!resultados || !resultados.impactoBase) {
            console.error('Resultados inválidos para renderização de gráficos');
            return;
        }

        try {
            // Renderizar gráficos sequencialmente para evitar conflitos
            console.log('Renderizando gráfico de fluxo de caixa...');
            await renderizarGraficoFluxoCaixa(resultados);

            console.log('Renderizando gráfico de capital de giro...');
            await renderizarGraficoCapitalGiro(resultados);

            // Renderizar outros gráficos com delay
            setTimeout(() => {
                console.log('Renderizando gráficos adicionais...');

                const temProjecaoCompleta = resultados.projecaoTemporal && 
                                           resultados.projecaoTemporal.comparacaoRegimes && 
                                           resultados.projecaoTemporal.comparacaoRegimes.anos && 
                                           resultados.projecaoTemporal.comparacaoRegimes.anos.length > 0;

                if (temProjecaoCompleta) {
                    renderizarGraficoProjecao(resultados);
                }

                renderizarGraficoDecomposicao(resultados);
                renderizarGraficoSensibilidade(resultados);

            }, 300);

            console.log('Gráficos principais renderizados com sucesso');

        } catch (erro) {
            console.error('Erro ao renderizar gráficos:', erro);
        }
    }
    
    /**
     * Renderizar gráfico de fluxo de caixa
     * @param {Object} resultados - Resultados da simulação
     */    
    function renderizarGraficosDetalhamento(resultado) {
        console.log('ChartManager: Renderizando gráficos de detalhamento');
        
        // ✅ ADICIONAR ESTA LINHA:
        const canvas = document.getElementById('grafico-fluxo-caixa');
        
        if (!canvas) {
            console.error('Elemento canvas para gráfico de fluxo de caixa não encontrado');
            return;
        }

        // ADICIONAR ESTAS LINHAS:
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            existingChart.destroy();
        }

        if (typeof Chart === 'undefined') {
            console.error('Chart.js não disponível');
            return;
        }

        if (!resultado || !resultado.projecaoTemporal?.resultadosAnuais) {
            console.warn('Dados insuficientes para gráficos de detalhamento');
            return;
        }

        const cronograma = {
            2026: 0.10, 2027: 0.25, 2028: 0.40, 2029: 0.55,
            2030: 0.70, 2031: 0.85, 2032: 0.95, 2033: 1.00
        };

        const anos = Object.keys(cronograma);
        const dadosEntrada = resultado.memoriaCalculo?.dadosEntrada || {};
        const faturamento = dadosEntrada.empresa?.faturamento || 0;

        // Renderizar gráfico PIS/COFINS
        const ctxPisCofins = document.getElementById('grafico-evolucao-pis-cofins');
        if (ctxPisCofins) {
            // Destruir gráfico anterior se existir
            if (_charts.pisCofins) {
                _charts.pisCofins.destroy();
            }

            _charts.pisCofins = new Chart(ctxPisCofins, {
                type: 'line',
                data: {
                    labels: anos,
                    datasets: [{
                        label: 'Sistema Atual',
                        data: anos.map(ano => {
                            const percAtual = 1 - cronograma[ano];
                            return (faturamento * 0.095) * percAtual; // PIS+COFINS ~9.5%
                        }),
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        tension: 0.4
                    }, {
                        label: 'IVA Dual',
                        data: anos.map(ano => {
                            const percIVA = cronograma[ano];
                            return (faturamento * 0.088) * percIVA; // CBS ~8.8%
                        }),
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Evolução PIS/COFINS → CBS'
                        },
                        legend: {
                            position: 'bottom'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                        maximumFractionDigits: 0
                                    }).format(value);
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // Renderizar gráfico ICMS
        const ctxICMS = document.getElementById('grafico-evolucao-icms');
        if (ctxICMS) {
            // Destruir gráfico anterior se existir
            if (_charts.evolucaoICMS) {
                _charts.evolucaoICMS.destroy();
            }

            _charts.evolucaoICMS = new Chart(ctxICMS, {
                type: 'line',
                data: {
                    labels: anos,
                    datasets: [{
                        label: 'ICMS Atual',
                        data: anos.map(ano => {
                            const percAtual = 1 - cronograma[ano];
                            return (faturamento * 0.18) * percAtual; // ICMS ~18%
                        }),
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        tension: 0.4
                    }, {
                        label: 'IBS (IVA)',
                        data: anos.map(ano => {
                            const percIVA = cronograma[ano];
                            return (faturamento * 0.177) * percIVA; // IBS ~17.7%
                        }),
                        borderColor: '#9b59b6',
                        backgroundColor: 'rgba(155, 89, 182, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Evolução ICMS → IBS'
                        },
                        legend: {
                            position: 'bottom'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                        maximumFractionDigits: 0
                                    }).format(value);
                                }
                            }
                        }
                    }
                }
            });
        }

        // Renderizar gráfico IPI
        const ctxIPI = document.getElementById('grafico-evolucao-ipi');
        if (ctxIPI) {
            // Destruir gráfico anterior se existir
            if (_charts.evolucaoIPI) {
                _charts.evolucaoIPI.destroy();
            }

            _charts.evolucaoIPI = new Chart(ctxIPI, {
                type: 'bar',
                data: {
                    labels: anos,
                    datasets: [{
                        label: 'IPI Atual',
                        data: anos.map(ano => {
                            const percAtual = 1 - cronograma[ano];
                            return (faturamento * 0.10) * percAtual; // IPI ~10%
                        }),
                        backgroundColor: 'rgba(255, 206, 86, 0.7)',
                        borderColor: 'rgba(255, 206, 86, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Evolução IPI'
                        },
                        legend: {
                            position: 'bottom'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                        maximumFractionDigits: 0
                                    }).format(value);
                                }
                            }
                        }
                    }
                }
            });
        }

        // Renderizar gráfico Total
        const ctxTotal = document.getElementById('grafico-evolucao-total');
        if (ctxTotal) {
            // Destruir gráfico anterior se existir
            if (_charts.evolucaoTotal) {
                _charts.evolucaoTotal.destroy();
            }

            _charts.evolucaoTotal = new Chart(ctxTotal, {
                type: 'bar',
                data: {
                    labels: anos,
                    datasets: [{
                        label: 'Total de Impostos',
                        data: anos.map(ano => {
                            const percIVA = cronograma[ano];
                            const percAtual = 1 - percIVA;
                            const sistemaAtual = faturamento * 0.265 * percAtual; // Alíquota média atual
                            const sistemaIVA = faturamento * 0.265 * percIVA; // IVA equivalente
                            return sistemaAtual + sistemaIVA;
                        }),
                        backgroundColor: '#2ecc71',
                        borderColor: '#27ae60',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Total de Impostos Durante Transição'
                        },
                        legend: {
                            position: 'bottom'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                        maximumFractionDigits: 0
                                    }).format(value);
                                }
                            }
                        }
                    }
                }
            });
        }
        console.log('Gráficos de detalhamento renderizados com sucesso');
    }
    
    async function renderizarGraficoFluxoCaixa(resultados) {
        const canvasId = 'grafico-fluxo-caixa';
        const canvas = document.getElementById(canvasId);

        if (!canvas) {
            console.error('Elemento canvas para gráfico de fluxo de caixa não encontrado');
            return;
        }

        console.log('Iniciando renderização do gráfico de fluxo de caixa...');

        // Destruição segura e aguardo de disponibilidade
        destruirGraficoSeguro(canvasId);

        const canvasDisponivel = await aguardarCanvasDisponivel(canvasId);
        if (!canvasDisponivel) {
            console.error('Canvas não ficou disponível para gráfico de fluxo de caixa');
            return;
        }

        // Aguardar um pouco antes de criar o novo gráfico
        setTimeout(() => {
            try {
                // Obter o ano selecionado para visualização
                const selectAnoVisualizacao = document.getElementById('ano-visualizacao');
                const anoSelecionado = selectAnoVisualizacao ? parseInt(selectAnoVisualizacao.value) : 
                                      (resultados.projecaoTemporal?.parametros?.anoInicial || 2026);

                // Preparar dados para o gráfico
                let resultadoAtual, resultadoSplitPayment, resultadoIVASemSplit;

                // Verificar se temos dados do ano específico ou usar impactoBase
                if (resultados.projecaoTemporal?.resultadosAnuais && 
                    resultados.projecaoTemporal.resultadosAnuais[anoSelecionado]) {

                    const resultadoAno = resultados.projecaoTemporal.resultadosAnuais[anoSelecionado];
                    resultadoAtual = resultadoAno.resultadoAtual;
                    resultadoSplitPayment = resultadoAno.resultadoSplitPayment;
                    resultadoIVASemSplit = resultadoAno.resultadoIVASemSplit;
                } else {
                    // Fallback para impactoBase
                    resultadoAtual = resultados.impactoBase.resultadoAtual;
                    resultadoSplitPayment = resultados.impactoBase.resultadoSplitPayment;
                    resultadoIVASemSplit = resultados.impactoBase.resultadoIVASemSplit;
                }

                // Extrair dados dos resultados com validação
                const dadosSimulacao = resultados.dadosUtilizados || {};
                const faturamento = dadosSimulacao.empresa?.faturamento || 0;

                // Regime Atual
                const receitaAtual = faturamento;
                const impostosAtual = resultadoAtual?.impostos?.total || 0;
                const liquidoAtual = receitaAtual - impostosAtual;

                // Regime IVA sem Split Payment
                const receitaIVASemSplit = faturamento;
                const impostosIVASemSplit = resultadoIVASemSplit?.impostos?.total || 0;
                const liquidoIVASemSplit = receitaIVASemSplit - impostosIVASemSplit;

                // Regime Split Payment
                const impostosIVAComSplit = resultadoSplitPayment?.impostos?.total || 0;
                const percentualImplementacao = resultadoSplitPayment?.percentualImplementacao || 0.1;
                const impostoDireto = impostosIVAComSplit * percentualImplementacao;
                const impostoPosterior = impostosIVAComSplit - impostoDireto;
                const liquidoSplit = faturamento - impostosIVAComSplit;

                // Criar dados para o gráfico
                const data = {
                    labels: ['Regime Atual', 'IVA sem Split', 'IVA com Split'],
                    datasets: [
                        {
                            label: 'Recebimento Líquido',
                            data: [liquidoAtual, liquidoIVASemSplit, liquidoSplit],
                            backgroundColor: 'rgba(75, 192, 192, 0.7)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Imposto Recolhido Posteriormente',
                            data: [impostosAtual, impostosIVASemSplit, impostoPosterior],
                            backgroundColor: 'rgba(255, 206, 86, 0.7)',
                            borderColor: 'rgba(255, 206, 86, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Imposto Recolhido Diretamente',
                            data: [0, 0, impostoDireto],
                            backgroundColor: 'rgba(255, 99, 132, 0.7)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        }
                    ]
                };

                // Configurar opções do gráfico
                const options = {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: `Comparação de Fluxo de Caixa (${anoSelecionado})`,
                            font: { size: 16 }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += new Intl.NumberFormat('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL'
                                        }).format(context.parsed.y);
                                    }
                                    return label;
                                }
                            }
                        },
                        legend: {
                            position: 'bottom'
                        }
                    },
                    scales: {
                        x: { stacked: true },
                        y: {
                            stacked: true,
                            ticks: {
                                callback: function(value) {
                                    return new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                        maximumFractionDigits: 0
                                    }).format(value);
                                }
                            }
                        }
                    }
                };

                // Criar o gráfico
                _charts.fluxoCaixa = new Chart(canvas, {
                    type: 'bar',
                    data: data,
                    options: options
                });

                console.log('Gráfico de fluxo de caixa criado com sucesso');

            } catch (error) {
                console.error('Erro ao criar gráfico de fluxo de caixa:', error);
            }
        }, 50);
    }
    
    /**
     * Renderizar gráfico de capital de giro
     * @param {Object} resultados - Resultados da simulação
     */
    async function renderizarGraficoCapitalGiro(resultados) {
        const canvasId = 'grafico-capital-giro';
        const canvas = document.getElementById(canvasId);

        if (!canvas) {
            console.error('Elemento canvas para gráfico de capital de giro não encontrado');
            return;
        }

        console.log('Iniciando renderização do gráfico de capital de giro...');

        // Destruição segura e aguardo de disponibilidade
        destruirGraficoSeguro(canvasId);

        const canvasDisponivel = await aguardarCanvasDisponivel(canvasId);
        if (!canvasDisponivel) {
            console.error('Canvas não ficou disponível para gráfico de capital de giro');
            return;
        }

        try {
            // Obter o ano selecionado para visualização
            const selectAnoVisualizacao = document.getElementById('ano-visualizacao');
            const anoSelecionado = selectAnoVisualizacao ? parseInt(selectAnoVisualizacao.value) : 
                                  (resultados.projecaoTemporal?.parametros?.anoInicial || 2026);

            // Extrair dados do resultado do ano selecionado ou do impactoBase
            let capitalGiroAtual, capitalGiroIVASemSplit, capitalGiroSplit, diferencaCapitalGiro;

            if (resultados.projecaoTemporal?.resultadosAnuais && 
                resultados.projecaoTemporal.resultadosAnuais[anoSelecionado]) {

                const resultadoAno = resultados.projecaoTemporal.resultadosAnuais[anoSelecionado];
                capitalGiroAtual = resultadoAno.resultadoAtual?.capitalGiroDisponivel || 0;
                capitalGiroSplit = resultadoAno.resultadoSplitPayment?.capitalGiroDisponivel || 0;
                capitalGiroIVASemSplit = resultadoAno.resultadoIVASemSplit?.capitalGiroDisponivel || 0;
                diferencaCapitalGiro = resultadoAno.diferencaCapitalGiro || 0;
            } else {
                // Fallback para impactoBase
                capitalGiroAtual = resultados.impactoBase.resultadoAtual?.capitalGiroDisponivel || 0;
                capitalGiroSplit = resultados.impactoBase.resultadoSplitPayment?.capitalGiroDisponivel || 0;
                capitalGiroIVASemSplit = resultados.impactoBase.resultadoIVASemSplit?.capitalGiroDisponivel || 0;
                diferencaCapitalGiro = resultados.impactoBase.diferencaCapitalGiro || 0;
            }

            // Criar dados para o gráfico
            const data = {
                labels: ['Capital de Giro Disponível'],
                datasets: [
                    {
                        label: 'Regime Atual',
                        data: [capitalGiroAtual],
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'IVA sem Split Payment',
                        data: [capitalGiroIVASemSplit],
                        backgroundColor: 'rgba(255, 206, 86, 0.7)',
                        borderColor: 'rgba(255, 206, 86, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'IVA com Split Payment',
                        data: [capitalGiroSplit],
                        backgroundColor: 'rgba(255, 99, 132, 0.7)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            };

            // Configurar opções do gráfico
            const options = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Impacto no Capital de Giro (${anoSelecionado})`,
                        font: { size: 16 }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                    }).format(context.parsed.y);
                                }
                                return label;
                            },
                            footer: function(tooltipItems) {
                                return 'Diferença (Atual vs Split): ' + new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                }).format(diferencaCapitalGiro);
                            }
                        }
                    },
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                    maximumFractionDigits: 0
                                }).format(value);
                            }
                        }
                    }
                }
            };

            // Criar o gráfico
            const novoGrafico = new Chart(canvas, {
                type: 'bar',
                data: data,
                options: options
            });

            // Armazenar referência
            _charts.capitalGiro = novoGrafico;

            console.log('Gráfico de capital de giro criado com sucesso');

        } catch (error) {
            console.error('Erro ao criar gráfico de capital de giro:', error);
        }
    }
    
    /**
     * Renderizar gráfico de projeção
     * @param {Object} resultados - Resultados da simulação
     */
    function renderizarGraficoProjecao(resultados) {
        const canvas = document.getElementById('grafico-projecao');
        if (!canvas) {
            console.error('Elemento canvas para gráfico de projeção não encontrado');
            return;
        }
        
        // ADICIONAR ESTAS LINHAS:
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            existingChart.destroy();
        }

        // Destruir gráfico anterior se existir
        if (_charts.projecao) {
            _charts.projecao.destroy();
        }

        // Extrair dados da projeção temporal
        const projecao = resultados.projecaoTemporal;
        if (!projecao || !projecao.comparacaoRegimes) {
            console.warn('Dados de projeção não disponíveis para o gráfico');
            return;
        }

        // Extrair anos e dados de comparação
        const { anos, impacto, atual, splitPayment, ivaSemSplit } = projecao.comparacaoRegimes;

        if (!anos || !anos.length) {
            console.warn('Sem dados de anos para projeção temporal');
            return;
        }

        // Verificar se temos dados de implementação
        let percentuaisImplementacao = [];
        for (const ano of anos) {
            const percentual = projecao.resultadosAnuais?.[ano]?.percentualImplementacao || 
                              window.CurrentTaxSystem?.obterPercentualImplementacao?.(ano) || 0;
            percentuaisImplementacao.push(percentual * 100);
        }

        // Criar dados para o gráfico
        const data = {
            labels: anos,
            datasets: [
                {
                    label: 'Necessidade Adicional de Capital',
                    data: impacto?.necessidadeAdicional || Array(anos.length).fill(0),
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    yAxisID: 'y',
                    type: 'bar'
                },
                {
                    label: 'Impacto no Capital de Giro',
                    data: impacto?.diferencaCapitalGiro || Array(anos.length).fill(0),
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 2,
                    yAxisID: 'y',
                    type: 'line'
                },
                {
                    label: 'Percentual de Implementação',
                    data: percentuaisImplementacao,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    yAxisID: 'y1',
                    type: 'line'
                }
            ]
        };

        // Configurar opções do gráfico
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Projeção Temporal do Impacto',
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                if (context.datasetIndex === 2) {
                                    label += context.parsed.y.toFixed(1) + '%';
                                } else {
                                    label += new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                    }).format(context.parsed.y);
                                }
                            }
                            return label;
                        }
                    }
                },
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Valores (R$)'
                    },
                    ticks: {
                        callback: function(value) {
                            return new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                                maximumFractionDigits: 0
                            }).format(value);
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Implementação (%)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        };

        // Criar o gráfico
        _charts.projecao = new Chart(canvas, {
            type: 'bar',
            data: data,
            options: options
        });
    }
    
    /**
     * Renderizar gráfico de decomposição do impacto
     * @param {Object} resultados - Resultados da simulação
     */
    function renderizarGraficoDecomposicao(resultados) {
        const canvas = document.getElementById('grafico-decomposicao');
        if (!canvas) {
            console.error('Elemento canvas para gráfico de decomposição não encontrado');
            return;
        }
        
        // ADICIONAR ESTAS LINHAS:
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            existingChart.destroy();
        }

        // Destruir gráfico anterior se existir
        if (_charts.decomposicao) {
            _charts.decomposicao.destroy();
        }

        // Obter o ano selecionado para visualização
        const selectAnoVisualizacao = document.getElementById('ano-visualizacao');
        const anoSelecionado = selectAnoVisualizacao ? parseInt(selectAnoVisualizacao.value) : 
                              (resultados.projecaoTemporal?.parametros?.anoInicial || 2026);

        // Extrair dados de impacto
        const dadosUtilizados = resultados.dadosUtilizados || {};
        const dadosEmpresa = dadosUtilizados.empresa || {};
        const dadosFiscais = dadosUtilizados.parametrosFiscais || {};
        const dadosFinanceiros = dadosUtilizados.cicloFinanceiro || {};

        // Obter dados específicos
        const faturamento = dadosEmpresa.faturamento || 0;
        const aliquota = dadosFiscais.aliquota || 0.265;
        const percVista = dadosFinanceiros.percVista || 0.3;
        const percPrazo = dadosFinanceiros.percPrazo || 0.7;

        // Calcular componentes do impacto
        const valorImpostoTotal = faturamento * aliquota;

        // Decompor o impacto
        const impactoVendaVista = valorImpostoTotal * percVista;
        const impactoVendaPrazo = valorImpostoTotal * percPrazo;

        // Obter percentual de implementação para o ano selecionado
        const percentualImplementacao = resultados.projecaoTemporal?.resultadosAnuais?.[anoSelecionado]?.percentualImplementacao || 
                                       window.CurrentTaxSystem?.obterPercentualImplementacao?.(anoSelecionado) || 0.1;

        // Calcular impacto com Split Payment
        const impactoVendaVistaSplit = impactoVendaVista * percentualImplementacao;
        const impactoVendaPrazoSplit = impactoVendaPrazo * percentualImplementacao;

        // Calcular impacto sem Split Payment
        const impactoVendaVistaSemSplit = impactoVendaVista;
        const impactoVendaPrazoSemSplit = impactoVendaPrazo;

        // Criar dados para o gráfico
        const data = {
            labels: ['Regime Atual', 'IVA sem Split', 'IVA com Split'],
            datasets: [
                {
                    label: 'Impacto de Vendas à Vista',
                    data: [impactoVendaVista, impactoVendaVistaSemSplit, impactoVendaVistaSplit],
                    backgroundColor: 'rgba(255, 159, 64, 0.7)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Impacto de Vendas a Prazo',
                    data: [impactoVendaPrazo, impactoVendaPrazoSemSplit, impactoVendaPrazoSplit],
                    backgroundColor: 'rgba(153, 102, 255, 0.7)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }
            ]
        };

        // Configurar opções do gráfico
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Decomposição do Impacto por Tipo de Venda (${anoSelecionado} - ${(percentualImplementacao*100).toFixed(0)}%)`,
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                }).format(context.parsed.y);
                            }
                            return label;
                        },
                        footer: function(tooltipItems) {
                            // Calcular percentual
                            const index = tooltipItems[0].dataIndex;
                            const datasetIndex = tooltipItems[0].datasetIndex;
                            const value = data.datasets[datasetIndex].data[index];

                            // Total varia conforme o regime
                            let total;
                            if (index === 0) {
                                total = impactoVendaVista + impactoVendaPrazo;
                            } else if (index === 1) {
                                total = impactoVendaVistaSemSplit + impactoVendaPrazoSemSplit;
                            } else {
                                total = impactoVendaVistaSplit + impactoVendaPrazoSplit;
                            }

                            const percentual = total > 0 ? (value / total * 100).toFixed(1) : '0.0';
                            return 'Percentual: ' + percentual + '%';
                        }
                    }
                },
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                                maximumFractionDigits: 0
                            }).format(value);
                        }
                    }
                }
            }
        };

        // Criar o gráfico
        _charts.decomposicao = new Chart(canvas, {
            type: 'bar',
            data: data,
            options: options
        });
    }
    
    /**
     * Renderizar gráfico de sensibilidade
     * @param {Object} resultados - Resultados da simulação
     */
    function renderizarGraficoSensibilidade(resultados) {
        const canvas = document.getElementById('grafico-sensibilidade');
        if (!canvas) {
            console.error('Elemento canvas para gráfico de sensibilidade não encontrado');
            return;
        }
        
        // ADICIONAR ESTAS LINHAS:
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            existingChart.destroy();
        }

        // Destruir gráfico anterior se existir
        if (_charts.sensibilidade) {
            _charts.sensibilidade.destroy();
        }

        // Obter o ano selecionado para visualização
        const selectAnoVisualizacao = document.getElementById('ano-visualizacao');
        const anoSelecionado = selectAnoVisualizacao ? parseInt(selectAnoVisualizacao.value) : 
                              (resultados.projecaoTemporal?.parametros?.anoInicial || 2026);

        // Verificar se temos análise de sensibilidade disponível
        let analiseSensibilidade;
        if (resultados.impactoBase.analiseSensibilidade) {
            analiseSensibilidade = resultados.impactoBase.analiseSensibilidade;
        } else {
            // Gerar dados de sensibilidade artificiais se não existirem
            const dadosUtilizados = resultados.dadosUtilizados || {};
            const dadosEmpresa = dadosUtilizados.empresa || {};
            const dadosFiscais = dadosUtilizados.parametrosFiscais || {};

            const faturamento = dadosEmpresa.faturamento || 0;
            const aliquota = dadosFiscais.aliquota || 0.265;
            const valorImpostoTotal = faturamento * aliquota;

            // Percentuais padrão
            const percentuais = [10, 25, 40, 55, 70, 85, 100];

            // Calcular impacto para cada percentual
            const impactos = percentuais.map(percentual => {
                return -valorImpostoTotal * (percentual / 100);
            });

            analiseSensibilidade = {
                percentuais,
                resultados: Object.fromEntries(percentuais.map((p, i) => [p/100, impactos[i]]))
            };
        }

        // Extrair dados para o gráfico
        const percentuais = analiseSensibilidade.percentuais || [10, 25, 40, 55, 70, 85, 100];
        const impactos = percentuais.map(p => {
            // Converter para decimal se necessário
            const percentualDecimal = p > 1 ? p / 100 : p;
            return analiseSensibilidade.resultados[percentualDecimal] || 0;
        });

        // Criar dados para o gráfico
        const data = {
            labels: percentuais.map(p => typeof p === 'number' ? p + '%' : p),
            datasets: [
                {
                    label: 'Impacto no Capital de Giro',
                    data: impactos,
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2
                }
            ]
        };

        // Configurar opções do gráfico
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Análise de Sensibilidade',
                    font: {
                        size: 16
                    }
                },
                subtitle: {
                    display: true,
                    text: 'Impacto por Percentual de Implementação',
                    font: {
                        size: 14
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                },
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                                maximumFractionDigits: 0
                            }).format(value);
                        }
                    }
                }
            }
        };

        // Criar o gráfico
        _charts.sensibilidade = new Chart(canvas, {
            type: 'line',
            data: data,
            options: options
        });
    }
    
    /**
     * Renderizar gráfico de estratégias de mitigação
     * @param {Object} resultadoEstrategias - Resultado das estratégias de mitigação 
     * @param {Object} impactoBase - Impacto base para comparação
     */
    function renderizarGraficoEstrategias(resultadoEstrategias, impactoBase) {
        console.log('ChartManager: Iniciando renderização de gráficos de estratégias...');

        // Verificar se temos os elementos de canvas necessários
        const canvasEfetividade = document.getElementById('grafico-efetividade-estrategias');
        const canvasComparacao = document.getElementById('grafico-comparacao-estrategias');
        const canvasEvolucao = document.getElementById('grafico-evolucao-estrategias');

        // Verificar a existência dos canvas
        if (!canvasEfetividade && !canvasComparacao && !canvasEvolucao) {
            console.error('ChartManager: Nenhum elemento canvas para gráficos de estratégias encontrado');
            return;
        }

        // Caso de inicialização sem dados - limpar gráficos existentes
        if (!resultadoEstrategias || !impactoBase) {
            console.log('ChartManager: Inicializando gráficos de estratégias em estado vazio');

            // Limpar gráficos existentes
            ['efetividadeEstrategias', 'comparacaoEstrategias', 'evolucaoEstrategias'].forEach(tipoGrafico => {
                if (_charts[tipoGrafico]) {
                    _charts[tipoGrafico].destroy();
                    delete _charts[tipoGrafico];
                }
            });

            return;
        }

        try {
            // Obter o ano selecionado para visualização
            const seletorAno = document.getElementById('ano-visualizacao-estrategias');
            const anoSelecionado = seletorAno ? 
                parseInt(seletorAno.value) : 
                (resultadoEstrategias.ano || impactoBase.ano || 2026);

            // Obter percentual de implementação para o ano selecionado
            const percentualImplementacao = window.CurrentTaxSystem?.obterPercentualImplementacao?.(anoSelecionado) * 100 || 10;

            console.log(`ChartManager: Renderizando gráficos para ano ${anoSelecionado} (${percentualImplementacao.toFixed(0)}%)`);

            // Verificar detalhadamente os dados disponíveis
            if (!resultadoEstrategias.efeitividadeCombinada) {
                console.warn('ChartManager: Dados de efetividade combinada não disponíveis');

                // Criar estrutura mínima para continuar
                resultadoEstrategias.efeitividadeCombinada = {
                    efetividadePercentual: 0,
                    mitigacaoTotal: 0,
                    custoTotal: 0,
                    custoBeneficio: 0
                };
            }

            // 1. Renderizar gráfico de efetividade
            if (canvasEfetividade) {
                renderizarGraficoEfetividadeEstrategias(resultadoEstrategias, anoSelecionado, percentualImplementacao);
            }

            // 2. Renderizar gráfico de comparação
            if (canvasComparacao) {
                renderizarGraficoComparacaoEstrategias(resultadoEstrategias, impactoBase, anoSelecionado, percentualImplementacao);
            }

            // 3. Renderizar gráfico de evolução
            if (canvasEvolucao) {
                if (resultadoEstrategias.evolucaoTemporal) {
                    renderizarGraficoEvolucaoEstrategias(resultadoEstrategias.evolucaoTemporal);
                } else {
                    // Criar dados simulados para evolução se não estiverem disponíveis
                    const evolucaoSimulada = criarDadosEvolucaoSimulados(resultadoEstrategias, impactoBase);
                    renderizarGraficoEvolucaoEstrategias(evolucaoSimulada);
                }
            }

            console.log('ChartManager: Gráficos de estratégias renderizados com sucesso');
        } catch (erro) {
            console.error('ChartManager: Erro ao renderizar gráficos de estratégias:', erro);
        }
    }

    /**
     * Cria dados simulados de evolução temporal para estratégias
     * @param {Object} resultadoEstrategias - Resultado das estratégias
     * @param {Object} impactoBase - Impacto base da simulação
     * @returns {Object} - Dados simulados de evolução temporal
     */
    function criarDadosEvolucaoSimulados(resultadoEstrategias, impactoBase) {
        // Obter anos disponíveis do cronograma de implementação
        const anos = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033];

        // Calcular efetividade base (a partir do resultado atual)
        const efetividadeBase = resultadoEstrategias.efeitividadeCombinada?.efetividadePercentual || 0;

        // Calcular impacto base (usando o impacto original)
        const impactoOriginal = Math.abs(impactoBase.diferencaCapitalGiro || 0);

        // Criar arrays para evolução temporal
        const efetividadePorAno = [];
        const impactoMitigadoPorAno = [];
        const impactoResidualPorAno = [];

        // Para cada ano, calcular valores baseados no percentual de implementação
        anos.forEach(ano => {
            // Obter percentual de implementação para o ano
            const percentualImplementacao = window.CurrentTaxSystem.obterPercentualImplementacao(ano);

            // A efetividade cresce com o passar do tempo (simulação)
            // Começa com 80% da efetividade base e chega a 100% no final
            const fatorEfetividade = 0.8 + (0.2 * percentualImplementacao);
            const efetividadeAno = efetividadeBase * fatorEfetividade;

            // O impacto cresce com o percentual de implementação
            const impactoAno = impactoOriginal * percentualImplementacao;

            // O impacto mitigado é proporcional à efetividade
            const impactoMitigado = impactoAno * (efetividadeAno / 100);

            // O impacto residual é o que sobra
            const impactoResidual = impactoAno - impactoMitigado;

            // Adicionar aos arrays
            efetividadePorAno.push(efetividadeAno);
            impactoMitigadoPorAno.push(impactoMitigado);
            impactoResidualPorAno.push(impactoResidual);
        });

        // Retornar estrutura simulada
        return {
            anos,
            efetividadePorAno,
            impactoMitigadoPorAno,
            impactoResidualPorAno
        };
    }

    /**
     * Renderizar gráfico de comparação entre sistemas tributários
     * @param {Object} resultadoEstrategias - Resultado das estratégias
     * @param {Object} impactoBase - Impacto base
     * @param {number} anoSelecionado - Ano selecionado
     * @param {number} percentualImplementacao - Percentual de implementação
     */
    function renderizarGraficoComparacaoSistemas(resultadoEstrategias, impactoBase, anoSelecionado, percentualImplementacao) {
        const canvas = document.getElementById('grafico-comparacao-estrategias');
        if (!canvas) {
            console.error('Elemento canvas para gráfico de comparação de sistemas não encontrado');
            return;
        }
        
        // ADICIONAR ESTAS LINHAS:
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            existingChart.destroy();
        }

        // Destruir gráfico anterior se existir
        if (_charts.comparacaoSistemas) {
            _charts.comparacaoSistemas.destroy();
        }

        // Verificar se temos os dados de comparação entre sistemas
        if (!resultadoEstrategias.impactoSistemasComparados) {
            console.warn('Dados de comparação entre sistemas não disponíveis');
            return;
        }

        // Extrair dados para o gráfico
        const sistemaAtual = resultadoEstrategias.impactoSistemasComparados.atual;
        const sistemaIVASemSplit = resultadoEstrategias.impactoSistemasComparados.ivaSemSplit;
        const sistemaIVAComSplit = resultadoEstrategias.impactoSistemasComparados.ivaComSplit;

        // Criar dados para o gráfico
        const data = {
            labels: ['Capital de Giro', 'Impostos', 'Efetividade Mitigação'],
            datasets: [
                {
                    label: 'Regime Atual',
                    data: [
                        sistemaAtual.capitalGiro,
                        sistemaAtual.impostos,
                        sistemaAtual.impactoMitigado
                    ],
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'IVA sem Split',
                    data: [
                        sistemaIVASemSplit.capitalGiro,
                        sistemaIVASemSplit.impostos,
                        sistemaIVASemSplit.impactoMitigado
                    ],
                    backgroundColor: 'rgba(255, 206, 86, 0.7)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1
                },
                {
                    label: 'IVA com Split',
                    data: [
                        sistemaIVAComSplit.capitalGiro,
                        sistemaIVAComSplit.impostos,
                        sistemaIVAComSplit.impactoMitigado
                    ],
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        };

        // Configurar opções do gráfico
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Comparação entre Sistemas Tributários (${anoSelecionado} - ${percentualImplementacao.toFixed(0)}%)`,
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                if (context.datasetIndex === 2) {
                                    label += context.parsed.y.toFixed(1) + '%';
                                } else {
                                    label += new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                    }).format(context.parsed.y);
                                }
                            }
                            return label;
                        }
                    }
                },
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                                maximumFractionDigits: 0
                            }).format(value);
                        }
                    }
                }
            }
        };

        // Criar o gráfico
        _charts.comparacaoSistemas = new Chart(canvas, {
            type: 'bar',
            data: data,
            options: options
        });
    }

    /**
     * Renderizar gráfico de efetividade das estratégias
     * @param {Object} resultadoEstrategias - Resultado das estratégias de mitigação
     * @param {number} anoSelecionado - Ano selecionado para visualização
     * @param {number} percentualImplementacao - Percentual de implementação do Split Payment
     */
    function renderizarGraficoEfetividadeEstrategias(resultadoEstrategias, anoSelecionado, percentualImplementacao) {
        const canvas = document.getElementById('grafico-efetividade-estrategias');
        if (!canvas) {
            console.error('Elemento canvas para gráfico de efetividade de estratégias não encontrado');
            return;
        }
        
        // ADICIONAR ESTAS LINHAS:
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            existingChart.destroy();
        }

        // Destruir gráfico anterior se existir
        if (_charts.efetividadeEstrategias) {
            _charts.efetividadeEstrategias.destroy();
        }

        // Verificar se temos dados de estratégias
        const estrategiasAtivas = [];

        // Tentar extrair dados de várias fontes possíveis
        if (resultadoEstrategias.resultadosEstrategias) {
            // Extrair de resultadosEstrategias (formato padrão)
            Object.entries(resultadoEstrategias.resultadosEstrategias).forEach(([nome, resultado]) => {
                if (resultado && resultado !== null) {
                    estrategiasAtivas.push({
                        nome: window.SimuladorFluxoCaixa?.traduzirNomeEstrategia?.(nome) || nome,
                        efetividade: resultado.efetividadePercentual || 0
                    });
                }
            });
        } else if (resultadoEstrategias.dadosGraficos && resultadoEstrategias.dadosGraficos.efetividade) {
            // Extrair de dadosGraficos.efetividade (formato alternativo)
            estrategiasAtivas.push(...resultadoEstrategias.dadosGraficos.efetividade.estrategias);
        }

        // Se não encontrarmos estratégias ativas de nenhuma forma, usar mensagem padrão
        if (estrategiasAtivas.length === 0) {
            console.warn('Sem estratégias ativas para visualização');
            // Criar um gráfico vazio ou com mensagem
            _charts.efetividadeEstrategias = new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: ['Sem estratégias ativas'],
                    datasets: [{
                        label: 'Efetividade (%)',
                        data: [0],
                        backgroundColor: 'rgba(200, 200, 200, 0.7)',
                        borderColor: 'rgba(200, 200, 200, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: `Efetividade das Estratégias de Mitigação (${anoSelecionado} - ${percentualImplementacao.toFixed(0)}%)`,
                            font: { size: 16 }
                        },
                        subtitle: {
                            display: true,
                            text: 'Nenhuma estratégia ativa configurada',
                            font: { size: 14, style: 'italic' }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    }
                }
            });
            return;
        }

        // Preparar dados para o gráfico
        const labels = estrategiasAtivas.map(e => e.nome);
        const efetividades = estrategiasAtivas.map(e => e.efetividade);

        // Adicionar efetividade combinada se disponível
        if (resultadoEstrategias.efeitividadeCombinada && 
            resultadoEstrategias.efeitividadeCombinada.efetividadePercentual !== undefined) {
            labels.push('Combinada');
            efetividades.push(resultadoEstrategias.efeitividadeCombinada.efetividadePercentual);
        }

        // Criar dados para o gráfico
        const data = {
            labels: labels,
            datasets: [{
                label: 'Efetividade (%)',
                data: efetividades,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(54, 162, 235, 0.9)' // Destacar combinada
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(54, 162, 235, 1)'
                ],
                borderWidth: 1
            }]
        };

        // Configurar opções do gráfico
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Efetividade das Estratégias de Mitigação (${anoSelecionado} - ${percentualImplementacao.toFixed(0)}%)`,
                    font: { size: 16 }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(1) + '%';
                            }
                            return label;
                        }
                    }
                },
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        };

        // Criar o gráfico
        _charts.efetividadeEstrategias = new Chart(canvas, {
            type: 'bar',
            data: data,
            options: options
        });
    }

    /**
     * Renderizar gráfico de comparação antes/depois das estratégias
     * @param {Object} resultadoEstrategias - Resultado das estratégias de mitigação
     * @param {Object} impactoBase - Impacto base para comparação
     */
    function renderizarGraficoComparacaoEstrategias(resultadoEstrategias, impactoBase) {
        const canvas = document.getElementById('grafico-comparacao-estrategias');
        if (!canvas) {
            console.error('Elemento canvas para gráfico de comparação de estratégias não encontrado');
            return;
        }
        
        // ADICIONAR ESTAS LINHAS:
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            existingChart.destroy();
        }

        // Destruir gráfico anterior se existir
        if (_charts.comparacaoEstrategias) {
            _charts.comparacaoEstrategias.destroy();
        }

        // Verificar se temos dados de gráficos específicos
        if (!resultadoEstrategias.dadosGraficos || !resultadoEstrategias.dadosGraficos.comparacaoImpacto) {
            // Preparar dados manualmente
            const diferencaOriginal = Math.abs(impactoBase.diferencaCapitalGiro || 0);
            const efetividadePercentual = resultadoEstrategias.efeitividadeCombinada?.efetividadePercentual || 0;
            const diferencaMitigada = diferencaOriginal * (1 - efetividadePercentual/100);

            const necessidadeOriginal = Math.abs(impactoBase.necessidadeAdicionalCapitalGiro || 0);
            const necessidadeMitigada = necessidadeOriginal * (1 - efetividadePercentual/100);

            // Criar dados para o gráfico
            const data = {
                labels: ['Sem Mitigação', 'Com Mitigação'],
                datasets: [
                    {
                        label: 'Diferença no Capital de Giro',
                        data: [diferencaOriginal, diferencaMitigada],
                        backgroundColor: 'rgba(255, 99, 132, 0.7)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Necessidade Adicional',
                        data: [necessidadeOriginal, necessidadeMitigada],
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }
                ]
            };

            // Configurar opções do gráfico
            const options = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Comparação do Impacto Antes e Após Mitigação',
                        font: {
                            size: 16
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                    }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    },
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                    maximumFractionDigits: 0
                                }).format(value);
                            }
                        }
                    }
                }
            };

            // Criar o gráfico
            _charts.comparacaoEstrategias = new Chart(canvas, {
                type: 'bar',
                data: data,
                options: options
            });
        } else {
            // Usar dados formatados especificamente para gráficos
            const dadosComparacao = resultadoEstrategias.dadosGraficos.comparacaoImpacto;

            // Criar dados para o gráfico
            const data = {
                labels: dadosComparacao.labels,
                datasets: [
                    {
                        label: 'Diferença no Capital de Giro',
                        data: dadosComparacao.diferencaCapitalGiro,
                        backgroundColor: 'rgba(255, 99, 132, 0.7)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Necessidade Adicional',
                        data: dadosComparacao.necessidadeAdicional,
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }
                ]
            };

            // Configurar opções do gráfico
            const options = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Comparação do Impacto Antes e Após Mitigação',
                        font: {
                            size: 16
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                    }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    },
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                    maximumFractionDigits: 0
                                }).format(value);
                            }
                        }
                    }
                }
            };

            // Criar o gráfico
            _charts.comparacaoEstrategias = new Chart(canvas, {
                type: 'bar',
                data: data,
                options: options
            });
        }
    }

    /**
     * Renderizar gráfico de evolução temporal das estratégias
     * @param {Object} evolucaoTemporal - Dados de evolução temporal das estratégias
     */
    function renderizarGraficoEvolucaoEstrategias(evolucaoTemporal) {
        const canvas = document.getElementById('grafico-evolucao-estrategias');
        if (!canvas) {
            console.error('Elemento canvas para gráfico de evolução das estratégias não encontrado');
            return;
        }
        
        // ADICIONAR ESTAS LINHAS:
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            existingChart.destroy();
        }

        // Destruir gráfico anterior se existir
        if (_charts.evolucaoEstrategias) {
            _charts.evolucaoEstrategias.destroy();
        }

        // Verificar se temos dados de evolução
        if (!evolucaoTemporal.anos || evolucaoTemporal.anos.length === 0) {
            console.warn('Sem dados de evolução temporal para estratégias');
            return;
        }

        // Criar dados para o gráfico
        const data = {
            labels: evolucaoTemporal.anos,
            datasets: [
                {
                    label: 'Efetividade (%)',
                    data: evolucaoTemporal.efetividadePorAno,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    yAxisID: 'y1',
                    type: 'line'
                },
                {
                    label: 'Impacto Mitigado',
                    data: evolucaoTemporal.impactoMitigadoPorAno,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    yAxisID: 'y',
                    type: 'bar'
                },
                {
                    label: 'Impacto Residual',
                    data: evolucaoTemporal.impactoResidualPorAno,
                    backgroundColor: 'rgba(255, 206, 86, 0.7)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1,
                    yAxisID: 'y',
                    type: 'bar'
                }
            ]
        };

        // Configurar opções do gráfico
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Evolução Temporal das Estratégias de Mitigação',
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                if (context.datasetIndex === 0) {
                                    label += context.parsed.y.toFixed(1) + '%';
                                } else {
                                    label += new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                    }).format(context.parsed.y);
                                }
                            }
                            return label;
                        }
                    }
                },
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Valores (R$)'
                    },
                    ticks: {
                        callback: function(value) {
                            return new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                                maximumFractionDigits: 0
                            }).format(value);
                        }
                    },
                    stacked: true
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Efetividade (%)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        };

        // Criar o gráfico
        _charts.evolucaoEstrategias = new Chart(canvas, {
            type: 'bar',
            data: data,
            options: options
        });
    }
    
    /**
     * Limpa todos os gráficos existentes
     * Útil para reinicializar a interface ou antes de renderizar novos resultados
     */
    function limparGraficos() {
        // Destruir as instâncias existentes de gráficos
        for (const tipo in _charts) {
            if (_charts[tipo]) {
                _charts[tipo].destroy();
                console.log(`Gráfico de ${tipo} destruído`);
            }
        }

        // Reinicializar o objeto _charts
        _charts = {};

        console.log('Todos os gráficos foram limpos');
    }

    // Exportar API pública
    return {
        inicializar,
        renderizarGraficos,
        renderizarGraficosDetalhamento,
        renderizarGraficoFluxoCaixa,
        renderizarGraficoCapitalGiro,
        renderizarGraficoProjecao,
        renderizarGraficoDecomposicao,
        renderizarGraficoSensibilidade,
        renderizarGraficoEstrategias,     // Nova função para estratégias
        renderizarGraficoEfetividadeEstrategias,  // Nova função auxiliar
        renderizarGraficoComparacaoEstrategias,   // Nova função auxiliar
        renderizarGraficoEvolucaoEstrategias,     // Nova função auxiliar
        limparGraficos
    };
})();

// Inicializar o gerenciador de gráficos quando o documento estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    if (window.ChartManager && typeof window.ChartManager.inicializar === 'function') {
        window.ChartManager.inicializar();
    }
});