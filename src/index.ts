/**
 * SoftyComp Node.js SDK
 *
 * Official Node.js SDK for SoftyComp — South African bill presentment and debit order platform.
 *
 * @see https://softycompdistribution.co.za
 * @see https://webapps.softycomp.co.za (API documentation)
 */

import crypto from 'crypto';

// ==================== Types ====================

export type BillFrequency = 'once-off' | 'monthly' | 'weekly' | 'yearly' | 'subscription';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type WebhookType = 'pending' | 'successful' | 'failed' | 'cancelled';

export interface SoftyCompConfig {
  /** Your SoftyComp API key */
  apiKey: string;
  /** Your SoftyComp API secret */
  secretKey: string;
  /** Use sandbox environment (testapi.softycompdistribution.co.za) */
  sandbox?: boolean;
  /** Optional webhook secret for signature validation */
  webhookSecret?: string;
}

export interface CreateBillParams {
  /** Amount in Rands (not cents!) e.g. 299.00 */
  amount: number;
  /** Customer full name */
  customerName: string;
  /** Customer email address */
  customerEmail: string;
  /** Customer mobile number (e.g. "0825551234") */
  customerPhone: string;
  /** Your internal reference/invoice number */
  reference: string;
  /** Bill description */
  description?: string;
  /** Payment frequency: 'once-off', 'weekly', 'monthly', 'yearly', or 'subscription' */
  frequency: BillFrequency;
  /** Commencement date for recurring bills (YYYY-MM-DD). Must be future date (min tomorrow). Ignored for once-off. */
  commencementDate?: string;
  /** Day of month to charge for recurring bills (1-28). Ignored for once-off. Defaults to tomorrow's day. */
  recurringDay?: number;
  /** Month to charge for yearly bills (1-12). Ignored for monthly/once-off. Defaults to tomorrow's month. */
  recurringMonth?: number;
  /** URL to redirect customer after successful payment */
  returnUrl: string;
  /** URL to redirect customer after cancelled payment */
  cancelUrl: string;
  /** URL to receive webhook notifications */
  notifyUrl: string;
  /** Company name to display on bill */
  companyName?: string;
  /** Company contact number to display */
  companyContact?: string;
  /** Company email to display */
  companyEmail?: string;
}

export interface CreateBillResult {
  /** Unique bill reference from SoftyComp */
  reference: string;
  /** Payment URL to redirect customer to */
  paymentUrl: string;
  /** ISO 8601 timestamp when the payment link expires (typically 30 minutes) */
  expiresAt: string;
}

export interface RefundParams {
  /** Original transaction ID/reference to refund */
  transactionId: string;
  /** Amount to refund in Rands (not cents!). Omit for full refund. */
  amount?: number;
}

export interface RefundResult {
  /** Refund reference ID */
  refundId: string;
  /** Refund status */
  status: 'completed' | 'pending' | 'failed';
  /** Amount refunded in Rands */
  amount: number;
}

export interface WebhookEvent {
  /** Event type: 'pending', 'successful', 'failed', 'cancelled' */
  type: WebhookType;
  /** Transaction reference */
  reference: string;
  /** Payment status */
  status: PaymentStatus;
  /** Amount in Rands */
  amount: number;
  /** Transaction date (ISO 8601) */
  transactionDate: string;
  /** Payment method ID (1=Card, 2=EFT, etc.) */
  paymentMethodId: number;
  /** Payment method description */
  paymentMethod: string;
  /** Your original reference */
  userReference: string;
  /** Additional information */
  information: string;
  /** Raw webhook payload */
  raw: any;
}

export interface BillStatusResult {
  /** Bill reference */
  reference: string;
  /** Current payment status */
  status: PaymentStatus;
  /** Amount in Rands */
  amount: number;
  /** Transaction date if paid */
  paidAt?: string;
  /** Raw response data */
  data: any;
}

// ==================== Internal Types ====================

interface TokenResponse {
  token: string;
  expiration: string;
}

interface BillResponse {
  reference: string;
  paymentURL: string;
  success: boolean;
  message: string;
}

interface WebhookPayload {
  reference: string;
  activityTypeID: number;
  transactionDate: string;
  amount: number;
  paymentMethodTypeID: number;
  paymentMethodTypeDescription: string;
  userReference: string;
  information: string;
}

// ==================== Main SDK Class ====================

export class SoftyComp {
  private apiKey: string;
  private secretKey: string;
  private sandbox: boolean;
  private baseUrl: string;
  private webhookSecret?: string;

