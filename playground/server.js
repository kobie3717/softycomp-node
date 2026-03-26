/**
 * SoftyComp Developer Playground
 * Interactive API explorer powered by softycomp-node SDK
 */

const express = require('express');
const path = require('path');
const { SoftyComp } = require('../dist/index.js');

const app = express();
const PORT = 4021;

// Security headers (must be first)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// SoftyComp sandbox client
// Credentials default to sandbox test keys for demo purposes
const client = new SoftyComp({
  apiKey: process.env.SOFTYCOMP_API_KEY || '97E932D2-EC27-4583-B8E4-EDC87C8019BA',
  secretKey: process.env.SOFTYCOMP_SECRET_KEY || 'OEPQKMxopavCtvmvwE3Y',
  sandbox: true,
});

// In-memory stores
const webhookHistory = [];
const sseClients = [];

// ==================== Status & Info ====================

app.get('/api/status', async (req, res) => {
  try {
    // Test authentication
    await client.authenticate();
    res.json({
      success: true,
      environment: 'sandbox',
      baseUrl: 'https://sandbox.softycomp.co.za/SoftyCompBureauAPI',
      authenticated: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================== Bill Presentment ====================

app.post('/api/bill', async (req, res) => {
  try {
    const {
      amount,
      customerName,
      customerEmail,
      customerPhone,
      reference,
      description,
      frequency,
      commencementDate,
      recurringDay,
      recurringMonth,
      dayOfWeek,
      companyName,
      companyContact,
      companyEmail,
    } = req.body;

    const billParams = {
      amount: parseFloat(amount),
      customerName,
      customerEmail,
      customerPhone,
      reference,
      description: description || 'Payment',
      frequency,
      returnUrl: `http://localhost:${PORT}/payment-success`,
      cancelUrl: `http://localhost:${PORT}/payment-cancel`,
      notifyUrl: `http://localhost:${PORT}/webhook`,
      companyName,
      companyContact,
      companyEmail,
    };

    // Add recurring fields if applicable
    if (frequency !== 'once-off') {
      if (commencementDate) billParams.commencementDate = commencementDate;
      if (recurringDay) billParams.recurringDay = parseInt(recurringDay);
      if (recurringMonth) billParams.recurringMonth = parseInt(recurringMonth);
      if (dayOfWeek) billParams.recurringDay = parseInt(dayOfWeek);
    }

    const result = await client.createBill(billParams);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/bill/:ref', async (req, res) => {
  try {
    const result = await client.getBillStatus(req.params.ref);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

app.post('/api/bill/update', async (req, res) => {
  try {
    const { reference, amount, description, customerName, customerEmail, customerPhone } = req.body;

    const updateParams = { reference };
    if (amount) updateParams.amount = parseFloat(amount);
    if (description) updateParams.description = description;
    if (customerName) updateParams.customerName = customerName;
    if (customerEmail) updateParams.customerEmail = customerEmail;
    if (customerPhone) updateParams.customerPhone = customerPhone;

    await client.updateBillPresentment(updateParams);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

app.post('/api/bill/expire', async (req, res) => {
  try {
    const { reference, userReference } = req.body;
    await client.setBillToExpiredStatus(reference, userReference || reference);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/bill/:ref/audits', async (req, res) => {
  try {
    const { userRef } = req.query;
    const result = await client.listBillPresentmentAudits(
      req.params.ref,
      userRef || req.params.ref
    );
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

app.post('/api/bill/reauth', async (req, res) => {
  try {
    const {
      oldReference,
      reference,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      description,
      frequency,
      billingCycle,
    } = req.body;

    const result = await client.createReauthBill({
      oldReference,
      newReference: reference || `reauth_${Date.now()}`,
      amount: parseFloat(amount),
      customerName,
      customerEmail,
      customerPhone,
      description: description || 'Re-authentication',
      billingCycle: billingCycle || frequency?.toUpperCase() || 'MONTHLY',
      successUrl: `http://localhost:${PORT}/payment-success`,
      cancelUrl: `http://localhost:${PORT}/payment-cancel`,
      notifyUrl: `http://localhost:${PORT}/webhook`,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================== Refunds ====================

app.post('/api/refund', async (req, res) => {
  try {
    const { reference, transactionId, amount } = req.body;
    const refundParams = { transactionId: transactionId || reference };
    if (amount) refundParams.amount = parseFloat(amount);

    const result = await client.refund(refundParams);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================== Client Management ====================

app.post('/api/client', async (req, res) => {
  try {
    const { firstName, lastName, name, surname, email, phone, idNumber } = req.body;
    const clientId = await client.createClient({
      name: firstName || name || 'Client',
      surname: lastName || surname || 'User',
      email,
      phone,
      idNumber,
    });
    res.json({
      success: true,
      data: { clientId },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================== Mobi-Mandate (Debit Orders) ====================

app.post('/api/mandate', async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      surname,
      initials,
      idNumber,
      amount,
      frequency,
      debitDay,
      description,
      reference,
      commencementDate,
    } = req.body;

    // Extract surname from customerName if not provided
    const fullName = customerName || 'Customer User';
    const nameParts = fullName.split(' ');
    const extractedSurname = surname || nameParts[nameParts.length - 1] || 'User';
    const extractedInitials = initials || extractedSurname.charAt(0);

    const mandateParams = {
      customerEmail,
      customerPhone,
      surname: extractedSurname,
      initials: extractedInitials,
      amount: parseFloat(amount),
      frequency: frequency || 'monthly',
      debitDay: parseInt(debitDay) || 1,
      description: description || reference || 'Debit Order',
      successUrl: `http://localhost:${PORT}/mandate-success`,
      callbackUrl: `http://localhost:${PORT}/webhook`,
    };

    if (idNumber) mandateParams.idNumber = idNumber;
    if (commencementDate) mandateParams.commencementDate = commencementDate;

    const result = await client.createMobiMandate(mandateParams);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

app.post('/api/collection/status', async (req, res) => {
  try {
    const { reference, collectionId, status, statusTypeId } = req.body;

    // Map status string to statusTypeId if needed
    let finalStatusTypeId = statusTypeId;
    if (!finalStatusTypeId && status) {
      const statusMap = {
        'suspend': 6,
        'cancel': 6,
        'active': 1,
        'resume': 1,
      };
      finalStatusTypeId = statusMap[status.toLowerCase()] || 6;
    }

    // Note: This endpoint requires a collectionId which we don't have from a reference
    // In a real app, you'd need to fetch the collection first or store the ID
    const finalCollectionId = collectionId || 1; // Placeholder for demo

    await client.updateCollectionStatus({
      collectionId: parseInt(finalCollectionId),
      statusTypeId: parseInt(finalStatusTypeId),
    });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================== Credit Distribution (Payouts) ====================

app.post('/api/payout', async (req, res) => {
  try {
    const { amount, accountNumber, branchCode, accountName, accountHolder, reference } = req.body;
    const result = await client.createCreditDistribution({
      amount: parseFloat(amount),
      accountNumber,
      branchCode,
      accountName: accountName || accountHolder,
      reference: reference || `payout_${Date.now()}`,
    });
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================== Webhooks ====================

const webhookHandler = express.json();

app.post('/webhook', webhookHandler, (req, res) => {
  try {
    const event = client.parseWebhook(req.body);
    const webhookEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      event,
      raw: req.body,
    };

    webhookHistory.unshift(webhookEntry);
    if (webhookHistory.length > 100) webhookHistory.pop();

    // Broadcast to SSE clients
    sseClients.forEach(client => {
      client.res.write(`data: ${JSON.stringify(webhookEntry)}\n\n`);
    });

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send('Bad Request');
  }
});

// Alias for API consistency
app.post('/api/webhook', webhookHandler, (req, res) => {
  try {
    const event = client.parseWebhook(req.body);
    const webhookEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      event,
      raw: req.body,
    };

    webhookHistory.unshift(webhookEntry);
    if (webhookHistory.length > 100) webhookHistory.pop();

    // Broadcast to SSE clients
    sseClients.forEach(client => {
      client.res.write(`data: ${JSON.stringify(webhookEntry)}\n\n`);
    });

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send('Bad Request');
  }
});

app.get('/api/webhooks', (req, res) => {
  res.json({
    success: true,
    data: webhookHistory,
  });
});

// SSE for live webhook feed
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  req.on('close', () => {
    const index = sseClients.findIndex(c => c.id === clientId);
    if (index !== -1) sseClients.splice(index, 1);
  });
});

// ==================== Static Pages ====================

app.get('/payment-success', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Success</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .container {
          text-align: center;
          padding: 2rem;
        }
        .success-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        h1 { margin: 0 0 0.5rem; }
        p { opacity: 0.9; }
        a {
          display: inline-block;
          margin-top: 2rem;
          padding: 0.75rem 2rem;
          background: white;
          color: #667eea;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success-icon">✓</div>
        <h1>Payment Successful</h1>
        <p>Your payment has been processed successfully.</p>
        <a href="/">Return to Playground</a>
      </div>
    </body>
    </html>
  `);
});

app.get('/payment-cancel', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Cancelled</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }
        .container {
          text-align: center;
          padding: 2rem;
        }
        .cancel-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        h1 { margin: 0 0 0.5rem; }
        p { opacity: 0.9; }
        a {
          display: inline-block;
          margin-top: 2rem;
          padding: 0.75rem 2rem;
          background: white;
          color: #f5576c;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="cancel-icon">✕</div>
        <h1>Payment Cancelled</h1>
        <p>Your payment was cancelled.</p>
        <a href="/">Return to Playground</a>
      </div>
    </body>
    </html>
  `);
});

app.get('/mandate-success', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Mandate Success</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .container {
          text-align: center;
          padding: 2rem;
        }
        .success-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        h1 { margin: 0 0 0.5rem; }
        p { opacity: 0.9; }
        a {
          display: inline-block;
          margin-top: 2rem;
          padding: 0.75rem 2rem;
          background: white;
          color: #667eea;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success-icon">✓</div>
        <h1>Mandate Signed</h1>
        <p>Your debit order mandate has been successfully signed.</p>
        <a href="/">Return to Playground</a>
      </div>
    </body>
    </html>
  `);
});

// ==================== Server Start ====================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║       SoftyComp Developer Playground                          ║
║       Interactive API Explorer                                ║
║                                                               ║
║       🚀 Server running on http://localhost:${PORT}            ║
║       📦 Powered by softycomp-node SDK                        ║
║       🔧 Sandbox environment                                  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});
