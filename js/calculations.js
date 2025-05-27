import { calculateAnnualMortgagePayment, calculateRemainingLoanBalance } from './utils.js';

export function calculatePropertyMetrics(propertyInputData, generalInputs, valuationRate) {
    const baseValue = propertyInputData.baseValue;
    const initialUserEquity = propertyInputData.initialUserEquity;
    const loanAmount = propertyInputData.loanAmount;
    const creditRate = propertyInputData.creditRate;
    const initialMonthlyRent = propertyInputData.initialMonthlyRent;

    const propertyTaxPercent = propertyInputData.propertyTaxPercent;
    const maintenancePercent = propertyInputData.maintenancePercent;
    const insurancePercent = propertyInputData.insurancePercent;
    const initialAdminFeeAnnual = propertyInputData.adminFeeMonthly * 12;

    const investmentHorizonYears = generalInputs.investmentYears;
    const loanTermYears = generalInputs.loanTermYears;
    const inflationRate = generalInputs.inflationRate;

    const annualMortgagePayment = calculateAnnualMortgagePayment(loanAmount, creditRate, loanTermYears);

    let accumulatedCashFlow = 0;
    for (let year = 1; year <= investmentHorizonYears; year++) {
        const currentAnnualRent = (initialMonthlyRent * 12) * Math.pow(1 + inflationRate, year - 1);

        const currentPropertyValueBase = baseValue * Math.pow(1 + valuationRate, year - 1);
        const currentPropertyTax = currentPropertyValueBase * propertyTaxPercent;
        const currentMaintenance = currentPropertyValueBase * maintenancePercent;
        const currentInsurance = currentPropertyValueBase * insurancePercent;
        const currentAdminFee = initialAdminFeeAnnual * Math.pow(1 + inflationRate, year - 1);

        const totalAnnualExpenses = currentPropertyTax + currentMaintenance + currentInsurance + currentAdminFee;

        const currentYearMortgagePayment = (year <= loanTermYears && loanAmount > 0) ? annualMortgagePayment : 0;

        const cashFlowThisYear = currentAnnualRent - totalAnnualExpenses - currentYearMortgagePayment;
        accumulatedCashFlow += cashFlowThisYear;
    }

    const futureBasePropertyValue = baseValue * Math.pow(1 + valuationRate, investmentHorizonYears);
    const remainingLoanBalance = calculateRemainingLoanBalance(loanAmount, creditRate, loanTermYears, investmentHorizonYears, annualMortgagePayment);

    const finalEquityInProperty = futureBasePropertyValue - remainingLoanBalance;
    const totalUserValue = finalEquityInProperty + accumulatedCashFlow;

    let roi = 0;
    let cagr = 0;

    if (initialUserEquity > 0) {
        roi = (totalUserValue - initialUserEquity) / initialUserEquity;
        if (investmentHorizonYears > 0) {
            if (totalUserValue >= 0) {
                cagr = Math.pow(totalUserValue / initialUserEquity, 1 / investmentHorizonYears) - 1;
            } else {
                cagr = -1;
            }
        } else {
            cagr = (totalUserValue / initialUserEquity) - 1;
            if (!isFinite(cagr)) cagr = 0;
        }
    } else if (initialUserEquity === 0) {
        if (totalUserValue > 0) {
            roi = Infinity;
            cagr = Infinity;
        } else if (totalUserValue < 0) {
            roi = -Infinity;
            cagr = -Infinity;
        } else {
            roi = 0;
            cagr = 0;
        }
    }

    const totalInterestOverLoanTerm = (annualMortgagePayment * loanTermYears) - loanAmount;

    return {
        futureBasePropertyValue,
        accumulatedCashFlow,
        finalEquityInProperty,
        totalUserValue,
        roi,
        cagr,
        initialUserEquity,
        annualMortgagePayment,
        totalInterestPaid: totalInterestOverLoanTerm > 0 ? totalInterestOverLoanTerm : 0
    };
}

export function getAnnualCashFlowBreakdown(propertyInputData, generalInputs, valuationRateForExpenses) {
    const breakdown = [];
    const baseValue = propertyInputData.baseValue;
    const loanAmount = propertyInputData.loanAmount;
    const creditRate = propertyInputData.creditRate;

    const initialMonthlyRent = propertyInputData.initialMonthlyRent;

    const propertyTaxPercent = propertyInputData.propertyTaxPercent;
    const maintenancePercent = propertyInputData.maintenancePercent;
    const insurancePercent = propertyInputData.insurancePercent;
    const initialAdminFeeAnnual = propertyInputData.adminFeeMonthly * 12;

    const investmentHorizonYears = generalInputs.investmentYears;
    const loanTermYears = generalInputs.loanTermYears;
    const inflationRate = generalInputs.inflationRate;

    const annualMortgagePayment = calculateAnnualMortgagePayment(loanAmount, creditRate, loanTermYears);

    for (let year = 1; year <= investmentHorizonYears; year++) {
        const currentAnnualRentBruto = (initialMonthlyRent * 12) * Math.pow(1 + inflationRate, year - 1);

        const currentPropertyValueBase = baseValue * Math.pow(1 + valuationRateForExpenses, year - 1);
        const currentPropertyTax = currentPropertyValueBase * propertyTaxPercent;
        const currentMaintenance = currentPropertyValueBase * maintenancePercent;
        const currentInsurance = currentPropertyValueBase * insurancePercent;
        const currentAdminFee = initialAdminFeeAnnual * Math.pow(1 + inflationRate, year - 1);

        const gastosVariablesAnuales = currentPropertyTax + currentMaintenance + currentInsurance;
        const gastosFijosAnuales = currentAdminFee;
        const currentYearMortgagePayment = (year <= loanTermYears && loanAmount > 0) ? annualMortgagePayment : 0;

        const cashFlowNetoThisYear = currentAnnualRentBruto - gastosVariablesAnuales - gastosFijosAnuales - currentYearMortgagePayment;
        breakdown.push({
            year: year,
            annualRentBruto: currentAnnualRentBruto,
            gastosVariablesAnuales: gastosVariablesAnuales,
            gastosFijosAnuales: gastosFijosAnuales,
            annualMortgagePayment: currentYearMortgagePayment,
            cashFlowNetoAnual: cashFlowNetoThisYear
        });
    }
    return breakdown;
}
