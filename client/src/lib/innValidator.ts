function weightedSum(digits: number[], weights: number[]): number {
  return weights.reduce((sum, weight, i) => sum + weight * digits[i], 0);
}

export function isValidInn(rawInn: string): boolean {
  if (!/^\d{10}$|^\d{12}$/.test(rawInn)) return false;

  const digits = rawInn.split("").map(Number);

  if (digits.length === 10) {
    const checkDigit = (weightedSum(digits, [2, 4, 10, 3, 5, 9, 4, 6, 8]) % 11) % 10;
    return checkDigit === digits[9];
  }

  const n11 = (weightedSum(digits, [7, 2, 4, 10, 3, 5, 9, 4, 6, 8]) % 11) % 10;
  const n12 = (weightedSum(digits, [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]) % 11) % 10;
  return n11 === digits[10] && n12 === digits[11];
}

export function expectedInnLength(nodeId: string): 10 | 12 {
  return nodeId === "llc_inn" ? 10 : 12;
}