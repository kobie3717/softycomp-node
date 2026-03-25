# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-03-25

### Added

#### Bill Management
- `setBillToExpiredStatus(reference, userReference)` - Set a bill to expired status
- `updateBillPresentment(params)` - Update bill presentment details (amount, description, customer info)
- `listBillPresentmentAudits(reference, userReference)` - Get audit trail for a bill

#### Client Management
- `createClient(params)` - Create a new client profile

#### Mobi-Mandate (Debit Orders)
- `createMobiMandate(params)` - Generate Mobi-Mandate link for debit order sign-up
- `updateCollectionStatus(params)` - Update collection status (e.g., cancel debit order)

#### Payouts
- `createCreditDistribution(params)` - Send money to a bank account (credit distribution)

#### Re-authentication
- `createReauthBill(params)` - Handle card expiry by expiring old bill and creating new one

#### TypeScript Types
- `UpdateBillParams` - Parameters for updating bills
- `BillAudit` - Bill audit trail entry
- `CreateClientParams` - Client creation parameters
- `CreateMobiMandateParams` - Mobi-Mandate creation parameters
- `MobiMandateResult` - Mobi-Mandate result
- `UpdateCollectionStatusParams` - Collection status update parameters
- `CreditDistributionParams` - Credit distribution parameters
- `CreditDistributionResult` - Credit distribution result
- `CreateReauthBillParams` - Re-auth bill creation parameters

### Changed
- Updated `mapBillStatus()` to handle statusTypeID 6 (Arrears) and 7 (ReAuth Required)
- Enhanced webhook parsing to detect card expiry/re-auth events

### Documentation
- Added comprehensive examples for all new methods
- Updated README.md with full API coverage
- Added TypeScript type exports documentation

## [1.0.5] - Previous release

Initial public release with core functionality:
- Bill presentment (once-off and recurring)
- Bill status checking
- Refunds
- Webhook handling
