/**
 * Test básico de ejemplo para verificar que el setup funciona
 */
import { describe, it, expect } from 'vitest';

describe('Test Setup Verification', () => {
  it('should run basic math operations', () => {
    expect(1 + 1).toBe(2);
    expect(2 * 3).toBe(6);
  });

  it('should handle strings', () => {
    expect('hello').toBe('hello');
    expect('test'.length).toBe(4);
  });

  it('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr).toContain(2);
  });

  it('should handle objects', () => {
    const obj = { name: 'test', value: 123 };
    expect(obj.name).toBe('test');
    expect(obj.value).toBe(123);
  });
});



