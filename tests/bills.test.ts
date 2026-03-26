import { SoftyComp } from '../src/index';

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('Bill Operations', () => {
  const mockAuth = () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'test-token',
        expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      }),
    });
  };

  it('should create once-off bill with valid params', async () => {
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
        reference: 'BILL-123',
        paymentURL: 'https://pay.softycomp.co.za/xyz',
        message: 'Success',
      }),
    });

    const result = await client.createBill({
      amount: 299.00,
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '0825551234',
      reference: 'INV-001',
      description: 'Test payment',
      frequency: 'once-off',
      returnUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      notifyUrl: 'https://example.com/webhook',
    });

    expect(result.reference).toBe('BILL-123');
    expect(result.paymentUrl).toBe('https://pay.softycomp.co.za/xyz');
    expect(result.expiresAt).toBeTruthy();
  });

  it('should create monthly bill with valid params', async () => {
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
        reference: 'BILL-456',
        paymentURL: 'https://pay.softycomp.co.za/abc',
        message: 'Success',
      }),
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const commencementDate = tomorrow.toISOString().split('T')[0];

    const result = await client.createBill({
      amount: 99.00,
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      customerPhone: '0821234567',
      reference: 'SUB-001',
      description: 'Monthly subscription',
      frequency: 'monthly',
      commencementDate,
      recurringDay: 1,
      returnUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      notifyUrl: 'https://example.com/webhook',
    });

    expect(result.reference).toBe('BILL-456');
    expect(result.paymentUrl).toBe('https://pay.softycomp.co.za/abc');
  });

  it('should reject negative amount', async () => {
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
      client.createBill({
        amount: -100,
        customerName: 'Test',
        customerEmail: 'test@example.com',
        customerPhone: '0821234567',
        reference: 'TEST-001',
        frequency: 'once-off',
        returnUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        notifyUrl: 'https://example.com/webhook',
      })
    ).rejects.toThrow();
  });

  it('should reject NaN amount', async () => {
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
      client.createBill({
        amount: NaN,
        customerName: 'Test',
        customerEmail: 'test@example.com',
        customerPhone: '0821234567',
        reference: 'TEST-001',
        frequency: 'once-off',
        returnUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        notifyUrl: 'https://example.com/webhook',
      })
    ).rejects.toThrow();
  });

  it('should reject Infinity amount', async () => {
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
      client.createBill({
        amount: Infinity,
        customerName: 'Test',
        customerEmail: 'test@example.com',
        customerPhone: '0821234567',
        reference: 'TEST-001',
        frequency: 'once-off',
        returnUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        notifyUrl: 'https://example.com/webhook',
      })
    ).rejects.toThrow();
  });

  it('should getBillStatus and map status correctly', async () => {
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
        reference: 'BILL-123',
        statusTypeID: 2, // Completed
        amount: '299.00',
        transactionDate: '2026-03-26T10:00:00Z',
      }),
    });

    const status = await client.getBillStatus('BILL-123');

    expect(status.reference).toBe('BILL-123');
    expect(status.status).toBe('completed');
    expect(status.amount).toBe(299.00);
    expect(status.paidAt).toBe('2026-03-26T10:00:00Z');
  });

  it('should updateBillPresentment and merge existing bill data', async () => {
    const client = new SoftyComp({
      apiKey: 'test-key',
      secretKey: 'test-secret',
      sandbox: true,
    });

    // Mock auth
    mockAuth();

    // Mock GET bill (to retrieve current bill data)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({
        reference: 'BILL-123',
        userReference: 'USER-REF-123',
        items: [
          {
            Amount: 100.00,
            Description: 'Old description',
          },
        ],
      }),
    });

    // Mock POST update
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({
        success: true,
        message: 'Updated',
      }),
    });

    await client.updateBillPresentment({
      reference: 'BILL-123',
      amount: 200.00,
      description: 'New description',
    });

    // Verify the update was called
    const updateCall = mockFetch.mock.calls.find(call =>
      call[0].includes('/api/paygatecontroller/updateBillPresentment')
    );
    expect(updateCall).toBeTruthy();
  });
});
