import { copFormatter, percentFormatter } from './utils.js';

export class UIComponents {
    static createProjectSummaryHTML(propSetup, propertyInputData, inputs) {
        const annualMortgagePaymentForSummary = this.calculateAnnualMortgagePayment(
            propertyInputData.loanAmount,
            propertyInputData.creditRate,
            inputs.loanTermYears
        );
        const totalInterestForSummary = (annualMortgagePaymentForSummary * inputs.loanTermYears) - propertyInputData.loanAmount;

        return `
            <div class="summary-block">
                <h4>Resumen de Compra y Financiamiento: ${propSetup.name}</h4>
                <ul>
                    <li><strong>Valor Base Inmueble:</strong> <span class="value">${copFormatter.format(propertyInputData.baseValue)}</span></li>
                    <li><strong>Gastos Notaría y Reg. (${percentFormatter(inputs.notaryFeesPercent,1)}):</strong> <span class="value">${copFormatter.format(propertyInputData.notaryAmount)}</span></li>
                    <li><strong>Valor Total Adquisición (con Notaría):</strong> <span class="value">${copFormatter.format(propertyInputData.totalValueWithNotary)}</span></li>
                </ul>
                <h5 class="font-semibold text-gray-700 mt-2 mb-1">Detalles del Financiamiento:</h5>
                <ul class="list-disc list-inside ml-4">
                    <li><strong>Enganche (${percentFormatter(propertyInputData.downPaymentPercent,0)}):</strong> <span class="value">${copFormatter.format(propertyInputData.initialUserEquity)}</span></li>
                    <li><strong>Monto del Crédito:</strong> <span class="value">${copFormatter.format(propertyInputData.loanAmount)}</span></li>
                    <li><strong>Tasa E.A. Crédito:</strong> <span class="value">${percentFormatter(propertyInputData.creditRate,2)}</span></li>
                    <li><strong>Plazo del Crédito:</strong> <span class="value">${inputs.loanTermYears} años</span></li>
                    <li><strong>Pago Anual Estimado (Crédito):</strong> <span class="value">${copFormatter.format(annualMortgagePaymentForSummary)}</span></li>
                    <li><strong>Intereses Totales Estimados (sobre Plazo Total Crédito):</strong> <span class="value">${copFormatter.format(totalInterestForSummary > 0 ? totalInterestForSummary : 0)}</span></li>
                </ul>
                <p class="note">Nota: El "Flujo Caja Neto Acum." en la tabla de resultados considera los pagos del crédito y gastos operativos (que varían por escenario) durante los ${inputs.investmentYears} años de inversión.</p>
            </div>
        `;
    }

    static createPropertyAnalysisTableHTML(propSetup, inputs, propertyMetricsStore) {
        let html = `
            <section id="${propSetup.idPrefix}-analysis" class="mb-10">
                <h2 class="section-title">${propSetup.name}</h2>
                <div class="overflow-x-auto">
                    <table class="custom-table">
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
                        <tbody>
        `;

        inputs.valuationScenarios.forEach(scenario => {
            const metrics = propertyMetricsStore[propSetup.idPrefix].find(m => m.scenarioName === scenario.name);
            if (metrics) {
                html += `
                    <tr>
                        <td class="font-semibold ${scenario.color}">${scenario.name} (${percentFormatter(scenario.rate, 1)})</td>
                        <td>${copFormatter.format(metrics.futureBasePropertyValue)}</td>
                        <td>${copFormatter.format(metrics.accumulatedCashFlow)}</td>
                        <td class="font-bold">${copFormatter.format(metrics.totalUserValue)}</td>
                        <td class="font-semibold ${metrics.roi >= 0 ? 'text-green-700' : 'text-red-700'}">${percentFormatter(metrics.roi)}</td>
                        <td class="font-semibold ${!isFinite(metrics.cagr) || metrics.cagr >= 0 ? 'text-green-700' : 'text-red-700'}">${percentFormatter(metrics.cagr)}</td>
                    </tr>
                `;
            }
        });

        html += `
                        </tbody>
                    </table>
                </div>
            </section>
        `;

        return html;
    }

