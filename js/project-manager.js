import { copFormatter, percentFormatter, calculateAnnualMortgagePayment } from './utils.js';

export class ProjectManager {
    constructor(projectId, elements) {
        this.projectId = projectId;
        this.elements = elements;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const inputs = [
            this.elements.baseValueInput,
            this.elements.downPaymentPercentInput,
            this.elements.creditRateInput
        ];

        inputs.forEach(input => {
            input.addEventListener('input', () => this.updateFinancingCalculations());
        });
    }

    updateFinancingCalculations(loanTermYears, notaryFeesPercent) {
        const baseValue = parseFloat(this.elements.baseValueInput.value);
        const downPaymentPercent = parseFloat(this.elements.downPaymentPercentInput.value) / 100;
        const creditRate = parseFloat(this.elements.creditRateInput.value) / 100;
        const notaryFeesPercentValue = notaryFeesPercent / 100;

        let calculatedNotaryAmount = 0;
        let calculatedTotalValueWithNotary = 0;
        let calculatedInitialUserEquity = 0;
        let calculatedLoanAmount = 0;
        let calculatedTotalInterest = 0;

        const defaultText = '-';

        if (isNaN(baseValue) || baseValue <= 0 || !isFinite(baseValue) ||
            isNaN(notaryFeesPercentValue) || notaryFeesPercentValue < 0) {

            this.updateDisplays(defaultText);
        } else {
            calculatedNotaryAmount = baseValue * notaryFeesPercentValue;
            calculatedTotalValueWithNotary = baseValue + calculatedNotaryAmount;

            this.elements.notaryAmountDisplay.textContent = copFormatter.format(calculatedNotaryAmount);
            this.elements.totalValueWithNotaryDisplay.textContent = copFormatter.format(calculatedTotalValueWithNotary);

            if (!isNaN(downPaymentPercent) && downPaymentPercent >= 0 && downPaymentPercent <= 1 &&
                !isNaN(creditRate) && creditRate >= 0 &&
                !isNaN(loanTermYears) && loanTermYears >= 0) {

                calculatedInitialUserEquity = downPaymentPercent === 0 ? 0 : calculatedTotalValueWithNotary * downPaymentPercent;
                calculatedLoanAmount = calculatedTotalValueWithNotary - calculatedInitialUserEquity;

                this.elements.downPaymentAmountDisplay.textContent = copFormatter.format(calculatedInitialUserEquity);
                this.elements.loanAmountDisplay.textContent = copFormatter.format(calculatedLoanAmount);

                if (calculatedLoanAmount > 0 && loanTermYears > 0) {
                    const annualPayment = calculateAnnualMortgagePayment(calculatedLoanAmount, creditRate, loanTermYears);
                    calculatedTotalInterest = (annualPayment * loanTermYears) - calculatedLoanAmount;
                    if (this.elements.totalInterestDisplay) {
                        this.elements.totalInterestDisplay.textContent = copFormatter.format(calculatedTotalInterest > 0 ? calculatedTotalInterest : 0);
                    }
                } else {
                    if (this.elements.totalInterestDisplay) {
                        this.elements.totalInterestDisplay.textContent = copFormatter.format(0);
                    }
                }
            } else {
                this.updateLoanDisplays(defaultText);
            }
        }

        return {
            notaryAmount: calculatedNotaryAmount,
            totalValueWithNotary: calculatedTotalValueWithNotary,
            initialUserEquity: calculatedInitialUserEquity,
            loanAmount: calculatedLoanAmount,
            totalInterest: calculatedTotalInterest
        };
    }

    updateDisplays(defaultText) {
        this.elements.notaryAmountDisplay.textContent = defaultText;
        this.elements.totalValueWithNotaryDisplay.textContent = defaultText;
        this.updateLoanDisplays(defaultText);
    }

    updateLoanDisplays(defaultText) {
        this.elements.downPaymentAmountDisplay.textContent = defaultText;
        this.elements.loanAmountDisplay.textContent = defaultText;
        if (this.elements.totalInterestDisplay) {
            this.elements.totalInterestDisplay.textContent = defaultText;
        }
    }

    getInputData(financingData) {
        return {
            baseValue: parseFloat(this.elements.baseValueInput.value),
            initialMonthlyRent: parseFloat(this.elements.initialMonthlyRentInput.value),
            propertyTaxPercent: parseFloat(this.elements.propertyTaxPercentInput.value) / 100,
            maintenancePercent: parseFloat(this.elements.maintenancePercentInput.value) / 100,
            insurancePercent: parseFloat(this.elements.insurancePercentInput.value) / 100,
            adminFeeMonthly: parseFloat(this.elements.adminFeeMonthlyInput.value),
            downPaymentPercent: parseFloat(this.elements.downPaymentPercentInput.value) / 100,
            creditRate: parseFloat(this.elements.creditRateInput.value) / 100,
            notaryAmount: financingData.notaryAmount,
            totalValueWithNotary: financingData.totalValueWithNotary,
            initialUserEquity: financingData.initialUserEquity,
            loanAmount: financingData.loanAmount,
            totalInterestPaid: financingData.totalInterest
        };
    }

    setValuesFromConfig(config) {
        this.elements.baseValueInput.value = config.baseValue;
        this.elements.initialMonthlyRentInput.value = config.initialMonthlyRent;
        this.elements.propertyTaxPercentInput.value = config.propertyTaxPercent;
        this.elements.maintenancePercentInput.value = config.maintenancePercent;
        this.elements.insurancePercentInput.value = config.insurancePercent;
        this.elements.adminFeeMonthlyInput.value = config.adminFeeMonthly;
        this.elements.downPaymentPercentInput.value = config.downPaymentPercent;
        this.elements.creditRateInput.value = config.creditRate;
    }
}
