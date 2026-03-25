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

export interface UpdateBillParams {
  /** Bill reference to update */
  reference: string;
  /** New amount in Rands */
  amount?: number;
  /** New description */
  description?: string;
  /** Update customer details */
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface BillAudit {
  /** Audit entry ID */
  auditId: number;
  /** Timestamp of change */
  timestamp: string;
  /** Description of change */
  description: string;
  /** User who made the change */
  user: string;
  /** Raw audit data */
  raw: any;
}

export interface CreateClientParams {
  /** Client full name */
  name: string;
  /** Client surname */
  surname: string;
  /** Client email address */
  email: string;
  /** Client phone number */
  phone: string;
  /** Client ID number (optional) */
  idNumber?: string;
}

export interface CreateMobiMandateParams {
  /** Customer email */
  customerEmail: string;
  /** Customer phone number */
  customerPhone: string;
  /** Contract code / reference */
  contractCode?: string;
  /** Customer surname */
  surname: string;
  /** Customer initials */
  initials?: string;
  /** Customer ID number */
  idNumber?: string;
  /** Product ID */
  productId?: string;
  /** Recurring amount in Rands */
  amount: number;
  /** Initial amount (defaults to amount) */
  initialAmount?: number;
  /** Account name */
  accountName?: string;
  /** Account number */
  accountNumber?: string;
  /** Branch code */
  branchCode?: string;
  /** Account type (1=Savings, 2=Cheque, 3=Credit Card) */
  accountType?: number;
  /** Expiry date (YYYY-MM-DD) */
  expiryDate?: string;
  /** Commencement date (YYYY-MM-DD) */
  commencementDate?: string;
  /** Collection frequency: 'monthly' | 'yearly' */
  frequency: 'monthly' | 'yearly';
  /** Collection method type ID (4=NAEDO) */
  collectionMethodTypeId?: number;
  /** Debit day (1-28) */
  debitDay?: number;
  /** Description */
  description?: string;
  /** Maximum collection amount (defaults to amount * 1.5) */
  maxCollectionAmount?: number;
  /** Success redirect URL */
  successUrl?: string;
  /** Webhook callback URL */
  callbackUrl?: string;
}

export interface MobiMandateResult {
  /** Mandate URL for customer to sign */
  url: string;
  /** Success status */
  success: boolean;
  /** Message from SoftyComp */
  message: string;
}

export interface UpdateCollectionStatusParams {
  /** Collection ID to update */
  collectionId: number;
  /** New status type ID (6=Cancelled) */
  statusTypeId: number;
}

export interface CreditDistributionParams {
  /** Amount in Rands */
  amount: number;
  /** Recipient account number */
  accountNumber: string;
  /** Recipient branch code */
  branchCode: string;
  /** Recipient account name */
  accountName: string;
  /** Payment reference */
  reference: string;
}

export interface CreditDistributionResult {
  /** Distribution ID */
  distributionId: string;
  /** Success status */
  success: boolean;
  /** Messages from SoftyComp */
  messages: string[];
}

export interface CreateReauthBillParams {
  /** Old bill reference to expire */
  oldReference: string;
  /** New bill reference (must be different) */
  newReference: string;
  /** Amount in Rands */
  amount: number;
  /** Customer name */
  customerName: string;
  /** Customer email */
  customerEmail: string;
  /** Customer phone */
  customerPhone: string;
  /** Bill description */
  description: string;
  /** Billing cycle */
  billingCycle: 'MONTHLY' | 'YEARLY';
  /** Success URL */
  successUrl: string;
  /** Cancel URL */
  cancelUrl: string;
  /** Webhook URL */
  notifyUrl: string;
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
  statusTypeID?: number;
}

interface ClientResponse {
  value: number;
  success: boolean;
  messages: string[];
}

interface MobiMandateResponse {
  success: boolean;
  tinyURL: string;
  message: string;
}

interface GenericResponse {
  value?: any;
  success: boolean;
  messages: string[];
  message?: string;
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

  // ==================== Bill Management ====================

  /**
   * Set a bill to expired status
   *
   * @example
   * ```typescript
   * await client.setBillToExpiredStatus('BILL-REF-123', 'USER-REF-123');
   * ```
   */
  async setBillToExpiredStatus(reference: string, userReference: string): Promise<void> {
    await this.apiRequest(
      'POST',
      `/api/paygatecontroller/setBillToExpiredStatus/${encodeURIComponent(reference)}/${encodeURIComponent(userReference)}`,
      '', // Empty body required
    );
  }

