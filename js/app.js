import { updateSliderValueDisplay } from './utils.js';
import { ProjectManager } from './project-manager.js';
import { calculatePropertyMetrics, getAnnualCashFlowBreakdown } from './calculations.js';
import { UIComponents } from './ui-components.js';

class REITAnalyzer {
    constructor() {
        this.initializeElements();
        this.initializeProjects();
        this.setupEventListeners();
        this.setupSliders();
        this.loadConfigAndInitialize();
    }

    initializeElements() {
        // Main controls
        this.calculateButton = document.getElementById('calculateButton');
        this.resetButton = document.getElementById('resetButton');
        this.resultsArea = document.getElementById('resultsArea');
        this.errorMessageDiv = document.getElementById('errorMessage');
        this.oneProjectRadio = document.getElementById('oneProjectRadio');
        this.twoProjectsRadio = document.getElementById('twoProjectsRadio');

        // General parameters
        this.investmentYearsSlider = document.getElementById('investmentYearsSlider');
        this.investmentYearsValue = document.getElementById('investmentYearsValue');
        this.loanTermYearsSlider = document.getElementById('loanTermYearsSlider');
        this.loanTermYearsValue = document.getElementById('loanTermYearsValue');
        this.notaryFeesPercentInput = document.getElementById('notaryFeesPercentInput');
        this.inflationRateInput = document.getElementById('inflationRateInput');
        this.fpvRateInput = document.getElementById('fpvRateInput');
        this.highYieldFundRateInput = document.getElementById('highYieldFundRateInput');
        this.generalFinancialBlock = document.getElementById('generalFinancialBlock');

        // Scenario inputs
        this.scenarioInputs = [
            { slider: document.getElementById('pessimisticRateSlider'), valueDisplay: document.getElementById('pessimisticRateValue'), name: "Pesimista", color: "text-red-600", decimals: 1 },
            { slider: document.getElementById('normalRateSlider'), valueDisplay: document.getElementById('normalRateValue'), name: "Normal", color: "text-yellow-600", decimals: 1 },
            { slider: document.getElementById('realisticRateSlider'), valueDisplay: document.getElementById('realisticRateValue'), name: "Realista", color: "text-green-600", decimals: 1 },
            { slider: document.getElementById('optimisticRateSlider'), valueDisplay: document.getElementById('optimisticRateValue'), name: "Optimista", color: "text-blue-600", decimals: 1 }
        ];
    }

    initializeProjects() {
        // Project 1 elements
        const project1Elements = {
            block: document.getElementById('project1InputBlock'),
            baseValueInput: document.getElementById('project1BaseValueInput'),
            initialMonthlyRentInput: document.getElementById('project1InitialMonthlyRent'),
            propertyTaxPercentInput: document.getElementById('project1PropertyTaxPercent'),
            maintenancePercentInput: document.getElementById('project1MaintenancePercent'),
            insurancePercentInput: document.getElementById('project1InsurancePercent'),
            adminFeeMonthlyInput: document.getElementById('project1AdminFeeMonthly'),
            downPaymentPercentInput: document.getElementById('project1DownPaymentPercent'),
            creditRateInput: document.getElementById('project1CreditRate'),
            notaryAmountDisplay: document.getElementById('project1NotaryAmountDisplay_Config'),
            totalValueWithNotaryDisplay: document.getElementById('project1TotalValueWithNotaryDisplay_Config'),
            downPaymentAmountDisplay: document.getElementById('project1DownPaymentAmountDisplay_Config'),
            loanAmountDisplay: document.getElementById('project1LoanAmountDisplay_Config'),
            totalInterestDisplay: document.getElementById('project1TotalInterestDisplay_Config')
        };

        // Project 2 elements
        const project2Elements = {
            block: document.getElementById('project2InputBlock'),
            baseValueInput: document.getElementById('project2BaseValueInput'),
            initialMonthlyRentInput: document.getElementById('project2InitialMonthlyRent'),
            propertyTaxPercentInput: document.getElementById('project2PropertyTaxPercent'),
            maintenancePercentInput: document.getElementById('project2MaintenancePercent'),
            insurancePercentInput: document.getElementById('project2InsurancePercent'),
            adminFeeMonthlyInput: document.getElementById('project2AdminFeeMonthly'),
            downPaymentPercentInput: document.getElementById('project2DownPaymentPercent'),
            creditRateInput: document.getElementById('project2CreditRate'),
            notaryAmountDisplay: document.getElementById('project2NotaryAmountDisplay_Config'),
            totalValueWithNotaryDisplay: document.getElementById('project2TotalValueWithNotaryDisplay_Config'),
            downPaymentAmountDisplay: document.getElementById('project2DownPaymentAmountDisplay_Config'),
            loanAmountDisplay: document.getElementById('project2LoanAmountDisplay_Config'),
            totalInterestDisplay: document.getElementById('project2TotalInterestDisplay_Config')
        };

        this.project1Manager = new ProjectManager('project1', project1Elements);
        this.project2Manager = new ProjectManager('project2', project2Elements);
    }

