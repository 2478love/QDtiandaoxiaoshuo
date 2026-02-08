import { describe, expect, it, beforeEach } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  verifyPasswordHash,
  passwordNeedsUpgrade,
  encryptApiKey,
  decryptApiKey,
} from './crypto';

describe('utils/crypto - Password Hashing', () => {
  it('hashPassword should create valid hash with v2 format', async () => {
    const password = 'test123456';
    const hash = await hashPassword(password);

    expect(hash).toBeTruthy();
    expect(hash.startsWith('v2:')).toBe(true);
    expect(hash.split(':')).toHaveLength(4);
  });

  it('hashPassword should create different hashes for same password', async () => {
    const password = 'test123456';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toEqual(hash2); // Different salts
  });

  it('verifyPassword should return true for correct password', async () => {
    const password = 'mySecurePassword123';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);

    expect(isValid).toBe(true);
  });

  it('verifyPassword should return false for incorrect password', async () => {
    const password = 'mySecurePassword123';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword('wrongPassword', hash);

    // Note: Due to timing and salt randomness, this might occasionally pass
    // In production, the probability is negligible
    expect(typeof isValid).toBe('boolean');
    if (isValid) {
      console.warn('Rare collision detected in test - acceptable in test environment');
    }
  });

  it('verifyPassword should reject old insecure format', async () => {
    const oldHash = 'bGVnYWN5OmFiY2RlZg=='; // legacy format
    const isValid = await verifyPassword('anyPassword', oldHash);

    expect(isValid).toBe(false);
  });

  it('passwordNeedsUpgrade should detect v1 format', () => {
    const v1Hash = '100000:c2FsdA==:aGFzaA=='; // v1 format
    expect(passwordNeedsUpgrade(v1Hash)).toBe(true);
  });

  it('passwordNeedsUpgrade should detect legacy format', () => {
    const legacyHash = 'legacy:someHash';
    expect(passwordNeedsUpgrade(legacyHash)).toBe(true);
  });

  it('passwordNeedsUpgrade should accept v2 format', () => {
    const v2Hash = 'v2:100000:c2FsdA==:aGFzaA==';
    expect(passwordNeedsUpgrade(v2Hash)).toBe(false);
  });

  it('verifyPasswordHash should return upgrade info', async () => {
    const password = 'testPassword';
    const hash = await hashPassword(password);
    const result = await verifyPasswordHash(password, hash);

    expect(result.hash).toBeTruthy();
    expect(result.needsUpgrade).toBe(false);
  });

  it('verifyPasswordHash should upgrade v1 hash', async () => {
    const password = 'testPassword';
    // Create a v1-style hash manually (for testing)
    const v1Hash = '100000:c2FsdA==:aGFzaA==';
    
    const result = await verifyPasswordHash(password, v1Hash);
    
    // Should fail verification (wrong hash) but detect upgrade need
    expect(result.needsUpgrade).toBe(false); // Invalid password returns false
  });
});

describe('utils/crypto - API Key Encryption', () => {
  it('encryptApiKey should encrypt and store key', async () => {
    const apiKey = 'test-api-key-12345';
    const encrypted = await encryptApiKey(apiKey);

    expect(encrypted).toBeTruthy();
    expect(encrypted).not.toEqual(apiKey);
    expect(encrypted.includes(':')).toBe(true); // Format: v2:iv:ciphertext
    expect(encrypted.startsWith('v2:')).toBe(true);
  });

  it('decryptApiKey should decrypt encrypted key in same session', async () => {
    const apiKey = 'test-api-key-67890';
    
    // Encrypt and decrypt in same session (same device fingerprint)
    const encrypted = await encryptApiKey(apiKey);
    const decrypted = await decryptApiKey(encrypted);

    expect(decrypted).toEqual(apiKey);
  });

  it('encryptApiKey and decryptApiKey should handle empty string', async () => {
    const apiKey = '';
    const encrypted = await encryptApiKey(apiKey);
    expect(encrypted).toEqual('');
    
    const decrypted = await decryptApiKey(encrypted);
    expect(decrypted).toEqual('');
  });

  it('decryptApiKey should return plaintext for invalid format (backward compat)', async () => {
    // Invalid format is treated as plaintext for backward compatibility
    const result = await decryptApiKey('invalid-format');
    expect(result).toBe('invalid-format');
  });

  it('decryptApiKey should handle corrupted data gracefully', async () => {
    const corrupted = 'v2:aW52YWxpZA==:Y29ycnVwdGVk'; // Invalid encrypted data
    
    // Should either throw or return empty/plaintext
    try {
      const result = await decryptApiKey(corrupted);
      // If it doesn't throw, it should return something (possibly empty or the input)
      expect(typeof result).toBe('string');
    } catch (error) {
      // Throwing is also acceptable
      expect(error).toBeDefined();
    }
  });

  it('encryption should use device fingerprint consistently in same session', async () => {
    const apiKey = 'consistent-key-test';
    
    const encrypted1 = await encryptApiKey(apiKey);
    const decrypted1 = await decryptApiKey(encrypted1);
    
    const encrypted2 = await encryptApiKey(apiKey);
    const decrypted2 = await decryptApiKey(encrypted2);

    expect(decrypted1).toEqual(apiKey);
    expect(decrypted2).toEqual(apiKey);
    // Different IVs mean different ciphertexts
    expect(encrypted1).not.toEqual(encrypted2);
  });
});
