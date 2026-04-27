import { describe, expect, test, jest } from '@jest/globals';
import { api } from '@/lib/api';

// Mock fetch
global.fetch = jest.fn() as jest.Mock;

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET request calls correct URL', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: 'test' }),
    });

    await api.get('/test');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
      })
    );
  });

  test('POST request sends JSON body', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: 'test' }),
    });

    await api.post('/test', { key: 'value' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ key: 'value' }),
      })
    );
  });

  test('throws error on non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Bad request' }),
    });

    await expect(api.get('/test')).rejects.toThrow();
  });
});
