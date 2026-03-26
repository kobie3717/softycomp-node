import { SoftyComp } from '../src/index';

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('Authentication', () => {
  it('should cache token for subsequent calls', async () => {
    const client = new SoftyComp({
      apiKey: 'test-key',
      secretKey: 'test-secret',
      sandbox: true,
    });

    // Mock auth response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'test-token-123',
        expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      }),
    });

    // Mock bill status response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({
        reference: 'BILL-123',
        statusTypeID: 1,
        amount: '100.00',
      }),
    });

    // First call - should authenticate
    await client.getBillStatus('BILL-123');

    // Second call - should use cached token
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({
        reference: 'BILL-456',
        statusTypeID: 1,
        amount: '200.00',
      }),
    });

    await client.getBillStatus('BILL-456');

    // Auth should only be called once
    expect(mockFetch).toHaveBeenCalledTimes(3); // 1 auth + 2 API calls
    expect(mockFetch.mock.calls[0][0]).toContain('/api/auth/generatetoken');
  });

  it('should refresh token when expired', async () => {
    const client = new SoftyComp({
      apiKey: 'test-key',
      secretKey: 'test-secret',
      sandbox: true,
    });

    // Mock first auth with expired token
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'expired-token',
        expiration: new Date(Date.now() - 1000).toISOString(), // Expired
      }),
    });

    // Mock bill status response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({
        reference: 'BILL-123',
        statusTypeID: 1,
        amount: '100.00',
      }),
    });

    await client.getBillStatus('BILL-123');

    // Mock second auth (token refresh)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'new-token',
        expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      }),
    });

    // Mock second bill status response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({
        reference: 'BILL-456',
        statusTypeID: 1,
        amount: '200.00',
      }),
    });

    await client.getBillStatus('BILL-456');

    // Should have authenticated twice
    const authCalls = mockFetch.mock.calls.filter(call => call[0].includes('/api/auth/generatetoken'));
    expect(authCalls.length).toBe(2);
  });

  it('should handle invalid credentials error', async () => {
    const client = new SoftyComp({
      apiKey: 'invalid-key',
      secretKey: 'invalid-secret',
      sandbox: true,
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Invalid credentials',
    });

    await expect(client.getBillStatus('BILL-123')).rejects.toThrow(
      'SoftyComp authentication failed: 401 - Invalid credentials'
    );
  });

  it('should handle authentication timeout', async () => {
    const client = new SoftyComp({
      apiKey: 'test-key',
      secretKey: 'test-secret',
      sandbox: true,
    });

    mockFetch.mockImplementationOnce(() => {
      const error = new Error('Timeout');
      error.name = 'AbortError';
      return Promise.reject(error);
    });

    await expect(client.getBillStatus('BILL-123')).rejects.toThrow(
      'SoftyComp authentication timeout (30s)'
    );
  });
});
