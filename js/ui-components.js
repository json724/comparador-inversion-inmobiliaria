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
}
