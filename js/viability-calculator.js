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
            adminFeePercent: 0.5, // % of monthly rent - specific to viability analysis
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
            adminFeePercent
        } = inputs;

        // Convert percentages to decimals
        const rentalYieldDecimal = expectedRentalYield / 100;
        const interestRateDecimal = interestRate / 100;
        const downPaymentDecimal = downPaymentPercent / 100;
        const notaryFeesDecimal = notaryFeesPercent / 100;
        const propertyTaxDecimal = propertyTaxPercent / 100;
        const maintenanceDecimal = maintenancePercent / 100;
        const insuranceDecimal = insurancePercent / 100;
        const adminFeeDecimal = adminFeePercent / 100;

        // Target annual cashflow
        const targetAnnualCashflow = targetMonthlyCashflow * 12;

        // We need to solve for property value iteratively
        // Starting with an estimate based on rental yield
        let propertyValue = targetAnnualCashflow / (rentalYieldDecimal * 0.5); // Conservative estimate
        let iterations = 0;
        const maxIterations = 100;
        const tolerance = 1000; // COP tolerance

        // Debug: Log initial estimate
        console.log('=== CÁLCULO DE VIABILIDAD - DEBUG ===');
        console.log(`Cashflow objetivo mensual: ${this.formatCOP(targetMonthlyCashflow)}`);
        console.log(`Cashflow objetivo anual: ${this.formatCOP(targetAnnualCashflow)}`);
        console.log(`Rentabilidad esperada: ${expectedRentalYield}%`);
        console.log(`Estimación inicial de valor de propiedad: ${this.formatCOP(propertyValue)}`);
        console.log('');

        while (iterations < maxIterations) {
            const result = this.calculateCashflowForPropertyValue(propertyValue, {
                interestRateDecimal,
                loanTermYears,
                downPaymentDecimal,
                notaryFeesDecimal,
                propertyTaxDecimal,
                maintenanceDecimal,
                insuranceDecimal,
                adminFeeDecimal,
                rentalYieldDecimal
            });

            const cashflowDifference = result.netAnnualCashflow - targetAnnualCashflow;

            // Debug: Log iteration details
            if (iterations < 5 || iterations % 10 === 0) {
                console.log(`--- Iteración ${iterations + 1} ---`);
                console.log(`Valor propiedad: ${this.formatCOP(propertyValue)}`);
                console.log(`Renta anual calculada: ${this.formatCOP(result.annualRent)}`);
                console.log(`Gastos anuales totales: ${this.formatCOP(result.totalAnnualExpenses)}`);
                console.log(`Pago hipoteca anual: ${this.formatCOP(result.annualMortgagePayment)}`);
                console.log(`Cashflow neto anual: ${this.formatCOP(result.netAnnualCashflow)}`);
                console.log(`Diferencia con objetivo: ${this.formatCOP(cashflowDifference)}`);
                console.log(`Capital requerido: ${this.formatCOP(result.requiredDownPayment)}`);
                console.log('');
            }

            if (Math.abs(cashflowDifference) < tolerance) {
                console.log(`Convergencia alcanzada en ${iterations + 1} iteraciones`);
                break;
            }

            // Adjust property value based on cashflow difference
            const adjustmentFactor = 1 + (cashflowDifference / targetAnnualCashflow) * 0.1;
            propertyValue = propertyValue / adjustmentFactor;

            iterations++;
        }

        // Calculate final metrics
        const finalResult = this.calculateCashflowForPropertyValue(propertyValue, {
            interestRateDecimal,
            loanTermYears,
            downPaymentDecimal,
            notaryFeesDecimal,
            propertyTaxDecimal,
            maintenanceDecimal,
            insuranceDecimal,
            adminFeeDecimal,
            rentalYieldDecimal
        });

        console.log('=== RESULTADO FINAL ===');
        console.log(`Valor de propiedad necesario: ${this.formatCOP(propertyValue)}`);
        console.log(`Capital total requerido: ${this.formatCOP(finalResult.requiredDownPayment)}`);
        console.log(`Renta mensual: ${this.formatCOP(finalResult.monthlyRent)}`);
        console.log(`Cashflow neto mensual: ${this.formatCOP(finalResult.netAnnualCashflow / 12)}`);
        console.log('========================');

        return {
            requiredPropertyValue: propertyValue,
            totalValueWithNotary: finalResult.totalValueWithNotary,
            requiredDownPayment: finalResult.requiredDownPayment,
            loanAmount: finalResult.loanAmount,
            monthlyRent: finalResult.monthlyRent,
            annualRent: finalResult.annualRent,
            totalAnnualExpenses: finalResult.totalAnnualExpenses,
            annualMortgagePayment: finalResult.annualMortgagePayment,
            netAnnualCashflow: finalResult.netAnnualCashflow,
            netMonthlyCashflow: finalResult.netAnnualCashflow / 12,
            totalRequiredCapital: finalResult.requiredDownPayment,
            iterations: iterations
        };
    }

    calculateCashflowForPropertyValue(propertyValue, params) {
        const {
            interestRateDecimal,
            loanTermYears,
            downPaymentDecimal,
            notaryFeesDecimal,
            propertyTaxDecimal,
            maintenanceDecimal,
            insuranceDecimal,
            adminFeeDecimal,
            rentalYieldDecimal
        } = params;

        // Calculate costs and financing
        const notaryFees = propertyValue * notaryFeesDecimal;
        const totalValueWithNotary = propertyValue + notaryFees;
        const requiredDownPayment = totalValueWithNotary * downPaymentDecimal;
        const loanAmount = totalValueWithNotary - requiredDownPayment;

        // Calculate annual rent based on rental yield
        const annualRent = propertyValue * rentalYieldDecimal;
        const monthlyRent = annualRent / 12;

        // Calculate annual expenses
        const propertyTax = propertyValue * propertyTaxDecimal;
        const maintenance = propertyValue * maintenanceDecimal;
        const insurance = propertyValue * insuranceDecimal;
        const adminFee = annualRent * adminFeeDecimal;
        const totalAnnualExpenses = propertyTax + maintenance + insurance + adminFee;

        // Calculate mortgage payment
        const annualMortgagePayment = calculateAnnualMortgagePayment(loanAmount, interestRateDecimal, loanTermYears);

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
