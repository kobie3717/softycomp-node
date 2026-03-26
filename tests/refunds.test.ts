import { SoftyComp } from '../src/index';

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('Refund Operations', () => {
  const mockAuth = () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'test-token',
        expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      }),
    });
  };

  it('should process full refund with valid params', async () => {
    const client = new SoftyComp({
      apiKey: 'test-key',
      secretKey: 'test-secret',
      sandbox: true,
    });

    mockAuth();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({
        success: true,
        reference: 'REFUND-123',
        message: 'Refund processed',
      }),
    });

    const result = await client.refund({
      transactionId: 'TXN-123',
    });

    expect(result.refundId).toBeTruthy();
    expect(result.status).toBe('completed');
  });

  it('should process partial refund with valid params', async () => {
    const client = new SoftyComp({
      apiKey: 'test-key',
      secretKey: 'test-secret',
      sandbox: true,
    });

    mockAuth();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({
        success: true,
        reference: 'REFUND-456',
        message: 'Partial refund processed',
      }),
    });

    const result = await client.refund({
      transactionId: 'TXN-456',
      amount: 100.00,
    });

    expect(result.refundId).toBeTruthy();
    expect(result.status).toBe('completed');
    expect(result.amount).toBe(100.00);
  });

  it('should reject negative refund amount', async () => {
    const client = new SoftyComp({
      apiKey: 'test-key',
      secretKey: 'test-secret',
      sandbox: true,
    });

    mockAuth();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'Invalid amount',
    });

    await expect(
      client.refund({
        transactionId: 'TXN-789',
        amount: -50.00,
      })
    ).rejects.toThrow();
  });

  it('should reject NaN refund amount', async () => {
    const client = new SoftyComp({
      apiKey: 'test-key',
      secretKey: 'test-secret',
      sandbox: true,
    });

    mockAuth();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'Invalid amount',
    });

    await expect(
      client.refund({
        transactionId: 'TXN-NAN',
        amount: NaN,
      })
    ).rejects.toThrow();
  });

  it('should reject Infinity refund amount', async () => {
    const client = new SoftyComp({
      apiKey: 'test-key',
      secretKey: 'test-secret',
      sandbox: true,
    });

    mockAuth();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'Invalid amount',
    });

    await expect(
      client.refund({
        transactionId: 'TXN-INF',
        amount: Infinity,
      })
    ).rejects.toThrow();
  });

  it('should accept zero refund amount', async () => {
    const client = new SoftyComp({
      apiKey: 'test-key',
      secretKey: 'test-secret',
      sandbox: true,
    });

    mockAuth();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({
        success: true,
        reference: 'REFUND-ZERO',
        message: 'Zero refund processed',
      }),
    });

    const result = await client.refund({
      transactionId: 'TXN-ZERO',
      amount: 0,
    });

    expect(result.refundId).toBeTruthy();
    expect(result.amount).toBe(0);
  });

  it('should handle failed refund', async () => {
    const client = new SoftyComp({
      apiKey: 'test-key',
      secretKey: 'test-secret',
      sandbox: true,
    });

    mockAuth();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({
        success: false,
        message: 'Transaction not found',
      }),
    });

    const result = await client.refund({
      transactionId: 'TXN-NOTFOUND',
      amount: 50.00,
    });

    expect(result.status).toBe('pending');
    expect(result.amount).toBe(50.00);
  });
});
