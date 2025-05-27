import { calculateAnnualMortgagePayment } from './utils.js';

export class ViabilityCalculator {
    constructor() {
        // Get default values from config.js if available, otherwise use fallback values
        const config = window.REIT_CONFIG || {};
        const generalConfig = config.general || {};
        const project1Config = config.project1 || {};

        this.defaultValues = {
            targetMonthlyCashflow: 2000000, // COP - specific to viability analysis
            availableCapital: 50000000, // COP - specific to viability analysis
            expectedRentalYield: 7.0, // % - specific to viability analysis
            loanTermYears: 30, // Use 30 years for viability analysis (more realistic for buy-to-rent)
            interestRate: project1Config.creditRate || 12.0, // % EA
            downPaymentPercent: project1Config.downPaymentPercent || 30, // %
            notaryFeesPercent: generalConfig.notaryFeesPercent || 2.5, // %
            propertyTaxPercent: project1Config.propertyTaxPercent || 0.5, // %
            maintenancePercent: project1Config.maintenancePercent || 1.0, // %
            insurancePercent: project1Config.insurancePercent || 0.3, // %
            adminFeeMonthly: project1Config.adminFeeMonthly || 0, // COP - consistent with comparator
            inflationRate: generalConfig.inflationRate || 5.0 // %
        };
    }

    calculateRequiredCapital(inputs) {
        const {
            targetMonthlyCashflow,
            expectedRentalYield,
            loanTermYears,
            interestRate,
            downPaymentPercent,
            notaryFeesPercent,
            propertyTaxPercent,
            maintenancePercent,
            insurancePercent,
            adminFeeMonthly
        } = inputs;

        console.log('=== CÁLCULO DIRECTO DE VIABILIDAD ===');
        console.log(`Objetivo: ${this.formatCOP(targetMonthlyCashflow)} mensuales`);
        console.log(`Parámetros: Rentabilidad ${expectedRentalYield}%, Crédito ${loanTermYears} años al ${interestRate}%`);
        console.log('');

        // Convert percentages to decimals
        const r = expectedRentalYield / 100; // rental yield
        const i = interestRate / 100; // interest rate
        const d = downPaymentPercent / 100; // down payment
        const n = notaryFeesPercent / 100; // notary fees
        const g = (propertyTaxPercent + maintenancePercent + insurancePercent) / 100; // total expense rate

        const targetAnnualCashflow = targetMonthlyCashflow * 12;
        const adminFeeAnnual = adminFeeMonthly * 12;

        console.log(`Gastos fijos anuales (administración): ${this.formatCOP(adminFeeAnnual)}`);
        console.log(`Tasa de gastos variables: ${(g * 100).toFixed(2)}% del valor de la propiedad`);
        console.log('');

        // Use direct mathematical approach with Newton-Raphson method
        // Since mortgage payment is non-linear in property value, we need numerical solution
        const result = this.solveForPropertyValue(targetAnnualCashflow, r, g, adminFeeAnnual, i, loanTermYears, d, n);

        console.log('=== RESULTADO FINAL ===');
        console.log(`Valor de propiedad necesario: ${this.formatCOP(result.requiredPropertyValue)}`);
        console.log(`Capital total requerido: ${this.formatCOP(result.totalRequiredCapital)}`);
        console.log(`Renta mensual: ${this.formatCOP(result.monthlyRent)}`);
        console.log(`Cashflow neto mensual: ${this.formatCOP(result.netMonthlyCashflow)}`);
        console.log('========================');

        return result;
    }

