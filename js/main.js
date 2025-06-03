// Verificação imediata
console.log('main.js carregado, SimuladorFluxoCaixa disponível?', !!window.SimuladorFluxoCaixa);
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, SimuladorFluxoCaixa disponível?', !!window.SimuladorFluxoCaixa);
});

function inicializarModulos() {
    console.log('Inicializando módulos do sistema...');
    
    // Verificar se o CalculationCore está disponível
    if (!window.CalculationCore) {
        console.warn('CalculationCore não encontrado. Algumas funcionalidades podem estar limitadas.');
    }

    // Verificar se o DataManager está disponível
    if (!window.DataManager) {
        console.error('DataManager não encontrado. O simulador pode não funcionar corretamente.');
    } else {
        console.log('DataManager disponível. Modo debug:', window.location.search.includes('debug=true'));
    }

    console.log('Módulos inicializados com sucesso');
    return true;
}

// Chamar no carregamento da página
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar módulos básicos na ordem correta
    inicializarModulos();
    
    // Inicializar repository com integração ao DataManager
    inicializarRepository();
    
    // Inicializar simulador
    if (window.SimuladorFluxoCaixa && typeof window.SimuladorFluxoCaixa.init === 'function') {
        window.SimuladorFluxoCaixa.init();
    }
    
    // Inicializar gerenciador de setores (após repository para carregar dados persistidos)
    if (typeof SetoresManager !== 'undefined') {
        SetoresManager.inicializar();
        
        // Preencher dropdown de setores na aba de simulação
        SetoresManager.preencherDropdownSetores('setor');
    }
    
    // Inicializar UI components
    const uiComponents = [
        { name: 'TabsManager', method: 'inicializar' },
        { name: 'FormsManager', method: 'inicializar' },
        { name: 'ModalManager', method: 'inicializar' }
    ];
    
    uiComponents.forEach(component => {
        if (typeof window[component.name] !== 'undefined') {
            window[component.name][component.method]();
            console.log(`${component.name} inicializado`);
        } else {
            console.warn(`${component.name} não encontrado`);
        }
    });
    
    // Inicializa o ImportacaoController
    if (typeof ImportacaoController !== 'undefined' && ImportacaoController.inicializar) {
        ImportacaoController.inicializar();
    }
    
    // Inicializar eventos principais
    inicializarEventosPrincipais();
    
    // Configurar observadores
    observarMudancasDeAba();
    observarCamposCriticos();
    
    // Inicializar campos específicos com base na estrutura canônica do DataManager
    const dadosPadrao = window.DataManager.obterEstruturaAninhadaPadrao();
    
    // Aplicar valores padrão aos campos se não tiverem sido carregados do repository
    atualizarCamposComDadosPadrao(dadosPadrao);
    
    // Inicializar campos específicos
    ajustarCamposTributarios();
    ajustarCamposOperacao();
    calcularCreditosTributarios();
    
    // Inicializar formatação de moeda
    if (window.CurrencyFormatter && typeof window.CurrencyFormatter.inicializar === 'function') {
        window.CurrencyFormatter.inicializar();
    }
    
    // Adicionar variável global para controle de processamento SPED
    window.processandoSPED = false; 
    
    console.log('Inicialização completa com arquitetura de dados padronizada');
});

/**
 * Atualiza os campos da interface com os valores padrão da estrutura canônica
 * @param {Object} dadosPadrao - Estrutura canônica com valores padrão
 */
function atualizarCamposComDadosPadrao(dadosPadrao) {
    // Mapear os campos principais da interface com suas seções e propriedades na estrutura canônica
    const mapeamentoCampos = [
        { id: 'faturamento', secao: 'empresa', prop: 'faturamento', tipo: 'monetario' },
        { id: 'margem', secao: 'empresa', prop: 'margem', tipo: 'percentual' },
        { id: 'pmr', secao: 'cicloFinanceiro', prop: 'pmr', tipo: 'numero' },
        { id: 'pmp', secao: 'cicloFinanceiro', prop: 'pmp', tipo: 'numero' },
        { id: 'pme', secao: 'cicloFinanceiro', prop: 'pme', tipo: 'numero' },
        { id: 'perc-vista', secao: 'cicloFinanceiro', prop: 'percVista', tipo: 'percentual' }
        // Adicionar outros campos conforme necessário
    ];
    
    mapeamentoCampos.forEach(campo => {
        const elemento = document.getElementById(campo.id);
        if (!elemento) return;
        
        // Obter valor padrão da estrutura canônica
        const valorPadrao = dadosPadrao[campo.secao]?.[campo.prop];
        if (valorPadrao === undefined) return;
        
        // Não sobrescrever valores já existentes
        if (elemento.value && elemento.value !== '0' && elemento.value !== '0,00' && elemento.value !== 'R$ 0,00') {
            return;
        }
        
        // Formatar o valor de acordo com o tipo
        switch (campo.tipo) {
            case 'monetario':
                elemento.value = window.DataManager.formatarMoeda(valorPadrao);
                break;
            case 'percentual':
                elemento.value = valorPadrao <= 1 ? (valorPadrao * 100).toFixed(2) : valorPadrao.toFixed(2);
                break;
            case 'numero':
                elemento.value = valorPadrao.toString();
                break;
            default:
                elemento.value = valorPadrao;
        }
        
        // Salvar o valor normalizado no dataset
        elemento.dataset.valorNormalizado = valorPadrao;
    });
    
    // Inicializar campos tributários e de operação após atualizar valores
    ajustarCamposTributarios();
    ajustarCamposOperacao();
    calcularCreditosTributarios();
}

/**
 * Inicializa eventos específicos da página principal
 */
