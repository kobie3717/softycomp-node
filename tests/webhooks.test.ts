import { SoftyComp } from '../src/index';
import crypto from 'crypto';

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('Webhook Security', () => {
  it('should verify webhook with valid HMAC signature', () => {
    const webhookSecret = 'test-secret-key';
    const client = new SoftyComp({
      apiKey: 'test-key',
      secretKey: 'test-secret',
      sandbox: false,
      webhookSecret,
    });

    const payload = JSON.stringify({
      reference: 'BILL-123',
      activityTypeID: 2,
      amount: 299.00,
    });

    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    const isValid = client.verifyWebhook(payload, { signature });
    expect(isValid).toBe(true);
  });

  it('should reject webhook with invalid signature', () => {
    const client = new SoftyComp({
      apiKey: 'test-key',
      secretKey: 'test-secret',
      sandbox: false,
      webhookSecret: 'test-secret-key',
    });

    const payload = JSON.stringify({
      reference: 'BILL-123',
      activityTypeID: 2,
      amount: 299.00,
    });

    const isValid = client.verifyWebhook(payload, { signature: 'invalid-signature' });
    expect(isValid).toBe(false);
  });

  it('should reject webhook with missing signature', () => {
    const client = new SoftyComp({
      apiKey: 'test-key',
      secretKey: 'test-secret',
      sandbox: false,
      webhookSecret: 'test-secret-key',
    });

    const payload = JSON.stringify({
      reference: 'BILL-123',
      activityTypeID: 2,
      amount: 299.00,
    });

    const isValid = client.verifyWebhook(payload, {});
    expect(isValid).toBe(false);
  });

  it('should return true with warning in sandbox without webhookSecret', () => {
    const client = new SoftyComp({
      apiKey: 'test-key',
      secretKey: 'test-secret',
      sandbox: true,
      // No webhookSecret
    });

    const payload = JSON.stringify({
      reference: 'BILL-123',
      activityTypeID: 2,
      amount: 299.00,
    });

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const isValid = client.verifyWebhook(payload, { signature: 'any-signature' });
    expect(isValid).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('WARNING: Webhook signature verification disabled in sandbox mode')
    );

    consoleSpy.mockRestore();
  });

  it('should throw error in production without webhookSecret', () => {
    const client = new SoftyComp({
      apiKey: 'test-key',
      secretKey: 'test-secret',
      sandbox: false,
      // No webhookSecret
    });

    const payload = JSON.stringify({
      reference: 'BILL-123',
      activityTypeID: 2,
      amount: 299.00,
    });

    expect(() => {
      client.verifyWebhook(payload, { signature: 'any-signature' });
    }).toThrow('Webhook secret is required in production mode');
  });
});

describe('Webhook Parsing', () => {
  it('should parse webhook event with activityTypeID field', () => {
    const client = new SoftyComp({
      apiKey: 'test-key',
      secretKey: 'test-secret',
      sandbox: true,
    });

    const payload = {
      reference: 'BILL-123',
      activityTypeID: 2, // Successful
      transactionDate: '2026-03-26T10:00:00Z',
      amount: 299.00,
      paymentMethodTypeID: 1,
      paymentMethodTypeDescription: 'Credit Card',
      userReference: 'USER-REF-123',
      information: 'Payment successful',
    };

    const event = client.parseWebhook(payload);

    expect(event.type).toBe('successful');
    expect(event.status).toBe('completed');
    expect(event.reference).toBe('BILL-123');
    expect(event.amount).toBe(299.00);
    expect(event.paymentMethod).toBe('Credit Card');
    expect(event.userReference).toBe('USER-REF-123');
  });

  it('should parse webhook event with WebhookTypeID field', () => {
    const client = new SoftyComp({
      apiKey: 'test-key',
      secretKey: 'test-secret',
      sandbox: true,
    });

    const payload = {
      reference: 'BILL-456',
      WebhookTypeID: 3, // Failed
      transactionDate: '2026-03-26T10:00:00Z',
      amount: 99.00,
      paymentMethodTypeID: 1,
      paymentMethodTypeDescription: 'Credit Card',
      userReference: 'USER-REF-456',
      information: 'Card declined',
    };

    const event = client.parseWebhook(payload);

    expect(event.type).toBe('failed');
    expect(event.status).toBe('failed');
    expect(event.reference).toBe('BILL-456');
    expect(event.amount).toBe(99.00);
  });

  it('should map event type 1 to pending', () => {
    const client = new SoftyComp({
      apiKey: 'test-key',
      secretKey: 'test-secret',
      sandbox: true,
    });

    const payload = {
      reference: 'BILL-789',
      activityTypeID: 1,
      transactionDate: '2026-03-26T10:00:00Z',
      amount: 50.00,
      paymentMethodTypeID: 1,
      paymentMethodTypeDescription: 'Credit Card',
      userReference: 'USER-REF-789',
      information: 'Pending',
    };

    const event = client.parseWebhook(payload);

    expect(event.type).toBe('pending');
    expect(event.status).toBe('pending');
  });

  it('should map event type 2 to successful', () => {
    const client = new SoftyComp({
      apiKey: 'test-key',
      secretKey: 'test-secret',
      sandbox: true,
    });

    const payload = {
      reference: 'BILL-100',
      activityTypeID: 2,
      transactionDate: '2026-03-26T10:00:00Z',
      amount: 150.00,
      paymentMethodTypeID: 1,
      paymentMethodTypeDescription: 'Credit Card',
      userReference: 'USER-REF-100',
      information: 'Success',
    };

    const event = client.parseWebhook(payload);

    expect(event.type).toBe('successful');
    expect(event.status).toBe('completed');
  });

  it('should map event type 3 to failed', () => {
    const client = new SoftyComp({
      apiKey: 'test-key',
      secretKey: 'test-secret',
      sandbox: true,
    });

    const payload = {
      reference: 'BILL-200',
      activityTypeID: 3,
      transactionDate: '2026-03-26T10:00:00Z',
      amount: 250.00,
      paymentMethodTypeID: 1,
      paymentMethodTypeDescription: 'Credit Card',
      userReference: 'USER-REF-200',
      information: 'Failed',
    };

    const event = client.parseWebhook(payload);

    expect(event.type).toBe('failed');
    expect(event.status).toBe('failed');
  });

  it('should map event type 4 to cancelled', () => {
    const client = new SoftyComp({
      apiKey: 'test-key',
      secretKey: 'test-secret',
      sandbox: true,
    });

    const payload = {
      reference: 'BILL-300',
      activityTypeID: 4,
      transactionDate: '2026-03-26T10:00:00Z',
      amount: 350.00,
      paymentMethodTypeID: 1,
      paymentMethodTypeDescription: 'Credit Card',
      userReference: 'USER-REF-300',
      information: 'Cancelled',
    };

    const event = client.parseWebhook(payload);

    expect(event.type).toBe('cancelled');
    expect(event.status).toBe('cancelled');
  });

  it('should parse webhook from JSON string', () => {
    const client = new SoftyComp({
      apiKey: 'test-key',
      secretKey: 'test-secret',
      sandbox: true,
    });

    const payloadString = JSON.stringify({
      reference: 'BILL-400',
      activityTypeID: 2,
      transactionDate: '2026-03-26T10:00:00Z',
      amount: 450.00,
      paymentMethodTypeID: 1,
      paymentMethodTypeDescription: 'Credit Card',
      userReference: 'USER-REF-400',
      information: 'Success',
    });

    const event = client.parseWebhook(payloadString);

    expect(event.type).toBe('successful');
    expect(event.status).toBe('completed');
    expect(event.reference).toBe('BILL-400');
  });
});
