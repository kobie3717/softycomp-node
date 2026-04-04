# SoftyComp API Coverage

## Version 1.1.0 Coverage

### ✅ Implemented Endpoints

#### Authentication
- `POST /api/auth/generatetoken` - Get Bearer token

#### Bill Presentment
- `POST /api/paygatecontroller/requestbillpresentment` - Create bill
- `GET /api/paygatecontroller/listBillPresentmentDetails/{ref}/{userRef}` - Get bill status
- `POST /api/paygatecontroller/setBillToExpiredStatus/{ref}/{userRef}` - Expire bill
- `POST /api/paygatecontroller/updateBillPresentment` - Update bill details
- `GET /api/paygatecontroller/listBillPresentmentAudits/{ref}/{userRef}` - List audit trail

#### Refunds
- `POST /api/paygatecontroller/requestCreditTransaction` - Process refund

#### Client Management
- `POST /api/clients/createclient` - Create client profile

#### Mobi-Mandate (Debit Orders)
- `POST /api/mobimandate/generateMobiMandateRequest` - Generate mandate link
- `POST /api/collections/updateCollectionStatus` - Update collection status

#### Payouts
- `POST /api/creditdistribution/createCreditDistribution` - Send payout

#### High-Level Methods
- `createReauthBill()` - Combo method: expire old bill + create new bill (handles card expiry)

### 📊 Coverage Stats

**v1.0.5:** 4 methods (~20% API coverage)
- authenticate
- createBill
- getBillStatus
- refund

**v1.1.0:** 12 methods (~80% API coverage)
- authenticate ✅
- createBill ✅
- getBillStatus ✅
- setBillToExpiredStatus ✅ NEW
- updateBillPresentment ✅ NEW
- listBillPresentmentAudits ✅ NEW
- refund ✅
- createClient ✅ NEW
- createMobiMandate ✅ NEW
- updateCollectionStatus ✅ NEW
- createCreditDistribution ✅ NEW
- createReauthBill ✅ NEW

### 🚫 Not Implemented (Lower Priority)

The following endpoints exist in the SoftyComp API but are less commonly used:

#### Products
- `POST /api/products/createproduct` - Create product
- `GET /api/products/listproducts` - List products

#### Collections (Advanced)
- `GET /api/collections/listcollections/{clientId}` - List collections for client
- `GET /api/collections/getcollectiondetails/{collectionId}` - Get collection details

#### Transactions & Reconciliation
- `POST /api/paygatecontroller/listTransactions` - List transactions by date
- `GET /api/paygatecontroller/listReconSuccessfulRecords/{fromDate}/{toDate}` - List recon records

These can be added in future versions if needed. The WhatsAuction reference implementation includes helpers for some of these (see `softycomp.ts` lines 545-603).

## Migration from 1.0.5 to 1.1.0

100% backward compatible. All existing code will work without changes. Just install the new version:

```bash
npm install softycomp-node@1.1.0
```

Then import the new types/methods as needed:

```typescript
import {
  SoftyComp,
  CreateMobiMandateParams,
  CreditDistributionParams,
  // ... etc
} from 'softycomp-node';
```