function inicializarEventosPrincipais() {
    console.log('Inicializando eventos principais');
    
    // Evento para o botão Simular
    const btnSimular = document.getElementById('btn-simular');
    if (btnSimular) {
        btnSimular.addEventListener('click', function() {
            console.log('Botão Simular clicado');

            try {
                // Verificar se o simulador está disponível
                if (!window.SimuladorFluxoCaixa) {
                    throw new Error('Simulador não inicializado corretamente');
                }

                // Verificar disponibilidade do DataManager (componente obrigatório)
                if (!window.DataManager) {
                    throw new Error('DataManager não disponível. A simulação não pode continuar.');
                }

                // Obter dados usando o DataManager (estrutura aninhada)
                let dadosAninhados = window.DataManager.obterDadosDoFormulario();
                console.log('Dados obtidos do formulário (estrutura aninhada):', dadosAninhados);

                // NOVA FUNCIONALIDADE: Integrar dados do SPED se disponíveis
                dadosAninhados = integrarDadosSpedNaEstruturaPadrao(dadosAninhados);

                // Verificar se há dados do SPED e notificar
                if (dadosAninhados.dadosSpedImportados) {
                    console.log('Dados do SPED detectados e integrados à simulação');
                    adicionarNotificacaoSped();
                }

                // Se o repositório estiver disponível, atualizar com os novos dados
                if (typeof SimuladorRepository !== 'undefined') {
                    Object.keys(dadosAninhados).forEach(secao => {
                        if (dadosAninhados[secao]) {
                            SimuladorRepository.atualizarSecao(secao, dadosAninhados[secao]);
                        }
                    });
                    console.log('Repositório atualizado com os dados do formulário e SPED');
                }

                // Executar simulação, passando os dados obtidos
                const resultado = window.SimuladorFluxoCaixa.simular(dadosAninhados);

                if (!resultado) {
                    throw new Error('A simulação não retornou resultados');
                }

                // Processar resultados
                atualizarInterface(resultado);
                
                // **ADICIONAR AQUI:**
                mostrarPainelResultados();

                // Atualizar gráficos se o ChartManager estiver disponível
                if (typeof window.ChartManager !== 'undefined' && typeof window.ChartManager.renderizarGraficos === 'function') {
                    window.ChartManager.renderizarGraficos(resultado);
                } else {
                    console.warn('ChartManager não encontrado ou função renderizarGraficos indisponível');
                }

            } catch (erro) {
                console.error('Erro ao executar simulação:', erro);
                alert('Não foi possível realizar a simulação: ' + erro.message);
            }
        });
    } else {
        console.error('Botão Simular não encontrado no DOM');
    }
    
    // Evento para o botão Limpar
    const btnLimpar = document.getElementById('btn-limpar');
    if (btnLimpar) {
        btnLimpar.addEventListener('click', function() {
            console.log('Botão Limpar clicado');

            try {
                // 1. Limpar localStorage
                if (typeof SimuladorRepository !== 'undefined') {
                    // Opção 1: Remover completamente os dados salvos
                    localStorage.removeItem(SimuladorRepository.STORAGE_KEY);

                    // Opção 2: Restaurar para valores padrão (alternativa à remoção)
                    const dadosPadrao = window.DataManager.obterEstruturaAninhadaPadrao();
                    Object.keys(dadosPadrao).forEach(secao => {
                        SimuladorRepository.atualizarSecao(secao, dadosPadrao[secao]);
                    });

                    console.log('Dados do repositório limpos');
                }

                // 2. Limpar formulários
                const camposFormulario = [
                    'faturamento', 'margem', 'tipo-empresa', 'tipo-operacao', 'regime',
                    'aliquota-simples', 'pmr', 'pmp', 'pme', 'perc-vista',
                    'cenario', 'taxa-crescimento', 'data-inicial', 'data-final'
                ];

                camposFormulario.forEach(id => {
                    const campo = document.getElementById(id);
                    if (campo) {
                        if (campo.type === 'checkbox') {
                            campo.checked = false;
                        } else if (campo.tagName === 'SELECT') {
                            campo.selectedIndex = 0;
                        } else {
                            campo.value = '';
                        }

                        // Disparar evento de mudança para atualizar campos dependentes
                        const event = new Event('change');
                        campo.dispatchEvent(event);
                    }
                });

                // 3. Redefinir valores padrão específicos
                const campoFaturamento = document.getElementById('faturamento');
                if (campoFaturamento) {
                    campoFaturamento.value = 'R$ 0,00';
                    if (campoFaturamento.dataset) campoFaturamento.dataset.rawValue = '0';
                }

                document.getElementById('margem').value = '15';
                document.getElementById('pmr').value = '30';
                document.getElementById('pmp').value = '30';
                document.getElementById('pme').value = '30';
                document.getElementById('perc-vista').value = '30';

                // 4. Atualizar campos de ciclo financeiro e outros dependentes
                const cicloFinanceiro = document.getElementById('ciclo-financeiro');
                if (cicloFinanceiro) cicloFinanceiro.value = '30';

                const percPrazo = document.getElementById('perc-prazo');
                if (percPrazo) percPrazo.value = '70%';

                // 5. Limpar área de resultados
                const divResultadosDetalhados = document.getElementById('resultados-detalhados');
                if (divResultadosDetalhados) {
                    divResultadosDetalhados.style.display = 'none';
                }

                // 6. Limpar gráficos se o ChartManager estiver disponível
                if (typeof window.ChartManager !== 'undefined' && typeof window.ChartManager.limparGraficos === 'function') {
                    window.ChartManager.limparGraficos();
                }

                console.log('Formulários limpos com sucesso');
                alert('Os dados foram limpos. Você pode iniciar uma nova simulação.');

            } catch (erro) {
                console.error('Erro ao limpar formulários:', erro);
                alert('Ocorreu um erro ao limpar os formulários: ' + erro.message);
            }
        });
    } else {
        console.error('Botão Limpar não encontrado no DOM');
    }
    
    // Eventos para exportação
    const btnExportarPDF = document.getElementById('btn-exportar-pdf');
    if (btnExportarPDF) {
        btnExportarPDF.addEventListener('click', function() {
            console.log('Botão Exportar PDF clicado');
            if (typeof window.ExportTools !== 'undefined' && typeof window.ExportTools.exportarParaPDF === 'function') {
                window.ExportTools.exportarParaPDF();
            } else {
                console.error('ExportTools não disponível ou método exportarParaPDF não encontrado');
                alert('Ferramenta de exportação PDF não está disponível no momento.');
            }
        });
    } else {
        console.warn('Botão Exportar PDF não encontrado no DOM');
    }

    const btnExportarExcel = document.getElementById('btn-exportar-excel');
    if (btnExportarExcel) {
        btnExportarExcel.addEventListener('click', function() {
            console.log('Botão Exportar Excel clicado');
            if (typeof window.ExportTools !== 'undefined' && typeof window.ExportTools.exportarParaExcel === 'function') {
                window.ExportTools.exportarParaExcel();
            } else {
                console.error('ExportTools não disponível ou método exportarParaExcel não encontrado');
                alert('Ferramenta de exportação Excel não está disponível no momento.');
            }
        });
    } else {
        console.warn('Botão Exportar Excel não encontrado no DOM');
    }
    
    const btnExportarMemoria = document.getElementById('btn-exportar-memoria');
    if (btnExportarMemoria) {
        btnExportarMemoria.addEventListener('click', function() {
            if (typeof ExportTools !== 'undefined') {
                ExportTools.exportarMemoriaCalculo();
            }
        });
    }
    
    // Eventos para exportação de estratégias
    const btnExportarEstrategiasPDF = document.getElementById('btn-exportar-estrategias-pdf');
    if (btnExportarEstrategiasPDF) {
        btnExportarEstrategiasPDF.addEventListener('click', function() {
            console.log('Botão Exportar Estratégias PDF clicado');
            if (typeof window.ExportTools !== 'undefined' && typeof window.ExportTools.exportarParaPDF === 'function') {
                window.ExportTools.exportarParaPDF();
            } else {
                console.error('ExportTools não disponível ou método exportarParaPDF não encontrado');
                alert('Ferramenta de exportação PDF não está disponível no momento.');
            }
        });
    }

    const btnExportarEstrategiasExcel = document.getElementById('btn-exportar-estrategias-excel');
    if (btnExportarEstrategiasExcel) {
        btnExportarEstrategiasExcel.addEventListener('click', function() {
            console.log('Botão Exportar Estratégias Excel clicado');
            if (typeof window.ExportTools !== 'undefined' && typeof window.ExportTools.exportarParaExcel === 'function') {
                window.ExportTools.exportarParaExcel();
            } else {
                console.error('ExportTools não disponível ou método exportarParaExcel não encontrado');
                alert('Ferramenta de exportação Excel não está disponível no momento.');
            }
        });
    }
    
    // Event listener para mudança de setor - REATIVAR FUNCIONALIDADE
    const campoSetor = document.getElementById('setor');
    if (campoSetor) {
        campoSetor.addEventListener('change', function() {
            const setorCodigo = this.value;

            if (!setorCodigo) {
                // Limpar campos se nenhum setor selecionado
                document.getElementById('aliquota-cbs').value = '';
                document.getElementById('aliquota-ibs').value = '';
                document.getElementById('reducao').value = '';
                document.getElementById('aliquota').value = '';
                document.getElementById('categoria-iva').value = 'standard';
                return;
            }

            // Obter dados do setor do repositório
            if (typeof SetoresRepository !== 'undefined') {
                const dadosSetor = SetoresRepository.obterSetor(setorCodigo);

                if (dadosSetor) {
                    // Preencher campos com os dados pré-definidos do repositório
                    document.getElementById('aliquota-cbs').value = (dadosSetor['aliquota-cbs'] * 100).toFixed(1);
                    document.getElementById('aliquota-ibs').value = (dadosSetor['aliquota-ibs'] * 100).toFixed(1);
                    document.getElementById('reducao').value = (dadosSetor.reducaoEspecial * 100).toFixed(1);

                    // Usar a alíquota efetiva já definida no repositório (NÃO calcular)
                    document.getElementById('aliquota').value = (dadosSetor.aliquotaEfetiva * 100).toFixed(1);

                    // Definir categoria tributária
                    document.getElementById('categoria-iva').value = dadosSetor.categoriaIva || 'standard';

                    console.log(`Setor ${dadosSetor.nome} selecionado - campos preenchidos automaticamente`);
                } else {
                    console.warn(`Dados do setor ${setorCodigo} não encontrados`);
                }
            } else {
                console.error('SetoresRepository não disponível');
            }
        });

        console.log('Event listener para mudança de setor configurado');
    } else {
        console.error('Campo setor não encontrado no DOM');
    }
    
    // Evento para atualização da memória de cálculo
    const btnAtualizarMemoria = document.getElementById('btn-atualizar-memoria');
    if (btnAtualizarMemoria) {
        btnAtualizarMemoria.addEventListener('click', function() {
            atualizarExibicaoMemoriaCalculo();
        });
    }
    
    // Evento para select de anos da memória
    const selectAnoMemoria = document.getElementById('select-ano-memoria');
    if (selectAnoMemoria) {
        selectAnoMemoria.addEventListener('change', function() {
            atualizarExibicaoMemoriaCalculo();
        });
    }
    
    // Função para atualizar exibição da memória de cálculo
    // Adicionar ao main.js
    function atualizarExibicaoMemoriaCalculo() {
        const selectAno = document.getElementById('select-ano-memoria');
        if (!selectAno) return;

        const anoSelecionado = selectAno.value;
        console.log('Atualizando memória para o ano:', anoSelecionado);

        // Verificar se temos dados de memória de cálculo disponíveis
        if (!window.memoriaCalculoSimulacao) {
            const conteudo = '<p class="text-muted">Realize uma simulação para gerar a memória de cálculo detalhada.</p>';
            document.getElementById('memoria-calculo').innerHTML = conteudo;
            return;
        }

        // Extrair dados de memória
        const memoria = window.memoriaCalculoSimulacao;

        // Formatar valores usando o DataManager
        const formatarMoeda = window.DataManager.formatarMoeda;
        const formatarPercentual = valor => {
            return valor ? window.DataManager.formatarPercentual(valor) : 'N/A';
        };

        // Gerar conteúdo HTML para a memória de cálculo
        let conteudo = `
            <div class="memory-section">
                <h3>1. Dados de Entrada</h3>
                <div class="memory-content">
                    <p><strong>Empresa:</strong> ${memoria.dadosEntrada?.empresa?.faturamento ? formatarMoeda(memoria.dadosEntrada.empresa.faturamento) : 'N/A'}</p>
                    <p><strong>Margem:</strong> ${memoria.dadosEntrada?.empresa?.margem ? formatarPercentual(memoria.dadosEntrada.empresa.margem) : 'N/A'}</p>
                    <p><strong>Ciclo Financeiro:</strong> PMR = ${memoria.dadosEntrada?.cicloFinanceiro?.pmr || 'N/A'}, 
                       PMP = ${memoria.dadosEntrada?.cicloFinanceiro?.pmp || 'N/A'}, 
                       PME = ${memoria.dadosEntrada?.cicloFinanceiro?.pme || 'N/A'}</p>
                    <p><strong>Distribuição de Vendas:</strong> À Vista = ${memoria.dadosEntrada?.cicloFinanceiro?.percVista ? formatarPercentual(memoria.dadosEntrada.cicloFinanceiro.percVista) : 'N/A'}, 
                       A Prazo = ${memoria.dadosEntrada?.cicloFinanceiro?.percPrazo ? formatarPercentual(memoria.dadosEntrada.cicloFinanceiro.percPrazo) : 'N/A'}</p>
                    <p><strong>Alíquota:</strong> ${memoria.dadosEntrada?.parametrosFiscais?.aliquota ? formatarPercentual(memoria.dadosEntrada.parametrosFiscais.aliquota) : 'N/A'}</p>
                </div>
            </div>

            <div class="memory-section">
                <h3>2. Cálculo do Impacto Base</h3>
                <div class="memory-content">
                    <p><strong>Diferença no Capital de Giro:</strong> ${memoria.impactoBase?.diferencaCapitalGiro ? formatarMoeda(memoria.impactoBase.diferencaCapitalGiro) : 'N/A'}</p>
                    <p><strong>Percentual de Impacto:</strong> ${memoria.impactoBase?.percentualImpacto ? formatarPercentual(memoria.impactoBase.percentualImpacto/100) : 'N/A'}</p>
                    <p><strong>Impacto em Dias de Faturamento:</strong> ${memoria.impactoBase?.impactoDiasFaturamento ? memoria.impactoBase.impactoDiasFaturamento.toFixed(1) + ' dias' : 'N/A'}</p>
                </div>
            </div>

            <div class="memory-section">
                <h3>3. Projeção Temporal</h3>
                <div class="memory-content">
                    <p><strong>Cenário:</strong> ${memoria.projecaoTemporal?.parametros?.cenarioTaxaCrescimento || 'N/A'}</p>
                    <p><strong>Taxa de Crescimento:</strong> ${memoria.projecaoTemporal?.parametros?.taxaCrescimento ? formatarPercentual(memoria.projecaoTemporal.parametros.taxaCrescimento) : 'N/A'}</p>
                    <p><strong>Necessidade Total de Capital de Giro:</strong> ${memoria.projecaoTemporal?.impactoAcumulado?.totalNecessidadeCapitalGiro ? formatarMoeda(memoria.projecaoTemporal.impactoAcumulado.totalNecessidadeCapitalGiro) : 'N/A'}</p>
                    <p><strong>Custo Financeiro Total:</strong> ${memoria.projecaoTemporal?.impactoAcumulado?.custoFinanceiroTotal ? formatarMoeda(memoria.projecaoTemporal.impactoAcumulado.custoFinanceiroTotal) : 'N/A'}</p>
                </div>
            </div>

            <div class="memory-section">
                <h3>4. Memória Crítica de Cálculo</h3>
                <div class="memory-content">
                    <p><strong>Fórmula:</strong> ${memoria.memoriaCritica?.formula || 'N/A'}</p>
                    <div class="steps-container">
                        <p><strong>Passo a Passo:</strong></p>
                        <ol>
                            ${(memoria.memoriaCritica?.passoAPasso || []).map(passo => `<li>${passo}</li>`).join('')}
                        </ol>
                    </div>
                    <div class="observations-container">
                        <p><strong>Observações:</strong></p>
                        <ul>
                            ${(memoria.memoriaCritica?.observacoes || []).map(obs => `<li>${obs}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;

        // Adicionar o conteúdo à div de memória de cálculo
        document.getElementById('memoria-calculo').innerHTML = conteudo;
    }
    
    // Exportar a função para o escopo global
    window.exibirMemoriaCalculo = atualizarExibicaoMemoriaCalculo;
    
    // Evento para simulação de estratégias
     const btnSimularEstrategias = document.getElementById('btn-simular-estrategias');
    if (btnSimularEstrategias) {
        btnSimularEstrategias.addEventListener('click', function() {
            // Corrigir a referência para a função
            if (window.SimuladorFluxoCaixa && typeof window.SimuladorFluxoCaixa.simularEstrategias === 'function') {
                window.SimuladorFluxoCaixa.simularEstrategias();
            } else {
                console.error('Função de simulação de estratégias não encontrada');
                alert('Não foi possível simular estratégias. Verifique se todos os módulos foram carregados corretamente.');
            }
        });
    }
    
    // Adicionar evento para salvar setores que atualize os dropdowns
    const btnSalvarSetor = document.getElementById('btn-salvar-setor');
    if (btnSalvarSetor) {
        btnSalvarSetor.addEventListener('click', function() {
            // Após salvar o setor, atualizar dropdown na aba de simulação
            setTimeout(function() {
                SetoresManager.preencherDropdownSetores('setor');
            }, 100);
        });
    }
    
    // BOTÕES DE LOG DE IMPORTAÇÃO
    const btnLimparLog = document.getElementById('btn-limpar-log');
    if (btnLimparLog) {
        btnLimparLog.addEventListener('click', limparLogImportacao);
    }
    
    const btnExportarLog = document.getElementById('btn-exportar-log');
    if (btnExportarLog) {
        btnExportarLog.addEventListener('click', exportarLogImportacao);
    }
    
    // FILTROS DE LOG
    const filtros = ['filtro-info', 'filtro-warning', 'filtro-error', 'filtro-success'];
    filtros.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', aplicarFiltrosLog);
        }
    });
    
    // BOTÃO DE DETALHES DA IMPORTAÇÃO
    const btnDetalhes = document.getElementById('btn-detalhes-importacao');
    if (btnDetalhes) {
        btnDetalhes.addEventListener('click', exibirDetalhesImportacao);
    }

    /**
     * Correções e adições para o arquivo main.js
     * Adiciona suporte aos botões de log e melhora a integração SPED
     * VERSÃO CORRIGIDA - Janeiro 2025
     */

    // Função para limpar log de importação
    function limparLogImportacao() {
        const logArea = document.getElementById('import-log');
        if (logArea) {
            logArea.innerHTML = '<p class="text-muted">Log limpo pelo usuário.</p>';
        }

        // Resetar estatísticas
        const stats = ['stat-total', 'stat-success', 'stat-warnings', 'stat-errors'];
        stats.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = '0';
        });

        // Ocultar seção de estatísticas
        const logStatistics = document.getElementById('log-statistics');
        if (logStatistics) {
            logStatistics.style.display = 'none';
        }

        console.log('MAIN: Log de importação limpo');
    }

    // Função para exportar log de importação
    function exportarLogImportacao() {
        const logArea = document.getElementById('import-log');
        if (!logArea) return;

        const logContent = logArea.innerText || logArea.textContent;

        if (!logContent || logContent.trim() === 'Log limpo pelo usuário.' || 
            logContent.includes('Selecione os arquivos SPED')) {
            alert('Não há dados de log para exportar.');
            return;
        }

        const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `log-importacao-sped-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        console.log('MAIN: Log de importação exportado');
    }

    // Função para aplicar filtros de log
    function aplicarFiltrosLog() {
        const logArea = document.getElementById('import-log');
        if (!logArea) return;

        const filtros = {
            info: document.getElementById('filtro-info')?.checked !== false,
            warning: document.getElementById('filtro-warning')?.checked !== false,
            error: document.getElementById('filtro-error')?.checked !== false,
            success: document.getElementById('filtro-success')?.checked !== false
        };

        const logItems = logArea.querySelectorAll('p[class*="log-"]');

        logItems.forEach(item => {
            let mostrar = false;

            Object.keys(filtros).forEach(tipo => {
                if (item.classList.contains(`log-${tipo}`) && filtros[tipo]) {
                    mostrar = true;
                }
            });

            item.style.display = mostrar ? 'block' : 'none';
        });

        console.log('MAIN: Filtros de log aplicados', filtros);
    }

    // Função para exibir detalhes da importação SPED
    function exibirDetalhesImportacao() {
        if (!window.dadosImportadosSped) {
            alert('Nenhum dado SPED foi importado ainda.');
            return;
        }

        // Criar modal com detalhes da importação
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        const dados = window.dadosImportadosSped;
        const empresa = dados.empresa || {};
        const parametrosFiscais = dados.parametrosFiscais || {};
        const metadados = dados.metadados || {};

        modal.innerHTML = `
            <div class="modal" style="max-width: 800px; max-height: 80vh; overflow-y: auto; background: white; border-radius: 8px; padding: 0;">
                <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0;">Detalhes da Importação SPED</h3>
                    <button type="button" class="modal-close" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <h4 style="color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 5px;">Dados da Empresa</h4>
                    <div style="margin-bottom: 20px;">
                        <p><strong>Razão Social:</strong> ${empresa.nome || 'N/A'}</p>
                        <p><strong>CNPJ:</strong> ${empresa.cnpj || 'N/A'}</p>
                        <p><strong>Faturamento Mensal:</strong> ${formatarMoedaDetalhes(empresa.faturamento || 0)}</p>
                        <p><strong>Margem Operacional:</strong> ${((empresa.margem || 0) * 100).toFixed(2)}%</p>
                        <p><strong>Tipo de Empresa:</strong> ${empresa.tipoEmpresa || 'N/A'}</p>
                        <p><strong>Regime Tributário:</strong> ${empresa.regime || 'N/A'}</p>
                    </div>

                    <h4 style="color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 5px;">Composição Tributária</h4>
                    <div style="margin-bottom: 20px;">
                        ${parametrosFiscais.composicaoTributaria ? gerarTabelaComposicao(parametrosFiscais.composicaoTributaria) : '<p>Dados não disponíveis</p>'}
                    </div>

                    <h4 style="color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 5px;">Metadados da Importação</h4>
                    <div style="margin-bottom: 20px;">
                        <p><strong>Fonte dos Dados:</strong> ${metadados.fonteDados || 'N/A'}</p>
                        <p><strong>Data de Importação:</strong> ${metadados.timestampImportacao ? new Date(metadados.timestampImportacao).toLocaleString('pt-BR') : 'N/A'}</p>
                        <p><strong>Qualidade dos Dados:</strong> ${metadados.qualidadeDados?.classificacao || 'N/A'}</p>
                        ${metadados.arquivosProcessados?.length ? `
                            <p><strong>Arquivos Processados:</strong></p>
                            <ul>
                                ${metadados.arquivosProcessados.map(arquivo => `
                                    <li>${arquivo.nomeArquivo || 'Arquivo'} (${arquivo.tipoArquivo || 'Tipo desconhecido'})</li>
                                `).join('')}
                            </ul>
                        ` : ''}
                    </div>
                </div>
                <div class="modal-footer" style="padding: 20px; border-top: 1px solid #ddd; text-align: right;">
                    <button type="button" class="btn btn-secondary" style="padding: 8px 16px; border: 1px solid #6c757d; background: #6c757d; color: white; border-radius: 4px; cursor: pointer;">Fechar</button>
                </div>
            </div>
        `;

        // Adicionar event listeners
        const closeBtn = modal.querySelector('.modal-close');
        const footerBtn = modal.querySelector('.btn-secondary');

        const fecharModal = () => {
            document.body.removeChild(modal);
        };

        closeBtn.addEventListener('click', fecharModal);
        footerBtn.addEventListener('click', fecharModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) fecharModal();
        });

        document.body.appendChild(modal);
    }
    
    /**
     * Verifica se há dados do SPED disponíveis e os prioriza nos cálculos
     * @returns {Object|null} Dados do SPED se disponíveis
     */
    function obterDadosSpedPrioritarios() {
        // Verificar se há dados marcados como vindos do SPED
        const camposSpedData = document.querySelectorAll('.sped-data');
        if (camposSpedData.length === 0) {
            return null;
        }

        // Extrair dados do painel de composição tributária detalhada
        const extrairValorMonetario = (id) => {
            const elemento = document.getElementById(id);
            if (!elemento || !elemento.value) return 0;

            // Usar o mesmo método do DataManager para extrair valor
            if (window.DataManager && window.DataManager.extrairValorMonetario) {
                return window.DataManager.extrairValorMonetario(elemento.value);
            }

            // Fallback: extrair valor manualmente
            return parseFloat(elemento.value.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
        };

        const extrairValorPercentual = (id) => {
            const elemento = document.getElementById(id);
            if (!elemento || !elemento.value) return 0;
            return parseFloat(elemento.value) || 0;
        };

        return {
            // Sinalizar que são dados do SPED
            origemSped: true,

            // Débitos mensais
            debitos: {
                pis: extrairValorMonetario('debito-pis'),
                cofins: extrairValorMonetario('debito-cofins'),
                icms: extrairValorMonetario('debito-icms'),
                ipi: extrairValorMonetario('debito-ipi'),
                iss: extrairValorMonetario('debito-iss')
            },

            // Créditos mensais
            creditos: {
                pis: extrairValorMonetario('credito-pis'),
                cofins: extrairValorMonetario('credito-cofins'),
                icms: extrairValorMonetario('credito-icms'),
                ipi: extrairValorMonetario('credito-ipi'),
                iss: extrairValorMonetario('credito-iss')
            },

            // Alíquotas efetivas
            aliquotasEfetivas: {
                pis: extrairValorPercentual('aliquota-efetiva-pis'),
                cofins: extrairValorPercentual('aliquota-efetiva-cofins'),
                icms: extrairValorPercentual('aliquota-efetiva-icms'),
                ipi: extrairValorPercentual('aliquota-efetiva-ipi'),
                iss: extrairValorPercentual('aliquota-efetiva-iss'),
                total: extrairValorPercentual('aliquota-efetiva-total')
            },

            // Totais
            totalDebitos: extrairValorMonetario('total-debitos'),
            totalCreditos: extrairValorMonetario('total-creditos')
        };
    }

    // Função auxiliar para gerar tabela de composição tributária
    function gerarTabelaComposicao(composicao) {
        const { debitos, creditos, aliquotasEfetivas } = composicao;

        return `
            <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
                <thead>
                    <tr style="background-color: #f8f9fa;">
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Imposto</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Débitos</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Créditos</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Alíquota Efetiva</th>
                    </tr>
                </thead>
                <tbody>
                    ${['pis', 'cofins', 'icms', 'ipi', 'iss'].map(imposto => `
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 8px;">${imposto.toUpperCase()}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatarMoedaDetalhes(debitos[imposto] || 0)}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatarMoedaDetalhes(creditos[imposto] || 0)}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${(aliquotasEfetivas[imposto] || 0).toFixed(3)}%</td>
                        </tr>
                    `).join('')}
                    <tr style="background-color: #f8f9fa; font-weight: bold;">
                        <td style="border: 1px solid #ddd; padding: 8px;">TOTAL</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatarMoedaDetalhes(Object.values(debitos).reduce((sum, val) => sum + (val || 0), 0))}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatarMoedaDetalhes(Object.values(creditos).reduce((sum, val) => sum + (val || 0), 0))}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${(aliquotasEfetivas.total || 0).toFixed(3)}%</td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    // Função auxiliar para formatação de moeda nos detalhes
    function formatarMoedaDetalhes(valor) {
        if (isNaN(valor) || valor === null || valor === undefined) {
            valor = 0;
        }

        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(valor);
    }

    // Função para ajustar campos por tipo de operação
    function ajustarCamposOperacao() {
        const tipoEmpresa = document.getElementById('tipo-empresa')?.value;
        const camposICMS = document.getElementById('campos-icms');
        const camposIPI = document.getElementById('campos-ipi');
        const camposISS = document.getElementById('campos-iss');

        // Ocultar todos os campos primeiro
        if (camposICMS) camposICMS.style.display = 'none';
        if (camposIPI) camposIPI.style.display = 'none';
        if (camposISS) camposISS.style.display = 'none';

        // Mostrar campos baseado no tipo de empresa
        switch(tipoEmpresa) {
            case 'comercio':
                if (camposICMS) camposICMS.style.display = 'block';
                break;
            case 'industria':
                if (camposICMS) camposICMS.style.display = 'block';
                if (camposIPI) camposIPI.style.display = 'block';
                break;
            case 'servicos':
                if (camposISS) camposISS.style.display = 'block';
                break;
        }

        console.log('MAIN: Campos de operação ajustados para tipo:', tipoEmpresa);
    }
    
    // Função para calcular dados financeiros
    function calcularDadosFinanceiros() {
        if (!window.DataManager) return;

        const receitaLiquida = window.DataManager.extrairValorNumerico('receita-liquida');
        const custoTotal = window.DataManager.extrairValorNumerico('custo-total');
        const despesasOperacionais = window.DataManager.extrairValorNumerico('despesas-operacionais');

        // Calcular lucro operacional
        const lucroOperacional = receitaLiquida - custoTotal - despesasOperacionais;
        const campoLucroOperacional = document.getElementById('lucro-operacional');
        if (campoLucroOperacional) {
            campoLucroOperacional.value = window.DataManager.formatarMoeda(lucroOperacional);
        }

        // Calcular margem operacional
        const margemOperacional = receitaLiquida > 0 ? (lucroOperacional / receitaLiquida) * 100 : 0;
        const campoMargemOperacional = document.getElementById('margem-operacional-calc');
        if (campoMargemOperacional) {
            campoMargemOperacional.value = margemOperacional.toFixed(2);
        }

        console.log('MAIN: Dados financeiros calculados - Lucro:', lucroOperacional, 'Margem:', margemOperacional);
    }

    // Função melhorada para inicialização do sistema
    function inicializarSistemaCorrigido() {
        console.log('MAIN: Iniciando sistema corrigido...');

        // Verificar dependências críticas
        const dependencias = [
            { nome: 'SpedParser', objeto: window.SpedParser },
            { nome: 'SpedExtractor', objeto: window.SpedExtractor },
            { nome: 'DataManager', objeto: window.DataManager },
            { nome: 'ImportacaoController', objeto: window.ImportacaoController }
        ];

        let todasDisponíveis = true;
        dependencias.forEach(dep => {
            if (!dep.objeto) {
                console.error(`MAIN: ${dep.nome} não encontrado`);
                todasDisponíveis = false;
            } else {
                console.log(`MAIN: ✓ ${dep.nome} disponível`);
            }
        });

        if (!todasDisponíveis) {
            console.error('MAIN: Nem todas as dependências estão disponíveis');
            return false;
        }

        // Inicializar ImportacaoController
        if (window.ImportacaoController && typeof window.ImportacaoController.inicializar === 'function') {
            try {
                window.ImportacaoController.inicializar();
                console.log('MAIN: ✓ ImportacaoController inicializado');
            } catch (error) {
                console.error('MAIN: ✗ Erro ao inicializar ImportacaoController:', error);
            }
        }

        // Configurar event listeners para botões de log
        const btnLimparLog = document.getElementById('btn-limpar-log');
        if (btnLimparLog) {
            btnLimparLog.addEventListener('click', limparLogImportacao);
            console.log('MAIN: ✓ Botão limpar log configurado');
        }

        const btnExportarLog = document.getElementById('btn-exportar-log');
        if (btnExportarLog) {
            btnExportarLog.addEventListener('click', exportarLogImportacao);
            console.log('MAIN: ✓ Botão exportar log configurado');
        }

        // Configurar filtros de log
        const filtrosLog = ['filtro-info', 'filtro-warning', 'filtro-error', 'filtro-success'];
        filtrosLog.forEach(filtroId => {
            const filtro = document.getElementById(filtroId);
            if (filtro) {
                filtro.addEventListener('change', aplicarFiltrosLog);
            }
        });

        // Configurar campos tributários e financeiros
        const campoRegime = document.getElementById('regime');
        if (campoRegime) {
            campoRegime.addEventListener('change', ajustarCamposTributarios);
        }

        const campoTipoEmpresa = document.getElementById('tipo-empresa');
        if (campoTipoEmpresa) {
            campoTipoEmpresa.addEventListener('change', ajustarCamposOperacao);
        }

        const checkboxDadosFinanceiros = document.getElementById('usar-dados-financeiros');
        if (checkboxDadosFinanceiros) {
            checkboxDadosFinanceiros.addEventListener('change', toggleDadosFinanceiros);
        }

        // Aplicar formatação de moeda em campos financeiros
        if (window.CurrencyFormatter) {
            const camposFinanceiros = [
                'receita-bruta', 'receita-liquida', 'custo-total', 
                'despesas-operacionais', 'lucro-operacional'
            ];

            camposFinanceiros.forEach(id => {
                const campo = document.getElementById(id);
                if (campo) {
                    window.CurrencyFormatter.aplicarFormatacaoMoeda(campo);
                    campo.addEventListener('input', calcularDadosFinanceiros);
                }
            });
        }

        // Configuração inicial dos campos
        ajustarCamposTributarios();
        ajustarCamposOperacao();

        console.log('MAIN: Sistema corrigido inicializado com sucesso');
        return true;
    }

    // Adicionar funções ao escopo global para serem chamadas pelo HTML
    if (typeof window !== 'undefined') {
        window.limparLogImportacao = limparLogImportacao;
        window.exportarLogImportacao = exportarLogImportacao;
        window.aplicarFiltrosLog = aplicarFiltrosLog;
        window.exibirDetalhesImportacao = exibirDetalhesImportacao;
        window.ajustarCamposTributarios = ajustarCamposTributarios;
        window.ajustarCamposOperacao = ajustarCamposOperacao;
        window.toggleDadosFinanceiros = toggleDadosFinanceiros;
        window.calcularDadosFinanceiros = calcularDadosFinanceiros;
        window.inicializarSistemaCorrigido = inicializarSistemaCorrigido;

        // Executar inicialização quando o DOM estiver pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', inicializarSistemaCorrigido);
        } else {
            inicializarSistemaCorrigido();
        }

        console.log('MAIN: Funções de correção carregadas no escopo global');
    }

    /**
     * Atualiza estatísticas do log em tempo real
     */
    function atualizarEstatisticasLog() {
        const logArea = document.getElementById('import-log');
        const logStats = document.getElementById('log-statistics');

        if (!logArea || !logStats) return;

        const entradas = logArea.querySelectorAll('.log-entry');
        const stats = {
            total: entradas.length,
            success: logArea.querySelectorAll('.text-success').length,
            warnings: logArea.querySelectorAll('.text-warning').length,
            errors: logArea.querySelectorAll('.text-danger').length
        };

        // Atualizar elementos de estatísticas
        const elementos = {
            'stat-total': stats.total,
            'stat-success': stats.success,
            'stat-warnings': stats.warnings,
            'stat-errors': stats.errors
        };

        Object.entries(elementos).forEach(([id, valor]) => {
            const elemento = document.getElementById(id);
            if (elemento) elemento.textContent = valor;
        });

        // Mostrar estatísticas se houver entradas
        if (stats.total > 0) {
            logStats.style.display = 'block';
        }
    }
    
    // No final da função inicializarEventosPrincipais() no main.js
    // Adicionar:
    if (window.CurrencyFormatter) {
        CurrencyFormatter.inicializar();
    }
    
    console.log('Eventos principais inicializados');
}