  // Token cache
  private token: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: SoftyCompConfig) {
    this.apiKey = config.apiKey;
    this.secretKey = config.secretKey;
    this.sandbox = config.sandbox ?? true;
    this.webhookSecret = config.webhookSecret;

    // Base URL mapping
    if (this.sandbox) {
      this.baseUrl = 'https://sandbox.softycomp.co.za/SoftyCompBureauAPI';
    } else {
      this.baseUrl = 'https://api.softycomp.co.za/SoftyCompBureauAPI';
    }

    if (!this.apiKey || !this.secretKey) {
      throw new Error('SoftyComp requires apiKey and secretKey');
    }
  }

  // ==================== Authentication ====================

  /**
   * Authenticate and get Bearer token (cached for ~30 minutes)
   * @internal
   */
  private async authenticate(): Promise<string> {
    // Return cached token if still valid (with 60s buffer)
    if (this.token && Date.now() < this.tokenExpiry - 60_000) {
      return this.token;
    }

    const response = await fetch(`${this.baseUrl}/api/auth/generatetoken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: this.apiKey,
        apiSecret: this.secretKey,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SoftyComp authentication failed: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as TokenResponse;
    this.token = data.token;
    this.tokenExpiry = new Date(data.expiration).getTime();
    return this.token;
  }

  /**
   * Make authenticated API request
   * @internal
   */
  private async apiRequest<T = any>(method: string, path: string, data?: any): Promise<T> {
    const token = await this.authenticate();
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SoftyComp API error (${method} ${path}): ${response.status} - ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return (await response.json()) as T;
    }
    return (await response.text()) as unknown as T;
  }

  // ==================== Bill Presentment ====================

  /**
   * Create a payment bill (once-off or recurring)
   *
   * @example
   * ```typescript
   * const bill = await client.createBill({
   *   amount: 299.00,
   *   customerName: 'John Doe',
   *   customerEmail: 'john@example.com',
   *   customerPhone: '0825551234',
   *   reference: 'INV-001',
   *   description: 'Monthly subscription',
   *   frequency: 'monthly',
   *   commencementDate: '2026-04-01',
   *   recurringDay: 1,
   *   returnUrl: 'https://myapp.com/success',
   *   cancelUrl: 'https://myapp.com/cancel',
   *   notifyUrl: 'https://myapp.com/webhook'
   * });
   *
   * // Redirect customer to payment page
   * console.log(bill.paymentUrl);
   * ```
   */
  async createBill(params: CreateBillParams): Promise<CreateBillResult> {
    const isRecurring = params.frequency !== 'once-off';

    // Frequency type mapping from SoftyComp docs:
    // 1=Once Off, 2=Monthly, 3=Weekly, 4=Yearly, 5=To Collect Amount, 6=Subscription
    const frequencyMap: Record<BillFrequency, number> = {
      'once-off': 1, 'monthly': 2, 'weekly': 3, 'yearly': 4, 'subscription': 6
    };
    const frequencyTypeID = frequencyMap[params.frequency] ?? 1;

    // Build the bill item
    const item: Record<string, any> = {
      Description: params.description || 'Payment',
      Amount: parseFloat(params.amount.toFixed(2)),
      FrequencyTypeID: frequencyTypeID,
      DisplayCompanyName: params.companyName || 'Your Company',
      DisplayCompanyContactNo: params.companyContact || '',
      DisplayCompanyEmailAddress: params.companyEmail || params.customerEmail,
    };

    // Add recurring-specific fields
    if (isRecurring) {
      // Validate commencement date is in the future
      let commencementDate: Date;
      if (params.commencementDate) {
        commencementDate = new Date(params.commencementDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (commencementDate <= now) {
          throw new Error('commencementDate must be a future date (minimum tomorrow)');
        }
      } else {
        // Default to tomorrow
        commencementDate = new Date();
        commencementDate.setDate(commencementDate.getDate() + 1);
      }

      item.CommencementDate = commencementDate.toISOString().split('T')[0];
      item.RecurringDay = params.recurringDay || commencementDate.getDate();

      if (params.frequency === 'yearly') {
        item.RecurringMonth = params.recurringMonth || (commencementDate.getMonth() + 1);
      } else {
        item.RecurringMonth = null;
      }

      // DayOfWeek required for weekly frequency (1=Monday...7=Sunday)
      if (params.frequency === 'weekly') {
        item.DayOfWeek = params.recurringDay || commencementDate.getDay() || 7; // JS Sunday=0 → 7
      } else {
        item.DayOfWeek = null;
      }
      item.ExpiryDate = null;
      item.InitialAmount = null;
      item.ToCollectAmount = null;
    }

    // Build the bill request
    const billData = {
      Name: params.customerName,
      ModeTypeID: 4, // Plugin mode (returns payment URL)
      Emailaddress: params.customerEmail,
      Cellno: params.customerPhone,
      UserReference: params.reference,
      Items: [item],
      ScheduledDateTime: null,
      CallbackUrl: params.notifyUrl,
      SuccessURL: params.returnUrl,
      FailURL: params.cancelUrl,
      NotifyURL: params.notifyUrl,
      CancelURL: params.cancelUrl,
    };

    const result = await this.apiRequest<BillResponse>(
      'POST',
      '/api/paygatecontroller/requestbillpresentment',
      billData,
    );

    if (!result.success) {
      throw new Error(`Failed to create bill: ${result.message}`);
    }

    return {
      reference: result.reference,
      paymentUrl: result.paymentURL,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  }

  // ==================== Bill Status ====================

  /**
   * Get bill payment status
   *
   * @example
   * ```typescript
   * const status = await client.getBillStatus('BILL-REF-123');
   * if (status.status === 'completed') {
   *   console.log('Payment received on:', status.paidAt);
   * }
   * ```
   */
  async getBillStatus(reference: string): Promise<BillStatusResult> {
    const result = await this.apiRequest<any>(
      'GET',
      `/api/paygatecontroller/listBillPresentmentDetails/${reference}/${reference}`,
    );

    // Map status: 1=pending, 2=completed, 3=failed, 4/5=cancelled
    const statusTypeID = result?.statusTypeID || result?.status || 1;
    const status = this.mapBillStatus(statusTypeID);

    return {
      reference: result?.reference || reference,
      status,
      amount: parseFloat(result?.amount || '0'),
      paidAt: result?.transactionDate || undefined,
      data: result,
    };
  }

  // ==================== Refunds ====================

  /**
   * Process a refund (credit transaction)
   *
   * @example
   * ```typescript
   * // Full refund
   * const refund = await client.refund({ transactionId: 'TXN-123' });
   *
   * // Partial refund
   * const refund = await client.refund({
   *   transactionId: 'TXN-123',
   *   amount: 100.00
   * });
   * ```
   */
  async refund(params: RefundParams): Promise<RefundResult> {
    const refundData: any = {
      Reference: params.transactionId,
      UserReference: params.transactionId,
    };

    if (params.amount !== undefined) {
      // IMPORTANT: SoftyComp uses capital "A" in Amount field for refunds
      refundData.Amount = parseFloat(params.amount.toFixed(2));
    }

    const result = await this.apiRequest<any>(
      'POST',
      '/api/paygatecontroller/requestCreditTransaction',
      refundData,
    );

    return {
      refundId: result?.reference || `refund_${params.transactionId}_${Date.now()}`,
      status: result?.success ? 'completed' : 'pending',
      amount: params.amount || 0,
    };
  }

  // ==================== Webhooks ====================

  /**
   * Verify webhook signature (HMAC-SHA256)
   *
   * @example
   * ```typescript
   * app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
   *   const signature = req.headers['x-signature'] as string;
   *   if (!client.verifyWebhook(req.body, { signature })) {
   *     return res.status(400).send('Invalid signature');
   *   }
   *   // Process webhook...
   * });
   * ```
   */
  verifyWebhook(
    body: string | Buffer,
    headers: { signature?: string } | Record<string, string>
  ): boolean {
    const signature = 'signature' in headers ? headers.signature : (headers as Record<string, string>)['x-signature'];

    if (!signature || !this.webhookSecret) {
      // No signature validation configured
      return true;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(body)
      .digest('hex');

    return signature === expectedSignature || signature === `sha256=${expectedSignature}`;
  }

  /**
   * Parse webhook event payload
   *
   * @example
   * ```typescript
   * const event = client.parseWebhook(req.body);
   *
   * switch (event.type) {
   *   case 'successful':
   *     console.log('Payment successful:', event.reference, event.amount);
   *     break;
   *   case 'failed':
   *     console.log('Payment failed:', event.reference);
   *     break;
   *   case 'cancelled':
   *     console.log('Payment cancelled:', event.reference);
   *     break;
   * }
   * ```
   */
  parseWebhook(body: any): WebhookEvent {
    const event: WebhookPayload = typeof body === 'string' ? JSON.parse(body) : body;

    // Handle both field names: activityTypeID (docs) and WebhookTypeID (observed)
    // Mapping: 1=Pending, 2=Successful, 3=Failed, 4=Cancelled
    const typeId = event.activityTypeID || (event as any).WebhookTypeID || 1;
    let type: WebhookType = 'pending';
    let status: PaymentStatus = 'pending';

    switch (typeId) {
      case 2:
        type = 'successful';
        status = 'completed';
        break;
      case 3:
        type = 'failed';
        status = 'failed';
        break;
      case 4:
        type = 'cancelled';
        status = 'cancelled';
        break;
      default:
        type = 'pending';
        status = 'pending';
    }

    return {
      type,
      reference: event.reference,
      status,
      amount: event.amount,
      transactionDate: event.transactionDate,
      paymentMethodId: event.paymentMethodTypeID,
      paymentMethod: event.paymentMethodTypeDescription,
      userReference: event.userReference,
      information: event.information,
      raw: event,
    };
  }

  // ==================== Helpers ====================

  /**
   * Map SoftyComp status type ID to payment status
   * @internal
   */
  private mapBillStatus(statusTypeID: number | string): PaymentStatus {
    switch (Number(statusTypeID)) {
      case 1: return 'pending';   // New
      case 2: return 'completed'; // Paid
      case 3: return 'failed';    // Failed
      case 4: return 'cancelled'; // Expired
      case 5: return 'cancelled'; // Cancelled
      default: return 'pending';
    }
  }
}

// ==================== Default Export ====================

export default SoftyComp;