    solveForPropertyValue(targetAnnualCashflow, rentalYield, expenseRate, adminFeeAnnual, interestRate, loanTermYears, downPaymentRate, notaryRate) {
        // More robust algorithm: Bisection method with Newton-Raphson refinement

        console.log(`Buscando valor de propiedad para cashflow objetivo: ${this.formatCOP(targetAnnualCashflow)}`);

        // Define the function we want to solve: f(V) = cashflow(V) - target = 0
        const cashflowFunction = (V) => {
            const result = this.calculateCashflowForPropertyValue(V, {
                rentalYield,
                expenseRate,
                adminFeeAnnual,
                interestRate,
                loanTermYears,
                downPaymentRate,
                notaryRate
            });
            return result.netAnnualCashflow - targetAnnualCashflow;
        };

        // First, find bounds where the function changes sign
        let lowerBound = 10000000; // 10M COP minimum
        let upperBound = 10000000000; // 10B COP maximum

        console.log('Buscando límites donde la función cambia de signo...');

        // Find upper bound where cashflow becomes positive
        let iterations = 0;
        const maxSearchIterations = 50;

        while (iterations < maxSearchIterations) {
            const fUpper = cashflowFunction(upperBound);
            console.log(`Probando límite superior V = ${this.formatCOP(upperBound)}, f(V) = ${this.formatCOP(fUpper)}`);

            if (fUpper > 0) {
                break; // Found positive cashflow
            }

            upperBound *= 2; // Double the search range
            iterations++;
        }

        if (iterations >= maxSearchIterations) {
            console.log('⚠️ No se encontró un límite superior viable. El objetivo puede ser imposible con estos parámetros.');
            // Return a reasonable estimate anyway
            return this.calculateFinalResult(upperBound / 2, {
                rentalYield,
                expenseRate,
                adminFeeAnnual,
                interestRate,
                loanTermYears,
                downPaymentRate,
                notaryRate
            });
        }

        // Verify we have opposite signs
        const fLower = cashflowFunction(lowerBound);
        const fUpper = cashflowFunction(upperBound);

        console.log(`Límites encontrados:`);
        console.log(`  Inferior: V = ${this.formatCOP(lowerBound)}, f(V) = ${this.formatCOP(fLower)}`);
        console.log(`  Superior: V = ${this.formatCOP(upperBound)}, f(V) = ${this.formatCOP(fUpper)}`);

        if (fLower * fUpper > 0) {
            console.log('⚠️ Los límites no tienen signos opuestos. Usando estimación directa.');
            // Fallback to simple estimation
            const estimatedV = (targetAnnualCashflow + adminFeeAnnual) / (rentalYield - expenseRate - 0.05); // Rough mortgage estimate
            return this.calculateFinalResult(Math.max(estimatedV, lowerBound), {
                rentalYield,
                expenseRate,
                adminFeeAnnual,
                interestRate,
                loanTermYears,
                downPaymentRate,
                notaryRate
            });
        }

        // Bisection method
        console.log('Iniciando método de bisección...');
        const tolerance = 1000; // COP
        const maxIterations = 30;
        iterations = 0;

        let left = lowerBound;
        let right = upperBound;

        while (iterations < maxIterations && (right - left) > tolerance) {
            const mid = (left + right) / 2;
            const fMid = cashflowFunction(mid);

            if (iterations < 5 || iterations % 5 === 0) {
                console.log(`Bisección ${iterations + 1}: V = ${this.formatCOP(mid)}, f(V) = ${this.formatCOP(fMid)}`);
            }

            if (Math.abs(fMid) < tolerance) {
                console.log(`✅ Convergencia alcanzada en ${iterations + 1} iteraciones`);
                return this.calculateFinalResult(mid, {
                    rentalYield,
                    expenseRate,
                    adminFeeAnnual,
                    interestRate,
                    loanTermYears,
                    downPaymentRate,
                    notaryRate
                });
            }

            // Update bounds
            if (fMid * fLower < 0) {
                right = mid;
            } else {
                left = mid;
            }

            iterations++;
        }

        // Return the midpoint as final result
        const finalV = (left + right) / 2;
        console.log(`Método de bisección completado. Valor final: ${this.formatCOP(finalV)}`);

        return this.calculateFinalResult(finalV, {
            rentalYield,
            expenseRate,
            adminFeeAnnual,
            interestRate,
            loanTermYears,
            downPaymentRate,
            notaryRate
        });
    }

    calculateFinalResult(propertyValue, params) {
        const result = this.calculateCashflowForPropertyValue(propertyValue, params);

        return {
            requiredPropertyValue: propertyValue,
            totalValueWithNotary: result.totalValueWithNotary,
            requiredDownPayment: result.requiredDownPayment,
            loanAmount: result.loanAmount,
            monthlyRent: result.monthlyRent,
            annualRent: result.annualRent,
            totalAnnualExpenses: result.totalAnnualExpenses,
            annualMortgagePayment: result.annualMortgagePayment,
            netAnnualCashflow: result.netAnnualCashflow,
            netMonthlyCashflow: result.netAnnualCashflow / 12,
            totalRequiredCapital: result.requiredDownPayment,
            iterations: 0
        };
    }

    calculateCashflowForPropertyValue(propertyValue, params) {
        const {
            rentalYield,
            expenseRate,
            adminFeeAnnual,
            interestRate,
            loanTermYears,
            downPaymentRate,
            notaryRate
        } = params;

        // Calculate costs and financing (consistent with comparator)
        const notaryFees = propertyValue * notaryRate;
        const totalValueWithNotary = propertyValue + notaryFees;
        const requiredDownPayment = totalValueWithNotary * downPaymentRate;
        const loanAmount = totalValueWithNotary - requiredDownPayment;

        // Calculate annual rent based on rental yield
        const annualRent = propertyValue * rentalYield;
        const monthlyRent = annualRent / 12;

        // Calculate annual expenses (consistent with comparator)
        const variableExpenses = propertyValue * expenseRate; // predial + maintenance + insurance
        const fixedExpenses = adminFeeAnnual; // administration (paid by tenant, so usually 0)
        const totalAnnualExpenses = variableExpenses + fixedExpenses;

        // Calculate mortgage payment (same function as comparator)
        const annualMortgagePayment = calculateAnnualMortgagePayment(loanAmount, interestRate, loanTermYears);

        // Calculate net cashflow
        const netAnnualCashflow = annualRent - totalAnnualExpenses - annualMortgagePayment;

        return {
            totalValueWithNotary,
            requiredDownPayment,
            loanAmount,
            monthlyRent,
            annualRent,
            totalAnnualExpenses,
            annualMortgagePayment,
            netAnnualCashflow
        };
    }