/**
 * Adiciona notificação visual sobre uso de dados do SPED
 */
function adicionarNotificacaoSped() {
    // Remover notificação anterior se existir
    const notificacaoExistente = document.querySelector('.notificacao-sped');
    if (notificacaoExistente) {
        notificacaoExistente.remove();
    }

    // Criar nova notificação
    const notificacao = document.createElement('div');
    notificacao.className = 'alert alert-info notificacao-sped';
    notificacao.innerHTML = `
        <strong><i class="icon-info-circle"></i> Dados SPED Integrados:</strong> 
        A simulação está utilizando dados tributários reais extraídos dos arquivos SPED importados, 
        proporcionando maior precisão nos cálculos.
    `;

    // Inserir no início da área de resultados
    const divResultados = document.getElementById('resultados');
    if (divResultados) {
        divResultados.insertBefore(notificacao, divResultados.firstChild);
    }
}

/**
 * Atualiza os resultados exibidos com base no ano selecionado
 */
function atualizarResultadosPorAno() {
    // Obter o ano selecionado
    const anoSelecionado = document.getElementById('ano-visualizacao').value;
    
    // Verificar se há resultados carregados
    if (!window.SimuladorFluxoCaixa || !window.resultadosSimulacao) {
        console.warn('Não há resultados disponíveis para atualizar.');
        return;
    }
    
    const resultadosAnuais = window.resultadosSimulacao.projecaoTemporal?.resultadosAnuais;
    if (!resultadosAnuais || !resultadosAnuais[anoSelecionado]) {
        console.warn(`Não há resultados disponíveis para o ano ${anoSelecionado}.`);
        return;
    }
    
    const resultadoAno = resultadosAnuais[anoSelecionado];
    
    // Formatador de moeda para garantir consistência
    const formatarMoeda = window.CalculationCore.formatarMoeda;
    
    // Atualizar valores na interface - Comparação de Sistemas Tributários
    document.getElementById('tributo-atual').textContent = formatarMoeda(resultadoAno.resultadoAtual?.impostos?.total || 0);
    document.getElementById('tributo-dual').textContent = formatarMoeda(resultadoAno.resultadoSplitPayment?.impostos?.total || 0);
    document.getElementById('tributo-diferenca').textContent = formatarMoeda(
        (resultadoAno.resultadoSplitPayment?.impostos?.total || 0) - 
        (resultadoAno.resultadoAtual?.impostos?.total || 0)
    );
    
    // Valores para IVA sem Split
    document.getElementById('tributo-iva-sem-split').textContent = formatarMoeda(resultadoAno.resultadoIVASemSplit?.impostos?.total || 0);
    document.getElementById('tributo-diferenca-iva-sem-split').textContent = formatarMoeda(
        (resultadoAno.resultadoIVASemSplit?.impostos?.total || 0) - 
        (resultadoAno.resultadoAtual?.impostos?.total || 0)
    );
    
    // Atualizar valores na interface - Impacto no Capital de Giro
    document.getElementById('capital-giro-atual').textContent = formatarMoeda(resultadoAno.resultadoAtual?.capitalGiroDisponivel || 0);
    document.getElementById('capital-giro-iva-sem-split').textContent = formatarMoeda(resultadoAno.resultadoIVASemSplit?.capitalGiroDisponivel || 0);
    document.getElementById('capital-giro-split').textContent = formatarMoeda(resultadoAno.resultadoSplitPayment?.capitalGiroDisponivel || 0);
    document.getElementById('capital-giro-impacto').textContent = formatarMoeda(resultadoAno.diferencaCapitalGiro || 0);
    document.getElementById('capital-giro-impacto-iva-sem-split').textContent = formatarMoeda(resultadoAno.diferencaCapitalGiroIVASemSplit || 0);
    document.getElementById('capital-giro-necessidade').textContent = formatarMoeda(resultadoAno.necessidadeAdicionalCapitalGiro || 0);
    
    // Atualizar valores na interface - Impacto na Margem Operacional
    document.getElementById('margem-atual').textContent = ((resultadoAno.margemOperacionalOriginal || 0) * 100).toFixed(2) + '%';
    document.getElementById('margem-ajustada').textContent = ((resultadoAno.margemOperacionalAjustada || 0) * 100).toFixed(2) + '%';
    document.getElementById('margem-impacto').textContent = (resultadoAno.impactoMargem || 0).toFixed(2) + ' p.p.';
    
    // Atualizar valores na interface - Análise de Impacto Detalhada
    document.getElementById('percentual-impacto').textContent = (resultadoAno.percentualImpacto || 0).toFixed(2) + '%';
    document.getElementById('impacto-dias-faturamento').textContent = (resultadoAno.impactoDiasFaturamento || 0).toFixed(1) + ' dias';
    
    // Atualizar valores na interface - Projeção Temporal do Impacto
    const projecao = window.resultadosSimulacao.projecaoTemporal?.impactoAcumulado;
    if (projecao) {
        document.getElementById('total-necessidade-giro').textContent = formatarMoeda(projecao.totalNecessidadeCapitalGiro || 0);
        document.getElementById('custo-financeiro-total').textContent = formatarMoeda(projecao.custoFinanceiroTotal || 0);
    }
}

function atualizarInterface(resultado) {
    console.log('Atualizando interface com resultados');
    
    if (!resultado || !resultado.impactoBase) {
        console.error('Resultados inválidos ou incompletos:', resultado);
        alert('Não foi possível processar os resultados da simulação. Verifique o console para detalhes.');
        return;
    }
    
    try {
        window.resultadosSimulacao = resultado;
        
        const formatarMoeda = window.DataManager.formatarMoeda;
        const formatarPercentual = window.DataManager.formatarPercentual;
        
        const splitPaymentConsiderado = resultado.impactoBase.splitPaymentConsiderado !== false;
        
        const divResultados = document.getElementById('resultados');
        if (divResultados) {
            const avisoExistente = divResultados.querySelector('.split-payment-notice');
            if (avisoExistente) avisoExistente.remove();
            
            if (!splitPaymentConsiderado) {
                const aviso = document.createElement('div');
                aviso.className = 'alert alert-warning split-payment-notice';
                aviso.innerHTML = '<strong>Atenção:</strong> Simulação executada sem considerar o mecanismo de Split Payment.';
                divResultados.insertBefore(aviso, divResultados.firstChild);
            }
        }
        
        const seletorAno = document.getElementById('ano-visualizacao');
        const anoSelecionado = seletorAno ? parseInt(seletorAno.value) : resultado.projecaoTemporal?.parametros?.anoInicial || 2026;
        
        const dadosAno = obterDadosAnoSeguro(resultado, anoSelecionado);
        
        // Atualizar elementos existentes
        document.getElementById('tributo-atual').textContent = formatarMoeda(dadosAno.valorImpostoAtual);
        document.getElementById('tributo-dual').textContent = formatarMoeda(dadosAno.valorImpostoSplit);
        document.getElementById('tributo-diferenca').textContent = formatarMoeda(dadosAno.diferencaImposto);
        document.getElementById('tributo-iva-sem-split').textContent = formatarMoeda(dadosAno.valorImpostoIVASemSplit);
        document.getElementById('tributo-diferenca-iva-sem-split').textContent = formatarMoeda(dadosAno.diferencaImpostoIVASemSplit);
        
        // Atualizar capital de giro
        document.getElementById('capital-giro-atual').textContent = formatarMoeda(dadosAno.capitalGiroAtual);
        document.getElementById('capital-giro-iva-sem-split').textContent = formatarMoeda(dadosAno.capitalGiroIVASemSplit);
        document.getElementById('capital-giro-split').textContent = formatarMoeda(dadosAno.capitalGiroSplit);
        document.getElementById('capital-giro-impacto').textContent = formatarMoeda(dadosAno.diferencaCapitalGiro);
        document.getElementById('capital-giro-impacto-iva-sem-split').textContent = formatarMoeda(dadosAno.diferencaCapitalGiroIVASemSplit);
        document.getElementById('capital-giro-necessidade').textContent = formatarMoeda(dadosAno.necessidadeAdicionalCapitalGiro);
        
        aplicarClassesCondicionais(dadosAno);
        
        // Atualizar margem operacional
        document.getElementById('margem-atual').textContent = formatarPercentual(dadosAno.margemOriginal);
        document.getElementById('margem-ajustada').textContent = formatarPercentual(dadosAno.margemAjustada);
        document.getElementById('margem-impacto').textContent = formatarPercentual(dadosAno.impactoMargem);
        
        // Atualizar análise detalhada
        document.getElementById('percentual-impacto').textContent = formatarPercentual(dadosAno.percentualImpacto);
        document.getElementById('impacto-dias-faturamento').textContent = (dadosAno.impactoDiasFaturamento || 0).toFixed(1) + ' dias';
        
        // Atualizar projeção temporal
        document.getElementById('total-necessidade-giro').textContent = formatarMoeda(dadosAno.totalNecessidadeGiro);
        document.getElementById('custo-financeiro-total').textContent = formatarMoeda(dadosAno.custoFinanceiroTotal);
        
        // OU, de forma ainda mais simples, SUBSTITUIR por:
        // Forçar exibição das seções de transição
        document.getElementById('transicao-tributaria')?.style.setProperty('display', 'block');
        document.getElementById('transicao-tributaria')?.style.setProperty('visibility', 'visible');
        document.getElementById('detalhamento-impostos-transicao')?.style.setProperty('display', 'block');
        document.getElementById('detalhamento-impostos-transicao')?.style.setProperty('visibility', 'visible');
        
        // Atualizar tabela de transição com dados válidos
        atualizarTabelaTransicao(resultado);
        
        // Atualizar composição tributária
        atualizarComposicaoTributaria(resultado, anoSelecionado);
        
        // Atualizar evolução tributária detalhada
        atualizarEvolucaoTributaria(resultado, anoSelecionado);
        
        // Renderizar gráficos de detalhamento por imposto
        if (typeof renderizarGraficosDetalhamento === 'function') {
            setTimeout(() => {
                renderizarGraficosDetalhamento(resultado);
            }, 300);
        } else {
            console.warn('Função renderizarGraficosDetalhamento não encontrada');
        }

        // Forçar exibição das seções de transição
        document.getElementById('transicao-tributaria')?.style.setProperty('display', 'block');
        document.getElementById('transicao-tributaria')?.style.setProperty('visibility', 'visible');
        document.getElementById('detalhamento-impostos-transicao')?.style.setProperty('display', 'block');
        document.getElementById('detalhamento-impostos-transicao')?.style.setProperty('visibility', 'visible');

        // Atualizar tabela de transição com dados válidos
        atualizarTabelaTransicao(resultado);

        // Garantir que os elementos HTML dos gráficos existam antes de renderizar
        garantirElementosGraficos();

        // Atualizar gráficos se o ChartManager estiver disponível
        if (typeof window.ChartManager !== 'undefined' && typeof window.ChartManager.renderizarGraficos === 'function') {
            // Aguardar mais tempo para garantir que a interface foi completamente atualizada
            setTimeout(() => {
                console.log('Iniciando renderização de gráficos...');

                // Verificar se os dados estão estruturados corretamente
                const dadosGraficos = prepararDadosParaGraficos(resultado);

                window.ChartManager.renderizarGraficos(dadosGraficos);
            }, 500); // Aumentado de 200ms para 500ms
        } else {
            console.warn('ChartManager não encontrado ou função renderizarGraficos indisponível');
            // Tentar carregar o ChartManager
            if (typeof window.ChartManager === 'undefined') {
                console.log('Tentando inicializar ChartManager...');
                setTimeout(() => {
                    if (typeof window.ChartManager !== 'undefined') {
                        const dadosGraficos = prepararDadosParaGraficos(resultado);
                        window.ChartManager.renderizarGraficos(dadosGraficos);
                    }
                }, 1000);
            }
        }
        
        const divResultadosDetalhados = document.getElementById('resultados-detalhados');
        if (divResultadosDetalhados) {
            divResultadosDetalhados.style.display = 'block';
        }                
        
        window.memoriaCalculoSimulacao = resultado.memoriaCalculo;
        
        garantirEstruturaExportacao(resultado);
        
        window.DataManager.logTransformacao(
            resultado, 
            'Interface Atualizada', 
            'Atualização da Interface com Resultados'
        );
        
        console.log('Interface atualizada com sucesso');
    } catch (erro) {
        console.error('Erro ao atualizar interface:', erro);
        alert('Ocorreu um erro ao exibir os resultados: ' + erro.message);
    }
}

/**
 * Garante que os elementos HTML necessários para os gráficos existam
 */
function garantirElementosGraficos() {
    const graficosNecessarios = [
        { id: 'grafico-fluxo-caixa', container: '#fluxo-caixa-container', titulo: 'Fluxo de Caixa Projetado' },
        { id: 'grafico-projecao', container: '#comparacao-container', titulo: 'Comparação Tributária' },
        { id: 'grafico-capital-giro', container: '#capital-giro-container', titulo: 'Capital de Giro' },
        { id: 'grafico-decomposicao', container: '#decomposicao-container', titulo: 'Decomposição do Impacto' },
        { id: 'grafico-sensibilidade', container: '#sensibilidade-container', titulo: 'Análise de Sensibilidade' }
    ];

    graficosNecessarios.forEach(grafico => {
        let canvas = document.getElementById(grafico.id);
        
        if (!canvas) {
            console.log(`Criando elemento canvas para ${grafico.titulo}`);
            
            // Tentar encontrar o container específico
            let container = document.querySelector(grafico.container);
            
            // Se não encontrar, procurar containers alternativos
            if (!container) {
                container = document.querySelector('.chart-container') ||
                           document.querySelector('#resultados-detalhados') ||
                           document.querySelector('#resultados') ||
                           document.body;
            }

            // Criar estrutura completa para o gráfico
            const graficoWrapper = document.createElement('div');
            graficoWrapper.className = 'grafico-wrapper mb-4';
            graficoWrapper.innerHTML = `
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title">${grafico.titulo}</h5>
                    </div>
                    <div class="card-body">
                        <div class="chart-container" style="position: relative; height: 400px;">
                            <canvas id="${grafico.id}"></canvas>
                        </div>
                    </div>
                </div>
            `;

            container.appendChild(graficoWrapper);
            console.log(`Canvas ${grafico.id} criado com sucesso`);
        }
    });
}

/**
 * Prepara os dados no formato correto para os gráficos
 */
function prepararDadosParaGraficos(resultado) {
    // Garantir que a estrutura de dados esteja completa
    const dadosGraficos = {
        ...resultado,
        // Garantir que dadosUtilizados existam
        dadosUtilizados: resultado.dadosUtilizados || {
            empresa: {
                faturamento: resultado.memoriaCalculo?.dadosEntrada?.empresa?.faturamento || 1000000,
                margem: resultado.memoriaCalculo?.dadosEntrada?.empresa?.margem || 0.15
            },
            parametrosFiscais: {
                aliquota: resultado.memoriaCalculo?.dadosEntrada?.parametrosFiscais?.aliquota || 0.265
            },
            cicloFinanceiro: {
                pmr: resultado.memoriaCalculo?.dadosEntrada?.cicloFinanceiro?.pmr || 30,
                pmp: resultado.memoriaCalculo?.dadosEntrada?.cicloFinanceiro?.pmp || 30,
                pme: resultado.memoriaCalculo?.dadosEntrada?.cicloFinanceiro?.pme || 30,
                percVista: resultado.memoriaCalculo?.dadosEntrada?.cicloFinanceiro?.percVista || 0.3,
                percPrazo: resultado.memoriaCalculo?.dadosEntrada?.cicloFinanceiro?.percPrazo || 0.7
            }
        }
    };

    // Garantir que o impactoBase tenha a estrutura necessária
    if (!dadosGraficos.impactoBase) {
        dadosGraficos.impactoBase = {
            resultadoAtual: {
                capitalGiroDisponivel: dadosGraficos.dadosUtilizados.empresa.faturamento * 0.8,
                impostos: { total: dadosGraficos.dadosUtilizados.empresa.faturamento * 0.2 }
            },
            resultadoSplitPayment: {
                capitalGiroDisponivel: dadosGraficos.dadosUtilizados.empresa.faturamento * 0.75,
                impostos: { total: dadosGraficos.dadosUtilizados.empresa.faturamento * 0.18 }
            },
            resultadoIVASemSplit: {
                capitalGiroDisponivel: dadosGraficos.dadosUtilizados.empresa.faturamento * 0.82,
                impostos: { total: dadosGraficos.dadosUtilizados.empresa.faturamento * 0.18 }
            },
            diferencaCapitalGiro: dadosGraficos.dadosUtilizados.empresa.faturamento * -0.05
        };
    }

    // Garantir que projecaoTemporal tenha dados básicos
    if (!dadosGraficos.projecaoTemporal) {
        dadosGraficos.projecaoTemporal = {
            parametros: {
                anoInicial: 2026,
                anoFinal: 2033
            },
            resultadosAnuais: {},
            comparacaoRegimes: {
                anos: [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033],
                atual: { capitalGiro: [], impostos: [] },
                splitPayment: { capitalGiro: [], impostos: [] },
                ivaSemSplit: { capitalGiro: [], impostos: [] }
            }
        };
    }

    console.log('Dados preparados para gráficos:', dadosGraficos);
    return dadosGraficos;
}

