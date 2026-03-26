/**
 * SoftyComp SDK Usage Example
 *
 * Run: node example.js
 */

const { SoftyComp } = require('./dist/index.js');

// Initialize client (sandbox mode)
// Credentials default to sandbox test keys for demo purposes
const client = new SoftyComp({
  apiKey: process.env.SOFTYCOMP_API_KEY || '97E932D2-EC27-4583-B8E4-EDC87C8019BA',
  secretKey: process.env.SOFTYCOMP_SECRET_KEY || 'OEPQKMxopavCtvmvwE3Y',
  sandbox: true,
});

async function example() {
  try {
    console.log('🚀 SoftyComp SDK Example\n');

    // Example 1: Create a once-off bill
    console.log('1️⃣  Creating once-off bill...');
    const onceBill = await client.createBill({
      amount: 299.00,
      customerName: 'John Doe',
      customerEmail: 'john@test.com', // Note: SoftyComp blocks @example.com in sandbox
      customerPhone: '0825551234',
      reference: `INV-${Date.now()}`,
      description: 'Product purchase',
      frequency: 'once-off',
      returnUrl: 'https://myapp.com/success',
      cancelUrl: 'https://myapp.com/cancel',
      notifyUrl: 'https://myapp.com/webhook',
    });
    console.log('✅ Bill created:', onceBill.reference);
    console.log('💳 Payment URL:', onceBill.paymentUrl);
    console.log('⏰ Expires:', onceBill.expiresAt);
    console.log();

    // Example 2: Create a monthly subscription
    console.log('2️⃣  Creating monthly subscription...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const commencementDate = tomorrow.toISOString().split('T')[0];

    const monthlyBill = await client.createBill({
      amount: 99.00,
      customerName: 'Jane Smith',
      customerEmail: 'jane@test.com', // Note: SoftyComp blocks @example.com in sandbox
      customerPhone: '0821234567',
      reference: `SUB-${Date.now()}`,
      description: 'Monthly subscription',
      frequency: 'monthly',
      commencementDate,
      recurringDay: 1,
      returnUrl: 'https://myapp.com/success',
      cancelUrl: 'https://myapp.com/cancel',
      notifyUrl: 'https://myapp.com/webhook',
    });
    console.log('✅ Subscription created:', monthlyBill.reference);
    console.log('💳 Payment URL:', monthlyBill.paymentUrl);
    console.log();

    // Example 3: Check bill status
    console.log('3️⃣  Checking bill status...');
    const status = await client.getBillStatus(onceBill.reference);
    console.log('✅ Status:', status.status);
    console.log('💰 Amount: R' + status.amount);
    console.log();

    // Example 4: Parse webhook event
    console.log('4️⃣  Parsing webhook event (simulation)...');
    const mockWebhook = {
      reference: 'TXN-123',
      activityTypeID: 2, // Successful
      transactionDate: new Date().toISOString(),
      amount: 299.00,
      paymentMethodTypeID: 1,
      paymentMethodTypeDescription: 'Credit Card',
      userReference: 'INV-001',
      information: 'Payment successful',
    };

    const event = client.parseWebhook(mockWebhook);
    console.log('✅ Event type:', event.type);
    console.log('💳 Reference:', event.reference);
    console.log('📊 Status:', event.status);
    console.log('💰 Amount: R' + event.amount);
    console.log('💳 Method:', event.paymentMethod);
    console.log();

    console.log('✨ All examples completed successfully!');
    console.log('\n📚 Full documentation: https://github.com/kobie3717/softycomp-node');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

example();
