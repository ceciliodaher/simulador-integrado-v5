/**
 * @fileoverview Núcleo do simulador de impacto do Split Payment.
 * @module simulator
 * @author Expertzy Inteligência Tributária
 * @version 1.0.0
 */


// Objeto para armazenar resultados intermediários
let _resultadoAtual = null;
let _resultadoSplitPayment = null;

/**
 * Coordena todos os cálculos necessários para a simulação
 * @param {Object} dados - Dados consolidados para simulação (formato plano)
 * @returns {Object} - Resultados coordenados da simulação
 */
function coordenarCalculos(dados) {
    // Conversão única se necessário (com cache otimizado)
    if (dados.empresa !== undefined) {
        dados = window.DataManager.converterParaEstruturaPlana(dados);
    }
    
    const anoInicial = parseInt(dados.dataInicial?.split('-')[0], 10) || 2026;
    const anoFinal = parseInt(dados.dataFinal?.split('-')[0], 10) || 2033;
    
    // Calcular impacto base diretamente
    const impactoBase = window.IVADualSystem.calcularImpactoCapitalGiro(dados, anoInicial);
    
    // Calcular projeção temporal diretamente
    const projecaoTemporal = window.IVADualSystem.calcularProjecaoTemporal(
        dados, 
        anoInicial, 
        anoFinal, 
        dados.cenario, 
        dados.taxaCrescimento
    );
    
    // Gerar memória de cálculo uma única vez
    const memoriaCalculo = gerarMemoriaCalculo(dados, impactoBase, projecaoTemporal);
    
    return {
        impactoBase,
        projecaoTemporal,
        memoriaCalculo
    };
}

/**
 * Detecta e integra dados do SPED nos cálculos do simulador
 * @param {Object} dadosAninhados - Dados em estrutura aninhada
 * @returns {Object} Dados processados com integração SPED
 */
function processarDadosComIntegracaoSped(dadosAninhados) {
    // Verificação direta sem logs desnecessários
    if (!dadosAninhados.dadosSpedImportados) {
        return dadosAninhados;
    }
    
    // Processamento direto sem múltiplas cópias
    const dadosSped = dadosAninhados.dadosSpedImportados.composicaoTributaria;
    
    // Integração direta dos dados SPED
    if (!dadosAninhados.parametrosFiscais) {
        dadosAninhados.parametrosFiscais = {};
    }
    
    Object.assign(dadosAninhados.parametrosFiscais, {
        debitosReais: dadosSped.debitos,
        creditosReais: dadosSped.creditos,
        aliquotasEfetivasReais: dadosSped.aliquotasEfetivas
    });
    
    // Calcular alíquota efetiva se aplicável
    const faturamento = dadosAninhados.empresa?.faturamento || 0;
    if (faturamento > 0 && dadosSped.totalDebitos > 0) {
        dadosAninhados.parametrosFiscais.aliquotaEfetivaReal = dadosSped.totalDebitos / faturamento;
        dadosAninhados.parametrosFiscais.usarAliquotaReal = true;
    }
    
    return dadosAninhados;
}

/**
 * Gera a memória de cálculo de forma centralizada
 * @param {Object} dados - Dados da simulação (formato plano)
 * @param {Object} impactoBase - Resultados do impacto base
 * @param {Object} projecaoTemporal - Resultados da projeção temporal
 * @returns {Object} - Memória de cálculo estruturada
 */