// ADICIONAR esta nova função:
/**
 * Renderiza gráficos de detalhamento por imposto durante a transição
 * VERSÃO CORRIGIDA
 */
function renderizarGraficosDetalhamento(resultado) {
    console.log('Renderizando gráficos de detalhamento...');
    
    // Verificar se Chart.js está disponível
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js não está disponível');
        return;
    }
    
    // Verificar se há dados necessários
    if (!resultado || !resultado.memoriaCalculo?.dadosEntrada?.empresa?.faturamento) {
        console.warn('Dados insuficientes para renderizar gráficos de detalhamento');
        return;
    }
    
    const cronograma = {
        2026: 0.10, 2027: 0.25, 2028: 0.40, 2029: 0.55,
        2030: 0.70, 2031: 0.85, 2032: 0.95, 2033: 1.00
    };
    
    const anos = Object.keys(cronograma);
    const faturamento = resultado.memoriaCalculo.dadosEntrada.empresa.faturamento;
    
    // Garantir que os elementos canvas existam
    garantirElementosGraficosDetalhamento();
    
    // Dados para gráfico PIS/COFINS
    const dadosPisCofins = anos.map(ano => {
        const percIVA = cronograma[ano];
        const percAtual = 1 - percIVA;
        const faturamentoAno = faturamento * Math.pow(1.05, parseInt(ano) - 2026); // 5% crescimento
        return {
            ano: ano,
            atual: (faturamentoAno * 0.0925 * percAtual), // PIS+COFINS estimado
            iva: (faturamentoAno * 0.088 * percIVA) // CBS estimado
        };
    });
    
    // Renderizar gráfico PIS/COFINS
    renderizarGraficoIndividual('grafico-evolucao-pis-cofins', {
        type: 'line',
        data: {
            labels: anos,
            datasets: [{
                label: 'PIS/COFINS Atual',
                data: dadosPisCofins.map(d => d.atual),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 2
            }, {
                label: 'CBS (IVA)',
                data: dadosPisCofins.map(d => d.iva),
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Evolução PIS/COFINS → CBS'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                        }
                    }
                }
            }
        }
    });
    
    // Renderizar gráfico ICMS
    renderizarGraficoIndividual('grafico-evolucao-icms', {
        type: 'line',
        data: {
            labels: anos,
            datasets: [{
                label: 'ICMS Atual',
                data: anos.map(ano => {
                    const percAtual = 1 - cronograma[ano];
                    const faturamentoAno = faturamento * Math.pow(1.05, parseInt(ano) - 2026);
                    return (faturamentoAno * 0.18 * percAtual);
                }),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderWidth: 2
            }, {
                label: 'IBS (IVA)',
                data: anos.map(ano => {
                    const percIVA = cronograma[ano];
                    const faturamentoAno = faturamento * Math.pow(1.05, parseInt(ano) - 2026);
                    return (faturamentoAno * 0.177 * percIVA);
                }),
                borderColor: 'rgb(153, 102, 255)',
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Evolução ICMS → IBS'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                        }
                    }
                }
            }
        }
    });
    
    // Renderizar gráfico IPI
    renderizarGraficoIndividual('grafico-evolucao-ipi', {
        type: 'bar',
        data: {
            labels: anos,
            datasets: [{
                label: 'IPI Atual',
                data: anos.map(ano => {
                    const percAtual = 1 - cronograma[ano];
                    const faturamentoAno = faturamento * Math.pow(1.05, parseInt(ano) - 2026);
                    return (faturamentoAno * 0.10 * percAtual);
                }),
                backgroundColor: 'rgba(255, 206, 86, 0.7)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Evolução IPI'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                        }
                    }
                }
            }
        }
    });
    
    // Renderizar gráfico Total
    renderizarGraficoIndividual('grafico-evolucao-total', {
        type: 'bar',
        data: {
            labels: anos,
            datasets: [{
                label: 'Total de Impostos',
                data: anos.map(ano => {
                    const percIVA = cronograma[ano];
                    const percAtual = 1 - percIVA;
                    const faturamentoAno = faturamento * Math.pow(1.05, parseInt(ano) - 2026);
                    const sistemaAtual = faturamentoAno * 0.265 * percAtual; // Alíquota média atual
                    const sistemaIVA = faturamentoAno * 0.265 * percIVA; // IVA equivalente
                    return sistemaAtual + sistemaIVA;
                }),
                backgroundColor: '#2ecc71',
                borderColor: '#27ae60',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Total de Impostos Durante Transição'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                        }
                    }
                }
            }
        }
    });
    
    console.log('Gráficos de detalhamento renderizados com sucesso');
}

/**
 * Função auxiliar para renderizar gráfico individual
 */
function renderizarGraficoIndividual(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.warn(`Canvas ${canvasId} não encontrado`);
        return;
    }
    
    // Destruir gráfico anterior se existir
    const existingChart = Chart.getChart(canvasId);
    if (existingChart) {
        existingChart.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    new Chart(ctx, config);
}

/**
 * Garante que os elementos canvas para gráficos de detalhamento existam
 */
function garantirElementosGraficosDetalhamento() {
    const graficosNecessarios = [
        { id: 'grafico-evolucao-pis-cofins', titulo: 'Evolução PIS/COFINS → CBS' },
        { id: 'grafico-evolucao-icms', titulo: 'Evolução ICMS → IBS' },
        { id: 'grafico-evolucao-ipi', titulo: 'Evolução IPI' },
        { id: 'grafico-evolucao-total', titulo: 'Total de Impostos Durante Transição' }
    ];

    graficosNecessarios.forEach(grafico => {
        let canvas = document.getElementById(grafico.id);
        
        if (!canvas) {
            console.log(`Criando elemento canvas para ${grafico.titulo}`);
            
            // Procurar container para detalhamento
            let container = document.querySelector('#detalhamento-impostos-transicao') ||
                           document.querySelector('#evolucao-tributaria') ||
                           document.querySelector('#resultados-detalhados');
            
            if (!container) {
                // Criar seção de detalhamento se não existir
                container = document.createElement('div');
                container.id = 'detalhamento-impostos-transicao';
                container.className = 'detalhamento-container';
                
                const resultados = document.querySelector('#resultados') || document.body;
                resultados.appendChild(container);
            }

            // Criar estrutura completa para o gráfico
            const graficoWrapper = document.createElement('div');
            graficoWrapper.className = 'grafico-detalhamento mb-4';
            graficoWrapper.innerHTML = `
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title">${grafico.titulo}</h5>
                    </div>
                    <div class="card-body">
                        <div class="chart-container" style="position: relative; height: 400px;">
                            <canvas id="${grafico.id}"></canvas>
                        </div>
                    </div>
                </div>
            `;

            container.appendChild(graficoWrapper);
            console.log(`Canvas ${grafico.id} criado com sucesso`);
        }
    });
}

/**
 * Obtém dados do ano de forma segura, verificando múltiplas estruturas
 * @param {Object} resultado - Resultado da simulação
 * @param {number} ano - Ano selecionado
 * @returns {Object} Dados do ano com valores seguros
 */
function obterDadosAnoSeguro(resultado, ano) {
    // Valores padrão seguros
    const dadosSeguro = {
        valorImpostoAtual: 0,
        valorImpostoSplit: 0,
        valorImpostoIVASemSplit: 0,
        diferencaImposto: 0,
        diferencaImpostoIVASemSplit: 0,
        capitalGiroAtual: 0,
        capitalGiroSplit: 0,
        capitalGiroIVASemSplit: 0,
        diferencaCapitalGiro: 0,
        diferencaCapitalGiroIVASemSplit: 0,
        necessidadeAdicionalCapitalGiro: 0,
        margemOriginal: 0,
        margemAjustada: 0,
        impactoMargem: 0,
        percentualImpacto: 0,
        impactoDiasFaturamento: 0,
        totalNecessidadeGiro: 0,
        custoFinanceiroTotal: 0
    };
    
    try {
        // Tentar obter dados anuais específicos
        if (resultado.projecaoTemporal?.resultadosAnuais?.[ano]) {
            const dadosAno = resultado.projecaoTemporal.resultadosAnuais[ano];
            
            dadosSeguro.valorImpostoAtual = dadosAno.resultadoAtual?.impostos?.total || dadosAno.resultadoAtual?.valorImpostoTotal || 0;
            dadosSeguro.valorImpostoSplit = dadosAno.resultadoSplitPayment?.impostos?.total || dadosAno.resultadoSplitPayment?.valorImpostoTotal || 0;
            dadosSeguro.valorImpostoIVASemSplit = dadosAno.resultadoIVASemSplit?.impostos?.total || dadosAno.resultadoIVASemSplit?.valorImpostoTotal || dadosSeguro.valorImpostoAtual;
            
            dadosSeguro.capitalGiroAtual = dadosAno.resultadoAtual?.capitalGiroDisponivel || 0;
            dadosSeguro.capitalGiroSplit = dadosAno.resultadoSplitPayment?.capitalGiroDisponivel || 0;
            dadosSeguro.capitalGiroIVASemSplit = dadosAno.resultadoIVASemSplit?.capitalGiroDisponivel || dadosSeguro.capitalGiroAtual;
            
            dadosSeguro.diferencaCapitalGiro = dadosAno.diferencaCapitalGiro || (dadosSeguro.capitalGiroSplit - dadosSeguro.capitalGiroAtual);
            dadosSeguro.diferencaCapitalGiroIVASemSplit = dadosAno.diferencaCapitalGiroIVASemSplit || (dadosSeguro.capitalGiroIVASemSplit - dadosSeguro.capitalGiroAtual);
            dadosSeguro.necessidadeAdicionalCapitalGiro = dadosAno.necessidadeAdicionalCapitalGiro || Math.abs(dadosSeguro.diferencaCapitalGiro) * 1.2;
            
            dadosSeguro.percentualImpacto = dadosAno.percentualImpacto || 0;
            dadosSeguro.impactoDiasFaturamento = dadosAno.impactoDiasFaturamento || 0;
        } else {
            // Usar dados do impacto base como fallback
            const impactoBase = resultado.impactoBase;
            
            dadosSeguro.valorImpostoAtual = impactoBase.resultadoAtual?.impostos?.total || impactoBase.resultadoAtual?.valorImpostoTotal || 0;
            dadosSeguro.valorImpostoSplit = impactoBase.resultadoSplitPayment?.impostos?.total || impactoBase.resultadoSplitPayment?.valorImpostoTotal || 0;
            dadosSeguro.valorImpostoIVASemSplit = impactoBase.resultadoIVASemSplit?.impostos?.total || impactoBase.resultadoIVASemSplit?.valorImpostoTotal || dadosSeguro.valorImpostoAtual;
            
            dadosSeguro.capitalGiroAtual = impactoBase.resultadoAtual?.capitalGiroDisponivel || 0;
            dadosSeguro.capitalGiroSplit = impactoBase.resultadoSplitPayment?.capitalGiroDisponivel || 0;
            dadosSeguro.capitalGiroIVASemSplit = impactoBase.resultadoIVASemSplit?.capitalGiroDisponivel || dadosSeguro.capitalGiroAtual;
            
            dadosSeguro.diferencaCapitalGiro = impactoBase.diferencaCapitalGiro || 0;
            dadosSeguro.diferencaCapitalGiroIVASemSplit = impactoBase.diferencaCapitalGiroIVASemSplit || 0;
            dadosSeguro.necessidadeAdicionalCapitalGiro = impactoBase.necessidadeAdicionalCapitalGiro || 0;
            
            dadosSeguro.margemOriginal = (impactoBase.margemOperacionalOriginal || 0) * 100;
            dadosSeguro.margemAjustada = (impactoBase.margemOperacionalAjustada || 0) * 100;
            dadosSeguro.impactoMargem = impactoBase.impactoMargem || 0;
            
            dadosSeguro.percentualImpacto = impactoBase.percentualImpacto || 0;
            dadosSeguro.impactoDiasFaturamento = impactoBase.impactoDiasFaturamento || 0;
        }
        
        // Calcular diferenças de impostos
        dadosSeguro.diferencaImposto = dadosSeguro.valorImpostoSplit - dadosSeguro.valorImpostoAtual;
        dadosSeguro.diferencaImpostoIVASemSplit = dadosSeguro.valorImpostoIVASemSplit - dadosSeguro.valorImpostoAtual;
        
        // Obter dados da projeção temporal
        if (resultado.projecaoTemporal?.impactoAcumulado) {
            dadosSeguro.totalNecessidadeGiro = resultado.projecaoTemporal.impactoAcumulado.totalNecessidadeCapitalGiro || 0;
            dadosSeguro.custoFinanceiroTotal = resultado.projecaoTemporal.impactoAcumulado.custoFinanceiroTotal || 0;
        }
        
    } catch (erro) {
        console.warn('Erro ao obter dados do ano, usando valores padrão:', erro);
    }
    
    return dadosSeguro;
}

/**
 * Aplica classes CSS condicionais baseadas nos valores
 * @param {Object} dadosAno - Dados do ano
 */
function aplicarClassesCondicionais(dadosAno) {
    const impactoElement = document.getElementById('capital-giro-impacto');
    if (impactoElement) {
        impactoElement.classList.remove('valor-negativo', 'valor-positivo');
        if (dadosAno.diferencaCapitalGiro < 0) {
            impactoElement.classList.add('valor-negativo');
        } else if (dadosAno.diferencaCapitalGiro > 0) {
            impactoElement.classList.add('valor-positivo');
        }
    }
    
    const impactoIVASemSplitElement = document.getElementById('capital-giro-impacto-iva-sem-split');
    if (impactoIVASemSplitElement) {
        impactoIVASemSplitElement.classList.remove('valor-negativo', 'valor-positivo');
        if (dadosAno.diferencaCapitalGiroIVASemSplit < 0) {
            impactoIVASemSplitElement.classList.add('valor-negativo');
        } else if (dadosAno.diferencaCapitalGiroIVASemSplit > 0) {
            impactoIVASemSplitElement.classList.add('valor-positivo');
        }
    }
}

/**
 * Garante que existe estrutura adequada para exportação
 * @param {Object} resultado - Resultado da simulação
 */
function garantirEstruturaExportacao(resultado) {
    if (!resultado.resultadosExportacao && resultado.projecaoTemporal?.resultadosAnuais) {
        const anos = Object.keys(resultado.projecaoTemporal.resultadosAnuais).sort();
        const resultadosPorAno = {};
        
        anos.forEach(ano => {
            const dadosAno = resultado.projecaoTemporal.resultadosAnuais[ano];
            resultadosPorAno[ano] = {
                capitalGiroSplitPayment: dadosAno.resultadoSplitPayment?.capitalGiroDisponivel || 0,
                capitalGiroAtual: dadosAno.resultadoAtual?.capitalGiroDisponivel || 0,
                capitalGiroIVASemSplit: dadosAno.resultadoIVASemSplit?.capitalGiroDisponivel || dadosAno.resultadoAtual?.capitalGiroDisponivel || 0,
                diferenca: dadosAno.diferencaCapitalGiro || 0,
                diferencaIVASemSplit: dadosAno.diferencaCapitalGiroIVASemSplit || 0,
                percentualImpacto: dadosAno.percentualImpacto || 0,
                impostoDevido: dadosAno.resultadoSplitPayment?.impostos?.total || 0,
                sistemaAtual: dadosAno.resultadoAtual?.impostos?.total || 0
            };
        });
        
        resultado.resultadosExportacao = {
            anos: anos,
            resultadosPorAno: resultadosPorAno,
            resumo: {
                variacaoTotal: Object.values(resultadosPorAno).reduce((acc, ano) => acc + ano.diferenca, 0),
                tendenciaGeral: Object.values(resultadosPorAno).reduce((acc, ano) => acc + ano.diferenca, 0) > 0 ? "aumento" : "redução"
            }
        };
        
        console.log('Estrutura de exportação gerada automaticamente');
    }
}

// Exportar a função para o escopo global
window.atualizarInterface = atualizarInterface;

// Exportar a função para o escopo global
window.atualizarInterface = atualizarInterface;

/**
 * Atualiza os resultados de estratégias conforme o ano selecionado
 */