    analyzeViability(requiredCapital, availableCapital) {
        const capitalGap = requiredCapital - availableCapital;
        const viabilityPercentage = (availableCapital / requiredCapital) * 100;

        let viabilityStatus = '';
        let recommendation = '';
        let statusColor = '';

        if (viabilityPercentage >= 100) {
            viabilityStatus = 'VIABLE';
            statusColor = 'text-green-600';
            recommendation = 'Tienes suficiente capital para realizar esta inversión. Puedes proceder con la compra.';
        } else if (viabilityPercentage >= 80) {
            viabilityStatus = 'CASI VIABLE';
            statusColor = 'text-yellow-600';
            recommendation = `Te faltan ${this.formatCOP(capitalGap)} para alcanzar tu objetivo. Considera ajustar tus expectativas o buscar financiamiento adicional.`;
        } else if (viabilityPercentage >= 50) {
            viabilityStatus = 'PARCIALMENTE VIABLE';
            statusColor = 'text-orange-600';
            recommendation = `Te faltan ${this.formatCOP(capitalGap)} para alcanzar tu objetivo. Considera reducir el cashflow objetivo o aumentar tu capital disponible.`;
        } else {
            viabilityStatus = 'NO VIABLE';
            statusColor = 'text-red-600';
            recommendation = `Te faltan ${this.formatCOP(capitalGap)} para alcanzar tu objetivo. Necesitas aumentar significativamente tu capital o reducir tus expectativas de cashflow.`;
        }

        return {
            viabilityStatus,
            statusColor,
            recommendation,
            viabilityPercentage,
            capitalGap: Math.max(0, capitalGap)
        };
    }

    formatCOP(amount) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    generateAlternativeScenarios(baseInputs, availableCapital) {
        const scenarios = [];

        // Scenario 1: Reduce target cashflow by 25%
        const scenario1 = { ...baseInputs };
        scenario1.targetMonthlyCashflow = baseInputs.targetMonthlyCashflow * 0.75;
        const result1 = this.calculateRequiredCapital(scenario1);
        const analysis1 = this.analyzeViability(result1.totalRequiredCapital, availableCapital);
        scenarios.push({
            name: 'Reducir Cashflow Objetivo 25%',
            inputs: scenario1,
            result: result1,
            analysis: analysis1
        });

        // Scenario 2: Increase down payment to 40%
        const scenario2 = { ...baseInputs };
        scenario2.downPaymentPercent = 40;
        const result2 = this.calculateRequiredCapital(scenario2);
        const analysis2 = this.analyzeViability(result2.totalRequiredCapital, availableCapital);
        scenarios.push({
            name: 'Aumentar Cuota Inicial a 40%',
            inputs: scenario2,
            result: result2,
            analysis: analysis2
        });

        // Scenario 3: Increase rental yield expectation
        const scenario3 = { ...baseInputs };
        scenario3.expectedRentalYield = baseInputs.expectedRentalYield + 1;
        const result3 = this.calculateRequiredCapital(scenario3);
        const analysis3 = this.analyzeViability(result3.totalRequiredCapital, availableCapital);
        scenarios.push({
            name: `Aumentar Rentabilidad a ${scenario3.expectedRentalYield}%`,
            inputs: scenario3,
            result: result3,
            analysis: analysis3
        });

        return scenarios;
    }

