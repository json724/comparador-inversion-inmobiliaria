// Formatters and utility functions
export const copFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
});

export const percentFormatter = (value, decimals = 2) => {
    if (isNaN(value) || !isFinite(value)) return 'N/A';
    return (value * 100).toFixed(decimals) + '%';
};

export function updateSliderValueDisplay(slider, valueDisplay, decimals, unit = '%') {
    valueDisplay.textContent = parseFloat(slider.value).toFixed(decimals) + unit;
}

export function calculateAnnualMortgagePayment(P, i, N) {
    if (P <= 0) return 0;
    if (N <= 0) return P;
    if (i === 0 && N > 0) return P / N;
    if (i === 0 && N === 0) return P;
    const annualPayment = P * (i * Math.pow(1 + i, N)) / (Math.pow(1 + i, N) - 1);
    return annualPayment;
}

export function calculateRemainingLoanBalance(P, i, N, k, M_annual) {
    if (P <= 0) return 0;
    if (k >= N) return 0;
    if (N <= 0) return P;
    if (i === 0) return Math.max(0, P - (M_annual * k));

    let balance = P * Math.pow(1 + i, k) - M_annual * ((Math.pow(1 + i, k) - 1) / i);
    return Math.max(0, balance);
}

export function calculateLiquidInstrumentValue(principal, rate, years) {
    if (principal === 0) return 0;
    if (!isFinite(principal) || !isFinite(rate) || !isFinite(years)) return NaN;
    if (years < 0) return principal;
    return principal * Math.pow(1 + rate, years);
}
