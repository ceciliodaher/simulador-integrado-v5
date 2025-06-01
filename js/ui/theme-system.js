// ===== SISTEMA DE TEMAS PERSONALIZÁVEIS ===== //
// Arquivo: js/ui/theme-system.js

const ThemeSystem = (function() {
    'use strict';

    // ===== DEFINIÇÃO DE TEMAS ===== //
    const themes = {
        default: {
            name: 'CapitalFlow Clássico',
            description: 'Tema padrão com cores corporativas',
            colors: {
                primary: '#667eea',
                secondary: '#764ba2',
                accent: '#f093fb',
                success: '#4facfe',
                warning: '#43e97b',
                danger: '#fa709a',
                background: '#f8fafc',
                surface: '#ffffff',
                text: '#1e293b',
                textSecondary: '#64748b'
            },
            gradients: {
                primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                warning: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                danger: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
            }
        },

        professional: {
            name: 'Profissional Azul',
            description: 'Tema elegante para ambientes corporativos',
            colors: {
                primary: '#2563eb',
                secondary: '#1d4ed8',
                accent: '#3b82f6',
                success: '#10b981',
                warning: '#f59e0b',
                danger: '#ef4444',
                background: '#f1f5f9',
                surface: '#ffffff',
                text: '#0f172a',
                textSecondary: '#475569'
            },
            gradients: {
                primary: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                secondary: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                danger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'
            }
        },

        financial: {
            name: 'Financeiro Verde',
            description: 'Tema inspirado no setor financeiro',
            colors: {
                primary: '#059669',
                secondary: '#047857',
                accent: '#10b981',
                success: '#22c55e',
                warning: '#eab308',
                danger: '#dc2626',
                background: '#f0fdf4',
                surface: '#ffffff',
                text: '#064e3b',
                textSecondary: '#166534'
            },
            gradients: {
                primary: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                secondary: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                warning: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                danger: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
            }
        },

        dark: {
            name: 'Modo Escuro',
            description: 'Tema escuro para reduzir fadiga visual',
            colors: {
                primary: '#8b5cf6',
                secondary: '#7c3aed',
                accent: '#a855f7',
                success: '#22c55e',
                warning: '#f59e0b',
                danger: '#ef4444',
                background: '#0f172a',
                surface: '#1e293b',
                text: '#f8fafc',
                textSecondary: '#cbd5e1'
            },
            gradients: {
                primary: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                secondary: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)',
                success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                danger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
            }
        },

        sunset: {
            name: 'Pôr do Sol',
            description: 'Tema quente com cores vibrantes',
            colors: {
                primary: '#f97316',
                secondary: '#ea580c',
                accent: '#fb923c',
                success: '#22c55e',
                warning: '#eab308',
                danger: '#dc2626',
                background: '#fff7ed',
                surface: '#ffffff',
                text: '#9a3412',
                textSecondary: '#c2410c'
            },
            gradients: {
                primary: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                secondary: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
                success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                warning: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                danger: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)'
            }
        }
    };

    // ===== CONFIGURAÇÕES ===== //
    let currentTheme = 'default';
    let customizations = {};

    // ===== APLICAÇÃO DE TEMAS ===== //
    function applyTheme(themeName) {
        const theme = themes[themeName];
        if (!theme) {
            console.warn(`Tema '${themeName}' não encontrado`);
            return;
        }

        currentTheme = themeName;
        
        // Aplicar variáveis CSS
        const root = document.documentElement;
        
        // Cores básicas
        Object.keys(theme.colors).forEach(colorName => {
            root.style.setProperty(`--color-${colorName}`, theme.colors[colorName]);
        });

        // Gradientes
        Object.keys(theme.gradients).forEach(gradientName => {
            root.style.setProperty(`--gradient-${gradientName}`, theme.gradients[gradientName]);
        });

        // Aplicar customizações específicas
        applyThemeCustomizations(theme);

        // Salvar preferência
        localStorage.setItem('selected-theme', themeName);

        // Disparar evento de mudança de tema
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: themeName, config: theme }
        }));

        console.log(`Tema '${theme.name}' aplicado com sucesso`);
    }

    function applyThemeCustomizations(theme) {
        // Aplicar estilos específicos para cada tema
        let existingStyle = document.getElementById('theme-customizations');
        if (existingStyle) {
            existingStyle.remove();
        }

        const style = document.createElement('style');
        style.id = 'theme-customizations';
        
        let css = `
            :root {
                --primary-color: ${theme.colors.primary};
                --secondary-color: ${theme.colors.secondary};
                --accent-color: ${theme.colors.accent};
                --success-color: ${theme.colors.success};
                --warning-color: ${theme.colors.warning};
                --danger-color: ${theme.colors.danger};
                --bg-primary: ${theme.colors.surface};
                --bg-secondary: ${theme.colors.background};
                --text-primary: ${theme.colors.text};
                --text-secondary: ${theme.colors.textSecondary};
                
                --primary-gradient: ${theme.gradients.primary};
                --secondary-gradient: ${theme.gradients.secondary};
                --success-gradient: ${theme.gradients.success};
                --warning-gradient: ${theme.gradients.warning};
                --danger-gradient: ${theme.gradients.danger};
            }

            body {
                background: ${theme.gradients.background};
                color: ${theme.colors.text};
                transition: all 0.3s ease;
            }

            .main-header {
                background: ${theme.gradients.primary};
            }

            .tab-button.active {
                background: ${theme.gradients.primary};
            }

            .group-box::before {
                background: ${theme.gradients.primary};
            }

            .modern-result-card::before,
            .panel-resultados-full::before,
            .panel-graficos-full::before {
                background: ${theme.gradients.success};
            }

            .chart-container::before {
                background: ${theme.gradients.warning};
            }
        `;

        // Ajustes específicos para tema escuro
        if (currentTheme === 'dark') {
            css += `
                .group-box,
                .result-card,
                .chart-container,
                .modern-result-card {
                    background: ${theme.colors.surface};
                    border-color: rgba(255, 255, 255, 0.1);
                }

                input, select, textarea {
                    background: ${theme.colors.surface};
                    border-color: rgba(255, 255, 255, 0.2);
                    color: ${theme.colors.text};
                }

                input:focus, select:focus, textarea:focus {
                    border-color: ${theme.colors.primary};
                    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
                }

                .transition-table th,
                .evolucao-table th {
                    background: ${theme.gradients.primary};
                }

                .transition-table,
                .evolucao-table {
                    background: ${theme.colors.surface};
                }

                .transition-table td,
                .evolucao-table td {
                    border-color: rgba(255, 255, 255, 0.1);
                }
            `;
        }

        style.textContent = css;
        document.head.appendChild(style);
    }

    // ===== INTERFACE DE SELEÇÃO DE TEMAS ===== //
    function createThemeSelector() {
        const selector = document.createElement('div');
        selector.id = 'theme-selector';
        selector.className = 'theme-selector';
        
        selector.innerHTML = `
            <div class="theme-selector-button" onclick="toggleThemeSelector()">
                <span class="theme-icon">🎨</span>
                <span class="theme-text">Temas</span>
            </div>
            <div class="theme-selector-panel" id="theme-panel" style="display: none;">
                <div class="theme-panel-header">
                    <h3>Escolha um Tema</h3>
                    <button class="theme-panel-close" onclick="toggleThemeSelector()">×</button>
                </div>
                <div class="theme-options">
                    ${Object.keys(themes).map(themeKey => `
                        <div class="theme-option ${themeKey === currentTheme ? 'active' : ''}" 
                             onclick="selectTheme('${themeKey}')" 
                             data-theme="${themeKey}">
                            <div class="theme-preview">
                                <div class="preview-primary" style="background: ${themes[themeKey].colors.primary}"></div>
                                <div class="preview-secondary" style="background: ${themes[themeKey].colors.secondary}"></div>
                                <div class="preview-accent" style="background: ${themes[themeKey].colors.accent}"></div>
                            </div>
                            <div class="theme-info">
                                <div class="theme-name">${themes[themeKey].name}</div>
                                <div class="theme-description">${themes[themeKey].description}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="theme-panel-footer">
                    <button class="btn-theme-custom" onclick="openCustomThemeEditor()">
                        Personalizar Tema
                    </button>
                </div>
            </div>
        `;

        selector.style.cssText = `
            position: fixed;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
            z-index: 9999;
        `;

        document.body.appendChild(selector);
        addThemeSelectorStyles();
    }

    function addThemeSelectorStyles() {
        if (document.getElementById('theme-selector-styles')) return;

        const style = document.createElement('style');
        style.id = 'theme-selector-styles';
        style.textContent = `
            .theme-selector-button {
                background: var(--primary-gradient, #667eea);
                color: white;
                padding: 12px 16px;
                border-radius: 25px 0 0 25px;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
            }

            .theme-selector-button:hover {
                transform: translateX(-5px);
                box-shadow: 0 6px 20px rgba(0,0,0,0.2);
            }

            .theme-selector-panel {
                position: absolute;
                right: 100%;
                top: 0;
                width: 320px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                border: 1px solid rgba(0,0,0,0.1);
                overflow: hidden;
                backdrop-filter: blur(10px);
            }

            .theme-panel-header {
                background: var(--primary-gradient, #667eea);
                color: white;
                padding: 16px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .theme-panel-header h3 {
                margin: 0;
                font-size: 1.1rem;
            }

            .theme-panel-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s ease;
            }

            .theme-panel-close:hover {
                background: rgba(255,255,255,0.2);
            }

            .theme-options {
                padding: 16px;
                max-height: 400px;
                overflow-y: auto;
            }

            .theme-option {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                border: 2px solid transparent;
                margin-bottom: 8px;
            }

            .theme-option:hover {
                background: rgba(0,0,0,0.02);
                transform: translateX(4px);
            }

            .theme-option.active {
                border-color: var(--primary-color, #667eea);
                background: rgba(102, 126, 234, 0.1);
            }

            .theme-preview {
                display: flex;
                gap: 4px;
                flex-shrink: 0;
            }

            .preview-primary,
            .preview-secondary,
            .preview-accent {
                width: 20px;
                height: 20px;
                border-radius: 4px;
                border: 1px solid rgba(0,0,0,0.1);
            }

            .theme-info {
                flex: 1;
            }

            .theme-name {
                font-weight: 600;
                color: var(--text-primary, #1e293b);
                margin-bottom: 2px;
                font-size: 0.9rem;
            }

            .theme-description {
                font-size: 0.8rem;
                color: var(--text-secondary, #64748b);
                line-height: 1.3;
            }

            .theme-panel-footer {
                padding: 16px;
                border-top: 1px solid rgba(0,0,0,0.1);
                background: rgba(0,0,0,0.02);
            }

            .btn-theme-custom {
                width: 100%;
                padding: 10px;
                background: var(--primary-gradient, #667eea);
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .btn-theme-custom:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
        `;

        document.head.appendChild(style);
    }

    // ===== EDITOR DE TEMA PERSONALIZADO ===== //
    function openCustomThemeEditor() {
        const modal = document.createElement('div');
        modal.id = 'custom-theme-modal';
        modal.className = 'modern-modal-overlay active';
        
        modal.innerHTML = `
            <div class="modern-modal">
                <div class="modal-header">
                    <h3>🎨 Editor de Tema Personalizado</h3>
                    <button class="modal-close" onclick="closeCustomThemeEditor()">×</button>
                </div>
                <div class="modal-body">
                    <div class="color-editor-grid">
                        ${Object.keys(themes.default.colors).map(colorName => `
                            <div class="color-editor-item">
                                <label for="color-${colorName}">${getColorLabel(colorName)}:</label>
                                <div class="color-input-group">
                                    <input type="color" id="color-${colorName}" 
                                           value="${themes[currentTheme].colors[colorName]}" 
                                           onchange="updateCustomColor('${colorName}', this.value)">
                                    <input type="text" class="color-text-input" 
                                           value="${themes[currentTheme].colors[colorName]}" 
                                           onchange="updateCustomColorText('${colorName}', this.value)">
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="preview-section">
                        <h4>Pré-visualização</h4>
                        <div class="theme-preview-large" id="theme-preview-large">
                            <div class="preview-card">
                                <div class="preview-header">Exemplo de Card</div>
                                <div class="preview-content">
                                    <p>Este é um exemplo de como o tema ficará.</p>
                                    <button class="preview-button">Botão de Exemplo</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" onclick="saveCustomTheme()">Salvar Tema</button>
                    <button class="btn-secondary" onclick="resetToDefaultTheme()">Resetar</button>
                    <button class="btn-secondary" onclick="closeCustomThemeEditor()">Cancelar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        addCustomThemeEditorStyles();
    }

    function getColorLabel(colorName) {
        const labels = {
            primary: 'Cor Primária',
            secondary: 'Cor Secundária', 
            accent: 'Cor de Destaque',
            success: 'Cor de Sucesso',
            warning: 'Cor de Aviso',
            danger: 'Cor de Erro',
            background: 'Fundo',
            surface: 'Superfície',
            text: 'Texto Principal',
            textSecondary: 'Texto Secundário'
        };
        return labels[colorName] || colorName;
    }

    function addCustomThemeEditorStyles() {
        if (document.getElementById('custom-theme-editor-styles')) return;

        const style = document.createElement('style');
        style.id = 'custom-theme-editor-styles';
        style.textContent = `
            .color-editor-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
                margin-bottom: 24px;
            }

            .color-editor-item {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .color-editor-item label {
                font-weight: 600;
                color: var(--text-primary);
                font-size: 0.9rem;
            }

            .color-input-group {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .color-input-group input[type="color"] {
                width: 50px;
                height: 40px;
                border: 2px solid var(--gray-200);
                border-radius: 8px;
                cursor: pointer;
            }

            .color-text-input {
                flex: 1;
                padding: 8px 12px;
                border: 2px solid var(--gray-200);
                border-radius: 8px;
                font-family: monospace;
            }

            .preview-section {
                margin-top: 24px;
                padding-top: 24px;
                border-top: 2px solid var(--gray-200);
            }

            .theme-preview-large {
                background: var(--bg-secondary);
                padding: 20px;
                border-radius: 12px;
                border: 1px solid var(--gray-200);
            }

            .preview-card {
                background: var(--bg-primary);
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                border: 1px solid var(--gray-200);
            }

            .preview-header {
                font-size: 1.2rem;
                font-weight: 700;
                color: var(--text-primary);
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 2px solid var(--primary-color);
            }

            .preview-content p {
                color: var(--text-secondary);
                margin-bottom: 16px;
                line-height: 1.5;
            }

            .preview-button {
                background: var(--primary-gradient);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
            }

            @media (max-width: 768px) {
                .color-editor-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;

        document.head.appendChild(style);
    }

    // ===== FUNÇÕES GLOBAIS ===== //
    window.toggleThemeSelector = function() {
        const panel = document.getElementById('theme-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    };

    window.selectTheme = function(themeName) {
        applyTheme(themeName);
        
        // Atualizar interface
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`[data-theme="${themeName}"]`)?.classList.add('active');
        
        // Fechar painel
        const panel = document.getElementById('theme-panel');
        if (panel) panel.style.display = 'none';

        // Notificação
        if (window.ModernUI) {
            window.ModernUI.showNotification(`Tema '${themes[themeName].name}' aplicado!`, 'success', 2000);
        }
    };

    window.closeCustomThemeEditor = function() {
        const modal = document.getElementById('custom-theme-modal');
        if (modal) modal.remove();
    };

    window.updateCustomColor = function(colorName, value) {
        const textInput = document.querySelector(`input[onchange*="${colorName}"][type="text"]`);
        if (textInput) textInput.value = value;
        
        updateThemePreview();
    };

    window.updateCustomColorText = function(colorName, value) {
        const colorInput = document.querySelector(`input[onchange*="${colorName}"][type="color"]`);
        if (colorInput) colorInput.value = value;
        
        updateThemePreview();
    };

    function updateThemePreview() {
        const customColors = {};
        document.querySelectorAll('input[type="color"]').forEach(input => {
            const colorName = input.id.replace('color-', '');
            customColors[colorName] = input.value;
        });

        // Aplicar no preview
        const preview = document.getElementById('theme-preview-large');
        if (preview) {
            preview.style.setProperty('--primary-color', customColors.primary);
            preview.style.setProperty('--text-primary', customColors.text);
            preview.style.setProperty('--text-secondary', customColors.textSecondary);
            preview.style.setProperty('--bg-primary', customColors.surface);
            preview.style.setProperty('--bg-secondary', customColors.background);
            preview.style.setProperty('--primary-gradient', `linear-gradient(135deg, ${customColors.primary} 0%, ${customColors.secondary} 100%)`);
        }
    }

    window.saveCustomTheme = function() {
        const customColors = {};
        document.querySelectorAll('input[type="color"]').forEach(input => {
            const colorName = input.id.replace('color-', '');
            customColors[colorName] = input.value;
        });

        // Criar tema personalizado
        const customTheme = {
            name: 'Tema Personalizado',
            description: 'Criado pelo usuário',
            colors: customColors,
            gradients: {
                primary: `linear-gradient(135deg, ${customColors.primary} 0%, ${customColors.secondary} 100%)`,
                secondary: `linear-gradient(135deg, ${customColors.accent} 0%, ${customColors.primary} 100%)`,
                success: `linear-gradient(135deg, ${customColors.success} 0%, ${customColors.success}dd 100%)`,
                warning: `linear-gradient(135deg, ${customColors.warning} 0%, ${customColors.warning}dd 100%)`,
                danger: `linear-gradient(135deg, ${customColors.danger} 0%, ${customColors.danger}dd 100%)`,
                background: `linear-gradient(135deg, ${customColors.background} 0%, ${customColors.surface} 100%)`
            }
        };

        // Salvar no localStorage
        localStorage.setItem('custom-theme', JSON.stringify(customTheme));
        
        // Adicionar aos temas disponíveis
        themes.custom = customTheme;
        
        // Aplicar tema
        applyTheme('custom');
        
        // Fechar modal
        closeCustomThemeEditor();
        
        if (window.ModernUI) {
            window.ModernUI.showNotification('Tema personalizado salvo com sucesso!', 'success');
        }
    };

    window.resetToDefaultTheme = function() {
        applyTheme('default');
        closeCustomThemeEditor();
    };

    // ===== INICIALIZAÇÃO ===== //
    function init() {
        // Carregar tema personalizado salvo
        const savedCustomTheme = localStorage.getItem('custom-theme');
        if (savedCustomTheme) {
            try {
                themes.custom = JSON.parse(savedCustomTheme);
            } catch (error) {
                console.warn('Erro ao carregar tema personalizado:', error);
            }
        }

        // Carregar tema salvo
        const savedTheme = localStorage.getItem('selected-theme');
        if (savedTheme && themes[savedTheme]) {
            applyTheme(savedTheme);
        }

        // Criar seletor de temas
        createThemeSelector();

        // Escutar mudanças de tema para atualizar gráficos
        window.addEventListener('themeChanged', (e) => {
            if (window.ChartManager && typeof window.ChartManager.updateChartsTheme === 'function') {
                window.ChartManager.updateChartsTheme(e.detail.config);
            }
        });

        console.log('🎨 Sistema de Temas carregado com sucesso!');
    }

    // ===== INTERFACE PÚBLICA ===== //
    return {
        init,
        applyTheme,
        getCurrentTheme: () => currentTheme,
        getThemes: () => themes,
        createCustomTheme: (colors, gradients) => {
            const theme = {
                name: 'Tema Personalizado',
                description: 'Criado programaticamente',
                colors,
                gradients
            };
            themes.custom = theme;
            return theme;
        }
    };
})();

// ===== INICIALIZAÇÃO AUTOMÁTICA ===== //
document.addEventListener('DOMContentLoaded', function() {
    ThemeSystem.init();
});

// ===== EXPORTAR PARA ESCOPO GLOBAL ===== //
window.ThemeSystem = ThemeSystem;