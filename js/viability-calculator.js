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
            loanTermYears: generalConfig.loanTermYears || 10,
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
            adminFeePercent,
            inflationRate
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

            if (Math.abs(cashflowDifference) < tolerance) {
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
}