    setupEventListeners() {
        this.calculateButton.addEventListener('click', () => this.displayResults());
        this.resetButton.addEventListener('click', () => this.resetToConfig());

        // Project radio buttons
        this.oneProjectRadio.addEventListener('change', () => this.handleProjectCountChange());
        this.twoProjectsRadio.addEventListener('change', () => this.handleProjectCountChange());

        // Global inputs that affect financing calculations
        [this.notaryFeesPercentInput, this.loanTermYearsSlider].forEach(input => {
            input.addEventListener('input', () => this.triggerFinancingCalculationsUpdate());
        });
    }

    setupSliders() {
        // Investment years slider
        updateSliderValueDisplay(this.investmentYearsSlider, this.investmentYearsValue, 0, ' años');
        this.investmentYearsSlider.addEventListener('input', () => {
            updateSliderValueDisplay(this.investmentYearsSlider, this.investmentYearsValue, 0, ' años');
            this.triggerFinancingCalculationsUpdate();
        });

        // Loan term slider
        updateSliderValueDisplay(this.loanTermYearsSlider, this.loanTermYearsValue, 0, ' años');
        this.loanTermYearsSlider.addEventListener('input', () => {
            updateSliderValueDisplay(this.loanTermYearsSlider, this.loanTermYearsValue, 0, ' años');
            this.triggerFinancingCalculationsUpdate();
        });

        // Scenario sliders
        this.scenarioInputs.forEach(scenario => {
            updateSliderValueDisplay(scenario.slider, scenario.valueDisplay, scenario.decimals);
            scenario.slider.addEventListener('input', () =>
                updateSliderValueDisplay(scenario.slider, scenario.valueDisplay, scenario.decimals)
            );
        });
    }

    handleProjectCountChange() {
        if (this.oneProjectRadio.checked) {
            this.project2Manager.elements.block.classList.add('hidden-section');
            this.generalFinancialBlock.classList.remove('lg:col-start-3');
        } else {
            this.project2Manager.elements.block.classList.remove('hidden-section');
            this.generalFinancialBlock.classList.add('lg:col-start-3');
            this.triggerFinancingCalculationsUpdate();
        }
    }

    triggerFinancingCalculationsUpdate() {
        const loanTermYears = parseInt(this.loanTermYearsSlider.value);
        const notaryFeesPercent = parseFloat(this.notaryFeesPercentInput.value);

        this.project1Manager.updateFinancingCalculations(loanTermYears, notaryFeesPercent);
        if (this.twoProjectsRadio.checked) {
            this.project2Manager.updateFinancingCalculations(loanTermYears, notaryFeesPercent);
        }
    }

