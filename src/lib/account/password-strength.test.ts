import {describe, expect, it} from 'vitest';
import {passwordStrength} from './password-strength';

describe('passwordStrength', () => {
  it('rates empty, short and common passwords as too weak', () => {
    expect(passwordStrength('').score).toBe(0);
    expect(passwordStrength('Ab1!').score).toBe(0);
    expect(passwordStrength('password123').score).toBe(0);
  });

  it('rises with length and variety', () => {
    const weak = passwordStrength('casting7').score;
    const fair = passwordStrength('Casting2026').score;
    const strong = passwordStrength('Kaatru-Lead#2026!').score;
    expect(weak).toBeLessThan(fair);
    expect(fair).toBeLessThan(strong);
    expect(strong).toBe(4);
    expect(passwordStrength('Kaatru-Lead#2026!').label).toBe('Strong');
  });

  it('penalises repeats and sequences, and gives tips', () => {
    expect(passwordStrength('Aaaa1111bbbb').score).toBeLessThan(passwordStrength('Aq7mPz2xLw9k').score);
    expect(passwordStrength('abcd1234efgh').tips.join(' ')).toMatch(/sequences/);
    expect(passwordStrength('casting7').tips.length).toBeGreaterThan(0);
  });
});
