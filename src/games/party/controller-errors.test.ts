import { describe, expect, it } from 'vitest';
import { CONTROLLER_ERROR_CODES, controllerErrorCode, describeControllerError } from './controller-errors';

const t = (key: string, fallback: string) => `${key}|${fallback}`;

describe('controllerErrorCode', () => {
  it.each(CONTROLLER_ERROR_CODES)('finds %s in a raw RPC message', code => {
    expect(controllerErrorCode(code)).toBe(code);
    expect(controllerErrorCode(`ERROR: ${code} (P0001)`)).toBe(code);
  });

  it('maps legacy prose messages', () => {
    expect(controllerErrorCode('Party membership required')).toBe('removed');
    expect(controllerErrorCode('Party is full')).toBe('party_full');
    expect(controllerErrorCode('Host action required')).toBe('host_required');
    expect(controllerErrorCode('Party has ended')).toBe('ended');
    expect(controllerErrorCode('Party not found')).toBe('not_found');
  });

  it('has a German text for every code', () => {
    for (const code of [...CONTROLLER_ERROR_CODES, 'Party membership required', 'Host action required']) {
      expect(describeControllerError(code, (_k, fallback) => fallback)).not.toBe(code);
    }
  });

  it('ignores unknown or partial words', () => {
    expect(controllerErrorCode('network down')).toBeNull();
    expect(controllerErrorCode('xseat_taken')).toBeNull();
    expect(controllerErrorCode(null)).toBeNull();
  });
});

describe('describeControllerError', () => {
  it('translates known codes with a German default', () => {
    expect(describeControllerError('seat_taken', t)).toMatch(/^partyPlay\.error\.seat_taken\|Diesen Platz/);
    expect(describeControllerError('banned', t)).toContain('nicht mehr beitreten');
    expect(describeControllerError('party_full', t)).toContain('voll');
  });

  it('keeps legacy partyControllers keys and passes unknown text through', () => {
    expect(describeControllerError('partyControllers.notReady', t)).toBe('partyControllers.notReady|partyControllers.notReady');
    expect(describeControllerError('Boom', t)).toBe('Boom');
    expect(describeControllerError(null, t)).toBeNull();
  });
});