    getAndValidateInputs() {
        const loanTermYears = parseInt(this.loanTermYearsSlider.value);
        const notaryFeesPercent = parseFloat(this.notaryFeesPercentInput.value);

        const p1Financing = this.project1Manager.updateFinancingCalculations(loanTermYears, notaryFeesPercent);
        let p2Financing = { notaryAmount: 0, totalValueWithNotary: 0, initialUserEquity: 0, loanAmount: 0, totalInterest: 0 };

        if (this.twoProjectsRadio.checked) {
            p2Financing = this.project2Manager.updateFinancingCalculations(loanTermYears, notaryFeesPercent);
        }

        const inputs = {
            investmentYears: parseInt(this.investmentYearsSlider.value),
            loanTermYears: loanTermYears,
            notaryFeesPercent: notaryFeesPercent / 100,
            project1: this.project1Manager.getInputData(p1Financing),
            project2: null,
            inflationRate: parseFloat(this.inflationRateInput.value) / 100,
            fpvRate: parseFloat(this.fpvRateInput.value) / 100,
            highYieldFundRate: parseFloat(this.highYieldFundRateInput.value) / 100,
            valuationScenarios: this.scenarioInputs.map(s => ({
                name: s.name,
                rate: parseFloat(s.slider.value) / 100,
                color: s.color
            })),
            analyzeTwoProjects: this.twoProjectsRadio.checked
        };

        if (inputs.analyzeTwoProjects) {
            inputs.project2 = this.project2Manager.getInputData(p2Financing);
        }

        return this.validateInputs(inputs);
    }

    validateInputs(inputs) {
        let errors = [];

        if (isNaN(inputs.investmentYears) || inputs.investmentYears < 0) {
            errors.push("Años de inversión debe ser un número no negativo.");
        }
        if (isNaN(inputs.loanTermYears) || inputs.loanTermYears < 0) {
            errors.push("Plazo Crédito debe ser un número no negativo.");
        }
        if (isNaN(inputs.notaryFeesPercent) || inputs.notaryFeesPercent < 0 || inputs.notaryFeesPercent > 0.2) {
            errors.push("Gastos de Notaría deben estar entre 0% y 20%.");
        }

        const projectsToValidate = inputs.analyzeTwoProjects ? ['project1', 'project2'] : ['project1'];
        projectsToValidate.forEach(key => {
            const prop = inputs[key];
            if (!prop) return;
            const type = key === 'project1' ? 'Proyecto 1' : 'Proyecto 2';

            if (isNaN(prop.baseValue) || prop.baseValue <= 0 || !isFinite(prop.baseValue)) {
                errors.push(`Valor inmueble (Base) (${type}) debe ser un número positivo y finito.`);
            }
            if (isNaN(prop.initialMonthlyRent) || prop.initialMonthlyRent < 0) {
                errors.push(`Arriendo mensual (${type}) no puede ser negativo.`);
            }
            if (isNaN(prop.propertyTaxPercent) || prop.propertyTaxPercent < 0) {
                errors.push(`Impuesto Predial % (${type}) no puede ser negativo.`);
            }
            if (isNaN(prop.maintenancePercent) || prop.maintenancePercent < 0) {
                errors.push(`Mantenimiento % (${type}) no puede ser negativo.`);
            }
            if (isNaN(prop.insurancePercent) || prop.insurancePercent < 0) {
                errors.push(`Seguro de Vivienda % (${type}) no puede ser negativo.`);
            }
            if (isNaN(prop.adminFeeMonthly) || prop.adminFeeMonthly < 0) {
                errors.push(`Administración mensual (${type}) no puede ser negativa.`);
            }
            if (isNaN(prop.downPaymentPercent) || prop.downPaymentPercent < 0 || prop.downPaymentPercent > 1) {
                errors.push(`Porcentaje de entrada (${type}) debe estar entre 0% y 100%.`);
            }
            if (isNaN(prop.creditRate) || prop.creditRate < 0 || prop.creditRate > 1) {
                errors.push(`Tasa E.A. Crédito (${type}) debe estar entre 0% y 100%.`);
            }
        });

        if (isNaN(inputs.inflationRate) || inputs.inflationRate < -1 || inputs.inflationRate > 1) {
            errors.push("Inflación Estimada Anual debe estar entre -100% y 100%.");
        }
        if (isNaN(inputs.fpvRate) || !isFinite(inputs.fpvRate) || inputs.fpvRate < -1 || inputs.fpvRate > 1) {
            errors.push("Tasa FPV debe ser un número finito entre -100% y 100%.");
        }
        if (isNaN(inputs.highYieldFundRate) || !isFinite(inputs.highYieldFundRate) || inputs.highYieldFundRate < -1 || inputs.highYieldFundRate > 1) {
            errors.push("Tasa Fondo Alta Rentabilidad debe ser un número finito entre -100% y 100%.");
        }

        inputs.valuationScenarios.forEach(scenario => {
            if (isNaN(scenario.rate)) {
                errors.push(`Tasa para escenario ${scenario.name} debe ser un número válido.`);
            }
        });

        if (errors.length > 0) {
            this.errorMessageDiv.innerHTML = errors.join("<br>");
            this.resultsArea.innerHTML = '';
            return null;
        }

        this.errorMessageDiv.textContent = '';
        return inputs;
    }