function atualizarVisualizacaoEstrategias() {
    console.log('MAIN.JS: Iniciando atualização de visualização de estratégias...');

    // 1. Verificar se o SimuladorFluxoCaixa está disponível
    if (!window.SimuladorFluxoCaixa) {
        console.error('MAIN.JS: SimuladorFluxoCaixa não encontrado.');
        const divResultados = document.getElementById('resultados-estrategias');
        if (divResultados) {
            divResultados.innerHTML = `<div class="alert alert-danger"><strong>Erro Crítico:</strong> Componente de simulação não carregado.</div>`;
        }
        return;
    }

    try {
        const divResultados = document.getElementById('resultados-estrategias');
        if (!divResultados) {
            console.error('MAIN.JS: Elemento #resultados-estrategias não encontrado no DOM.');
            return;
        }

        // 2. Verificar se há resultados da SIMULAÇÃO PRINCIPAL disponíveis
        if (!window.resultadosSimulacao || !window.resultadosSimulacao.impactoBase) {
            console.warn('MAIN.JS: Resultados da simulação principal não encontrados. Solicitando execução.');
            divResultados.innerHTML = `
                <div class="alert alert-warning">
                    <strong>Atenção:</strong> É necessário executar uma simulação na aba "Simulação" 
                    antes de visualizar ou aplicar estratégias de mitigação.
                </div>
                <p class="text-muted">Acesse a aba "Simulação", configure os parâmetros e clique em 
                "Simular Impacto no Fluxo de Caixa".</p>
            `;
            // Limpar ou inicializar gráficos em estado vazio
            if (typeof window.ChartManager !== 'undefined' && typeof window.ChartManager.renderizarGraficoEstrategias === 'function') {
                window.ChartManager.renderizarGraficoEstrategias(null, null);
            }
            return;
        }

        // 3. Verificar se existem resultados de estratégias usando a classe específica
        const hasActualResults = divResultados.querySelector('.estrategias-resumo');
        
        // 4. Se existem resultados, atualizar para o ano selecionado
        if (hasActualResults) {
            console.log('MAIN.JS: Resultados detalhados de estratégias encontrados. Atualizando para ano selecionado...');
            
            // Obter ano selecionado para estratégias
            const seletorAnoEstrategias = document.getElementById('ano-visualizacao-estrategias');
            const anoSelecionado = seletorAnoEstrategias ? parseInt(seletorAnoEstrategias.value) : 2026;
            
            console.log(`MAIN.JS: Recalculando estratégias para o ano: ${anoSelecionado}`);
            
            // Recalcular estratégias para o ano específico
            recalcularEstrategiasParaAno(anoSelecionado);
            return;
        }

        // 5. Se não há resultados, exibir mensagem informativa
        console.log('MAIN.JS: Nenhum resultado detalhado de estratégia encontrado. Exibindo mensagem informativa.');
        
        // Verificar se há estratégias ativas configuradas
        const dadosAninhados = window.DataManager.obterDadosDoFormulario();
        let temEstrategiasAtivas = false;
        
        if (dadosAninhados && dadosAninhados.estrategias) {
            temEstrategiasAtivas = Object.values(dadosAninhados.estrategias).some(
                estrategia => estrategia && estrategia.ativar === true
            );
        }
        
        // Exibir mensagem adequada com base no estado das estratégias
        if (temEstrategiasAtivas) {
            divResultados.innerHTML = `
                <div class="alert alert-info">
                    <strong>Informação:</strong> Estratégias de mitigação configuradas. 
                    Clique no botão "Simular Estratégias" para visualizar os resultados.
                </div>
            `;
        } else {
            divResultados.innerHTML = `
                <div class="alert alert-info">
                    <strong>Informação:</strong> Selecione pelo menos uma estratégia de mitigação ativando-a 
                    com o seletor "Ativar Estratégia" em cada seção e configure seus parâmetros.
                </div>
                <p class="text-muted">Após ativar estratégias e configurar seus parâmetros, clique no botão "Simular Estratégias" para visualizar os resultados.</p>
            `;
        }
        
        // Inicializar gráficos em estado vazio ou com dados básicos
        if (typeof window.ChartManager !== 'undefined' && 
            typeof window.ChartManager.renderizarGraficoEstrategias === 'function') {
            window.ChartManager.renderizarGraficoEstrategias(null, window.resultadosSimulacao.impactoBase);
        }

        console.log('MAIN.JS: Visualização de estratégias atualizada com sucesso.');

    } catch (erro) {
        console.error('MAIN.JS: Erro fatal ao tentar atualizar visualização de estratégias:', erro);
        const divResultados = document.getElementById('resultados-estrategias');
        if (divResultados) {
            divResultados.innerHTML = `
                <div class="alert alert-danger">
                    <strong>Erro Inesperado:</strong> Ocorreu um problema ao tentar preparar a visualização das estratégias.
                    <br>Detalhes: ${erro.message}
                </div>
            `;
        }
    }
}

/**
 * Recalcula estratégias para um ano específico
 * @param {number} ano - Ano para recálculo
 */
function recalcularEstrategiasParaAno(ano) {
    console.log(`MAIN.JS: Recalculando estratégias para o ano ${ano}`);

    try {
        // Obter dados validados
        const dadosAninhados = window.DataManager.obterDadosDoFormulario();
        const dadosPlanos = window.DataManager.converterParaEstruturaPlana(dadosAninhados);

        // Filtrar estratégias ativas
        const estrategiasAtivas = {};
        let temEstrategiaAtiva = false;

        if (dadosAninhados.estrategias) {
            Object.entries(dadosAninhados.estrategias).forEach(([chave, estrategia]) => {
                if (estrategia?.ativar === true) {
                    estrategiasAtivas[chave] = estrategia;
                    temEstrategiaAtiva = true;
                }
            });
        }

        if (!temEstrategiaAtiva) {
            console.warn('MAIN.JS: Nenhuma estratégia ativa para recalcular');
            return;
        }

        // Calcular impacto base para o ano específico
        const impactoBaseAno = window.IVADualSystem.calcularImpactoCapitalGiro(dadosPlanos, ano);

        // Calcular efetividade das estratégias para o ano específico
        const resultadoEstrategias = window.IVADualSystem.calcularEfeitividadeMitigacao(
            dadosPlanos,
            estrategiasAtivas,
            ano
        );

        // Armazenar resultados atualizados
        window.lastStrategyResults = resultadoEstrategias;
        window.lastStrategyYear = ano;

        // Atualizar interface com resultados do ano específico
        atualizarInterfaceEstrategiasParaAno(resultadoEstrategias, impactoBaseAno, ano);

        // Atualizar gráficos se disponível
        if (typeof window.ChartManager !== 'undefined' && 
            typeof window.ChartManager.renderizarGraficoEstrategias === 'function') {
            
            console.log('MAIN.JS: Renderizando gráficos de estratégias para o ano', ano);
            window.ChartManager.renderizarGraficoEstrategias(resultadoEstrategias, impactoBaseAno);
        }

        console.log(`MAIN.JS: Recálculo de estratégias para ${ano} concluído com sucesso`);

    } catch (erro) {
        console.error(`MAIN.JS: Erro ao recalcular estratégias para o ano ${ano}:`, erro);
        
        const divResultados = document.getElementById('resultados-estrategias');
        if (divResultados) {
            divResultados.innerHTML = `
                <div class="alert alert-danger">
                    <strong>Erro no Recálculo:</strong> Não foi possível recalcular as estratégias para ${ano}.
                    <br>Detalhes: ${erro.message}
                </div>
            `;
        }
    }
}

/**
 * Atualiza interface de estratégias com dados específicos do ano
 * @param {Object} resultadoEstrategias - Resultados das estratégias
 * @param {Object} impactoBase - Impacto base para o ano
 * @param {number} ano - Ano de referência
 */
function atualizarInterfaceEstrategiasParaAno(resultadoEstrategias, impactoBase, ano) {
    const divResultados = document.getElementById('resultados-estrategias');
    if (!divResultados) return;

    const impactoOriginal = Math.abs(impactoBase.diferencaCapitalGiro || 0);
    const efetividade = resultadoEstrategias.efeitividadeCombinada;
    const percentualImplementacao = window.CurrentTaxSystem.obterPercentualImplementacao(ano);

    // Template com informações específicas do ano
    const htmlTemplate = `
        <div class="estrategias-resumo">
            <div class="ano-contexto mb-3">
                <h4>Resultados das Estratégias - Ano ${ano}</h4>
                <div class="implementacao-badge">
                    <span class="badge badge-primary">Split Payment: ${(percentualImplementacao * 100).toFixed(0)}% implementado</span>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="resultado-destaque">
                        <label class="form-label">Impacto Original (${ano}):</label>
                        <div class="valor-destaque text-danger">${window.CalculationCore.formatarMoeda(impactoOriginal)}</div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="resultado-destaque">
                        <label class="form-label">Efetividade da Mitigação:</label>
                        <div class="valor-destaque text-success">${(efetividade.efetividadePercentual || 0).toFixed(1)}%</div>
                    </div>
                </div>
            </div>
            <div class="resultados-detalhados mt-3">
                <div class="row">
                    <div class="col-md-3">
                        <strong>Impacto Mitigado:</strong><br>
                        <span class="text-success">${window.CalculationCore.formatarMoeda(efetividade.mitigacaoTotal || 0)}</span>
                    </div>
                    <div class="col-md-3">
                        <strong>Impacto Residual:</strong><br>
                        <span class="text-warning">${window.CalculationCore.formatarMoeda(impactoOriginal - (efetividade.mitigacaoTotal || 0))}</span>
                    </div>
                    <div class="col-md-3">
                        <strong>Custo Total:</strong><br>
                        <span class="text-info">${window.CalculationCore.formatarMoeda(efetividade.custoTotal || 0)}</span>
                    </div>
                    <div class="col-md-3">
                        <strong>Relação C/B:</strong><br>
                        <span class="text-muted">${(efetividade.custoBeneficio || 0).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    divResultados.innerHTML = htmlTemplate;
    console.log(`MAIN.JS: Interface de estratégias atualizada para o ano ${ano}`);
}

// Exportar funções necessárias para o escopo global
window.atualizarInterfaceEstrategiasParaAno = atualizarInterfaceEstrategiasParaAno;
window.recalcularEstrategiasParaAno = recalcularEstrategiasParaAno;

function inicializarRepository() {
    // Verificar se o repository já existe
    if (typeof SimuladorRepository !== 'undefined') {
        console.log('SimuladorRepository já existe. Integrando com DataManager...');
        
        // Se o DataManager estiver disponível, integrar com o repositório
        if (window.DataManager) {
            // Sobrescrever métodos do repositório para usar o DataManager
            const originalObterSecao = SimuladorRepository.obterSecao;
            const originalAtualizarSecao = SimuladorRepository.atualizarSecao;
            
            // Sobrescrever método obterSecao para normalizar dados via DataManager
            SimuladorRepository.obterSecao = function(nome) {
                const dados = originalObterSecao.call(this, nome);
                // Normalizar dados via DataManager
                return window.DataManager.normalizarDadosSecao(nome, dados);
            };
            
            // Sobrescrever método atualizarSecao para validar dados via DataManager
            SimuladorRepository.atualizarSecao = function(nome, dados) {
                // Validar dados via DataManager
                const dadosValidados = window.DataManager.validarDadosSecao(nome, dados);
                return originalAtualizarSecao.call(this, nome, dadosValidados);
            };
            
            console.log('SimuladorRepository integrado com DataManager com sucesso.');
        }
        
        return true;
    }

    // Criar repository básico se não existir, usando a estrutura canônica do DataManager
    window.SimuladorRepository = {
        dados: window.DataManager.obterEstruturaAninhadaPadrao(),

        obterSecao: function(nome) {
            const dadosSecao = this.dados[nome] || {};
            // Normalizar dados via DataManager
            return window.DataManager.normalizarDadosSecao(nome, dadosSecao);
        },

        atualizarSecao: function(nome, dados) {
            // Validar dados via DataManager
            this.dados[nome] = window.DataManager.validarDadosSecao(nome, dados);
            
            return this.dados[nome];
        }
    };

    console.log('Repository inicializado com estrutura canônica padrão.');
    return true;
}

/**
 * Integra dados do SPED na estrutura canônica do DataManager
 * @param {Object} dadosFormulario - Dados do formulário em estrutura aninhada
 * @returns {Object} Dados integrados com priorização do SPED
 */
// SUBSTITUIR por versão que utiliza mais intensivamente o DataManager:
function integrarDadosSpedNaEstruturaPadrao(dadosFormulario) {
    const dadosSped = obterDadosSpedPrioritarios();
    
    if (!dadosSped) {
        return dadosFormulario; // Retorna dados originais se não há SPED
    }

    // Utilizar DataManager para validação e normalização
    const dadosValidados = window.DataManager.validarENormalizar(dadosFormulario);
    
    // Criar cópia utilizando método do DataManager
    const dadosIntegrados = window.DataManager.criarCopiaSegura(dadosValidados);

    // Integrar dados SPED usando estrutura canônica
    window.DataManager.integrarDadosExternos(dadosIntegrados, {
        dadosSpedImportados: {
            composicaoTributaria: {
                debitos: dadosSped.debitos,
                creditos: dadosSped.creditos,
                aliquotasEfetivas: dadosSped.aliquotasEfetivas,
                totalDebitos: dadosSped.totalDebitos,
                totalCreditos: dadosSped.totalCreditos
            },
            origemDados: 'sped',
            timestampImportacao: new Date().toISOString()
        }
    });

    // Atualizar parâmetros fiscais com validação
    window.DataManager.atualizarParametrosFiscaisSped(dadosIntegrados, dadosSped);

    // Registrar log da transformação
    window.DataManager.logTransformacao(
        dadosFormulario, 
        dadosIntegrados, 
        'Integração SPED na Estrutura Padrão'
    );

    return dadosIntegrados;
}

// SUBSTITUIR ambas por uma única função consolidada:
function gerenciarInterfaceTributaria(regime, pisCofinsRegime = null) {
    // Verificar se estamos em processo de importação SPED
    if (window.processandoSPED) {
        console.log('MAIN: Ajuste de campos tributários ignorado durante processamento SPED');
        return;
    }

    const regimeAtivo = regime || document.getElementById('regime')?.value;
    const pisCofinsAtivo = pisCofinsRegime || document.getElementById('pis-cofins-regime')?.value;

    console.log(`MAIN: Atualizando interface tributária para regime ${regimeAtivo} e PIS/COFINS ${pisCofinsAtivo}`);
    
    // Implementação consolidada das duas funções
    const camposSimples = document.getElementById('campos-simples');
    const camposLucro = document.getElementById('campos-lucro');

    // Ocultar todos os campos específicos primeiro
    if (camposSimples) camposSimples.style.display = 'none';
    if (camposLucro) camposLucro.style.display = 'none';

    // Mostrar campos baseado no regime selecionado
    switch(regimeAtivo) {
        case 'simples':
            if (camposSimples) camposSimples.style.display = 'block';
            break;
        case 'presumido':
        case 'real':
            if (camposLucro) camposLucro.style.display = 'block';
            break;
    }

    // Atualizar campos específicos por tipo de operação
    ajustarCamposOperacao();
    
    // Recalcular créditos após mudança de regime
    if (typeof window.calcularCreditosTributarios === 'function') {
        setTimeout(() => {
            window.calcularCreditosTributarios();
        }, 100);
    }
}

// Manter compatibilidade com chamadas existentes
window.atualizarInterfaceTributaria = gerenciarInterfaceTributaria;
window.ajustarCamposTributarios = gerenciarInterfaceTributaria;

/**
 * Ajusta campos de operação com base no tipo de empresa
 */
function ajustarCamposOperacao() {
    const tipoEmpresa = document.getElementById('tipo-empresa')?.value;
    const camposICMS = document.getElementById('campos-icms');
    const camposIPI = document.getElementById('campos-ipi');
    const camposISS = document.getElementById('campos-iss');

    // Ocultar todos os campos primeiro
    if (camposICMS) camposICMS.style.display = 'none';
    if (camposIPI) camposIPI.style.display = 'none';
    if (camposISS) camposISS.style.display = 'none';

    // Mostrar campos baseado no tipo de empresa
    switch(tipoEmpresa) {
        case 'comercio':
            if (camposICMS) camposICMS.style.display = 'block';
            break;
        case 'industria':
            if (camposICMS) camposICMS.style.display = 'block';
            if (camposIPI) camposIPI.style.display = 'block';
            break;
        case 'servicos':
            if (camposISS) camposISS.style.display = 'block';
            break;
    }

    console.log('MAIN: Campos de operação ajustados para tipo:', tipoEmpresa);
}

/**
 * Adiciona notificação visual sobre uso de dados do SPED
 */
function adicionarNotificacaoSped() {
    // Remover notificação anterior se existir
    const notificacaoExistente = document.querySelector('.notificacao-sped');
    if (notificacaoExistente) {
        notificacaoExistente.remove();
    }

    // Criar nova notificação
    const notificacao = document.createElement('div');
    notificacao.className = 'alert alert-info notificacao-sped';
    notificacao.innerHTML = `
        <strong><i class="icon-info-circle"></i> Dados SPED Integrados:</strong> 
        A simulação está utilizando dados tributários reais extraídos dos arquivos SPED importados, 
        proporcionando maior precisão nos cálculos.
    `;

    // Inserir no início da área de resultados
    const divResultados = document.getElementById('resultados');
    if (divResultados) {
        divResultados.insertBefore(notificacao, divResultados.firstChild);
    }
}

/**
 * Observar mudanças de aba para atualizar dados quando necessário
 */
function observarMudancasDeAba() {
    // Observar eventos de mudança de aba
    document.addEventListener('tabChange', function(event) {
        const tabId = event.detail.tab;
        
        // Se a aba de simulação for ativada, garantir que o dropdown esteja atualizado
        if (tabId === 'simulacao') {
            SetoresManager.preencherDropdownSetores('setor');
            console.log('Dropdown de setores atualizado na aba de simulação');
        }
    });
}

// SUBSTITUIR por versão mais concisa:
function observarCamposCriticos() {
    console.log('Configurando observadores para campos críticos');
    
    // Obter mapeamento de campos da estrutura canônica
    const camposCriticos = window.DataManager.obterMapeamentoCamposCriticos();
    
    camposCriticos.forEach(campo => {
        configurarObservadorCampo(campo);
    });
    
    console.log('Configuração de observadores para campos críticos concluída');
}

function configurarObservadorCampo(campo) {
    const elemento = document.getElementById(campo.id);
    if (!elemento) {
        console.warn(`Campo crítico #${campo.id} não encontrado no DOM.`);
        return;
    }
    
    // Adicionar evento para normalização após alteração
    elemento.addEventListener('change', function() {
        normalizarCampoCritico(campo, elemento);
    });
    
    // Inicializar com valor do repositório
    inicializarCampoComRepositorio(campo, elemento);
    
    console.log(`Observador configurado para campo crítico: ${campo.id}`);
}

function normalizarCampoCritico(campo, elemento) {
    console.log(`Normalizando campo crítico: ${campo.id}`);
    
    try {
        // Utilizar DataManager para extrair e normalizar valor
        const valorAtual = window.DataManager.extrairValorDoCampo(elemento, campo.tipo);
        const valorNormalizado = window.DataManager.normalizarValor(valorAtual, campo.tipo);
        
        // Atualizar exibição usando formatadores do DataManager
        window.DataManager.atualizarExibicaoCampo(elemento, valorNormalizado, campo.tipo);
        
        // Registrar valor no dataset e notificar sistema
        elemento.dataset.valorNormalizado = valorNormalizado;
        
        const eventoMudanca = new CustomEvent('valorNormalizado', {
            detail: {
                campo: campo.id,
                tipo: campo.tipo,
                secao: campo.secao,
                valor: valorNormalizado
            }
        });
        elemento.dispatchEvent(eventoMudanca);
        
        // Atualizar repositório
        atualizarRepositorioComValorCampo(campo.secao, campo.id, valorNormalizado);
        
        console.log(`Campo ${campo.id} normalizado: ${valorNormalizado}`);
    } catch (erro) {
        console.error(`Erro ao normalizar campo ${campo.id}:`, erro);
    }
}

function inicializarCampoComRepositorio(campo, elemento) {
    try {
        const secao = window.SimuladorRepository.obterSecao(campo.secao);
        if (secao) {
            const valorDoRepositorio = window.DataManager.obterValorDePropertyPath(secao, campo.id);
            if (valorDoRepositorio !== undefined) {
                const valorNormalizado = window.DataManager.normalizarValor(valorDoRepositorio, campo.tipo);
                window.DataManager.atualizarExibicaoCampo(elemento, valorNormalizado, campo.tipo);
                elemento.dataset.valorNormalizado = valorNormalizado;
            }
        }
    } catch (erro) {
        console.warn(`Não foi possível inicializar o campo ${campo.id} com valor do repositório:`, erro);
    }
}

/**
 * Função auxiliar para atualizar o repositório com um valor de campo
 * @param {string} secao - Nome da seção no repositório
 * @param {string} campo - Nome do campo
 * @param {any} valor - Valor normalizado
 */
