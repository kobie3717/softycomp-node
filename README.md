# softycomp-node

[![npm version](https://img.shields.io/npm/v/softycomp-node.svg)](https://www.npmjs.com/package/softycomp-node)
[![npm downloads](https://img.shields.io/npm/dm/softycomp-node.svg)](https://www.npmjs.com/package/softycomp-node)
[![CI](https://github.com/kobie3717/softycomp-node/actions/workflows/ci.yml/badge.svg)](https://github.com/kobie3717/softycomp-node/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Discord](https://img.shields.io/badge/Discord-Join%20Chat-5865F2?logo=discord&logoColor=white)](https://discord.gg/Y2jCXNGgE)

**Official Node.js SDK for SoftyComp** — South African bill presentment and debit order platform.

Accept once-off and recurring payments via card, EFT, and debit order with a simple, type-safe API.

## Features

- **Bill Presentment** — Create, update, expire payment links for once-off or recurring bills
- **Debit Orders** — Monthly and yearly recurring collections via Mobi-Mandate
- **Client Management** — Create and manage customer profiles
- **Refunds** — Process full or partial refunds via credit transactions
- **Payouts** — Credit distribution to bank accounts
- **Re-authentication** — Handle card expiry with automated bill re-creation
- **Audit Trail** — List bill presentment audit logs
- **Webhooks** — Real-time payment notifications with signature validation
- **TypeScript** — Fully typed for autocomplete and type safety
- **Zero Dependencies** — Uses native `fetch()` (Node.js 18+)
- **Sandbox Support** — Test with sandbox environment before going live

## Developer Playground

Try the interactive API explorer at `playground/` — a beautiful web interface to test all SoftyComp features:

```bash
cd playground
npm install
npm start
```

Then visit http://localhost:4021 to explore:
- Create bills (once-off, monthly, weekly, yearly, subscription)
- Manage bills (status, update, expire, audit trail, re-auth)
- Debit orders (Mobi-Mandate)
- Client management & payouts
- Live webhook feed
- Code examples & API reference

## Installation

```bash
npm install softycomp-node
```

**Requirements:** Node.js 18+ (for native `fetch()` support)

## Quick Start

```typescript
import { SoftyComp } from 'softycomp-node';

// Initialize client
const client = new SoftyComp({
  apiKey: 'your-api-key',
  secretKey: 'your-secret-key',
  sandbox: true, // Use test environment
});

// Create a once-off bill
const bill = await client.createBill({
  amount: 299.00, // In Rands (not cents!)
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '0825551234',
  reference: 'INV-001',
  description: 'Product purchase',
  frequency: 'once-off',
  returnUrl: 'https://myapp.com/payment/success',
  cancelUrl: 'https://myapp.com/payment/cancel',
  notifyUrl: 'https://myapp.com/payment/webhook',
});

// Redirect customer to payment page
console.log(bill.paymentUrl);
```

## API Reference

### Initialize Client

```typescript
const client = new SoftyComp({
  apiKey: string;          // Your SoftyComp API key
  secretKey: string;       // Your SoftyComp API secret
  sandbox?: boolean;       // Use sandbox environment (default: true)
  webhookSecret?: string;  // Optional secret for webhook signature validation
});
```

**Environments:**
- **Sandbox:** `sandbox.softycomp.co.za`
- **Production:** `api.softycomp.co.za`

### Create Bill

Create a payment bill (once-off or recurring).

```typescript
const bill = await client.createBill({
  amount: number;              // Amount in Rands (not cents!) e.g. 299.00
  customerName: string;        // Customer full name
  customerEmail: string;       // Customer email
  customerPhone: string;       // Customer mobile (e.g. "0825551234")
  reference: string;           // Your internal reference/invoice number
  description?: string;        // Bill description
  frequency: 'once-off' | 'monthly' | 'yearly';

  // Recurring bill fields (ignored for once-off):
  commencementDate?: string;   // Start date (YYYY-MM-DD). Must be future (min tomorrow)
  recurringDay?: number;       // Day of month to charge (1-28). Defaults to tomorrow
  recurringMonth?: number;     // Month for yearly bills (1-12). Defaults to tomorrow

  // URLs:
  returnUrl: string;           // Success redirect URL
  cancelUrl: string;           // Cancel redirect URL
  notifyUrl: string;           // Webhook notification URL

  // Optional branding:
  companyName?: string;        // Company name to display
  companyContact?: string;     // Company contact number
  companyEmail?: string;       // Company email
});

// Returns:
{
  reference: string;     // SoftyComp bill reference
  paymentUrl: string;    // URL to redirect customer to
  expiresAt: string;     // ISO 8601 expiry timestamp (typically 30 mins)
}
```

#### Examples

**Once-off payment:**

```typescript
const bill = await client.createBill({
  amount: 150.00,
  customerName: 'Jane Smith',
  customerEmail: 'jane@example.com',
  customerPhone: '0821234567',
  reference: 'ORDER-789',
  frequency: 'once-off',
  returnUrl: 'https://myapp.com/success',
  cancelUrl: 'https://myapp.com/cancel',
  notifyUrl: 'https://myapp.com/webhook',
});
```

**Monthly subscription:**

```typescript
const bill = await client.createBill({
  amount: 99.00,
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '0825551234',
  reference: 'SUB-001',
  description: 'Premium Monthly Subscription',
  frequency: 'monthly',
  commencementDate: '2026-04-01',  // First charge date
  recurringDay: 1,                  // Charge on 1st of each month
  returnUrl: 'https://myapp.com/success',
  cancelUrl: 'https://myapp.com/cancel',
  notifyUrl: 'https://myapp.com/webhook',
});
```

**Yearly subscription:**

```typescript
const bill = await client.createBill({
  amount: 999.00,
  customerName: 'Alice Johnson',
  customerEmail: 'alice@example.com',
  customerPhone: '0827778888',
  reference: 'SUB-ANNUAL-042',
  description: 'Annual Premium Plan',
  frequency: 'yearly',
  commencementDate: '2027-01-15',
  recurringDay: 15,
  recurringMonth: 1,  // Charge on January 15th each year
  returnUrl: 'https://myapp.com/success',
  cancelUrl: 'https://myapp.com/cancel',
  notifyUrl: 'https://myapp.com/webhook',
});
```

### Get Bill Status

Check payment status of a bill.

```typescript
const status = await client.getBillStatus('BILL-REF-123');

// Returns:
{
  reference: string;       // Bill reference
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;          // Amount in Rands
  paidAt?: string;         // ISO 8601 payment timestamp (if paid)
  data: any;               // Raw response from SoftyComp
}
```

### Bill Management

#### Expire a Bill

Set a bill to expired status (e.g., for cancelling a recurring bill):

```typescript
await client.setBillToExpiredStatus('BILL-REF-123', 'USER-REF-123');
```

#### Update Bill Presentment

Update details of an existing bill:

```typescript
await client.updateBillPresentment({
  reference: 'BILL-REF-123',
  amount: 399.00,
  description: 'Updated description',
  customerEmail: 'newemail@example.com'
});
```

#### List Bill Audit Trail

Get the audit trail for a bill:

```typescript
const audits = await client.listBillPresentmentAudits('BILL-REF-123', 'USER-REF-123');

// Returns array of:
{
  auditId: number;
  timestamp: string;
  description: string;
  user: string;
  raw: any;
}
```

### Client Management

Create a new client profile:

```typescript
const clientId = await client.createClient({
  name: 'John',
  surname: 'Doe',
  email: 'john@example.com',
  phone: '0825551234',
  idNumber: '8001015009087'  // Optional SA ID number
});

console.log(`Created client ID: ${clientId}`);
```

### Mobi-Mandate (Debit Orders)

Create a Mobi-Mandate request for debit order sign-up. This generates a URL where customers can enter their bank details and sign a debit order mandate.

```typescript
const mandate = await client.createMobiMandate({
  customerEmail: 'john@example.com',
  customerPhone: '0825551234',
  surname: 'Doe',
  initials: 'J',
  amount: 99.00,              // Monthly/yearly charge amount
  frequency: 'monthly',       // or 'yearly'
  debitDay: 1,                // Day of month to charge (1-28)
  description: 'Monthly subscription',
  successUrl: 'https://myapp.com/success',
  callbackUrl: 'https://myapp.com/webhook'
});

// Redirect customer to sign the mandate
console.log(mandate.url);  // e.g., https://popay.co.za/xxx

// Returns:
{
  url: string;      // Mandate sign-up URL
  success: boolean;
  message: string;
}
```

#### Cancel a Debit Order Collection

```typescript
await client.updateCollectionStatus({
  collectionId: 12345,
  statusTypeId: 6  // 6 = Cancelled
});
```

### Refund Payment

Process a full or partial refund (credit transaction).

```typescript
// Full refund
const refund = await client.refund({
  transactionId: 'TXN-123',
});

// Partial refund
const refund = await client.refund({
  transactionId: 'TXN-123',
  amount: 50.00,  // Amount in Rands
});

// Returns:
{
  refundId: string;        // Refund reference
  status: 'completed' | 'pending' | 'failed';
  amount: number;          // Amount refunded in Rands
}
```

### Credit Distribution (Payouts)

Send money to a bank account:

```typescript
const result = await client.createCreditDistribution({
  amount: 500.00,
  accountNumber: '1234567890',
  branchCode: '123456',
  accountName: 'John Doe',
  reference: 'PAYOUT-001'
});

// Returns:
{
  distributionId: string;
  success: boolean;
  messages: string[];
}
```

### Re-authentication (Card Expiry)

Handle card expiry by expiring the old bill and creating a new one with a different reference:

```typescript
const newBill = await client.createReauthBill({
  oldReference: 'OLD-BILL-123',
  newReference: 'NEW-BILL-456',  // MUST be different
  amount: 99.00,
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '0825551234',
  description: 'Monthly subscription',
  billingCycle: 'MONTHLY',  // or 'YEARLY'
  successUrl: 'https://myapp.com/success',
  cancelUrl: 'https://myapp.com/cancel',
  notifyUrl: 'https://myapp.com/webhook'
});

// Customer re-enters card details at newBill.paymentUrl
console.log(newBill.paymentUrl);
```

### Webhook Handling

SoftyComp sends real-time payment notifications to your `notifyUrl`.

#### Verify Webhook Signature

```typescript
import express from 'express';

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-signature'] as string;

  if (!client.verifyWebhook(req.body, { signature })) {
    return res.status(400).send('Invalid signature');
  }

  // Signature valid, process webhook...
  res.status(200).send('OK');
});
```

#### Parse Webhook Event

```typescript
const event = client.parseWebhook(req.body);

// Returns:
{
  type: 'pending' | 'successful' | 'failed' | 'cancelled';
  reference: string;           // Transaction reference
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;              // Amount in Rands
  transactionDate: string;     // ISO 8601 timestamp
  paymentMethodId: number;     // Payment method ID (1=Card, 2=EFT, etc.)
  paymentMethod: string;       // Payment method description
  userReference: string;       // Your original reference
  information: string;         // Additional info
  raw: any;                    // Raw webhook payload
}
```

#### Full Webhook Example

```typescript
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // 1. Verify signature (optional but recommended)
  const signature = req.headers['x-signature'] as string;
  if (!client.verifyWebhook(req.body, { signature })) {
    return res.status(400).send('Invalid signature');
  }

  // 2. Parse webhook event
  const event = client.parseWebhook(req.body);

  // 3. Handle event types
  switch (event.type) {
    case 'successful':
      console.log('Payment successful!');
      console.log(`Reference: ${event.reference}`);
      console.log(`Amount: R${event.amount}`);
      console.log(`Method: ${event.paymentMethod}`);
      // Update your database, send confirmation email, etc.
      break;

    case 'failed':
      console.log('Payment failed:', event.reference);
      // Notify customer, retry payment, etc.
      break;

    case 'cancelled':
      console.log('Payment cancelled:', event.reference);
      // Handle cancellation
      break;

    case 'pending':
      console.log('Payment pending:', event.reference);
      // Wait for final status
      break;
  }

  // 4. Respond with 200 OK
  res.status(200).send('OK');
});
```

## Test Cards

Use these test cards in the **sandbox environment** only:

| Card Number | 3DS | MOTO | Description |
|-------------|-----|------|-------------|
| `4790 4444 4444 4444` | ✅ Success | ✅ Success | Both 3DS and MOTO succeed |
| `4790 3333 3333 3333` | ✅ Success | ❌ Fail | 3DS succeeds, MOTO fails |

**CVV:** Any 3 digits
**Expiry:** Any future date

## Important Notes

### Amounts in Rands (Not Cents!)

Unlike most payment SDKs, SoftyComp uses **Rands**, not cents:

```typescript
// ✅ Correct
amount: 299.00  // R299.00

// ❌ Wrong
amount: 29900   // Would be R29,900.00!
```

### Recurring Bill Requirements

For `frequency: 'monthly'` or `'yearly'`:

1. **Commencement Date** must be a future date (minimum tomorrow)
2. **Recurring Day** should be 1-28 (avoids month-end issues)
3. **Recurring Month** only for yearly bills (1=Jan, 12=Dec)

```typescript
// ✅ Correct
commencementDate: '2026-04-01',  // Future date
recurringDay: 15,                // 15th of each month

// ❌ Wrong
commencementDate: '2026-03-20',  // Past date
recurringDay: 31,                // Doesn't exist in all months
```

### Frequency Codes (Internal)

The SDK handles this automatically, but for reference:

- `1` = Once-off
- `2` = Monthly
- `7` = Yearly

### Webhook Activity Types (Internal)

The SDK maps these to friendly event types:

- `1` = Pending → `type: 'pending'`
- `2` = Successful → `type: 'successful'`
- `3` = Failed → `type: 'failed'`
- `4` = Cancelled → `type: 'cancelled'`

## TypeScript Support

The SDK is written in TypeScript and includes full type definitions:

```typescript
import {
  SoftyComp,
  BillFrequency,
  PaymentStatus,
  WebhookEvent,
  CreateBillParams,
  RefundParams,
  CreateClientParams,
  CreateMobiMandateParams,
  MobiMandateResult,
  UpdateBillParams,
  BillAudit,
  CreditDistributionParams,
  CreditDistributionResult,
  CreateReauthBillParams,
  UpdateCollectionStatusParams
} from 'softycomp-node';
```

## Error Handling

All methods throw descriptive errors:

```typescript
try {
  const bill = await client.createBill({
    // ... params
  });
} catch (error) {
  console.error('Failed to create bill:', error.message);
  // "Failed to create bill: SoftyComp API error (POST /api/paygatecontroller/requestbillpresentment): 400 - Invalid email address"
}
```

Common errors:
- Authentication: `SoftyComp authentication failed: 401 - Unauthorized`
- Invalid date: `commencementDate must be a future date (minimum tomorrow)`
- API errors: `SoftyComp API error (POST /path): 400 - Error message`

## Production Checklist

Before going live:

1. **Get production credentials** from SoftyComp
2. **Set `sandbox: false`** in config
3. **Configure webhook secret** for signature validation
4. **Test webhook endpoint** with production credentials
5. **Handle all webhook event types** (pending, successful, failed, cancelled)
6. **Implement idempotency** to avoid duplicate processing
7. **Log all transactions** for debugging and reconciliation
8. **Set up monitoring** for failed webhooks

## Community

Join our Discord for help, discussions, and announcements:

- **Discord:** [https://discord.gg/Y2jCXNGgE](https://discord.gg/Y2jCXNGgE)

## License

MIT © Kobie Wentzel

## Links

- **GitHub:** [kobie3717/softycomp-node](https://github.com/kobie3717/softycomp-node)
- **SoftyComp:** [softycompdistribution.co.za](https://softycompdistribution.co.za)
- **API Docs:** [webapps.softycomp.co.za](https://webapps.softycomp.co.za)

---

**Built by [Kobie Wentzel](https://github.com/kobie3717)** for the South African developer community.