function gerarMemoriaCalculo(dados, impactoBase, projecaoTemporal) {
    if (dados.empresa !== undefined) {
        throw new Error('Estrutura incompatível. Dados devem estar em formato plano para memória de cálculo.');
    }
    
    return {
        dadosEntrada: {
            empresa: {
                faturamento: typeof dados.faturamento === 'number' ? dados.faturamento : 0,
                margem: typeof dados.margem === 'number' ? dados.margem : 0,
                setor: dados.setor || '',
                tipoEmpresa: dados.tipoEmpresa || '',
                regime: dados.regime || ''
            },
            cicloFinanceiro: {
                pmr: typeof dados.pmr === 'number' ? dados.pmr : 30,
                pmp: typeof dados.pmp === 'number' ? dados.pmp : 30,
                pme: typeof dados.pme === 'number' ? dados.pme : 30,
                percVista: typeof dados.percVista === 'number' ? dados.percVista : 0.3,
                percPrazo: typeof dados.percPrazo === 'number' ? dados.percPrazo : 0.7
            },
            parametrosFiscais: {
                aliquota: typeof dados.aliquota === 'number' ? dados.aliquota : 0.265,
                tipoOperacao: dados.tipoOperacao || '',
                regime: dados.regime || '',
                creditos: {
                    pis: typeof dados.creditosPIS === 'number' ? dados.creditosPIS : 0,
                    cofins: typeof dados.creditosCOFINS === 'number' ? dados.creditosCOFINS : 0,
                    icms: typeof dados.creditosICMS === 'number' ? dados.creditosICMS : 0,
                    ipi: typeof dados.creditosIPI === 'number' ? dados.creditosIPI : 0,
                    cbs: typeof dados.creditosCBS === 'number' ? dados.creditosCBS : 0,
                    ibs: typeof dados.creditosIBS === 'number' ? dados.creditosIBS : 0
                },
                // NOVA SEÇÃO: Débitos tributários
                debitos: {
                    pis: typeof dados.debitosPIS === 'number' ? dados.debitosPIS : 0,
                    cofins: typeof dados.debitosCOFINS === 'number' ? dados.debitosCOFINS : 0,
                    icms: typeof dados.debitosICMS === 'number' ? dados.debitosICMS : 0,
                    ipi: typeof dados.debitosIPI === 'number' ? dados.debitosIPI : 0,
                    iss: typeof dados.debitosISS === 'number' ? dados.debitosISS : 0
                },
                // NOVA SEÇÃO: Cronograma de transição
                cronogramaTransicao: {
                    2026: 0.10, 2027: 0.25, 2028: 0.40, 2029: 0.55,
                    2030: 0.70, 2031: 0.85, 2032: 0.95, 2033: 1.00
                }
            },
            parametrosSimulacao: {
                cenario: dados.cenario || 'moderado',
                taxaCrescimento: typeof dados.taxaCrescimento === 'number' ? dados.taxaCrescimento : 0.05,
                dataInicial: dados.dataInicial || '2026-01-01',
                dataFinal: dados.dataFinal || '2033-12-31'
            }
        },
        impactoBase: {
            diferencaCapitalGiro: impactoBase.diferencaCapitalGiro,
            percentualImpacto: impactoBase.percentualImpacto,
            impactoDiasFaturamento: impactoBase.impactoDiasFaturamento
        },
        projecaoTemporal: {
            parametros: projecaoTemporal.parametros,
            impactoAcumulado: projecaoTemporal.impactoAcumulado
        },
        // NOVA SEÇÃO: Memória crítica com cálculos de transição
        memoriaCritica: {
            formula: "Impacto Transição = (Sistema Atual × % Atual) + (IVA Dual × % IVA) - Sistema Atual Original",
            passoAPasso: [
                "1. Calcular débitos e créditos por imposto no sistema atual",
                "2. Calcular alíquotas efetivas por imposto",
                "3. Determinar percentual de transição para o ano (10% em 2026 até 100% em 2033)",
                "4. Calcular valor híbrido: (Tributos Atuais × % Sistema Atual) + (IVA Dual × % Sistema Novo)",
                "5. Determinar impacto no capital de giro considerando a transição progressiva",
                "6. Projetar impactos ao longo dos 8 anos de transição"
            ],
            observacoes: [
                "Durante a transição, empresas pagarão ambos os sistemas simultaneamente",
                "O percentual do sistema atual diminui gradualmente de 90% (2026) para 0% (2033)",
                "O percentual do IVA Dual aumenta gradualmente de 10% (2026) para 100% (2033)",
                "Cálculos baseiam-se na LC 214/2025 e regulamentação posterior",
                "Valores podem variar conforme alterações na regulamentação"
            ]
        }
    };
}

/**
 * Integra dados do SPED na estrutura plana para cálculos
 * @param {Object} dadosPlanos - Estrutura plana de dados
 * @param {Object} dadosSpedImportados - Dados importados do SPED
 */
