import { SoftyComp } from '../src/index';

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('Input Validation', () => {
  const mockAuth = () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'test-token',
        expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      }),
    });
  };

  describe('Amount Validation', () => {
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

    it('should accept valid positive amount', async () => {
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
        amount: 299.99,
        customerName: 'Test',
        customerEmail: 'test@example.com',
        customerPhone: '0821234567',
        reference: 'TEST-001',
        frequency: 'once-off',
        returnUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        notifyUrl: 'https://example.com/webhook',
      });

      expect(result.reference).toBe('BILL-123');
    });

    it('should accept zero amount', async () => {
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
          reference: 'BILL-000',
          paymentURL: 'https://pay.softycomp.co.za/abc',
          message: 'Success',
        }),
      });

      const result = await client.createBill({
        amount: 0,
        customerName: 'Test',
        customerEmail: 'test@example.com',
        customerPhone: '0821234567',
        reference: 'TEST-000',
        frequency: 'once-off',
        returnUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        notifyUrl: 'https://example.com/webhook',
      });

      expect(result.reference).toBe('BILL-000');
    });
  });

  describe('Date Validation', () => {
    it('should reject invalid date format', async () => {
      const client = new SoftyComp({
        apiKey: 'test-key',
        secretKey: 'test-secret',
        sandbox: true,
      });

      mockAuth();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid date',
      });

      await expect(
        client.createBill({
          amount: 99.00,
          customerName: 'Test',
          customerEmail: 'test@example.com',
          customerPhone: '0821234567',
          reference: 'TEST-001',
          frequency: 'monthly',
          commencementDate: 'invalid-date',
          returnUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
          notifyUrl: 'https://example.com/webhook',
        })
      ).rejects.toThrow();
    });

    it('should reject past date for commencement', async () => {
      const client = new SoftyComp({
        apiKey: 'test-key',
        secretKey: 'test-secret',
        sandbox: true,
      });

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const pastDate = yesterday.toISOString().split('T')[0];

      await expect(
        client.createBill({
          amount: 99.00,
          customerName: 'Test',
          customerEmail: 'test@example.com',
          customerPhone: '0821234567',
          reference: 'TEST-001',
          frequency: 'monthly',
          commencementDate: pastDate,
          returnUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
          notifyUrl: 'https://example.com/webhook',
        })
      ).rejects.toThrow('commencementDate must be a future date');
    });

    it('should accept valid future date', async () => {
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
          reference: 'BILL-FUTURE',
          paymentURL: 'https://pay.softycomp.co.za/future',
          message: 'Success',
        }),
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];

      const result = await client.createBill({
        amount: 99.00,
        customerName: 'Test',
        customerEmail: 'test@example.com',
        customerPhone: '0821234567',
        reference: 'TEST-FUTURE',
        frequency: 'monthly',
        commencementDate: futureDate,
        returnUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        notifyUrl: 'https://example.com/webhook',
      });

      expect(result.reference).toBe('BILL-FUTURE');
    });
  });

  describe('Email Validation', () => {
    it('should reject invalid email format', async () => {
      const client = new SoftyComp({
        apiKey: 'test-key',
        secretKey: 'test-secret',
        sandbox: true,
      });

      mockAuth();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid email',
      });

      await expect(
        client.createBill({
          amount: 99.00,
          customerName: 'Test',
          customerEmail: 'invalid-email',
          customerPhone: '0821234567',
          reference: 'TEST-001',
          frequency: 'once-off',
          returnUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
          notifyUrl: 'https://example.com/webhook',
        })
      ).rejects.toThrow();
    });

    it('should accept valid email format', async () => {
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
          reference: 'BILL-VALID-EMAIL',
          paymentURL: 'https://pay.softycomp.co.za/valid',
          message: 'Success',
        }),
      });

      const result = await client.createBill({
        amount: 99.00,
        customerName: 'Test',
        customerEmail: 'valid.email@example.com',
        customerPhone: '0821234567',
        reference: 'TEST-VALID-EMAIL',
        frequency: 'once-off',
        returnUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        notifyUrl: 'https://example.com/webhook',
      });

      expect(result.reference).toBe('BILL-VALID-EMAIL');
    });
  });
});