    // Manual calculation example to understand the logic
    showManualCalculationExample() {
        console.log('=== EJEMPLO DE CÁLCULO MANUAL ===');

        // Example values
        const targetMonthlyCashflow = 2000000; // COP
        const targetAnnualCashflow = targetMonthlyCashflow * 12; // 24,000,000 COP
        const rentalYield = 7; // %
        const loanTermYears = 30; // años (más realista para buy-to-rent)
        const interestRate = 12; // % EA
        const downPaymentPercent = 30; // %

        console.log(`1. Objetivo: ${this.formatCOP(targetMonthlyCashflow)} mensuales = ${this.formatCOP(targetAnnualCashflow)} anuales`);
        console.log(`2. Parámetros: Rentabilidad ${rentalYield}%, Crédito ${loanTermYears} años al ${interestRate}%, Cuota inicial ${downPaymentPercent}%`);
        console.log('');

        // Let's try with a property value and see what cashflow we get
        const examplePropertyValue = 500000000; // 500M COP
        console.log(`3. Ejemplo con propiedad de ${this.formatCOP(examplePropertyValue)}:`);

        // Calculate rent
        const annualRent = examplePropertyValue * (rentalYield / 100);
        const monthlyRent = annualRent / 12;
        console.log(`   - Renta anual (${rentalYield}%): ${this.formatCOP(annualRent)}`);
        console.log(`   - Renta mensual: ${this.formatCOP(monthlyRent)}`);

        // Calculate expenses (using default percentages)
        const propertyTax = examplePropertyValue * 0.005; // 0.5%
        const maintenance = examplePropertyValue * 0.01; // 1%
        const insurance = examplePropertyValue * 0.003; // 0.3%
        const adminFee = annualRent * 0.005; // 0.5% of rent
        const totalExpenses = propertyTax + maintenance + insurance + adminFee;
        console.log(`   - Gastos anuales: ${this.formatCOP(totalExpenses)}`);
        console.log(`     * Predial (0.5%): ${this.formatCOP(propertyTax)}`);
        console.log(`     * Mantenimiento (1%): ${this.formatCOP(maintenance)}`);
        console.log(`     * Seguro (0.3%): ${this.formatCOP(insurance)}`);
        console.log(`     * Administración (0.5% renta): ${this.formatCOP(adminFee)}`);

        // Calculate financing
        const notaryFees = examplePropertyValue * 0.025; // 2.5%
        const totalValueWithNotary = examplePropertyValue + notaryFees;
        const downPayment = totalValueWithNotary * (downPaymentPercent / 100);
        const loanAmount = totalValueWithNotary - downPayment;
        console.log(`   - Valor total con notaría: ${this.formatCOP(totalValueWithNotary)}`);
        console.log(`   - Cuota inicial (${downPaymentPercent}%): ${this.formatCOP(downPayment)}`);
        console.log(`   - Monto del crédito: ${this.formatCOP(loanAmount)}`);

        // Calculate mortgage payment
        const annualMortgagePayment = calculateAnnualMortgagePayment(loanAmount, interestRate / 100, loanTermYears);
        const monthlyMortgagePayment = annualMortgagePayment / 12;
        console.log(`   - Pago hipoteca anual (${loanTermYears} años al ${interestRate}%): ${this.formatCOP(annualMortgagePayment)}`);
        console.log(`   - Pago hipoteca mensual: ${this.formatCOP(monthlyMortgagePayment)}`);

        // Calculate net cashflow
        const netAnnualCashflow = annualRent - totalExpenses - annualMortgagePayment;
        const netMonthlyCashflow = netAnnualCashflow / 12;
        console.log(`   - Cashflow neto anual: ${this.formatCOP(netAnnualCashflow)}`);
        console.log(`   - Cashflow neto mensual: ${this.formatCOP(netMonthlyCashflow)}`);

        console.log('');
        console.log('4. ANÁLISIS:');
        if (netMonthlyCashflow < targetMonthlyCashflow) {
            const deficit = targetMonthlyCashflow - netMonthlyCashflow;
            console.log(`   ❌ DÉFICIT: Faltan ${this.formatCOP(deficit)} mensuales`);
            console.log(`   📈 Necesitas una propiedad MÁS CARA para generar más renta`);

            // Show what happens with 10-year loan for comparison
            const annualMortgagePayment10 = calculateAnnualMortgagePayment(loanAmount, interestRate / 100, 10);
            const netCashflow10 = annualRent - totalExpenses - annualMortgagePayment10;
            console.log(`   ⚠️  Con crédito a 10 años: Pago anual ${this.formatCOP(annualMortgagePayment10)}`);
            console.log(`   ⚠️  Cashflow neto mensual sería: ${this.formatCOP(netCashflow10 / 12)}`);
        } else {
            const surplus = netMonthlyCashflow - targetMonthlyCashflow;
            console.log(`   ✅ SUPERÁVIT: Sobran ${this.formatCOP(surplus)} mensuales`);
            console.log(`   📉 Podrías comprar una propiedad MÁS BARATA`);
        }

        console.log('');
        console.log('5. CONCLUSIÓN:');
        console.log(`   Con ${loanTermYears} años de plazo, los pagos hipotecarios son más manejables`);
        console.log(`   Esto permite usar propiedades de valor más razonable`);
        console.log(`   El plazo del crédito es CLAVE para la viabilidad del buy-to-rent`);
        console.log('================================');
    }
}