function integrarDadosSpedNaEstruturaPlana(dadosPlanos, dadosSpedImportados) {
    const composicao = dadosSpedImportados.composicaoTributaria;
    
    // CORREÇÃO PRINCIPAL: Integrar créditos com validação robusta
    console.log('SIMULATOR: Integrando créditos do SPED:', composicao.creditos);
    
    // Adicionar débitos
    dadosPlanos.debitosPIS = composicao.debitos.pis || 0;
    dadosPlanos.debitosCOFINS = composicao.debitos.cofins || 0;
    dadosPlanos.debitosICMS = composicao.debitos.icms || 0;
    dadosPlanos.debitosIPI = composicao.debitos.ipi || 0;
    dadosPlanos.debitosISS = composicao.debitos.iss || 0;
    
    // CORREÇÃO PRINCIPAL: Adicionar créditos com múltiplas verificações
    const creditosPIS = composicao.creditos.pis || composicao.creditos.PIS || 0;
    const creditosCOFINS = composicao.creditos.cofins || composicao.creditos.COFINS || 0;
    const creditosICMS = composicao.creditos.icms || composicao.creditos.ICMS || 0;
    const creditosIPI = composicao.creditos.ipi || composicao.creditos.IPI || 0;
    
    dadosPlanos.creditosPIS = creditosPIS;
    dadosPlanos.creditosCOFINS = creditosCOFINS;
    dadosPlanos.creditosICMS = creditosICMS;
    dadosPlanos.creditosIPI = creditosIPI;
    
    // Log para diagnóstico
    console.log('SIMULATOR: Créditos integrados na estrutura plana:', {
        creditosPIS: creditosPIS,
        creditosCOFINS: creditosCOFINS,
        creditosICMS: creditosICMS,
        creditosIPI: creditosIPI,
        fonteOriginal: composicao.creditos
    });
    
    // Sobrescrever alíquota se disponível dados reais
    if (composicao.aliquotasEfetivas.total > 0) {
        dadosPlanos.aliquota = composicao.aliquotasEfetivas.total / 100;
        dadosPlanos.aliquotaOrigem = 'sped';
    }
    
    // Flags de controle
    dadosPlanos.temDadosSped = true;
    dadosPlanos.fonteDados = 'sped';
    
    console.log('SIMULATOR: Dados do SPED integrados na estrutura plana para cálculos');
}

/**
 * @class SimuladorFluxoCaixa
 * @description Classe principal do simulador que gerencia as simulações de Split Payment
 */