function atualizarRepositorioComValorCampo(secao, campo, valor) {
    try {
        // Obter a seção atual do repositório
        const dadosSecao = window.SimuladorRepository.obterSecao(secao);
        
        // Atualizar o campo específico
        dadosSecao[campo] = valor;
        
        // Atualizar a seção no repositório
        window.SimuladorRepository.atualizarSecao(secao, dadosSecao);
        
        console.log(`Repositório atualizado: ${secao}.${campo} = ${valor}`);
    } catch (erro) {
        console.error(`Erro ao atualizar repositório para ${secao}.${campo}:`, erro);
    }
}

/**
 * Função auxiliar para obter um valor de um caminho de propriedade
 * @param {Object} objeto - Objeto a ser acessado
 * @param {string} caminho - Caminho da propriedade (pode ser aninhado com '.')
 * @returns {any} - Valor da propriedade ou undefined se não encontrado
 */
function obterValorDePropertyPath(objeto, caminho) {
    if (!objeto || !caminho) return undefined;
    
    // Se o caminho não contiver ponto, acessar diretamente
    if (!caminho.includes('.')) {
        return objeto[caminho];
    }
    
    // Caso contrário, dividir e acessar recursivamente
    const partes = caminho.split('.');
    let valorAtual = objeto;
    
    for (const parte of partes) {
        if (valorAtual === undefined || valorAtual === null) {
            return undefined;
        }
        valorAtual = valorAtual[parte];
    }
    
    return valorAtual;
}

/**
 * Atualiza a tabela de transição tributária
 * @param {Object} resultado - Resultados da simulação
 */
function atualizarTabelaTransicao(resultado) {
    const tabela = document.getElementById('tabela-transicao');
    if (!tabela || !resultado.projecaoTemporal?.resultadosAnuais) {
        console.warn('Tabela de transição ou dados não disponíveis');
        return;
    }
    
    const tbody = tabela.querySelector('tbody');
    if (!tbody) {
        console.error('Elemento tbody não encontrado na tabela de transição');
        return;
    }
    
    tbody.innerHTML = '';
    
    const cronograma = {
        2026: 0.10, 2027: 0.25, 2028: 0.40, 2029: 0.55,
        2030: 0.70, 2031: 0.85, 2032: 0.95, 2033: 1.00
    };
    
    const formatarMoeda = window.DataManager.formatarMoeda;
    const anos = Object.keys(resultado.projecaoTemporal.resultadosAnuais).sort();
    
    anos.forEach(ano => {
        const dadosAno = resultado.projecaoTemporal.resultadosAnuais[ano];
        const percIVA = cronograma[ano] || 0;
        const percAtual = 1 - percIVA;
        
        // Obter valores com fallback seguro
        const regimeAtual = dadosAno.resultadoAtual?.capitalGiroDisponivel || 0;
        const ivaSemSplit = dadosAno.resultadoIVASemSplit?.capitalGiroDisponivel || regimeAtual;
        const ivaComSplit = dadosAno.resultadoSplitPayment?.capitalGiroDisponivel || 0;
        const impacto = ivaComSplit - regimeAtual;
        
        const linha = document.createElement('tr');
        linha.innerHTML = `
            <td>${ano}</td>
            <td>${formatarMoeda(regimeAtual)}</td>
            <td>${formatarMoeda(ivaSemSplit)}</td>
            <td>${formatarMoeda(ivaComSplit)}</td>
            <td class="${impacto >= 0 ? 'valor-positivo' : 'valor-negativo'}">${formatarMoeda(impacto)}</td>
        `;
        tbody.appendChild(linha);
    });
    
    console.log('Tabela de transição atualizada com', anos.length, 'anos');
}

/**
 * Atualiza a composição tributária detalhada
 * @param {Object} resultado - Resultados da simulação
 * @param {number} ano - Ano selecionado
 */
function atualizarComposicaoTributaria(resultado, ano) {
    const formatarMoeda = window.DataManager.formatarMoeda;
    
    console.log('MAIN: Atualizando composição tributária para ano:', ano);
    
    // CORREÇÃO: Verificar múltiplas fontes de dados SPED
    let dadosComposicao = null;
    
    // Prioridade 1: Dados globais do SPED
    if (window.dadosImportadosSped?.parametrosFiscais?.composicaoTributaria) {
        dadosComposicao = window.dadosImportadosSped.parametrosFiscais.composicaoTributaria;
        console.log('MAIN: Usando dados SPED globais para composição tributária');
    }
    // Prioridade 2: Dados do resultado da simulação
    else if (resultado.memoriaCalculo?.dadosEntrada?.parametrosFiscais?.composicaoTributaria) {
        dadosComposicao = resultado.memoriaCalculo.dadosEntrada.parametrosFiscais.composicaoTributaria;
        console.log('MAIN: Usando dados do resultado da simulação');
    }
    // Prioridade 3: Tentar reconstruir a partir de dados disponíveis
    else {
        console.warn('MAIN: Dados de composição tributária não encontrados, tentando reconstruir');
        dadosComposicao = tentarReconstruirComposicaoTributaria(resultado);
    }

    if (!dadosComposicao) {
        console.error('MAIN: Não foi possível obter dados de composição tributária');
        return;
    }

    const faturamento = resultado.memoriaCalculo?.dadosEntrada?.empresa?.faturamento || 0;
    
    console.log('MAIN: Dados de composição encontrados:', dadosComposicao);
    console.log('MAIN: Faturamento para cálculos:', faturamento);

    // Atualizar campos de débitos
    preencherCampoComposicao('debito-pis', dadosComposicao.debitos?.pis || 0);
    preencherCampoComposicao('debito-cofins', dadosComposicao.debitos?.cofins || 0);
    preencherCampoComposicao('debito-icms', dadosComposicao.debitos?.icms || 0);
    preencherCampoComposicao('debito-ipi', dadosComposicao.debitos?.ipi || 0);
    preencherCampoComposicao('debito-iss', dadosComposicao.debitos?.iss || 0);
    
    // Atualizar campos de créditos
    preencherCampoComposicao('credito-pis', dadosComposicao.creditos?.pis || 0);
    preencherCampoComposicao('credito-cofins', dadosComposicao.creditos?.cofins || 0);
    preencherCampoComposicao('credito-icms', dadosComposicao.creditos?.icms || 0);
    preencherCampoComposicao('credito-ipi', dadosComposicao.creditos?.ipi || 0);
    preencherCampoComposicao('credito-iss', dadosComposicao.creditos?.iss || 0);
    
    // Calcular e atualizar alíquotas efetivas baseadas nos valores líquidos
    if (faturamento > 0) {
        const impostos = ['pis', 'cofins', 'icms', 'ipi', 'iss'];
        
        impostos.forEach(imposto => {
            const debito = dadosComposicao.debitos?.[imposto] || 0;
            const credito = dadosComposicao.creditos?.[imposto] || 0;
            const valorLiquido = Math.max(0, debito - credito);
            const aliquotaEfetiva = (valorLiquido / faturamento) * 100;
            
            const campoAliquota = document.getElementById(`aliquota-efetiva-${imposto}`);
            if (campoAliquota) {
                campoAliquota.value = aliquotaEfetiva.toFixed(3);
                campoAliquota.dataset.rawValue = aliquotaEfetiva.toString();
            }
        });
    }
    
    // Calcular e atualizar totais
    const totalDebitos = Object.values(dadosComposicao.debitos || {}).reduce((sum, val) => sum + (val || 0), 0);
    const totalCreditos = Object.values(dadosComposicao.creditos || {}).reduce((sum, val) => sum + (val || 0), 0);
    
    preencherCampoComposicao('total-debitos', totalDebitos);
    preencherCampoComposicao('total-creditos', totalCreditos);
    
    // Alíquota efetiva total
    if (faturamento > 0) {
        const totalLiquido = Math.max(0, totalDebitos - totalCreditos);
        const aliquotaEfetivaTotal = (totalLiquido / faturamento) * 100;
        const campoAliquotaTotal = document.getElementById('aliquota-efetiva-total');
        if (campoAliquotaTotal) {
            campoAliquotaTotal.value = aliquotaEfetivaTotal.toFixed(3);
            campoAliquotaTotal.dataset.rawValue = aliquotaEfetivaTotal.toString();
        }
    }

    console.log('MAIN: Composição tributária atualizada com sucesso');
}

/**
 * Função auxiliar para preencher campos da composição tributária
 */
function preencherCampoComposicao(campoId, valor) {
    const elemento = document.getElementById(campoId);
    if (!elemento) {
        console.warn(`MAIN: Campo ${campoId} não encontrado no DOM`);
        return;
    }

    const valorFormatado = window.DataManager.formatarMoeda(valor);
    elemento.value = valorFormatado;
    
    if (elemento.dataset) {
        elemento.dataset.rawValue = valor.toString();
    }
    
    // Adicionar classe para indicar que é dado do SPED
    if (valor > 0) {
        elemento.classList.add('sped-data-value');
    }
    
    console.log(`MAIN: Campo ${campoId} preenchido com ${valorFormatado} (valor: ${valor})`);
}

/**
 * Tenta reconstruir dados de composição tributária a partir de informações disponíveis
 */
function tentarReconstruirComposicaoTributaria(resultado) {
    console.log('MAIN: Tentando reconstruir composição tributária');
    
    // Verificar se há dados no resultado da simulação
    const dadosAno = resultado.projecaoTemporal?.resultadosAnuais;
    if (dadosAno) {
        const primeiroAno = Object.keys(dadosAno)[0];
        const impostos = dadosAno[primeiroAno]?.resultadoAtual?.decomposicaoImpostos;
        const creditos = dadosAno[primeiroAno]?.resultadoAtual?.decomposicaoCreditos;
        
        if (impostos || creditos) {
            return {
                debitos: impostos || {},
                creditos: creditos || {}
            };
        }
    }
    
    // Verificar se há dados SPED em uma estrutura alternativa
    if (window.dadosImportadosSped?.parametrosFiscais) {
        const pf = window.dadosImportadosSped.parametrosFiscais;
        
        // Verificar estrutura alternativa
        if (pf.debitos || pf.creditos) {
            return {
                debitos: pf.debitos || {},
                creditos: pf.creditos || {}
            };
        }
    }
    
    console.warn('MAIN: Não foi possível reconstruir composição tributária');
    return null;
}

/**
 * Verifica se há dados do SPED disponíveis e os prioriza nos cálculos
 * @returns {Object|null} Dados do SPED se disponíveis
 */
function obterDadosSpedPrioritarios() {
    // Verificar se há dados marcados como vindos do SPED
    const camposSpedData = document.querySelectorAll('.sped-data');
    if (camposSpedData.length === 0) {
        return null;
    }

    // Extrair dados do painel de composição tributária detalhada
    const extrairValorMonetario = (id) => {
        const elemento = document.getElementById(id);
        if (!elemento || !elemento.value) return 0;
        
        // Usar o mesmo método do DataManager para extrair valor
        if (window.DataManager && window.DataManager.extrairValorMonetario) {
            return window.DataManager.extrairValorMonetario(elemento.value);
        }
        
        // Fallback: extrair valor manualmente
        return parseFloat(elemento.value.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
    };

    const extrairValorPercentual = (id) => {
        const elemento = document.getElementById(id);
        if (!elemento || !elemento.value) return 0;
        return parseFloat(elemento.value) || 0;
    };

    return {
        // Sinalizar que são dados do SPED
        origemSped: true,
        
        // Débitos mensais
        debitos: {
            pis: extrairValorMonetario('debito-pis'),
            cofins: extrairValorMonetario('debito-cofins'),
            icms: extrairValorMonetario('debito-icms'),
            ipi: extrairValorMonetario('debito-ipi'),
            iss: extrairValorMonetario('debito-iss')
        },
        
        // Créditos mensais
        creditos: {
            pis: extrairValorMonetario('credito-pis'),
            cofins: extrairValorMonetario('credito-cofins'),
            icms: extrairValorMonetario('credito-icms'),
            ipi: extrairValorMonetario('credito-ipi'),
            iss: extrairValorMonetario('credito-iss')
        },
        
        // Alíquotas efetivas
        aliquotasEfetivas: {
            pis: extrairValorPercentual('aliquota-efetiva-pis'),
            cofins: extrairValorPercentual('aliquota-efetiva-cofins'),
            icms: extrairValorPercentual('aliquota-efetiva-icms'),
            ipi: extrairValorPercentual('aliquota-efetiva-ipi'),
            iss: extrairValorPercentual('aliquota-efetiva-iss'),
            total: extrairValorPercentual('aliquota-efetiva-total')
        },
        
        // Totais
        totalDebitos: extrairValorMonetario('total-debitos'),
        totalCreditos: extrairValorMonetario('total-creditos')
    };
}

// Função para mostrar o painel de resultados
function mostrarPainelResultados() {
    // Mostrar múltiplas seções de resultados possíveis
    const seletoresResultados = [
        '#results-section',
        '#resultados-detalhados', 
        '#resultados',
        '.results-container'
    ];

    let painelEncontrado = false;

    seletoresResultados.forEach(seletor => {
        const painel = document.querySelector(seletor);
        if (painel) {
            painel.style.display = 'block';
            painel.style.visibility = 'visible';
            painelEncontrado = true;
            console.log(`Painel ${seletor} exibido`);
        }
    });

    // Se não encontrou nenhum painel, criar um básico
    if (!painelEncontrado) {
        console.log('Criando painel de resultados básico');
        const painelResultados = document.createElement('div');
        painelResultados.id = 'resultados-detalhados';
        painelResultados.className = 'results-container';
        painelResultados.style.display = 'block';
        
        // Inserir após o formulário de simulação
        const formSimulacao = document.querySelector('#simulacao') || document.querySelector('form') || document.body;
        formSimulacao.parentNode.insertBefore(painelResultados, formSimulacao.nextSibling);
    }
    
    // Scroll suave para os resultados com delay maior
    setTimeout(() => {
        const painelVisivel = document.querySelector('#results-section, #resultados-detalhados, #resultados');
        if (painelVisivel) {
            painelVisivel.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    }, 300);
    
    console.log('Painel de resultados processado');
}

// SUBSTITUIR o bloco DOMContentLoaded extenso por:
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, SimuladorFluxoCaixa disponível?', !!window.SimuladorFluxoCaixa);
    
    // Sequência de inicialização organizada
    inicializarModulosBasicos();
    inicializarRepositoryIntegrado();
    inicializarSimuladores();
    inicializarGerenciadores();
    inicializarComponentesUI();
    inicializarEventosPrincipais();
    aplicarDadosPadrao();
    configurarObservadores();
    finalizarInicializacao();
    
    console.log('Inicialização completa com arquitetura de dados padronizada');
});

// Funções extraídas:
function inicializarModulosBasicos() {
    inicializarModulos();
}

function inicializarRepositoryIntegrado() {
    inicializarRepository();
}

function inicializarSimuladores() {
    if (window.SimuladorFluxoCaixa && typeof window.SimuladorFluxoCaixa.init === 'function') {
        window.SimuladorFluxoCaixa.init();
    }
}

function inicializarGerenciadores() {
    if (typeof SetoresManager !== 'undefined') {
        SetoresManager.inicializar();
        SetoresManager.preencherDropdownSetores('setor');
    }
}

function inicializarComponentesUI() {
    const uiComponents = [
        { name: 'TabsManager', method: 'inicializar' },
        { name: 'FormsManager', method: 'inicializar' },
        { name: 'ModalManager', method: 'inicializar' }
    ];
    
    uiComponents.forEach(component => {
        if (typeof window[component.name] !== 'undefined') {
            window[component.name][component.method]();
            console.log(`${component.name} inicializado`);
        } else {
            console.warn(`${component.name} não encontrado`);
        }
    });

    if (typeof ImportacaoController !== 'undefined' && ImportacaoController.inicializar) {
        ImportacaoController.inicializar();
    }
}

// SUBSTITUIR a função massiva por:
function inicializarEventosPrincipais() {
    console.log('Inicializando eventos principais');
    
    configurarEventosSimulacao();
    configurarEventosExportacao();
    configurarEventosSetores();
    configurarEventosLog();
    configurarEventosEstrategias();
    configurarEventosMemoriaCalculo();
    configurarEventosDados();
    
    console.log('Eventos principais inicializados');
}

// Extrair cada grupo de eventos para funções específicas:
function configurarEventosSimulacao() {
    configurarBotaoSimular();
    configurarBotaoLimpar();
}

function configurarBotaoSimular() {
    const btnSimular = document.getElementById('btn-simular');
    if (btnSimular) {
        btnSimular.addEventListener('click', function() {
            console.log('Botão Simular clicado');

            try {
                // Verificações de disponibilidade
                if (!window.SimuladorFluxoCaixa) {
                    throw new Error('Simulador não inicializado corretamente');
                }

                if (!window.DataManager) {
                    throw new Error('DataManager não disponível. A simulação não pode continuar.');
                }

                // Obter dados usando estrutura aninhada do DataManager
                let dadosAninhados = window.DataManager.obterDadosDoFormulario();
                console.log('Dados obtidos do formulário (estrutura aninhada):', dadosAninhados);

                // Integrar dados do SPED se disponíveis
                dadosAninhados = integrarDadosSpedNaEstruturaPadrao(dadosAninhados);

                if (dadosAninhados.dadosSpedImportados) {
                    console.log('Dados do SPED detectados e integrados à simulação');
                    adicionarNotificacaoSped();
                }

                // Atualizar repositório com dados consolidados
                if (typeof SimuladorRepository !== 'undefined') {
                    Object.keys(dadosAninhados).forEach(secao => {
                        if (dadosAninhados[secao]) {
                            SimuladorRepository.atualizarSecao(secao, dadosAninhados[secao]);
                        }
                    });
                    console.log('Repositório atualizado com os dados do formulário e SPED');
                }

                // Executar simulação
                const resultado = window.SimuladorFluxoCaixa.simular(dadosAninhados);

                if (!resultado) {
                    throw new Error('A simulação não retornou resultados');
                }

                // Processar e exibir resultados
                atualizarInterface(resultado);
                mostrarPainelResultados();

                // Atualizar gráficos
                if (typeof window.ChartManager !== 'undefined' && typeof window.ChartManager.renderizarGraficos === 'function') {
                    window.ChartManager.renderizarGraficos(resultado);
                } else {
                    console.warn('ChartManager não encontrado ou função renderizarGraficos indisponível');
                }

            } catch (erro) {
                console.error('Erro ao executar simulação:', erro);
                alert('Não foi possível realizar a simulação: ' + erro.message);
            }
        });
    } else {
        console.error('Botão Simular não encontrado no DOM');
    }
}

function configurarBotaoLimpar() {
    const btnLimpar = document.getElementById('btn-limpar');
    if (btnLimpar) {
        btnLimpar.addEventListener('click', function() {
            console.log('Botão Limpar clicado');

            try {
                // Limpar usando estrutura aninhada do DataManager
                if (typeof SimuladorRepository !== 'undefined') {
                    localStorage.removeItem(SimuladorRepository.STORAGE_KEY);

                    const dadosPadrao = window.DataManager.obterEstruturaAninhadaPadrao();
                    Object.keys(dadosPadrao).forEach(secao => {
                        SimuladorRepository.atualizarSecao(secao, dadosPadrao[secao]);
                    });

                    console.log('Dados do repositório limpos');
                }

                // Limpar formulários utilizando DataManager
                limparFormulariosComDataManager();

                // Limpar resultados e gráficos
                limparResultadosEGraficos();

                console.log('Formulários limpos com sucesso');
                alert('Os dados foram limpos. Você pode iniciar uma nova simulação.');

            } catch (erro) {
                console.error('Erro ao limpar formulários:', erro);
                alert('Ocorreu um erro ao limpar os formulários: ' + erro.message);
            }
        });
    } else {
        console.error('Botão Limpar não encontrado no DOM');
    }
}

