import { hashContractContent } from '@/modules/e-signature/service';

describe('e-signature', () => {
  it('genera hash SHA-256 estable', () => {
    const h1 = hashContractContent('contrato A');
    const h2 = hashContractContent('contrato A');
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
  });
});
