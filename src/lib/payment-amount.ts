const NO_DECIMAL_CURRENCIES = ['COP', 'CLP', 'ARS'];

/** Monto para Card Payment Brick (unidad principal de la moneda). */
export function toBrickAmount(amount: number, currency: string): number {
  return NO_DECIMAL_CURRENCIES.includes(currency.toUpperCase())
    ? Math.round(amount)
    : Math.round(amount * 100) / 100;
}