function limparFormulariosComDataManager() {
    const estruturaPadrao = window.DataManager.obterEstruturaAninhadaPadrao();
    
    // Mapear campos da interface para estrutura aninhada
    const mapeamentoCampos = [
        { id: 'faturamento', secao: 'empresa', prop: 'faturamento', tipo: 'monetario', padrao: 0 },
        { id: 'margem', secao: 'empresa', prop: 'margem', tipo: 'percentual', padrao: 15 },
        { id: 'pmr', secao: 'cicloFinanceiro', prop: 'pmr', tipo: 'numero', padrao: 30 },
        { id: 'pmp', secao: 'cicloFinanceiro', prop: 'pmp', tipo: 'numero', padrao: 30 },
        { id: 'pme', secao: 'cicloFinanceiro', prop: 'pme', tipo: 'numero', padrao: 30 },
        { id: 'perc-vista', secao: 'cicloFinanceiro', prop: 'percVista', tipo: 'percentual', padrao: 30 }
    ];

    mapeamentoCampos.forEach(campo => {
        const elemento = document.getElementById(campo.id);
        if (elemento) {
            // Usar valores padrão da estrutura ou valores específicos
            const valorPadrao = estruturaPadrao[campo.secao]?.[campo.prop] || campo.padrao;
            
            switch (campo.tipo) {
                case 'monetario':
                    elemento.value = window.DataManager.formatarMoeda(valorPadrao);
                    if (elemento.dataset) elemento.dataset.rawValue = valorPadrao.toString();
                    break;
                case 'percentual':
                    elemento.value = valorPadrao.toString();
                    break;
                case 'numero':
                    elemento.value = valorPadrao.toString();
                    break;
                default:
                    elemento.value = valorPadrao.toString();
            }

            // Disparar evento de mudança
            elemento.dispatchEvent(new Event('change'));
        }
    });

    // Limpar campos de seleção
    const camposSelecao = ['tipo-empresa', 'tipo-operacao', 'regime', 'cenario'];
    camposSelecao.forEach(id => {
        const campo = document.getElementById(id);
        if (campo && campo.tagName === 'SELECT') {
            campo.selectedIndex = 0;
            campo.dispatchEvent(new Event('change'));
        }
    });
}

function limparResultadosEGraficos() {
    const divResultadosDetalhados = document.getElementById('resultados-detalhados');
    if (divResultadosDetalhados) {
        divResultadosDetalhados.style.display = 'none';
    }

    if (typeof window.ChartManager !== 'undefined' && typeof window.ChartManager.limparGraficos === 'function') {
        window.ChartManager.limparGraficos();
    }
}

function configurarEventosExportacao() {
    configurarBotaoExportarPDF();
    configurarBotaoExportarExcel();
    configurarBotaoExportarMemoria();
    configurarBotoesExportarEstrategias();
}

function configurarBotaoExportarPDF() {
    const btnExportarPDF = document.getElementById('btn-exportar-pdf');
    if (btnExportarPDF) {
        btnExportarPDF.addEventListener('click', function() {
            console.log('Botão Exportar PDF clicado');
            if (typeof window.ExportTools !== 'undefined' && typeof window.ExportTools.exportarParaPDF === 'function') {
                window.ExportTools.exportarParaPDF();
            } else {
                console.error('ExportTools não disponível ou método exportarParaPDF não encontrado');
                alert('Ferramenta de exportação PDF não está disponível no momento.');
            }
        });
    } else {
        console.warn('Botão Exportar PDF não encontrado no DOM');
    }
}

function configurarBotaoExportarExcel() {
    const btnExportarExcel = document.getElementById('btn-exportar-excel');
    if (btnExportarExcel) {
        btnExportarExcel.addEventListener('click', function() {
            console.log('Botão Exportar Excel clicado');
            if (typeof window.ExportTools !== 'undefined' && typeof window.ExportTools.exportarParaExcel === 'function') {
                window.ExportTools.exportarParaExcel();
            } else {
                console.error('ExportTools não disponível ou método exportarParaExcel não encontrado');
                alert('Ferramenta de exportação Excel não está disponível no momento.');
            }
        });
    } else {
        console.warn('Botão Exportar Excel não encontrado no DOM');
    }
}

function configurarBotaoExportarMemoria() {
    const btnExportarMemoria = document.getElementById('btn-exportar-memoria');
    if (btnExportarMemoria) {
        btnExportarMemoria.addEventListener('click', function() {
            if (typeof ExportTools !== 'undefined') {
                ExportTools.exportarMemoriaCalculo();
            }
        });
    }
}

function configurarBotoesExportarEstrategias() {
    const btnExportarEstrategiasPDF = document.getElementById('btn-exportar-estrategias-pdf');
    if (btnExportarEstrategiasPDF) {
        btnExportarEstrategiasPDF.addEventListener('click', function() {
            console.log('Botão Exportar Estratégias PDF clicado');
            if (typeof window.ExportTools !== 'undefined' && typeof window.ExportTools.exportarParaPDF === 'function') {
                window.ExportTools.exportarParaPDF();
            } else {
                console.error('ExportTools não disponível ou método exportarParaPDF não encontrado');
                alert('Ferramenta de exportação PDF não está disponível no momento.');
            }
        });
    }

    const btnExportarEstrategiasExcel = document.getElementById('btn-exportar-estrategias-excel');
    if (btnExportarEstrategiasExcel) {
        btnExportarEstrategiasExcel.addEventListener('click', function() {
            console.log('Botão Exportar Estratégias Excel clicado');
            if (typeof window.ExportTools !== 'undefined' && typeof window.ExportTools.exportarParaExcel === 'function') {
                window.ExportTools.exportarParaExcel();
            } else {
                console.error('ExportTools não disponível ou método exportarParaExcel não encontrado');
                alert('Ferramenta de exportação Excel não está disponível no momento.');
            }
        });
    }
}

function configurarEventosSetores() {
    configurarCampoSetor();
    configurarBotaoSalvarSetor();
}

function configurarCampoSetor() {
    const campoSetor = document.getElementById('setor');
    if (campoSetor) {
        campoSetor.addEventListener('change', function() {
            const setorCodigo = this.value;

            if (!setorCodigo) {
                limparCamposSetor();
                return;
            }

            // Obter dados do setor do repositório
            if (typeof SetoresRepository !== 'undefined') {
                const dadosSetor = SetoresRepository.obterSetor(setorCodigo);

                if (dadosSetor) {
                    preencherCamposSetor(dadosSetor);
                    console.log(`Setor ${dadosSetor.nome} selecionado - campos preenchidos automaticamente`);
                } else {
                    console.warn(`Dados do setor ${setorCodigo} não encontrados`);
                }
            } else {
                console.error('SetoresRepository não disponível');
            }
        });

        console.log('Event listener para mudança de setor configurado');
    } else {
        console.error('Campo setor não encontrado no DOM');
    }
}

function limparCamposSetor() {
    document.getElementById('aliquota-cbs').value = '';
    document.getElementById('aliquota-ibs').value = '';
    document.getElementById('reducao').value = '';
    document.getElementById('aliquota').value = '';
    document.getElementById('categoria-iva').value = 'standard';
}

function preencherCamposSetor(dadosSetor) {
    document.getElementById('aliquota-cbs').value = (dadosSetor['aliquota-cbs'] * 100).toFixed(1);
    document.getElementById('aliquota-ibs').value = (dadosSetor['aliquota-ibs'] * 100).toFixed(1);
    document.getElementById('reducao').value = (dadosSetor.reducaoEspecial * 100).toFixed(1);
    document.getElementById('aliquota').value = (dadosSetor.aliquotaEfetiva * 100).toFixed(1);
    document.getElementById('categoria-iva').value = dadosSetor.categoriaIva || 'standard';
}

function configurarBotaoSalvarSetor() {
    const btnSalvarSetor = document.getElementById('btn-salvar-setor');
    if (btnSalvarSetor) {
        btnSalvarSetor.addEventListener('click', function() {
            // Após salvar o setor, atualizar dropdown na aba de simulação
            setTimeout(function() {
                SetoresManager.preencherDropdownSetores('setor');
            }, 100);
        });
    }
}

function configurarEventosLog() {
    configurarBotoesLog();
    configurarFiltrosLog();
    configurarBotaoDetalhes();
}

function configurarBotoesLog() {
    const btnLimparLog = document.getElementById('btn-limpar-log');
    if (btnLimparLog) {
        btnLimparLog.addEventListener('click', limparLogImportacao);
    }
    
    const btnExportarLog = document.getElementById('btn-exportar-log');
    if (btnExportarLog) {
        btnExportarLog.addEventListener('click', exportarLogImportacao);
    }
}

function configurarFiltrosLog() {
    const filtros = ['filtro-info', 'filtro-warning', 'filtro-error', 'filtro-success'];
    filtros.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', aplicarFiltrosLog);
        }
    });
}

function configurarBotaoDetalhes() {
    const btnDetalhes = document.getElementById('btn-detalhes-importacao');
    if (btnDetalhes) {
        btnDetalhes.addEventListener('click', exibirDetalhesImportacao);
    }
}

function configurarEventosEstrategias() {
    const btnSimularEstrategias = document.getElementById('btn-simular-estrategias');
    if (btnSimularEstrategias) {
        btnSimularEstrategias.addEventListener('click', function() {
            if (window.SimuladorFluxoCaixa && typeof window.SimuladorFluxoCaixa.simularEstrategias === 'function') {
                window.SimuladorFluxoCaixa.simularEstrategias();
            } else {
                console.error('Função de simulação de estratégias não encontrada');
                alert('Não foi possível simular estratégias. Verifique se todos os módulos foram carregados corretamente.');
            }
        });
    }
    
    // Event listener para seletor de ano de estratégias
    const seletorAnoEstrategias = document.getElementById('ano-visualizacao-estrategias');
    if (seletorAnoEstrategias) {
        seletorAnoEstrategias.addEventListener('change', function() {
            console.log('Ano de visualização de estratégias alterado para:', this.value);
            // Usar a função existente que já tem a lógica de verificação
            atualizarVisualizacaoEstrategias();
        });
        console.log('Event listener para ano de visualização de estratégias configurado');
    } else {
        console.warn('Seletor de ano de visualização de estratégias não encontrado no DOM');
    }
}

function configurarEventosMemoriaCalculo() {
    configurarBotaoAtualizarMemoria();
    configurarSelectAnoMemoria();
}

function configurarBotaoAtualizarMemoria() {
    const btnAtualizarMemoria = document.getElementById('btn-atualizar-memoria');
    if (btnAtualizarMemoria) {
        btnAtualizarMemoria.addEventListener('click', function() {
            atualizarExibicaoMemoriaCalculo();
        });
    }
}

function configurarSelectAnoMemoria() {
    const selectAnoMemoria = document.getElementById('select-ano-memoria');
    if (selectAnoMemoria) {
        selectAnoMemoria.addEventListener('change', function() {
            atualizarExibicaoMemoriaCalculo();
        });
    }
}

function configurarEventosDados() {
    configurarEventosCamposTributarios();
    configurarEventosCamposFinanceiros();
    configurarEventosFormatacao();
}

function configurarEventosCamposTributarios() {
    const campoRegime = document.getElementById('regime');
    if (campoRegime) {
        campoRegime.addEventListener('change', gerenciarInterfaceTributaria);
    }

    const campoTipoEmpresa = document.getElementById('tipo-empresa');
    if (campoTipoEmpresa) {
        campoTipoEmpresa.addEventListener('change', ajustarCamposOperacao);
    }
}

function configurarEventosCamposFinanceiros() {
    const checkboxDadosFinanceiros = document.getElementById('usar-dados-financeiros');
    if (checkboxDadosFinanceiros) {
        checkboxDadosFinanceiros.addEventListener('change', toggleDadosFinanceiros);
    }

    // Configurar campos financeiros para cálculo automático
    if (window.CurrencyFormatter) {
        const camposFinanceiros = [
            'receita-bruta', 'receita-liquida', 'custo-total', 
            'despesas-operacionais', 'lucro-operacional'
        ];

        camposFinanceiros.forEach(id => {
            const campo = document.getElementById(id);
            if (campo) {
                window.CurrencyFormatter.aplicarFormatacaoMoeda(campo);
                campo.addEventListener('input', calcularDadosFinanceiros);
            }
        });
    }
}

function configurarEventosFormatacao() {
    // Inicializar formatação de moeda se disponível
    if (window.CurrencyFormatter) {
        window.CurrencyFormatter.inicializar();
    }
}

// Funções auxiliares para eventos de log (que estavam no código original)
function limparLogImportacao() {
    const logArea = document.getElementById('import-log');
    if (logArea) {
        logArea.innerHTML = '<p class="text-muted">Log limpo pelo usuário.</p>';
    }

    // Resetar estatísticas
    const stats = ['stat-total', 'stat-success', 'stat-warnings', 'stat-errors'];
    stats.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = '0';
    });

    // Ocultar seção de estatísticas
    const logStatistics = document.getElementById('log-statistics');
    if (logStatistics) {
        logStatistics.style.display = 'none';
    }

    console.log('MAIN: Log de importação limpo');
}

