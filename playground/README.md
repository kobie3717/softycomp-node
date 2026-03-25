# SoftyComp Developer Playground

Interactive API explorer for the `softycomp-node` SDK — a beautiful, polished demo showcasing all SoftyComp API capabilities.

## Features

- **Dashboard** - Connection status, quick stats, and npm install command
- **Card Payments** - Create once-off and recurring bills with all frequency types
- **Bill Management** - Get status, update, expire, view audit trail, and re-authenticate bills
- **Debit Orders** - Create Mobi-Mandate and manage collection status
- **Clients & Payouts** - Create client profiles and process credit distributions
- **Webhooks** - Live webhook feed (SSE) and history viewer
- **Code Examples** - Copy-paste examples for all operations
- **API Reference** - Complete endpoint documentation with test cards

## Stack

- **Backend**: Express.js (Node.js)
- **Frontend**: Vanilla JavaScript (no frameworks)
- **SDK**: softycomp-node (local parent package)
- **Design**: Professional dark theme with SoftyComp branding

## Installation

```bash
cd /root/softycomp-node/playground
npm install
```

## Running

### Development Mode (auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### PM2 (production)
```bash
pm2 start server.js --name softycomp-playground
pm2 save
```

## Access

- **Local**: http://localhost:4021
- **External**: http://45.10.161.148:4021 (if firewall configured)

## Configuration

The playground uses SoftyComp sandbox credentials hardcoded in `server.js`:

```javascript
const client = new SoftyComp({
  apiKey: '97E932D2-EC27-4583-B8E4-EDC87C8019BA',
  secretKey: 'OEPQKMxopavCtvmvwE3Y',
  sandbox: true,
});
```

## Test Cards (Sandbox Only)

| Card Number | 3DS | MOTO | Description |
|-------------|-----|------|-------------|
| `4790 4444 4444 4444` | Success | Success | Both 3DS and MOTO succeed |
| `4790 3333 3333 3333` | Success | Fail | 3DS succeeds, MOTO fails |

**CVV**: Any 3 digits
**Expiry**: Any future date

## Features Demonstrated

### Bill Presentment
- Once-off bills
- Monthly recurring bills
- Weekly recurring bills (with DayOfWeek)
- Yearly recurring bills (with RecurringMonth)
- Subscription bills
- Get bill status
- Update bill details
- Expire/cancel bills
- View audit trail
- Re-authenticate bills (card expiry handling)

### Debit Orders
- Create Mobi-Mandate sign-up links
- Update collection status (activate/suspend/cancel)

### Client Management
- Create client profiles with SA ID validation

### Payouts
- Credit distribution to bank accounts

### Refunds
- Full refunds
- Partial refunds

### Webhooks
- Live webhook feed (Server-Sent Events)
- Webhook history viewer
- All webhook types: Pending, Successful, Failed, Cancelled
- Real-time toast notifications

## Architecture

```
playground/
├── server.js           # Express backend (all API endpoints)
├── public/
│   ├── index.html      # Single-page app
│   ├── style.css       # Professional dark theme
│   └── app.js          # Frontend logic (forms, SSE, tabs)
├── package.json        # Dependencies
└── README.md           # This file
```

## API Endpoints

All endpoints are proxies to the softycomp-node SDK:

- `GET /api/status` - Connection status
- `POST /api/bill` - Create bill
- `GET /api/bill/:ref` - Get bill status
- `POST /api/bill/update` - Update bill
- `POST /api/bill/expire` - Expire bill
- `GET /api/bill/:ref/audits` - Bill audit trail
- `POST /api/bill/reauth` - Re-authenticate bill
- `POST /api/refund` - Process refund
- `POST /api/client` - Create client
- `POST /api/mandate` - Create Mobi-Mandate
- `POST /api/collection/status` - Update collection status
- `POST /api/payout` - Credit distribution
- `POST /webhook` - Webhook receiver
- `GET /api/webhooks` - Webhook history
- `GET /events` - SSE stream for live webhooks

## Purpose

This playground is designed to impress SoftyComp directly — it showcases ONLY their API with no mention of competitors or "coming soon" features. It's a love letter to their platform, demonstrating the first Node.js SDK for SoftyComp.

## License

MIT
