import { describe, it, expect } from 'vitest';

/**
 * Função utilitária simulada do sistema (normalmente ficaria em utils/format.ts)
 */
function formatPhoneNumber(number: string): string {
  const cleanNumber = number.replace(/\D/g, '');
  if (cleanNumber.length < 10) return '';
  if (!cleanNumber.startsWith('55') && cleanNumber.length <= 11) {
    return '55' + cleanNumber;
  }
  return cleanNumber;
}

function parseJid(contactId: string, number: string): string {
  if (contactId.includes('@')) return contactId;
  if (number && /^\d+$/.test(number)) {
     return number + '@s.whatsapp.net';
  }
  return contactId + '@s.whatsapp.net';
}

describe('Testes de QA: Edge Cases e Tratamento de Exceções', () => {

  it('deve formatar corretamente números sem o DDI brasileiro', () => {
    expect(formatPhoneNumber('11987654321')).toBe('5511987654321');
  });

  it('deve remover caracteres especiais do número', () => {
    expect(formatPhoneNumber('+55 (11) 98765-4321')).toBe('5511987654321');
  });

  it('deve ignorar formatação para números corrompidos ou muito curtos', () => {
    expect(formatPhoneNumber('12345')).toBe('');
  });

  it('deve converter corretamente os contatos importados para JID do WhatsApp', () => {
    expect(parseJid('5511987654321', '5511987654321')).toBe('5511987654321@s.whatsapp.net');
  });

  it('deve respeitar JIDs que já possuem o domínio @s.whatsapp.net', () => {
    expect(parseJid('5511987654321@s.whatsapp.net', '5511987654321')).toBe('5511987654321@s.whatsapp.net');
  });

});