function exportarLogImportacao() {
    const logArea = document.getElementById('import-log');
    if (!logArea) return;

    const logContent = logArea.innerText || logArea.textContent;

    if (!logContent || logContent.trim() === 'Log limpo pelo usuário.' || 
        logContent.includes('Selecione os arquivos SPED')) {
        alert('Não há dados de log para exportar.');
        return;
    }

    const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `log-importacao-sped-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    console.log('MAIN: Log de importação exportado');
}

function aplicarFiltrosLog() {
    const logArea = document.getElementById('import-log');
    if (!logArea) return;

    const filtros = {
        info: document.getElementById('filtro-info')?.checked !== false,
        warning: document.getElementById('filtro-warning')?.checked !== false,
        error: document.getElementById('filtro-error')?.checked !== false,
        success: document.getElementById('filtro-success')?.checked !== false
    };

    const logItems = logArea.querySelectorAll('p[class*="log-"]');

    logItems.forEach(item => {
        let mostrar = false;

        Object.keys(filtros).forEach(tipo => {
            if (item.classList.contains(`log-${tipo}`) && filtros[tipo]) {
                mostrar = true;
            }
        });

        item.style.display = mostrar ? 'block' : 'none';
    });

    console.log('MAIN: Filtros de log aplicados', filtros);
}

function exibirDetalhesImportacao() {
    if (!window.dadosImportadosSped) {
        alert('Nenhum dado SPED foi importado ainda.');
        return;
    }

    // Criar modal com detalhes da importação
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    const dados = window.dadosImportadosSped;
    const empresa = dados.empresa || {};
    const parametrosFiscais = dados.parametrosFiscais || {};
    const metadados = dados.metadados || {};

    modal.innerHTML = criarConteudoModalDetalhes(empresa, parametrosFiscais, metadados);

    // Adicionar event listeners para fechar modal
    const closeBtn = modal.querySelector('.modal-close');
    const footerBtn = modal.querySelector('.btn-secondary');

    const fecharModal = () => {
        document.body.removeChild(modal);
    };

    closeBtn.addEventListener('click', fecharModal);
    footerBtn.addEventListener('click', fecharModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) fecharModal();
    });

    document.body.appendChild(modal);
}

function criarConteudoModalDetalhes(empresa, parametrosFiscais, metadados) {
    return `
        <div class="modal" style="max-width: 800px; max-height: 80vh; overflow-y: auto; background: white; border-radius: 8px; padding: 0;">
            <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0;">Detalhes da Importação SPED</h3>
                <button type="button" class="modal-close" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
            </div>
            <div class="modal-body" style="padding: 20px;">
                <h4 style="color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 5px;">Dados da Empresa</h4>
                <div style="margin-bottom: 20px;">
                    <p><strong>Razão Social:</strong> ${empresa.nome || 'N/A'}</p>
                    <p><strong>CNPJ:</strong> ${empresa.cnpj || 'N/A'}</p>
                    <p><strong>Faturamento Mensal:</strong> ${formatarMoedaDetalhes(empresa.faturamento || 0)}</p>
                    <p><strong>Margem Operacional:</strong> ${((empresa.margem || 0) * 100).toFixed(2)}%</p>
                    <p><strong>Tipo de Empresa:</strong> ${empresa.tipoEmpresa || 'N/A'}</p>
                    <p><strong>Regime Tributário:</strong> ${empresa.regime || 'N/A'}</p>
                </div>

                <h4 style="color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 5px;">Composição Tributária</h4>
                <div style="margin-bottom: 20px;">
                    ${parametrosFiscais.composicaoTributaria ? gerarTabelaComposicao(parametrosFiscais.composicaoTributaria) : '<p>Dados não disponíveis</p>'}
                </div>

                <h4 style="color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 5px;">Metadados da Importação</h4>
                <div style="margin-bottom: 20px;">
                    <p><strong>Fonte dos Dados:</strong> ${metadados.fonteDados || 'N/A'}</p>
                    <p><strong>Data de Importação:</strong> ${metadados.timestampImportacao ? new Date(metadados.timestampImportacao).toLocaleString('pt-BR') : 'N/A'}</p>
                    <p><strong>Qualidade dos Dados:</strong> ${metadados.qualidadeDados?.classificacao || 'N/A'}</p>
                    ${metadados.arquivosProcessados?.length ? `
                        <p><strong>Arquivos Processados:</strong></p>
                        <ul>
                            ${metadados.arquivosProcessados.map(arquivo => `
                                <li>${arquivo.nomeArquivo || 'Arquivo'} (${arquivo.tipoArquivo || 'Tipo desconhecido'})</li>
                            `).join('')}
                        </ul>
                    ` : ''}
                </div>
            </div>
            <div class="modal-footer" style="padding: 20px; border-top: 1px solid #ddd; text-align: right;">
                <button type="button" class="btn btn-secondary" style="padding: 8px 16px; border: 1px solid #6c757d; background: #6c757d; color: white; border-radius: 4px; cursor: pointer;">Fechar</button>
            </div>
        </div>
    `;
}

function gerarTabelaComposicao(composicao) {
    const { debitos, creditos, aliquotasEfetivas } = composicao;

    return `
        <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
            <thead>
                <tr style="background-color: #f8f9fa;">
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Imposto</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Débitos</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Créditos</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Alíquota Efetiva</th>
                </tr>
            </thead>
            <tbody>
                ${['pis', 'cofins', 'icms', 'ipi', 'iss'].map(imposto => `
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">${imposto.toUpperCase()}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatarMoedaDetalhes(debitos[imposto] || 0)}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatarMoedaDetalhes(creditos[imposto] || 0)}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${(aliquotasEfetivas[imposto] || 0).toFixed(3)}%</td>
                    </tr>
                `).join('')}
                <tr style="background-color: #f8f9fa; font-weight: bold;">
                    <td style="border: 1px solid #ddd; padding: 8px;">TOTAL</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatarMoedaDetalhes(Object.values(debitos).reduce((sum, val) => sum + (val || 0), 0))}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatarMoedaDetalhes(Object.values(creditos).reduce((sum, val) => sum + (val || 0), 0))}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${(aliquotasEfetivas.total || 0).toFixed(3)}%</td>
                </tr>
            </tbody>
        </table>
    `;
}

function formatarMoedaDetalhes(valor) {
    if (isNaN(valor) || valor === null || valor === undefined) {
        valor = 0;
    }

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor);
}

// Funções auxiliares que devem existir ou serem definidas em outros módulos
function toggleDadosFinanceiros() {
    // Implementação da função de toggle para dados financeiros
    const checkboxDadosFinanceiros = document.getElementById('usar-dados-financeiros');
    const painelDadosFinanceiros = document.getElementById('dados-financeiros-panel');
    
    if (checkboxDadosFinanceiros && painelDadosFinanceiros) {
        painelDadosFinanceiros.style.display = checkboxDadosFinanceiros.checked ? 'block' : 'none';
    }
}

function calcularDadosFinanceiros() {
    if (!window.DataManager) return;

    const receitaLiquida = window.DataManager.extrairValorNumerico('receita-liquida');
    const custoTotal = window.DataManager.extrairValorNumerico('custo-total');
    const despesasOperacionais = window.DataManager.extrairValorNumerico('despesas-operacionais');

    // Calcular lucro operacional
    const lucroOperacional = receitaLiquida - custoTotal - despesasOperacionais;
    const campoLucroOperacional = document.getElementById('lucro-operacional');
    if (campoLucroOperacional) {
        campoLucroOperacional.value = window.DataManager.formatarMoeda(lucroOperacional);
    }

    // Calcular margem operacional
    const margemOperacional = receitaLiquida > 0 ? (lucroOperacional / receitaLiquida) * 100 : 0;
    const campoMargemOperacional = document.getElementById('margem-operacional-calc');
    if (campoMargemOperacional) {
        campoMargemOperacional.value = margemOperacional.toFixed(2);
    }

    console.log('MAIN: Dados financeiros calculados - Lucro:', lucroOperacional, 'Margem:', margemOperacional);
}

function atualizarExibicaoMemoriaCalculo() {
    const selectAno = document.getElementById('select-ano-memoria');
    if (!selectAno) return;

    const anoSelecionado = selectAno.value;
    console.log('Atualizando memória para o ano:', anoSelecionado);

    // Verificar se temos dados de memória de cálculo disponíveis
    if (!window.memoriaCalculoSimulacao) {
        const conteudo = '<p class="text-muted">Realize uma simulação para gerar a memória de cálculo detalhada.</p>';
        document.getElementById('memoria-calculo').innerHTML = conteudo;
        return;
    }

    // Extrair dados de memória e formatar conteúdo
    const memoria = window.memoriaCalculoSimulacao;
    const formatarMoeda = window.DataManager.formatarMoeda;
    const formatarPercentual = valor => {
        return valor ? window.DataManager.formatarPercentual(valor) : 'N/A';
    };

    // Gerar conteúdo HTML para a memória de cálculo
    let conteudo = gerarConteudoMemoriaCalculo(memoria, formatarMoeda, formatarPercentual);
    
    // Adicionar o conteúdo à div de memória de cálculo
    document.getElementById('memoria-calculo').innerHTML = conteudo;
}

function gerarConteudoMemoriaCalculo(memoria, formatarMoeda, formatarPercentual) {
    return `
        <div class="memory-section">
            <h3>1. Dados de Entrada</h3>
            <div class="memory-content">
                <p><strong>Empresa:</strong> ${memoria.dadosEntrada?.empresa?.faturamento ? formatarMoeda(memoria.dadosEntrada.empresa.faturamento) : 'N/A'}</p>
                <p><strong>Margem:</strong> ${memoria.dadosEntrada?.empresa?.margem ? formatarPercentual(memoria.dadosEntrada.empresa.margem) : 'N/A'}</p>
                <p><strong>Ciclo Financeiro:</strong> PMR = ${memoria.dadosEntrada?.cicloFinanceiro?.pmr || 'N/A'}, 
                   PMP = ${memoria.dadosEntrada?.cicloFinanceiro?.pmp || 'N/A'}, 
                   PME = ${memoria.dadosEntrada?.cicloFinanceiro?.pme || 'N/A'}</p>
                <p><strong>Distribuição de Vendas:</strong> À Vista = ${memoria.dadosEntrada?.cicloFinanceiro?.percVista ? formatarPercentual(memoria.dadosEntrada.cicloFinanceiro.percVista) : 'N/A'}, 
                   A Prazo = ${memoria.dadosEntrada?.cicloFinanceiro?.percPrazo ? formatarPercentual(memoria.dadosEntrada.cicloFinanceiro.percPrazo) : 'N/A'}</p>
                <p><strong>Alíquota:</strong> ${memoria.dadosEntrada?.parametrosFiscais?.aliquota ? formatarPercentual(memoria.dadosEntrada.parametrosFiscais.aliquota) : 'N/A'}</p>
            </div>
        </div>

        <div class="memory-section">
            <h3>2. Cálculo do Impacto Base</h3>
            <div class="memory-content">
                <p><strong>Diferença no Capital de Giro:</strong> ${memoria.impactoBase?.diferencaCapitalGiro ? formatarMoeda(memoria.impactoBase.diferencaCapitalGiro) : 'N/A'}</p>
                <p><strong>Percentual de Impacto:</strong> ${memoria.impactoBase?.percentualImpacto ? formatarPercentual(memoria.impactoBase.percentualImpacto/100) : 'N/A'}</p>
                <p><strong>Impacto em Dias de Faturamento:</strong> ${memoria.impactoBase?.impactoDiasFaturamento ? memoria.impactoBase.impactoDiasFaturamento.toFixed(1) + ' dias' : 'N/A'}</p>
            </div>
        </div>

        <div class="memory-section">
            <h3>3. Projeção Temporal</h3>
            <div class="memory-content">
                <p><strong>Cenário:</strong> ${memoria.projecaoTemporal?.parametros?.cenarioTaxaCrescimento || 'N/A'}</p>
                <p><strong>Taxa de Crescimento:</strong> ${memoria.projecaoTemporal?.parametros?.taxaCrescimento ? formatarPercentual(memoria.projecaoTemporal.parametros.taxaCrescimento) : 'N/A'}</p>
                <p><strong>Necessidade Total de Capital de Giro:</strong> ${memoria.projecaoTemporal?.impactoAcumulado?.totalNecessidadeCapitalGiro ? formatarMoeda(memoria.projecaoTemporal.impactoAcumulado.totalNecessidadeCapitalGiro) : 'N/A'}</p>
                <p><strong>Custo Financeiro Total:</strong> ${memoria.projecaoTemporal?.impactoAcumulado?.custoFinanceiroTotal ? formatarMoeda(memoria.projecaoTemporal.impactoAcumulado.custoFinanceiroTotal) : 'N/A'}</p>
            </div>
        </div>

        <div class="memory-section">
            <h3>4. Memória Crítica de Cálculo</h3>
            <div class="memory-content">
                <p><strong>Fórmula:</strong> ${memoria.memoriaCritica?.formula || 'N/A'}</p>
                <div class="steps-container">
                    <p><strong>Passo a Passo:</strong></p>
                    <ol>
                        ${(memoria.memoriaCritica?.passoAPasso || []).map(passo => `<li>${passo}</li>`).join('')}
                    </ol>
                </div>
                <div class="observations-container">
                    <p><strong>Observações:</strong></p>
                    <ul>
                        ${(memoria.memoriaCritica?.observacoes || []).map(obs => `<li>${obs}</li>`).join('')}
                    </ul>
                </div>
            </div>
        </div>
    `;
}

// Exportar função para escopo global
window.exibirMemoriaCalculo = atualizarExibicaoMemoriaCalculo;

function aplicarDadosPadrao() {
    const dadosPadrao = window.DataManager.obterEstruturaAninhadaPadrao();
    atualizarCamposComDadosPadrao(dadosPadrao);
    gerenciarInterfaceTributaria();
    ajustarCamposOperacao();
    calcularCreditosTributarios();
}

function configurarObservadores() {
    observarMudancasDeAba();
    observarCamposCriticos();
}

/**
 * Configura tratamento de eventos de importação SPED
 * Garante que apenas ImportacaoController possa definir o regime durante importação
 */
function configurarGerenciamentoSPED() {
    // Ouvir evento de importação concluída
    document.addEventListener('spedImportacaoConcluida', function(evento) {
        console.log('MAIN: Importação SPED concluída, atualizando interface');

        // Realizar qualquer atualização adicional necessária após importação
        // MAS SEM modificar os valores de regime já definidos pelo ImportacaoController
    });

    console.log('MAIN: Gerenciamento SPED configurado');
}

function finalizarInicializacao() {
    if (window.CurrencyFormatter && typeof window.CurrencyFormatter.inicializar === 'function') {
        window.CurrencyFormatter.inicializar();
    }
    
    // ADICIONAR: Inicializar ChartManager
    if (window.ChartManager && typeof window.ChartManager.inicializar === 'function') {
        window.ChartManager.inicializar();
        console.log('ChartManager inicializado');
    } else {
        console.warn('ChartManager não encontrado durante inicialização');
    }
    
    // ADICIONAR: Inicializar seletor de ano para estratégias
    inicializarSeletorAnoEstrategias();
    
    window.processandoSPED = false;
    configurarGerenciamentoSPED();
}

/**
 * Inicializa o seletor de ano para estratégias com o mesmo valor da simulação principal
 */
function inicializarSeletorAnoEstrategias() {
    const seletorAnoPrincipal = document.getElementById('ano-visualizacao');
    const seletorAnoEstrategias = document.getElementById('ano-visualizacao-estrategias');
    
    if (seletorAnoPrincipal && seletorAnoEstrategias) {
        // Sincronizar valor inicial
        seletorAnoEstrategias.value = seletorAnoPrincipal.value;
        
        // Sincronizar mudanças do seletor principal para estratégias
        seletorAnoPrincipal.addEventListener('change', function() {
            seletorAnoEstrategias.value = this.value;
            
            // Se há resultados de estratégias, atualizar automaticamente
            if (window.lastStrategyResults) {
                // CORREÇÃO: Usar a função existente em vez da removida
                atualizarVisualizacaoEstrategias();
            }
        });
        
        console.log('Seletor de ano para estratégias inicializado e sincronizado');
    } else {
        console.warn('Seletores de ano não encontrados para sincronização');
    }
}

/**
 * Atualiza a tabela e gráfico de evolução tributária
 */
function atualizarEvolucaoTributaria(resultado, anoSelecionado) {
    console.log('MAIN: Iniciando atualização da evolução tributária');
    
    // Verificar múltiplas fontes de dados SPED
    let dadosSpedComposicao = null;
    
    if (window.dadosImportadosSped?.parametrosFiscais?.composicaoTributaria) {
        dadosSpedComposicao = window.dadosImportadosSped.parametrosFiscais.composicaoTributaria;
    } else if (resultado.memoriaCalculo?.dadosEntrada?.parametrosFiscais?.composicaoTributaria) {
        dadosSpedComposicao = resultado.memoriaCalculo.dadosEntrada.parametrosFiscais.composicaoTributaria;
    }
    
    const faturamento = resultado.memoriaCalculo?.dadosEntrada?.empresa?.faturamento;

    if (!dadosSpedComposicao || !faturamento) {
        console.warn('MAIN: Dados SPED ou faturamento não disponíveis para evolução tributária');
        return;
    }

    // CORREÇÃO: Obter parâmetros de simulação para crescimento
    const parametrosSimulacao = {
        cenario: resultado.projecaoTemporal?.parametros?.cenarioTaxaCrescimento || 'moderado',
        taxaCrescimento: resultado.projecaoTemporal?.parametros?.taxaCrescimento || 0.05
    };

    console.log('MAIN: Parâmetros de simulação:', parametrosSimulacao);

    // Calcular evolução com crescimento da receita
    const evolucao = window.IVADualSystem.calcularEvolucaoTributariaDetalhada(
        dadosSpedComposicao, 
        faturamento,
        parametrosSimulacao  // ADICIONADO: Parâmetros de crescimento
    );

    console.log('MAIN: Evolução calculada com crescimento:', evolucao);

    // Atualizar tabela
    atualizarTabelaEvolucaoTributaria(evolucao);

    // Atualizar gráfico
    if (typeof window.ChartManager !== 'undefined' && 
        typeof window.ChartManager.renderizarGraficoEvolucaoTributaria === 'function') {
        window.ChartManager.renderizarGraficoEvolucaoTributaria(evolucao);
    } else if (typeof window.renderizarGraficoEvolucaoTributaria === 'function') {
        window.renderizarGraficoEvolucaoTributaria(evolucao);
    }

    // ADICIONADO: Exibir estatísticas resumo
    exibirEstatisticasEvolucao(evolucao);
}

/**
 * Exibe estatísticas resumo da evolução tributária
 */
function exibirEstatisticasEvolucao(evolucao) {
    const estatisticas = evolucao.estatisticas;
    if (!estatisticas) return;

    const formatarMoeda = window.DataManager.formatarMoeda;
    const formatarPercentual = (valor) => valor.toFixed(2) + '%';

    // Criar ou atualizar painel de estatísticas
    let painelEstatisticas = document.getElementById('estatisticas-evolucao');
    if (!painelEstatisticas) {
        painelEstatisticas = document.createElement('div');
        painelEstatisticas.id = 'estatisticas-evolucao';
        painelEstatisticas.className = 'estatisticas-panel';
        
        const container = document.getElementById('evolucao-tributaria');
        if (container) {
            container.appendChild(painelEstatisticas);
        }
    }

    painelEstatisticas.innerHTML = `
        <h4>Estatísticas da Transição (2026-2033)</h4>
        <div class="estatisticas-grid">
            <div class="estatistica-item">
                <span class="label">Taxa de Crescimento:</span>
                <span class="value">${formatarPercentual(evolucao.parametrosUtilizados.taxaCrescimento * 100)} a.a.</span>
            </div>
            <div class="estatistica-item">
                <span class="label">Crescimento Total do Faturamento:</span>
                <span class="value">${formatarPercentual(estatisticas.crescimentoTotalFaturamento)}</span>
            </div>
            <div class="estatistica-item">
                <span class="label">Variação Total dos Impostos:</span>
                <span class="value ${estatisticas.variacaoTotalImpostos >= 0 ? 'positivo' : 'negativo'}">
                    ${formatarPercentual(estatisticas.variacaoTotalImpostos)}
                </span>
            </div>
            <div class="estatistica-item">
                <span class="label">Economia Estimada da Reforma:</span>
                <span class="value ${estatisticas.economiaEstimadaReforma.economia >= 0 ? 'positivo' : 'negativo'}">
                    ${formatarMoeda(estatisticas.economiaEstimadaReforma.economia)} 
                    (${formatarPercentual(estatisticas.economiaEstimadaReforma.percentualEconomia)})
                </span>
            </div>
        </div>
    `;
}

/**
 * Atualiza a tabela de evolução tributária
 */
function atualizarTabelaEvolucaoTributaria(evolucao) {
    const tabela = document.getElementById('tabela-evolucao-tributaria');
    if (!tabela) {
        console.warn('Tabela de evolução tributária não encontrada no DOM');
        return;
    }

    const tbody = tabela.querySelector('tbody');
    if (!tbody) {
        console.error('Elemento tbody não encontrado na tabela de evolução tributária');
        return;
    }

    tbody.innerHTML = '';
    const formatarMoeda = window.DataManager.formatarMoeda;

    evolucao.anos.forEach(ano => {
        const dados = evolucao.evolucaoPorAno[ano];
        const linha = document.createElement('tr');

        // Destacar anos de maior transição
        if (ano === 2027 || ano === 2029) {
            linha.classList.add('linha-transicao-major');
        }

        linha.innerHTML = `
            <td class="ano-col">${ano}</td>
            <td class="imposto-atual">${formatarMoeda(dados.pis)}</td>
            <td class="imposto-atual">${formatarMoeda(dados.cofins)}</td>
            <td class="imposto-atual">${formatarMoeda(dados.icms)}</td>
            <td class="imposto-atual">${formatarMoeda(dados.ipi)}</td>
            <td class="imposto-novo">${formatarMoeda(dados.ibs)}</td>
            <td class="imposto-novo">${formatarMoeda(dados.cbs)}</td>
            <td class="total-col">${formatarMoeda(dados.total)}</td>
        `;
        tbody.appendChild(linha);
    });

    // Mostrar seção de evolução tributária
    const secaoEvolucao = document.getElementById('evolucao-tributaria');
    if (secaoEvolucao) {
        secaoEvolucao.style.display = 'block';
    }

    console.log('Tabela de evolução tributária atualizada com', evolucao.anos.length, 'anos');
}

/**
 * Renderiza gráfico de evolução tributária usando Chart.js
 */
function renderizarGraficoEvolucaoTributaria(evolucao) {
    const canvas = document.getElementById('grafico-evolucao-tributaria');
    if (!canvas) return;

    // Verificar se Chart.js está disponível
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js não está disponível');
        return;
    }

    // Destruir gráfico anterior se existir
    if (window.graficoEvolucaoTributaria) {
        window.graficoEvolucaoTributaria.destroy();
    }

    const ctx = canvas.getContext('2d');

    window.graficoEvolucaoTributaria = new Chart(ctx, {
        type: 'line',
        data: {
            labels: evolucao.anos,
            datasets: [
                {
                    label: 'PIS',
                    data: evolucao.totaisPorImposto.pis,
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    borderWidth: 2
                },
                {
                    label: 'COFINS',
                    data: evolucao.totaisPorImposto.cofins,
                    borderColor: '#4ecdc4',
                    backgroundColor: 'rgba(78, 205, 196, 0.1)',
                    borderWidth: 2
                },
                {
                    label: 'ICMS',
                    data: evolucao.totaisPorImposto.icms,
                    borderColor: '#45b7d1',
                    backgroundColor: 'rgba(69, 183, 209, 0.1)',
                    borderWidth: 2
                },
                {
                    label: 'IPI',
                    data: evolucao.totaisPorImposto.ipi,
                    borderColor: '#f9ca24',
                    backgroundColor: 'rgba(249, 202, 36, 0.1)',
                    borderWidth: 2
                },
                {
                    label: 'CBS',
                    data: evolucao.totaisPorImposto.cbs,
                    borderColor: '#6c5ce7',
                    backgroundColor: 'rgba(108, 92, 231, 0.1)',
                    borderWidth: 3
                },
                {
                    label: 'IBS',
                    data: evolucao.totaisPorImposto.ibs,
                    borderColor: '#a29bfe',
                    backgroundColor: 'rgba(162, 155, 254, 0.1)',
                    borderWidth: 3
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Evolução da Tributação Durante a Transição (2026-2033)'
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                        }
                    }
                }
            }
        }
    });
}

// Fazer disponível globalmente se ChartManager não existir
if (typeof window.ChartManager === 'undefined') {
    window.renderizarGraficoEvolucaoTributaria = renderizarGraficoEvolucaoTributaria;
} else {
    // Adicionar ao ChartManager existente
    window.ChartManager.renderizarGraficoEvolucaoTributaria = renderizarGraficoEvolucaoTributaria;
}