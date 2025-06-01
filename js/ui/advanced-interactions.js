// ===== SISTEMA DE INTERAÇÕES AVANÇADAS ===== //
// Arquivo: js/ui/advanced-interactions.js

const AdvancedInteractions = (function() {
    'use strict';

    // ===== CONFIGURAÇÕES ===== //
    const config = {
        animationDuration: 300,
        countAnimationDuration: 2000,
        chartUpdateDelay: 500,
        tooltipDelay: 200,
        validationDelay: 500
    };

    // ===== SISTEMA DE VALIDAÇÃO EM TEMPO REAL ===== //
    const FormValidator = {
        rules: {
            required: (value) => value && value.trim() !== '',
            email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            number: (value) => !isNaN(parseFloat(value)) && isFinite(value),
            positiveNumber: (value) => parseFloat(value) > 0,
            percentage: (value) => parseFloat(value) >= 0 && parseFloat(value) <= 100,
            currency: (value) => /^\$?\d+(\.\d{2})?$/.test(value.replace(/[R$\s,]/g, ''))
        },

        messages: {
            required: 'Este campo é obrigatório',
            email: 'Digite um email válido',
            number: 'Digite um número válido',
            positiveNumber: 'Digite um número positivo',
            percentage: 'Digite um percentual entre 0 e 100',
            currency: 'Digite um valor monetário válido'
        },

        validateField(field, rules) {
            const value = field.value;
            const errors = [];

            rules.forEach(rule => {
                if (!this.rules[rule](value)) {
                    errors.push(this.messages[rule]);
                }
            });

            this.showValidationResult(field, errors);
            return errors.length === 0;
        },

        showValidationResult(field, errors) {
            // Remove validação anterior
            field.classList.remove('input-error', 'input-valid');
            const existingError = field.parentNode.querySelector('.error-message');
            if (existingError) existingError.remove();

            if (errors.length > 0) {
                // Adiciona estilo de erro
                field.classList.add('input-error');
                
                // Cria mensagem de erro
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.innerHTML = `<span>⚠️</span> ${errors[0]}`;
                field.parentNode.appendChild(errorDiv);

                // Anima a entrada da mensagem
                errorDiv.style.opacity = '0';
                errorDiv.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    errorDiv.style.opacity = '1';
                    errorDiv.style.transform = 'translateY(0)';
                }, 50);
            } else if (field.value && field.value.trim() !== '') {
                // Adiciona estilo de válido
                field.classList.add('input-valid');
            }
        },

        init() {
            // Configurar validação automática
            const fieldsToValidate = {
                'faturamento': ['required', 'currency'],
                'margem': ['required', 'percentage'],
                'pmr': ['required', 'positiveNumber'],
                'pmp': ['required', 'positiveNumber'],
                'pme': ['required', 'positiveNumber'],
                'perc-vista': ['required', 'percentage']
            };

            Object.keys(fieldsToValidate).forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    let timeout;
                    field.addEventListener('input', () => {
                        clearTimeout(timeout);
                        timeout = setTimeout(() => {
                            this.validateField(field, fieldsToValidate[fieldId]);
                        }, config.validationDelay);
                    });
                }
            });
        }
    };

    // ===== SISTEMA DE MÁSCARAS INTELIGENTES ===== //
    const SmartMasks = {
        currency: {
            format(value) {
                // Remove caracteres não numéricos
                let numbers = value.replace(/\D/g, '');
                
                // Converte para número
                numbers = parseFloat(numbers) / 100;
                
                // Formata como moeda
                return new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(numbers);
            },

            apply(input) {
                input.addEventListener('input', (e) => {
                    const cursorPosition = e.target.selectionStart;
                    const oldValue = e.target.value;
                    const newValue = this.format(oldValue);
                    
                    e.target.value = newValue;
                    
                    // Reposicionar cursor
                    const newCursorPosition = cursorPosition + (newValue.length - oldValue.length);
                    e.target.setSelectionRange(newCursorPosition, newCursorPosition);
                });
            }
        },

        percentage: {
            apply(input) {
                input.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/[^\d.]/g, '');
                    if (parseFloat(value) > 100) value = '100';
                    e.target.value = value;
                });

                input.addEventListener('blur', (e) => {
                    if (e.target.value && !e.target.value.includes('%')) {
                        e.target.value += '%';
                    }
                });
            }
        },

        init() {
            // Aplicar máscaras automaticamente
            document.querySelectorAll('.money-input').forEach(input => {
                this.currency.apply(input);
            });

            document.querySelectorAll('input[type="number"][max="100"]').forEach(input => {
                if (input.id.includes('perc') || input.id.includes('margem')) {
                    this.percentage.apply(input);
                }
            });
        }
    };

    // ===== CALCULADORA AUTOMÁTICA DE CAMPOS ===== //
    const AutoCalculator = {
        dependencies: {
            'ciclo-financeiro': ['pmr', 'pme', 'pmp'],
            'perc-prazo': ['perc-vista'],
            'aliquota': ['aliquota-cbs', 'aliquota-ibs']
        },

        formulas: {
            'ciclo-financeiro': (pmr, pme, pmp) => pmr + pme - pmp,
            'perc-prazo': (percVista) => 100 - percVista,
            'aliquota': (cbs, ibs) => cbs + ibs
        },

        calculate(targetField) {
            const dependencies = this.dependencies[targetField];
            if (!dependencies) return;

            const values = dependencies.map(fieldId => {
                const field = document.getElementById(fieldId);
                return field ? parseFloat(field.value) || 0 : 0;
            });

            const result = this.formulas[targetField](...values);
            const targetElement = document.getElementById(targetField);
            
            if (targetElement) {
                // Animar mudança de valor
                this.animateValueChange(targetElement, result);
            }
        },

        animateValueChange(element, newValue) {
            element.style.transform = 'scale(1.05)';
            element.style.background = 'rgba(102, 126, 234, 0.1)';
            
            setTimeout(() => {
                if (element.id === 'perc-prazo') {
                    element.value = newValue + '%';
                } else {
                    element.value = newValue;
                }
                
                element.style.transform = 'scale(1)';
                element.style.background = '';
            }, 200);
        },

        init() {
            // Configurar listeners para campos dependentes
            Object.values(this.dependencies).flat().forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.addEventListener('input', () => {
                        // Encontrar campos que dependem deste
                        Object.keys(this.dependencies).forEach(targetField => {
                            if (this.dependencies[targetField].includes(fieldId)) {
                                this.calculate(targetField);
                            }
                        });
                    });
                }
            });
        }
    };

    // ===== SISTEMA DE SUGESTÕES INTELIGENTES ===== //
    const SmartSuggestions = {
        suggestions: {
            'faturamento': {
                ranges: [
                    { min: 0, max: 100000, suggestion: 'Considere o regime Simples Nacional' },
                    { min: 100000, max: 1000000, suggestion: 'Avalie Lucro Presumido ou Simples' },
                    { min: 1000000, max: Infinity, suggestion: 'Lucro Real pode ser mais vantajoso' }
                ]
            },
            'margem': {
                ranges: [
                    { min: 0, max: 5, suggestion: 'Margem baixa - revisar custos' },
                    { min: 5, max: 15, suggestion: 'Margem adequada para o setor' },
                    { min: 15, max: Infinity, suggestion: 'Margem alta - ótimo resultado' }
                ]
            }
        },

        showSuggestion(fieldId, value) {
            const suggestions = this.suggestions[fieldId];
            if (!suggestions) return;

            const applicableRange = suggestions.ranges.find(range => 
                value >= range.min && value < range.max
            );

            if (applicableRange) {
                this.displaySuggestionTooltip(fieldId, applicableRange.suggestion);
            }
        },

        displaySuggestionTooltip(fieldId, message) {
            const field = document.getElementById(fieldId);
            if (!field) return;

            // Remove sugestão anterior
            const existingSuggestion = document.querySelector('.smart-suggestion');
            if (existingSuggestion) existingSuggestion.remove();

            // Cria nova sugestão
            const suggestion = document.createElement('div');
            suggestion.className = 'smart-suggestion';
            suggestion.innerHTML = `
                <div class="suggestion-content">
                    <span class="suggestion-icon">💡</span>
                    <span class="suggestion-text">${message}</span>
                    <button class="suggestion-close" onclick="this.parentNode.parentNode.remove()">×</button>
                </div>
            `;

            suggestion.style.cssText = `
                position: absolute;
                top: calc(100% + 5px);
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #fff3cd, #ffeaa7);
                border: 1px solid #ffc107;
                border-radius: 8px;
                padding: 12px;
                font-size: 0.85rem;
                z-index: 1000;
                animation: slideDown 0.3s ease;
            `;

            // Adicionar CSS para animação
            if (!document.querySelector('#suggestion-styles')) {
                const style = document.createElement('style');
                style.id = 'suggestion-styles';
                style.textContent = `
                    @keyframes slideDown {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .suggestion-content {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .suggestion-text {
                        flex: 1;
                        font-weight: 500;
                    }
                    .suggestion-close {
                        background: none;
                        border: none;
                        font-size: 1.2rem;
                        cursor: pointer;
                        color: #856404;
                    }
                `;
                document.head.appendChild(style);
            }

            field.parentNode.style.position = 'relative';
            field.parentNode.appendChild(suggestion);

            // Auto-remover após 5 segundos
            setTimeout(() => {
                if (suggestion.parentNode) {
                    suggestion.style.opacity = '0';
                    suggestion.style.transform = 'translateY(-10px)';
                    setTimeout(() => suggestion.remove(), 300);
                }
            }, 5000);
        },

        init() {
            Object.keys(this.suggestions).forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.addEventListener('blur', () => {
                        const value = parseFloat(field.value.replace(/[^\d.-]/g, ''));
                        if (!isNaN(value)) {
                            setTimeout(() => {
                                this.showSuggestion(fieldId, value);
                            }, 500);
                        }
                    });
                }
            });
        }
    };

    // ===== SISTEMA DE COMPARAÇÃO VISUAL ===== //
    const VisualComparison = {
        createComparisonCard(data) {
            const card = document.createElement('div');
            card.className = 'comparison-card';
            card.innerHTML = `
                <div class="comparison-header">
                    <h4>${data.title}</h4>
                    <span class="comparison-badge ${data.trend}">${data.change}</span>
                </div>
                <div class="comparison-values">
                    <div class="value-before">
                        <span class="label">Antes:</span>
                        <span class="amount">${data.before}</span>
                    </div>
                    <div class="value-arrow">→</div>
                    <div class="value-after">
                        <span class="label">Depois:</span>
                        <span class="amount">${data.after}</span>
                    </div>
                </div>
                <div class="comparison-impact">
                    <div class="impact-bar">
                        <div class="impact-fill" style="width: ${Math.abs(data.impactPercent)}%"></div>
                    </div>
                    <span class="impact-text">${data.impactText}</span>
                </div>
            `;

            return card;
        },

        updateComparisons(results) {
            const container = document.getElementById('comparison-container');
            if (!container) return;

            container.innerHTML = '';

            const comparisons = [
                {
                    title: 'Tributos Mensais',
                    before: results.tributoAtual,
                    after: results.tributoNovo,
                    change: results.variacao,
                    trend: results.variacao > 0 ? 'positive' : 'negative',
                    impactPercent: Math.abs(results.variacao),
                    impactText: `${Math.abs(results.variacao)}% ${results.variacao > 0 ? 'aumento' : 'redução'}`
                },
                {
                    title: 'Capital de Giro',
                    before: results.capitalGiroAtual,
                    after: results.capitalGiroNovo,
                    change: results.impactoCapital,
                    trend: results.impactoCapital > 0 ? 'negative' : 'positive',
                    impactPercent: Math.abs(results.impactoCapital),
                    impactText: `${Math.abs(results.impactoCapital)}% de impacto`
                }
            ];

            comparisons.forEach(comparison => {
                const card = this.createComparisonCard(comparison);
                container.appendChild(card);
                
                // Animar entrada
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 100);
            });
        }
    };

    // ===== SISTEMA DE EXPORTAÇÃO INTELIGENTE ===== //
    const SmartExport = {
        generateExportSummary() {
            const summary = {
                timestamp: new Date().toISOString(),
                empresa: document.getElementById('empresa')?.value || 'Não informado',
                faturamento: document.getElementById('faturamento')?.value || '0',
                regime: document.getElementById('regime')?.value || 'Não selecionado',
                impactoCalculado: true,
                configuracoes: this.getActiveConfigurations()
            };

            return summary;
        },

        getActiveConfigurations() {
            return {
                splitPayment: document.getElementById('considerar-split')?.checked || false,
                cenario: document.getElementById('cenario')?.value || 'Não selecionado',
                setor: document.getElementById('setor')?.value || 'Não selecionado'
            };
        },

        enhanceExportButtons() {
            const pdfBtn = document.getElementById('btn-exportar-pdf');
            const excelBtn = document.getElementById('btn-exportar-excel');

            if (pdfBtn) {
                pdfBtn.addEventListener('click', () => {
                    this.showExportProgress('PDF');
                });
            }

            if (excelBtn) {
                excelBtn.addEventListener('click', () => {
                    this.showExportProgress('Excel');
                });
            }
        },

        showExportProgress(type) {
            const progress = document.createElement('div');
            progress.className = 'export-progress';
            progress.innerHTML = `
                <div class="progress-content">
                    <div class="progress-spinner"></div>
                    <span>Gerando arquivo ${type}...</span>
                </div>
            `;

            progress.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 24px;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 12px;
            `;

            document.body.appendChild(progress);

            // Simular progresso
            setTimeout(() => {
                progress.querySelector('span').textContent = `Arquivo ${type} gerado com sucesso!`;
                progress.querySelector('.progress-spinner').remove();
                
                setTimeout(() => {
                    progress.remove();
                }, 2000);
            }, 2000);
        }
    };

    // ===== SISTEMA DE ATALHOS DE TECLADO ===== //
    const KeyboardShortcuts = {
        shortcuts: {
            'ctrl+s': () => this.saveCurrentState(),
            'ctrl+r': () => this.resetForm(),
            'ctrl+enter': () => document.getElementById('btn-simular')?.click(),
            'ctrl+e': () => document.getElementById('btn-exportar-pdf')?.click(),
            'f1': () => this.showHelp()
        },

        init() {
            document.addEventListener('keydown', (e) => {
                const key = [];
                if (e.ctrlKey) key.push('ctrl');
                if (e.shiftKey) key.push('shift');
                if (e.altKey) key.push('alt');
                key.push(e.key.toLowerCase());

                const combination = key.join('+');
                
                if (this.shortcuts[combination]) {
                    e.preventDefault();
                    this.shortcuts[combination]();
                }
            });

            // Mostrar dica de atalhos
            this.showShortcutsHint();
        },

        showShortcutsHint() {
            const hint = document.createElement('div');
            hint.id = 'shortcuts-hint';
            hint.innerHTML = `
                <div class="hint-content">
                    <span>💡 Dica: Use Ctrl+Enter para simular rapidamente</span>
                    <button onclick="this.parentNode.parentNode.remove()">×</button>
                </div>
            `;

            hint.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: rgba(102, 126, 234, 0.9);
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 0.85rem;
                z-index: 1000;
                backdrop-filter: blur(10px);
            `;

            document.body.appendChild(hint);

            // Auto-remover após 5 segundos
            setTimeout(() => {
                if (hint.parentNode) {
                    hint.style.opacity = '0';
                    setTimeout(() => hint.remove(), 300);
                }
            }, 5000);
        },

        saveCurrentState() {
            const state = {};
            document.querySelectorAll('input, select').forEach(field => {
                if (field.id) {
                    state[field.id] = field.value;
                }
            });
            
            localStorage.setItem('simulador-state', JSON.stringify(state));
            
            if (window.ModernUI) {
                window.ModernUI.showNotification('Estado salvo com sucesso!', 'success', 2000);
            }
        },

        resetForm() {
            if (confirm('Tem certeza que deseja limpar todos os campos?')) {
                document.getElementById('btn-limpar')?.click();
            }
        },

        showHelp() {
            // Implementar modal de ajuda
            if (window.ModernUI) {
                window.ModernUI.showNotification('F1 - Ajuda em desenvolvimento', 'info', 2000);
            }
        }
    };

    // ===== SISTEMA DE AUTOSAVE ===== //
    const AutoSave = {
        saveInterval: 30000, // 30 segundos
        intervalId: null,

        init() {
            // Carregar estado salvo
            this.loadSavedState();
            
            // Configurar autosave
            this.intervalId = setInterval(() => {
                this.saveCurrentState();
            }, this.saveInterval);

            // Salvar ao sair da página
            window.addEventListener('beforeunload', () => {
                this.saveCurrentState();
            });
        },

        saveCurrentState() {
            const state = {
                timestamp: Date.now(),
                formData: this.getFormData()
            };

            localStorage.setItem('simulador-autosave', JSON.stringify(state));
        },

        loadSavedState() {
            try {
                const saved = localStorage.getItem('simulador-autosave');
                if (saved) {
                    const state = JSON.parse(saved);
                    const hoursSinceLastSave = (Date.now() - state.timestamp) / (1000 * 60 * 60);
                    
                    // Só restaurar se foi salvo nas últimas 24 horas
                    if (hoursSinceLastSave < 24) {
                        this.showRestoreOption(state.formData);
                    }
                }
            } catch (error) {
                console.warn('Erro ao carregar estado salvo:', error);
            }
        },

        getFormData() {
            const data = {};
            document.querySelectorAll('input, select').forEach(field => {
                if (field.id && field.value) {
                    data[field.id] = field.value;
                }
            });
            return data;
        },

        showRestoreOption(savedData) {
            const modal = document.createElement('div');
            modal.className = 'restore-modal';
            modal.innerHTML = `
                <div class="modal-overlay">
                    <div class="modal-content">
                        <h3>💾 Dados Salvos Encontrados</h3>
                        <p>Encontramos dados salvos anteriormente. Deseja restaurá-los?</p>
                        <div class="modal-actions">
                            <button id="restore-yes" class="btn-primary">Sim, Restaurar</button>
                            <button id="restore-no" class="btn-secondary">Não, Começar Novo</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Event listeners
            document.getElementById('restore-yes').addEventListener('click', () => {
                this.restoreFormData(savedData);
                modal.remove();
            });

            document.getElementById('restore-no').addEventListener('click', () => {
                modal.remove();
            });
        },

        restoreFormData(data) {
            Object.keys(data).forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = data[fieldId];
                    
                    // Disparar eventos para atualizar cálculos dependentes
                    field.dispatchEvent(new Event('input'));
                    field.dispatchEvent(new Event('change'));
                }
            });

            if (window.ModernUI) {
                window.ModernUI.showNotification('Dados restaurados com sucesso!', 'success');
            }
        }
    };

    // ===== INICIALIZAÇÃO PRINCIPAL ===== //
    function init() {
        FormValidator.init();
        SmartMasks.init();
        AutoCalculator.init();
        SmartSuggestions.init();
        SmartExport.enhanceExportButtons();
        KeyboardShortcuts.init();
        AutoSave.init();

        console.log('🚀 Sistema de Interações Avançadas carregado com sucesso!');
    }

    // ===== INTERFACE PÚBLICA ===== //
    return {
        init,
        FormValidator,
        SmartMasks,
        AutoCalculator,
        SmartSuggestions,
        VisualComparison,
        SmartExport,
        KeyboardShortcuts,
        AutoSave
    };
})();

// ===== INICIALIZAÇÃO AUTOMÁTICA ===== //
document.addEventListener('DOMContentLoaded', function() {
    AdvancedInteractions.init();
});

// ===== INTEGRAÇÃO COM SISTEMA EXISTENTE ===== //
if (window.SimuladorFluxoCaixa) {
    const originalSimular = window.SimuladorFluxoCaixa.simular;
    window.SimuladorFluxoCaixa.simular = function(dados) {
        // Salvar estado antes da simulação
        AdvancedInteractions.AutoSave.saveCurrentState();
        
        try {
            const resultado = originalSimular.call(this, dados);
            
            // Atualizar comparações visuais
            AdvancedInteractions.VisualComparison.updateComparisons(resultado);
            
            return resultado;
        } catch (error) {
            if (window.ModernUI) {
                window.ModernUI.showNotification('Erro na simulação: ' + error.message, 'error');
            }
            throw error;
        }
    };
}

// ===== EXPORTAR PARA ESCOPO GLOBAL ===== //
window.AdvancedInteractions = AdvancedInteractions;