    displayResults() {
        const inputs = this.getAndValidateInputs();
        if (!inputs) return;

        this.resultsArea.innerHTML = '';

        const projectsToDisplay = [];
        if (inputs.project1 && inputs.project1.baseValue > 0 && isFinite(inputs.project1.baseValue)) {
            projectsToDisplay.push({
                name: "Proyecto 1",
                idPrefix: "project1",
                inputData: inputs.project1
            });
        }
        if (inputs.analyzeTwoProjects && inputs.project2 && inputs.project2.baseValue > 0 && isFinite(inputs.project2.baseValue)) {
            projectsToDisplay.push({
                name: "Proyecto 2",
                idPrefix: "project2",
                inputData: inputs.project2
            });
        }

        const FINANCIAL_INSTRUMENTS = [
            { name: "FPV", displayName: "FPV (Fondo de Pensiones Voluntarias)", rate: inputs.fpvRate, id: "fpv" },
            { name: "FondoAltaRent", displayName: "Fondo de Alta Rentabilidad", rate: inputs.highYieldFundRate, id: "high_yield_fund" }
        ];

        const propertyMetricsStore = {};

        // Generate results for each project
        projectsToDisplay.forEach(propSetup => {
            const propertyInputData = propSetup.inputData;
            propertyMetricsStore[propSetup.idPrefix] = [];

            // Project summary
            const projectSummaryHtml = UIComponents.createProjectSummaryHTML(propSetup, propertyInputData, inputs);

            // Calculate metrics for each scenario
            let propertyHtml = `<section id="${propSetup.idPrefix}-analysis" class="mb-10">`;
            propertyHtml += `<h2 class="section-title">${propSetup.name}</h2>`;
            propertyHtml += projectSummaryHtml;

            propertyHtml += `<div class="overflow-x-auto"><table class="custom-table">`;
            propertyHtml += `
                <thead>
                    <tr>
                        <th>Escenario Valorización</th>
                        <th>Valor Futuro Inmueble (Base Apreciada)</th>
                        <th>Flujo Caja Neto Acum. (Post-Hipoteca)</th>
                        <th>Patrimonio Final Usuario</th>
                        <th>ROI Neto (s/Enganche)</th>
                        <th>CAGR (s/Enganche)</th>
                    </tr>
                </thead>
                <tbody>`;

            inputs.valuationScenarios.forEach(scenario => {
                const metrics = calculatePropertyMetrics(propertyInputData, inputs, scenario.rate);
                propertyMetricsStore[propSetup.idPrefix].push({
                    scenarioName: scenario.name,
                    scenarioColor: scenario.color,
                    totalUserValue: metrics.totalUserValue,
                    scenarioRate: scenario.rate,
                    initialUserEquity: metrics.initialUserEquity,
                    futureBasePropertyValue: metrics.futureBasePropertyValue,
                    accumulatedCashFlow: metrics.accumulatedCashFlow,
                    roi: metrics.roi,
                    cagr: metrics.cagr
                });

                propertyHtml += `
                    <tr>
                        <td class="font-semibold ${scenario.color}">${scenario.name} (${(scenario.rate * 100).toFixed(1)}%)</td>
                        <td>${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(metrics.futureBasePropertyValue)}</td>
                        <td>${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(metrics.accumulatedCashFlow)}</td>
                        <td class="font-bold">${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(metrics.totalUserValue)}</td>
                        <td class="font-semibold ${metrics.roi >= 0 ? 'text-green-700' : 'text-red-700'}">${(metrics.roi * 100).toFixed(2)}%</td>
                        <td class="font-semibold ${!isFinite(metrics.cagr) || metrics.cagr >= 0 ? 'text-green-700' : 'text-red-700'}">${isFinite(metrics.cagr) ? (metrics.cagr * 100).toFixed(2) + '%' : 'N/A'}</td>
                    </tr>`;
            });
            propertyHtml += `</tbody></table></div>`;

            // Add cash flow breakdown
            let representativeScenarioRate = inputs.valuationScenarios.find(s => s.name === "Realista")?.rate;
            if (representativeScenarioRate === undefined && inputs.valuationScenarios.length > 0) {
                representativeScenarioRate = inputs.valuationScenarios[0].rate;
            } else if (representativeScenarioRate === undefined) {
                representativeScenarioRate = 0;
            }

            const annualBreakdown = getAnnualCashFlowBreakdown(propertyInputData, inputs, representativeScenarioRate);
            propertyHtml += UIComponents.createCashFlowBreakdownHTML(propSetup, annualBreakdown, representativeScenarioRate);
            propertyHtml += `</section>`;

            this.resultsArea.innerHTML += propertyHtml;
        });

        // Add liquid instruments comparison
        if (projectsToDisplay.length > 0) {
            this.resultsArea.innerHTML += UIComponents.createLiquidInstrumentsHTML(projectsToDisplay, FINANCIAL_INSTRUMENTS, inputs);
        }
    }