    static createCashFlowBreakdownHTML(propSetup, annualBreakdown, representativeScenarioRate) {
        let html = `
            <div id="${propSetup.idPrefix}-annual-cashflow-container" class="mt-6">
                <h5 class="table-title">Desglose Anual del Flujo de Caja para ${propSetup.name} (usando escenario de valorización: ${percentFormatter(representativeScenarioRate,1)})</h5>
                <div class="overflow-x-auto">
                    <table class="custom-table" id="${propSetup.idPrefix}-annual-cashflow-table">
                        <thead>
                            <tr>
                                <th>Año</th>
                                <th>Arriendo Anual Bruto</th>
                                <th>Gastos Variables Anuales (Predial + Mant. + Seguro)</th>
                                <th>Gastos Fijos Anuales (Admin)</th>
                                <th>Pago Anual Crédito</th>
                                <th>Flujo de Caja Neto Anual</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        let totalNetAnnualCashFlow = 0;
        annualBreakdown.forEach(item => {
            totalNetAnnualCashFlow += item.cashFlowNetoAnual;
            html += `
                <tr>
                    <td>${item.year}</td>
                    <td>${copFormatter.format(item.annualRentBruto)}</td>
                    <td>${copFormatter.format(item.gastosVariablesAnuales)}</td>
                    <td>${copFormatter.format(item.gastosFijosAnuales)}</td>
                    <td>${copFormatter.format(item.annualMortgagePayment)}</td>
                    <td class="${item.cashFlowNetoAnual >= 0 ? 'text-green-700' : 'text-red-700'} font-semibold">${copFormatter.format(item.cashFlowNetoAnual)}</td>
                </tr>
            `;
        });

        html += `
                        </tbody>
                        <tfoot>
                            <tr class="bg-gray-100 font-semibold">
                                <td colspan="5" class="text-right pr-4">Total Flujo de Caja Neto Acumulado:</td>
                                <td class="${totalNetAnnualCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}">${copFormatter.format(totalNetAnnualCashFlow)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;

        return html;
    }

    static createLiquidInstrumentsHTML(projectsToDisplay, FINANCIAL_INSTRUMENTS, inputs) {
        let html = `
            <section id="liquid-instruments-analysis" class="mb-10">
                <h2 class="section-title">Proyección Instrumentos Financieros (Invirtiendo el Enganche)</h2>
        `;

        projectsToDisplay.forEach(propSetup => {
            const propertyInputData = propSetup.inputData;
            html += `
                <h3 class="subsection-title">Si invirtiera ${copFormatter.format(propertyInputData.initialUserEquity)} (Enganche de ${propSetup.name}) en:</h3>
                <div class="overflow-x-auto">
                    <table class="custom-table">
                        <thead>
                            <tr>
                                <th>Instrumento Financiero</th>
                                <th>Valor Futuro Estimado</th>
                                <th>Tasa Efectiva Anual (CAGR)</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            FINANCIAL_INSTRUMENTS.forEach(instrument => {
                const futureValue = this.calculateLiquidInstrumentValue(propertyInputData.initialUserEquity, instrument.rate, inputs.investmentYears);
                html += `
                    <tr>
                        <td class="font-semibold">${instrument.displayName}</td>
                        <td class="font-bold">${copFormatter.format(futureValue)}</td>
                        <td class="font-semibold text-blue-700">${percentFormatter(instrument.rate, 2)}</td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                    </table>
                </div>
            `;
        });

        html += `</section>`;
        return html;
    }

    static calculateAnnualMortgagePayment(P, i, N) {
        if (P <= 0) return 0;
        if (N <= 0) return P;
        if (i === 0 && N > 0) return P / N;
        if (i === 0 && N === 0) return P;
        const annualPayment = P * (i * Math.pow(1 + i, N)) / (Math.pow(1 + i, N) - 1);
        return annualPayment;
    }

    static calculateLiquidInstrumentValue(principal, rate, years) {
        if (principal === 0) return 0;
        if (!isFinite(principal) || !isFinite(rate) || !isFinite(years)) return NaN;
        if (years < 0) return principal;
        return principal * Math.pow(1 + rate, years);
    }

    // Viability Analysis UI Components
    static createViabilityResultHTML(result, analysis, inputs) {
        const formatCOP = (amount) => new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);

        return `
            <div class="viability-result-card">
                <div class="viability-status ${analysis.statusColor}">
                    ${analysis.viabilityStatus}
                </div>

                <div class="viability-metrics">
                    <div class="viability-metric">
                        <div class="viability-metric-label">Capital Total Necesario</div>
                        <div class="viability-metric-value">${formatCOP(result.totalRequiredCapital)}</div>
                    </div>
                    <div class="viability-metric">
                        <div class="viability-metric-label">Capital Disponible</div>
                        <div class="viability-metric-value">${formatCOP(inputs.availableCapital)}</div>
                    </div>
                    <div class="viability-metric">
                        <div class="viability-metric-label">Viabilidad</div>
                        <div class="viability-metric-value">${analysis.viabilityPercentage.toFixed(1)}%</div>
                    </div>
                    ${analysis.capitalGap > 0 ? `
                    <div class="viability-metric">
                        <div class="viability-metric-label">Capital Faltante</div>
                        <div class="viability-metric-value text-red-600">${formatCOP(analysis.capitalGap)}</div>
                    </div>
                    ` : ''}
                </div>

                <div class="viability-recommendation">
                    <h4 class="text-lg font-semibold text-gray-800 mb-2">💡 Recomendación</h4>
                    <p class="text-gray-700">${analysis.recommendation}</p>
                </div>
            </div>
        `;
    }

    static createViabilityDetailsHTML(result, inputs) {
        const formatCOP = (amount) => new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);

        return `
            <div class="mt-8">
                <h3 class="text-xl font-semibold text-gray-800 mb-4">📋 Detalles del Análisis</h3>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white p-6 rounded-lg shadow border">
                        <h4 class="text-lg font-semibold text-blue-600 mb-4">🏠 Propiedad Requerida</h4>
                        <ul class="space-y-2 text-sm">
                            <li><strong>Valor de la Propiedad:</strong> ${formatCOP(result.requiredPropertyValue)}</li>
                            <li><strong>Valor Total con Notaría:</strong> ${formatCOP(result.totalValueWithNotary)}</li>
                            <li><strong>Arriendo Mensual Estimado:</strong> ${formatCOP(result.monthlyRent)}</li>
                            <li><strong>Arriendo Anual Estimado:</strong> ${formatCOP(result.annualRent)}</li>
                        </ul>
                    </div>

                    <div class="bg-white p-6 rounded-lg shadow border">
                        <h4 class="text-lg font-semibold text-green-600 mb-4">💰 Financiamiento</h4>
                        <ul class="space-y-2 text-sm">
                            <li><strong>Cuota Inicial (${inputs.downPaymentPercent}%):</strong> ${formatCOP(result.requiredDownPayment)}</li>
                            <li><strong>Monto del Crédito:</strong> ${formatCOP(result.loanAmount)}</li>
                            <li><strong>Cuota Anual Estimada:</strong> ${formatCOP(result.annualMortgagePayment)}</li>
                            <li><strong>Plazo:</strong> ${inputs.loanTermYears} años</li>
                        </ul>
                    </div>

                    <div class="bg-white p-6 rounded-lg shadow border">
                        <h4 class="text-lg font-semibold text-purple-600 mb-4">📊 Flujo de Caja</h4>
                        <ul class="space-y-2 text-sm">
                            <li><strong>Ingresos Anuales:</strong> ${formatCOP(result.annualRent)}</li>
                            <li><strong>Gastos Anuales Estimados:</strong> ${formatCOP(result.totalAnnualExpenses)}</li>
                            <li><strong>Cuota Hipoteca Anual:</strong> ${formatCOP(result.annualMortgagePayment)}</li>
                            <li><strong>Cashflow Neto Mensual:</strong> <span class="font-bold text-green-600">${formatCOP(result.netMonthlyCashflow)}</span></li>
                        </ul>
                    </div>

                    <div class="bg-white p-6 rounded-lg shadow border">
                        <h4 class="text-lg font-semibold text-orange-600 mb-4">⚙️ Parámetros Utilizados</h4>
                        <ul class="space-y-2 text-sm">
                            <li><strong>Rentabilidad Esperada:</strong> ${inputs.expectedRentalYield}%</li>
                            <li><strong>Tasa de Interés:</strong> ${inputs.interestRate}% E.A.</li>
                            <li><strong>Gastos de Notaría:</strong> ${inputs.notaryFeesPercent}%</li>
                            <li><strong>Gastos Operativos:</strong> ~${(inputs.propertyTaxPercent + inputs.maintenancePercent + inputs.insurancePercent).toFixed(1)}% anual</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    static createAlternativeScenariosHTML(scenarios) {
        const formatCOP = (amount) => new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);

        let html = `
            <div class="mt-8">
                <h3 class="text-xl font-semibold text-gray-800 mb-4">🔄 Escenarios Alternativos</h3>
                <p class="text-gray-600 mb-6">Si el escenario actual no es viable, considera estas alternativas:</p>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        `;

        scenarios.forEach(scenario => {
            html += `
                <div class="scenario-card">
                    <div class="scenario-title">${scenario.name}</div>
                    <div class="space-y-2 text-sm">
                        <div><strong>Capital Necesario:</strong> ${formatCOP(scenario.result.totalRequiredCapital)}</div>
                        <div><strong>Cashflow Mensual:</strong> ${formatCOP(scenario.result.netMonthlyCashflow)}</div>
                        <div class="mt-3">
                            <span class="inline-block px-2 py-1 text-xs font-semibold rounded ${scenario.analysis.statusColor} bg-opacity-10">
                                ${scenario.analysis.viabilityStatus}
                            </span>
                            <span class="ml-2 text-xs">${scenario.analysis.viabilityPercentage.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        return html;
    }
}