  /**
   * Update bill presentment details
   *
   * @example
   * ```typescript
   * await client.updateBillPresentment({
   *   reference: 'BILL-REF-123',
   *   amount: 399.00,
   *   description: 'Updated description'
   * });
   * ```
   */
  async updateBillPresentment(params: UpdateBillParams): Promise<void> {
    // First, get the current bill to retrieve full structure
    const currentBill = await this.apiRequest<any>(
      'GET',
      `/api/paygatecontroller/listBillPresentmentDetails/${params.reference}/${params.reference}`,
    );

    const updateData: any = {
      Reference: params.reference,
      UserReference: currentBill.userReference || params.reference,
      Items: currentBill.items || [],
    };

    if (params.customerName !== undefined) {
      updateData.Name = params.customerName;
    }
    if (params.customerEmail !== undefined) {
      updateData.Emailaddress = params.customerEmail;
    }
    if (params.customerPhone !== undefined) {
      updateData.Cellno = params.customerPhone;
    }

    // Update item fields if amount or description changed
    if (updateData.Items.length > 0) {
      if (params.amount !== undefined) {
        updateData.Items[0].Amount = parseFloat(params.amount.toFixed(2));
      }
      if (params.description !== undefined) {
        updateData.Items[0].Description = params.description;
      }
    }

    await this.apiRequest(
      'POST',
      '/api/paygatecontroller/updateBillPresentment',
      updateData,
    );
  }