const SimuladorFluxoCaixa = {
    /**
     * Inicializa o simulador
     */
    init() {
        console.log('Simulador de Split Payment inicializado...');

        // Verificação única de dependências críticas
        const dependenciasCriticas = ['DataManager', 'IVADualSystem', 'CurrentTaxSystem', 'CalculationCore'];
        const dependenciasFaltantes = dependenciasCriticas.filter(dep => typeof window[dep] === 'undefined');

        if (dependenciasFaltantes.length > 0) {
            throw new Error(`Dependências críticas não encontradas: ${dependenciasFaltantes.join(', ')}`);
        }

        console.log('Simulador de Split Payment inicializado com sucesso');
    },         

    /**
     * Gera um impacto base de fallback quando ocorrem erros
     * @param {Object} dados - Dados planos da simulação
     * @returns {Object} Impacto base simplificado
     */
    gerarImpactoBaseFallback(dados) {
        // Validar e garantir valores numéricos
        const faturamento = typeof dados.faturamento === 'number' && !isNaN(dados.faturamento) ? 
                           dados.faturamento : 0;

        const aliquota = typeof dados.aliquota === 'number' && !isNaN(dados.aliquota) ? 
                        dados.aliquota : 0.265;

        // Gerar um impacto base simplificado
        return {
            diferencaCapitalGiro: -faturamento * aliquota * 0.5,
            percentualImpacto: -50,
            necesidadeAdicionalCapitalGiro: faturamento * aliquota * 0.6,
            impactoDiasFaturamento: 15,
            impactoMargem: 2.5,
            resultadoAtual: {
                capitalGiroDisponivel: faturamento * aliquota
            },
            resultadoSplitPayment: {
                capitalGiroDisponivel: faturamento * aliquota * 0.5
            }
        };
    },
    
    /**
     * Valida os dados de entrada antes da simulação
     * @param {Object} dados - Dados a serem validados (formato aninhado)
     * @returns {Object} - Dados validados e normalizados
     * @throws {Error} - Erro descritivo se os dados forem inválidos
     */
    validarDados(dados) {
        if (!dados) {
            throw new Error('Dados não fornecidos para validação');
        }

        // Verificar se os dados estão em formato aninhado
        if (dados.empresa === undefined) {
            throw new Error('Estrutura de dados inválida: formato aninhado esperado');
        }

        // Delegar a validação completa ao DataManager
        try {
            const dadosValidados = window.DataManager.validarENormalizar(dados);

            // Log de diagnóstico
            window.DataManager.logTransformacao(
                dados, 
                dadosValidados, 
                'Validação de Dados de Entrada'
            );

            return dadosValidados;
        } catch (erro) {
            console.error('Erro na validação de dados:', erro);
            throw new Error(`Falha na validação dos dados: ${erro.message}`);
        }
    },

    /**
     * Simula o impacto do Split Payment
     * @param {Object} dadosExternos - Dados externos opcionais (formato aninhado)
     * @returns {Object} Resultados da simulação
     */
    simular(dadosExternos) {
        console.log('Iniciando simulação de impacto do Split Payment...');

        try {
            // 1. Obter e validar dados (única operação)
            let dadosAninhados = dadosExternos || window.DataManager.obterDadosDoFormulario();

            if (!dadosAninhados) {
                throw new Error('Não foi possível obter dados para a simulação');
            }

            // 2. Processar integração SPED se aplicável
            dadosAninhados = processarDadosComIntegracaoSped(dadosAninhados);

            // 3. Validação única via DataManager otimizado
            const dadosValidados = window.DataManager.validarENormalizar(dadosAninhados);

            // 4. Conversão única para estrutura plana
            const dadosPlanos = window.DataManager.converterParaEstruturaPlana(dadosValidados);

            // 5. Extração direta de parâmetros temporais
            const anoInicial = parseInt(dadosPlanos.dataInicial?.split('-')[0], 10) || 2026;
            const anoFinal = parseInt(dadosPlanos.dataFinal?.split('-')[0], 10) || 2033;

            // 6. Parâmetros setoriais diretos
            const parametrosSetoriais = {
                aliquotaCBS: dadosValidados.ivaConfig?.cbs || 0.088,
                aliquotaIBS: dadosValidados.ivaConfig?.ibs || 0.177,
                categoriaIva: dadosValidados.ivaConfig?.categoriaIva || 'standard',
                reducaoEspecial: dadosValidados.ivaConfig?.reducaoEspecial || 0,
                cronogramaProprio: false
            };

            // 7. Cálculos diretos (sem fallbacks complexos)
            const impactoBase = window.IVADualSystem.calcularImpactoCapitalGiro(
                dadosPlanos,
                anoInicial,
                parametrosSetoriais
            );

            const projecaoTemporal = window.IVADualSystem.calcularProjecaoTemporal(
                dadosPlanos,
                anoInicial,
                anoFinal,
                dadosPlanos.cenario,
                dadosPlanos.taxaCrescimento,
                parametrosSetoriais
            );

            // 8. Memória de cálculo única
            const memoriaCalculo = gerarMemoriaCalculo(dadosPlanos, impactoBase, projecaoTemporal);

            // 9. Armazenar resultados intermediários
            _resultadoAtual = impactoBase.resultadoAtual || null;
            _resultadoSplitPayment = impactoBase.resultadoSplitPayment || null;

            // 10. Resultado final
            const resultadosParaInterface = {
                impactoBase,
                projecaoTemporal,
                memoriaCalculo,
                dadosUtilizados: dadosValidados
            };

            // 11. Atualização da interface (se disponível)
            if (typeof window.atualizarInterface === 'function') {
                window.atualizarInterface(resultadosParaInterface);
            }

            if (typeof window.ChartManager?.renderizarGraficos === 'function') {
                window.ChartManager.renderizarGraficos(resultadosParaInterface);
            }

            return resultadosParaInterface;

        } catch (erro) {
            console.error('Erro crítico durante a simulação:', erro);
            alert('Ocorreu um erro durante a simulação: ' + erro.message);
            return null;
        }
    },
    
    /**
     * Simula o impacto das estratégias de mitigação
     * @returns {Object} Resultados da simulação com estratégias
     */
    simularEstrategias() {
        console.log('Iniciando simulação de estratégias de mitigação...');

        try {
            // 1. Verificar simulação base
            if (!_resultadoAtual || !_resultadoSplitPayment) {
                const resultadoBase = this.simular();
                if (!resultadoBase) {
                    throw new Error('Não foi possível realizar a simulação base');
                }
            }

            // 2. Obter dados via DataManager otimizado
            const dadosAninhados = window.DataManager.obterDadosDoFormulario();
            const dadosPlanos = window.DataManager.converterParaEstruturaPlana(dadosAninhados);

            // 3. Obter ano de visualização para estratégias
            const seletorAnoEstrategias = document.getElementById('ano-visualizacao-estrategias');
            const anoEstrategias = seletorAnoEstrategias ? 
                parseInt(seletorAnoEstrategias.value) : 
                parseInt(dadosPlanos.dataInicial?.split('-')[0], 10) || 2026;

            console.log(`Simulando estratégias para o ano: ${anoEstrategias}`);

            // 4. Filtrar estratégias ativas diretamente
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

            // 5. Tratar caso sem estratégias
            if (!temEstrategiaAtiva) {
                const divResultados = document.getElementById('resultados-estrategias');
                if (divResultados) {
                    divResultados.innerHTML = '<p class="text-muted">Nenhuma estratégia de mitigação foi selecionada para simulação.</p>';
                }

                return {
                    semEstrategiasAtivas: true,
                    efeitividadeCombinada: { efetividadePercentual: 0, mitigacaoTotal: 0, custoTotal: 0 }
                };
            }

            // 6. Calcular efetividade para o ano específico das estratégias
            const impactoBase = window.IVADualSystem.calcularImpactoCapitalGiro(
                dadosPlanos,
                anoEstrategias
            );

            const resultadoEstrategias = window.IVADualSystem.calcularEfeitividadeMitigacao(
                dadosPlanos,
                estrategiasAtivas,
                anoEstrategias
            );

            // 7. Armazenar resultados globais para uso em outras funções
            window.lastStrategyResults = resultadoEstrategias;
            window.lastStrategyYear = anoEstrategias;

            // 8. CORREÇÃO: Usar função do main.js em vez de função removida
            if (typeof window.atualizarInterfaceEstrategiasParaAno === 'function') {
                window.atualizarInterfaceEstrategiasParaAno(resultadoEstrategias, impactoBase, anoEstrategias);
            } else {
                // Fallback para função original se a nova não estiver disponível
                this._atualizarInterfaceEstrategias(resultadoEstrategias, impactoBase);
            }

            // 9. Atualizar gráficos se disponível
            if (typeof window.ChartManager !== 'undefined' && typeof window.ChartManager.renderizarGraficoEstrategias === 'function') {
                window.ChartManager.renderizarGraficoEstrategias(resultadoEstrategias, impactoBase);
            } else {
                console.warn('ChartManager não encontrado ou função renderizarGraficoEstrategias indisponível');
            }

            return resultadoEstrategias;

        } catch (erro) {
            console.error('Erro durante a simulação de estratégias:', erro);
            alert('Ocorreu um erro durante a simulação de estratégias: ' + erro.message);
            return null;
        }
    },

    /**
     * Atualiza interface de estratégias de forma otimizada com informações do ano
     * @private
     * @param {Object} resultadoEstrategias - Resultado das estratégias
     * @param {Object} impactoBase - Impacto base
     * @param {number} ano - Ano de referência
     */
    _atualizarInterfaceEstrategiasComAno(resultadoEstrategias, impactoBase, ano) {
        const divResultados = document.getElementById('resultados-estrategias');
        if (!divResultados) return;

        const impactoOriginal = Math.abs(impactoBase.diferencaCapitalGiro || 0);
        const efetividade = resultadoEstrategias.efeitividadeCombinada;
        const percentualImplementacao = window.CurrentTaxSystem.obterPercentualImplementacao(ano);

        // Template otimizado com informações específicas do ano
        const htmlTemplate = `
            <div class="estrategias-resumo">
                <div class="ano-contexto">
                    <h4>Resultados das Estratégias - Ano ${ano}</h4>
                    <div class="contexto-implementacao">
                        <span class="badge badge-info">Implementação Split Payment: ${(percentualImplementacao * 100).toFixed(0)}%</span>
                    </div>
                </div>
                <div class="resultados-principais">
                    <div class="resultado-destaque">
                        <label>Impacto Original (${ano}):</label>
                        <span class="valor-destaque negativo">${window.CalculationCore.formatarMoeda(impactoOriginal)}</span>
                    </div>
                    <div class="resultado-destaque">
                        <label>Efetividade da Mitigação:</label>
                        <span class="valor-destaque positivo">${(efetividade.efetividadePercentual || 0).toFixed(1)}%</span>
                    </div>
                </div>
                <div class="resultados-detalhados">
                    <div class="resultado-linha">
                        <span class="label">Impacto Mitigado:</span>
                        <span class="valor positivo">${window.CalculationCore.formatarMoeda(efetividade.mitigacaoTotal || 0)}</span>
                    </div>
                    <div class="resultado-linha">
                        <span class="label">Impacto Residual:</span>
                        <span class="valor">${window.CalculationCore.formatarMoeda(impactoOriginal - (efetividade.mitigacaoTotal || 0))}</span>
                    </div>
                    <div class="resultado-linha">
                        <span class="label">Custo Total:</span>
                        <span class="valor">${window.CalculationCore.formatarMoeda(efetividade.custoTotal || 0)}</span>
                    </div>
                    <div class="resultado-linha">
                        <span class="label">Relação Custo-Benefício:</span>
                        <span class="valor">${(efetividade.custoBeneficio || 0).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;

        divResultados.innerHTML = htmlTemplate;
    },
    
    /**
     * Traduz o nome técnico da estratégia para um nome amigável
     * @param {string} nomeTecnico - Nome técnico da estratégia
     * @returns {string} Nome amigável para exibição
     */
    traduzirNomeEstrategia(nomeTecnico) {
        const traducoes = {
            'ajustePrecos': 'Ajuste de Preços',
            'renegociacaoPrazos': 'Renegociação de Prazos',
            'antecipacaoRecebiveis': 'Antecipação de Recebíveis',
            'capitalGiro': 'Capital de Giro',
            'mixProdutos': 'Mix de Produtos',
            'meiosPagamento': 'Meios de Pagamento'
        };

        return traducoes[nomeTecnico] || nomeTecnico;
    },

    /**
     * Obtém o resultado atual para diagnóstico
     * @returns {Object|null} Resultado do regime atual
     */
    getResultadoAtual() { 
        return _resultadoAtual || null; 
    },

    /**
     * Obtém o resultado do Split Payment para diagnóstico
     * @returns {Object|null} Resultado do regime Split Payment
     */
    getResultadoSplitPayment() { 
        return _resultadoSplitPayment || null; 
    },
    
    /**
     * Atualiza interface de estratégias de forma otimizada
     * @private
     * @param {Object} resultadoEstrategias - Resultado das estratégias
     * @param {Object} impactoBase - Impacto base
     */
    _atualizarInterfaceEstrategias(resultadoEstrategias, impactoBase) {
        const divResultados = document.getElementById('resultados-estrategias');
        if (!divResultados) return;

        const impactoOriginal = Math.abs(impactoBase.diferencaCapitalGiro || 0);
        const efetividade = resultadoEstrategias.efeitividadeCombinada;

        // Template otimizado sem concatenações excessivas
        const htmlTemplate = `
            <div class="estrategias-resumo">
                <h4>Resultados das Estratégias</h4>
                <p><strong>Impacto Original:</strong> ${window.CalculationCore.formatarMoeda(impactoOriginal)}</p>
                <p><strong>Efetividade da Mitigação:</strong> ${(efetividade.efetividadePercentual || 0).toFixed(1)}%</p>
                <p><strong>Impacto Mitigado:</strong> ${window.CalculationCore.formatarMoeda(efetividade.mitigacaoTotal || 0)}</p>
                <p><strong>Impacto Residual:</strong> ${window.CalculationCore.formatarMoeda(impactoOriginal - (efetividade.mitigacaoTotal || 0))}</p>
                <p><strong>Custo Total:</strong> ${window.CalculationCore.formatarMoeda(efetividade.custoTotal || 0)}</p>
                <p><strong>Relação Custo-Benefício:</strong> ${(efetividade.custoBeneficio || 0).toFixed(2)}</p>
            </div>
        `;

        divResultados.innerHTML = htmlTemplate;
    },

    // Expor os módulos para acesso externo
    CalculationCore: window.CalculationCore,
    CurrentTaxSystem: window.CurrentTaxSystem,
    IVADualSystem: window.IVADualSystem   
    
};

// Expor ao escopo global
window.SimuladorFluxoCaixa = SimuladorFluxoCaixa;

// Inicializar o simulador quando o documento estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    if (SimuladorFluxoCaixa && typeof SimuladorFluxoCaixa.init === 'function') {
        SimuladorFluxoCaixa.init();
    }
});