    loadConfigAndInitialize() {
        if (!window.REIT_CONFIG) return;

        const cfg = window.REIT_CONFIG;

        // Set project values
        this.project1Manager.setValuesFromConfig(cfg.project1);
        this.project2Manager.setValuesFromConfig(cfg.project2);

        // Set general values
        this.investmentYearsSlider.value = cfg.general.investmentYears;
        this.loanTermYearsSlider.value = cfg.general.loanTermYears;
        this.notaryFeesPercentInput.value = cfg.general.notaryFeesPercent;
        this.inflationRateInput.value = cfg.general.inflationRate;
        this.fpvRateInput.value = cfg.general.fpvRate;
        this.highYieldFundRateInput.value = cfg.general.highYieldFundRate;

        // Set scenario values
        this.scenarioInputs[0].slider.value = cfg.scenarios.pessimistic;
        this.scenarioInputs[1].slider.value = cfg.scenarios.normal;
        this.scenarioInputs[2].slider.value = cfg.scenarios.realistic;
        this.scenarioInputs[3].slider.value = cfg.scenarios.optimistic;

        // Update displays
        this.scenarioInputs.forEach(scenario =>
            updateSliderValueDisplay(scenario.slider, scenario.valueDisplay, scenario.decimals)
        );
        updateSliderValueDisplay(this.investmentYearsSlider, this.investmentYearsValue, 0, ' años');
        updateSliderValueDisplay(this.loanTermYearsSlider, this.loanTermYearsValue, 0, ' años');

        this.triggerFinancingCalculationsUpdate();
    }

    resetToConfig() {
        this.loadConfigAndInitialize();
        this.displayResults();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new REITAnalyzer();
});