  /**
   * List bill presentment audit trail
   *
   * @example
   * ```typescript
   * const audits = await client.listBillPresentmentAudits('BILL-REF-123', 'USER-REF-123');
   * ```
   */
  async listBillPresentmentAudits(reference: string, userReference: string): Promise<BillAudit[]> {
    const result = await this.apiRequest<any[]>(
      'GET',
      `/api/paygatecontroller/listBillPresentmentAudits/${encodeURIComponent(reference)}/${encodeURIComponent(userReference)}`,
    );

    return (result || []).map((audit: any) => ({
      auditId: audit.auditId || 0,
      timestamp: audit.timestamp || audit.date || '',
      description: audit.description || audit.action || '',
      user: audit.user || audit.userName || '',
      raw: audit,
    }));
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

  // ==================== Client Management ====================

  /**
   * Create a new client
   *
   * @example
   * ```typescript
   * const clientId = await client.createClient({
   *   name: 'John',
   *   surname: 'Doe',
   *   email: 'john@example.com',
   *   phone: '0825551234',
   *   idNumber: '8001015009087'
   * });
   * ```
   */
  async createClient(params: CreateClientParams): Promise<number> {
    const result = await this.apiRequest<ClientResponse>(
      'POST',
      '/api/clients/createclient',
      {
        clientId: 0,
        clientTypeId: 1, // Individual
        contractCode: `C${Date.now().toString().slice(-13)}`, // Max 14 chars
        initials: params.name.charAt(0),
        surname: params.surname,
        idnumber: params.idNumber || '',
        clientStatusTypeId: 1, // Active
        cellphoneNumber: params.phone,
        emailAddress: params.email,
        sendSmsDonotifications: true,
        sendSmsUnpaidsNotifications: true,
        isSouthAfricanCitizen: true,
        fullNames: params.name,
      },
    );

    if (!result.success) {
      throw new Error(`SoftyComp create client failed: ${result.messages.join(', ')}`);
    }
    return result.value;
  }

  // ==================== Mobi-Mandate (Debit Orders) ====================

  /**
   * Create a Mobi-Mandate request for debit order sign-up
   *
   * @example
   * ```typescript
   * const mandate = await client.createMobiMandate({
   *   customerEmail: 'john@example.com',
   *   customerPhone: '0825551234',
   *   surname: 'Doe',
   *   initials: 'J',
   *   amount: 99.00,
   *   frequency: 'monthly',
   *   debitDay: 1,
   *   description: 'Monthly subscription',
   *   successUrl: 'https://myapp.com/success'
   * });
   *
   * // Redirect customer to mandate.url to sign
   * console.log(mandate.url);
   * ```
   */
  async createMobiMandate(params: CreateMobiMandateParams): Promise<MobiMandateResult> {
    const frequencyMap: Record<string, number> = {
      monthly: 2,
      yearly: 4,
    };

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultCommencementDate = tomorrow.toISOString().split('T')[0];

    const mandateData = {
      EmailAddress: params.customerEmail,
      CellphoneNumber: params.customerPhone,
      ContractCode: params.contractCode || `M${Date.now().toString().slice(-5)}`, // Max 6 chars
      Surname: params.surname,
      Initials: params.initials || params.surname.charAt(0),
      IDNumber: params.idNumber || '',
      ProductID: params.productId ? parseInt(params.productId, 10) : null,
      Amount: parseFloat(params.amount.toFixed(2)),
      InitialAmount: params.initialAmount ? parseFloat(params.initialAmount.toFixed(2)) : parseFloat(params.amount.toFixed(2)),
      AccountName: params.accountName || '',
      AccountNumber: params.accountNumber || '',
      BranchCode: params.branchCode || '',
      AccountType: params.accountType || 1,
      ExpiryDate: params.expiryDate || null,
      CommencementDate: params.commencementDate || defaultCommencementDate,
      CollectionFrequencyTypeID: frequencyMap[params.frequency] || 2,
      CollectionMethodTypeID: params.collectionMethodTypeId || 4, // NAEDO
      DebitDay: params.debitDay || 1,
      Description: params.description || 'Debit Order',
      DebitMonth: null,
      TransactionDate1: null,
      TransactionDate2: null,
      TransactionDate3: null,
      TransactionDate4: null,
      NaedoTrackingCodeID: 12,
      EntryClassCodeTypeID: 1,
      AdjustmentCategoryTypeID: 2,
      DebiCheckMaximumCollectionAmount: params.maxCollectionAmount || (params.amount * 1.5),
      DateAdjustmentAllowed: false,
      AdjustmentAmount: 0,
      AdjustmentRate: 0,
      DebitValueTypeID: 1,
      RedirectURL: params.successUrl || '',
      CallbackURL: params.callbackUrl || '',
      SendCorrespondence: true,
      ExternalRequest: true,
      HideHomeTel: true,
      HideWorkTel: true,
      HideProductDetail: false,
      HideExpiryDate: true,
      HideAdditionalInfo: true,
      HideDescription: false,
    };

    const result = await this.apiRequest<MobiMandateResponse>(
      'POST',
      '/api/mobimandate/generateMobiMandateRequest',
      mandateData,
    );

    if (!result.success) {
      throw new Error(`SoftyComp Mobi-Mandate failed: ${result.message}`);
    }

    return {
      url: result.tinyURL,
      success: result.success,
      message: result.message,
    };
  }

  /**
   * Update collection status (e.g., cancel a debit order)
   *
   * @example
   * ```typescript
   * await client.updateCollectionStatus({
   *   collectionId: 12345,
   *   statusTypeId: 6  // 6 = Cancelled
   * });
   * ```
   */
  async updateCollectionStatus(params: UpdateCollectionStatusParams): Promise<void> {
    await this.apiRequest(
      'POST',
      '/api/collections/updateCollectionStatus',
      {
        collectionID: params.collectionId,
        collectionStatusTypeID: params.statusTypeId,
      },
    );
  }

  // ==================== Credit Distribution (Payouts) ====================

  /**
   * Create a credit distribution (payout to bank account)
   *
   * @example
   * ```typescript
   * const result = await client.createCreditDistribution({
   *   amount: 500.00,
   *   accountNumber: '1234567890',
   *   branchCode: '123456',
   *   accountName: 'John Doe',
   *   reference: 'PAYOUT-001'
   * });
   * ```
   */
  async createCreditDistribution(params: CreditDistributionParams): Promise<CreditDistributionResult> {
    const result = await this.apiRequest<GenericResponse>(
      'POST',
      '/api/creditdistribution/createCreditDistribution',
      {
        creditFileTransactions: [
          {
            amount: parseFloat(params.amount.toFixed(2)),
            accountNumber: params.accountNumber,
            branchCode: params.branchCode,
            accountName: params.accountName,
            reference: params.reference,
          },
        ],
      },
    );

    return {
      distributionId: result?.value?.toString() || `dist_${Date.now()}`,
      success: result?.success || false,
      messages: result?.messages || [],
    };
  }

  // ==================== Re-authentication ====================

  /**
   * Handle card expiry / re-auth: expire old bill and create new one
   *
   * @example
   * ```typescript
   * const newBill = await client.createReauthBill({
   *   oldReference: 'OLD-BILL-123',
   *   newReference: 'NEW-BILL-456',
   *   amount: 99.00,
   *   customerName: 'John Doe',
   *   customerEmail: 'john@example.com',
   *   customerPhone: '0825551234',
   *   description: 'Monthly subscription',
   *   billingCycle: 'MONTHLY',
   *   successUrl: 'https://myapp.com/success',
   *   cancelUrl: 'https://myapp.com/cancel',
   *   notifyUrl: 'https://myapp.com/webhook'
   * });
   * ```
   */
  async createReauthBill(params: CreateReauthBillParams): Promise<CreateBillResult> {
    // Step 1: Expire the old bill
    try {
      await this.setBillToExpiredStatus(params.oldReference, params.oldReference);
    } catch (err) {
      console.warn(`[SoftyComp] Could not expire old bill ${params.oldReference}:`, err);
      // Continue — the old bill may already be expired
    }

    // Step 2: Create a new bill with a different reference
    const isMonthly = params.billingCycle === 'MONTHLY';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.createBill({
      amount: params.amount,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      reference: params.newReference,
      description: params.description,
      frequency: isMonthly ? 'monthly' : 'yearly',
      commencementDate: tomorrow.toISOString().split('T')[0],
      recurringDay: tomorrow.getDate(),
      recurringMonth: isMonthly ? undefined : (tomorrow.getMonth() + 1),
      returnUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
      notifyUrl: params.notifyUrl,
    });
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
      case 6: return 'failed';    // Arrears (card expired / payment failed)
      case 7: return 'failed';    // ReAuth required
      default: return 'pending';
    }
  }
}

// ==================== Default Export ====================

export default SoftyComp;
