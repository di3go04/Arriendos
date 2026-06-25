import { formatCOP,formatCurrency,formatDate } from '@/lib/format';

describe('formatCOP', () => {
  it('formats COP currency', () => {
    const result = formatCOP(1500000);
    expect(result).toContain('1.500.000');
  });

  it('handles zero', () => {
    expect(formatCOP(0)).toContain('0');
  });
});

describe('formatCurrency', () => {
  it('defaults to USD', () => {
    const result = formatCurrency(100);
    expect(result).toContain('100');
  });

  it('accepts custom currency', () => {
    const result = formatCurrency(50, 'EUR', 'es-ES');
    expect(result).toContain('50');
  });
});

describe('formatDate', () => {
  it('returns — for null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('formats valid date', () => {
    const result = formatDate('2024-06-15');
    expect(result).toContain('junio');
    expect(result).toContain('2024');
  });
});
