/**
 * Calcul d'un credit amortissable a mensualites constantes.
 * Taux annuel configurable par l'admin (2 % par defaut).
 * Tous les montants sont des entiers en FCFA.
 */
export interface LoanComputation {
  amountFcfa: number;
  durationYears: number;
  annualRatePercent: number;
  numberOfPayments: number;
  monthlyPaymentFcfa: number;
  totalRepayFcfa: number;
  totalInterestFcfa: number;
}

export function computeLoan(
  amountFcfa: number,
  durationYears: number,
  annualRatePercent: number
): LoanComputation {
  const numberOfPayments = durationYears * 12;
  const monthlyRate = annualRatePercent / 100 / 12;

  let monthlyPayment: number;
  if (monthlyRate === 0) {
    monthlyPayment = amountFcfa / numberOfPayments;
  } else {
    const factor = Math.pow(1 + monthlyRate, numberOfPayments);
    monthlyPayment = (amountFcfa * monthlyRate * factor) / (factor - 1);
  }

  // Mensualite arrondie au FCFA superieur pour eviter un reste du en fin de credit.
  const monthlyPaymentFcfa = Math.ceil(monthlyPayment);
  const totalRepayFcfa = monthlyPaymentFcfa * numberOfPayments;

  return {
    amountFcfa,
    durationYears,
    annualRatePercent,
    numberOfPayments,
    monthlyPaymentFcfa,
    totalRepayFcfa,
    totalInterestFcfa: totalRepayFcfa - amountFcfa,
  };
}
