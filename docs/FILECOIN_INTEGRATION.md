# Filecoin Integration for LendingDAO

## Overview

The Filecoin integration adds decentralized document storage capabilities to the LendingDAO ecosystem, enabling secure, immutable storage of loan agreements, governance documents, member KYC data, and automatic backup systems.

## Architecture

### Core Components

1. **IFilecoin.sol** - Interface definitions for Filecoin integration
2. **FilecoinStorage.sol** - Main storage contract managing documents and deals
3. **LendingDAOWithFilecoin.sol** - Enhanced DAO with Filecoin integration

### Key Features

- **Document Management**: Store and categorize different types of documents
- **Storage Deals**: Automatic creation and tracking of Filecoin storage deals
- **Access Control**: Private and public document access permissions
- **Automatic Backup**: Scheduled DAO state backups with encryption
- **Fee Collection**: Automatic collection of storage fees from transactions
- **Batch Operations**: Efficient batch document storage and member backups

## Document Types

The system supports several document categories:

```solidity
enum DocumentType {
    GOVERNANCE_PROPOSAL,    // Governance proposals and voting documents
    LOAN_AGREEMENT,        // Loan contracts and agreements
    MEMBER_KYC,           // Know Your Customer verification documents
    AUDIT_LOG,            // DAO state backup logs
    MEMBER_BACKUP,        // Individual member data backups
    TREASURY_RECORD,      // Treasury transaction records
    LEGAL_DOCUMENT        // Legal and compliance documents
}
```

## Storage Deal Management

### Deal Structure

```solidity
struct StorageDeal {
    uint256 dealId;
    string ipfsHash;
    uint256 fileSize;
    uint256 duration;
    uint256 price;
    address client;
    uint256 startTime;
    uint256 endTime;
    DealStatus status;
    string metadata;
}
```

### Deal Status

- `PENDING`: Deal is being negotiated
- `ACTIVE`: Deal is active and data is stored
- `EXPIRED`: Deal has expired
- `FAILED`: Deal failed or was cancelled

## Key Functions

### Document Storage

#### Store Document
```solidity
function storeDocument(
    DocumentType _docType,
    string memory _title,
    string memory _description,
    string memory _ipfsHash,
    uint256 _fileSize,
    bool _isEncrypted,
    bool _isPublic,
    string memory _metadata
) external payable returns (uint256)
```

#### Store Loan Agreement (Automatic)
```solidity
function storeLoanAgreement(
    uint256 _loanId,
    address _borrower,
    string memory _ipfsHash,
    uint256 _fileSize
) external payable onlyOwner returns (uint256)
```

#### Batch Store Documents
```solidity
function batchStoreDocuments(
    DocumentData[] memory _documents,
    string[] memory _ipfsHashes
) external payable returns (uint256[] memory)
```

### Backup System

#### Create DAO Backup
```solidity
function createDAOBackup(
    uint256 _memberCount,
    uint256 _proposalCount,
    uint256 _loanCount,
    uint256 _treasuryBalance,
    string memory _backupHash
) external onlyOwner returns (uint256)
```

#### Auto-Backup Checker
```solidity
function daoNeedsBackup() external view returns (bool)
function memberNeedsBackup(address _member) external view returns (bool)
```

### Document Retrieval

#### Get Document
```solidity
function getDocument(uint256 _documentId) external view returns (
    DocumentRecord memory document,
    string memory ipfsHash
)
```

#### Get Documents by Type
```solidity
function getDocumentsByType(DocumentType _docType) external view returns (uint256[] memory)
```

#### Get Member Documents
```solidity
function getMemberDocuments(address _member) external view returns (uint256[] memory)
```

## Enhanced DAO Functions

### Member Registration with KYC

```solidity
function registerMemberWithKYC(
    string memory _kycIPFSHash, 
    uint256 _kycFileSize
) external payable
```

Allows members to register with optional KYC document storage.

### Proposal Document Storage

```solidity
function storeProposalDocument(
    uint256 _proposalId,
    string memory _ipfsHash,
    uint256 _fileSize,
    string memory _title
) external payable onlyMember returns (uint256)
```

Store supporting documents for governance proposals.

### Governance Document Storage

```solidity
function storeGovernanceDocument(
    string memory _title,
    string memory _description,
    string memory _ipfsHash,
    uint256 _fileSize,
    bool _isPublic
) external payable onlyMember returns (uint256)
```

Store general governance-related documents.

## Storage Fee System

The system automatically collects a small percentage (1%) from transactions to fund storage operations:

- **Member Registration**: 1% fee collected for storage pool
- **Loan Repayment**: 1% fee collected for storage pool
- **Manual Storage**: Direct payment for storage costs

### Fee Pool Management

```solidity
uint256 public storageFeePool; // Accumulated fees
uint256 public constant STORAGE_FEE_PERCENTAGE = 100; // 1% (in basis points)
```

## Configuration Options

### Auto Storage Settings

```solidity
function setAutoDocumentStorageEnabled(bool _enabled) external onlyAdmin
function setAutoBackupEnabled(bool _enabled) external onlyAdmin
```

### Storage Pricing

```solidity
function setStoragePrice(uint256 _newPrice) external onlyOwner
function setBackupInterval(uint256 _newInterval) external onlyOwner
```

### Configuration Function

```solidity
function configureFilecoinStorage(
    uint256 _storagePrice, 
    uint256 _backupInterval
) external onlyAdmin
```

## Access Control

### Document Privacy

- **Public Documents**: Accessible to all DAO members
- **Private Documents**: Only accessible to document owner and admins
- **Encrypted Documents**: Additional encryption layer for sensitive data

### Admin Functions

- Configure storage settings
- Trigger manual backups
- Withdraw accumulated storage fees
- Batch backup member data

### Member Functions

- Store personal documents
- Access own documents
- Store proposal-related documents
- View public documents

## Storage Cost Calculation

```solidity
function calculateStorageCost(uint256 _fileSize, uint256 _duration) public view returns (uint256)
```

**Formula**: 
- File size converted to GB (rounded up)
- Duration converted to years (rounded up)
- Cost = `storagePrice * fileSizeGB * durationYears`

**Default Settings**:
- Storage Duration: 365 days (1 year)
- Storage Price: 0.001 ETH per GB per year
- Auto-backup Interval: 7 days

## Events

### Document Events
```solidity
event DocumentStored(uint256 indexed documentId, DocumentType indexed docType, address indexed owner, string ipfsHash, uint256 fileSize)
event DocumentRetrieved(uint256 indexed documentId, address indexed requester, string ipfsHash)
```

### Storage Deal Events
```solidity
event StorageDealCreated(uint256 indexed dealId, uint256 indexed documentId, string ipfsHash, uint256 duration, uint256 price)
```

### Backup Events
```solidity
event BackupCreated(uint256 indexed snapshotId, uint256 blockNumber, string snapshotHash, uint256 dataPoints)
event AutoBackupTriggered(uint256 indexed snapshotId, string ipfsHash)
```

### DAO Integration Events
```solidity
event LoanDocumentStored(uint256 indexed loanId, uint256 indexed documentId, string ipfsHash)
event ProposalDocumentStored(uint256 indexed proposalId, uint256 indexed documentId, string ipfsHash)
event MemberKYCStored(address indexed member, uint256 indexed documentId, string ipfsHash)
event StorageFeeCollected(uint256 amount, string purpose)
```

## Usage Examples

### Basic Document Storage

```javascript
// Calculate storage cost
const fileSize = 5000; // 5KB
const storageCost = await filecoinStorage.calculateStorageCost(
    fileSize, 
    await filecoinStorage.DEFAULT_STORAGE_DURATION()
);

// Store document
const tx = await filecoinStorage.storeDocument(
    1, // DocumentType.GOVERNANCE_PROPOSAL
    "Community Guidelines",
    "DAO governance guidelines and procedures",
    "QmExampleIPFSHash123",
    fileSize,
    false, // not encrypted
    true,  // public to all members
    '{"category":"governance","version":"1.0"}',
    { value: storageCost }
);
```

### Member Registration with KYC

```javascript
const membershipFee = await dao.membershipFee();
const kycStorageCost = await filecoinStorage.calculateStorageCost(kycFileSize, defaultDuration);
const totalCost = membershipFee + kycStorageCost;

await dao.connect(member).registerMemberWithKYC(
    "QmKYCDocumentHash",
    kycFileSize,
    { value: totalCost }
);
```

### Automatic Loan Document Storage

```javascript
// Enable automatic storage
await dao.setAutoDocumentStorageEnabled(true);

// When a loan is approved, document is automatically stored
// (if sufficient fees are available in storage pool)
```

### Manual Backup

```javascript
// Admin triggers manual backup
await dao.triggerManualBackup("QmBackupHash123");

// Check backup status
const needsBackup = await filecoinStorage.daoNeedsBackup();
const lastBackup = await filecoinStorage.lastSnapshotTime();
```

## Integration Benefits

### For the DAO

1. **Immutable Records**: All important documents are stored immutably on Filecoin
2. **Audit Trail**: Complete backup history for governance transparency
3. **Cost Efficiency**: Automated fee collection funds storage operations
4. **Decentralization**: No reliance on centralized storage providers

### For Members

1. **Document Security**: Personal documents stored securely with access control
2. **Transparency**: Public access to governance documents
3. **Privacy**: Private documents remain accessible only to authorized parties
4. **Backup Assurance**: Automatic backups ensure data preservation

### For Governance

1. **Proposal Documentation**: Rich documentation for governance proposals
2. **Historical Records**: Complete history of decisions and discussions
3. **Compliance**: Meet regulatory requirements for record keeping
4. **Transparency**: Public access to governance materials

## Security Considerations

### Access Control
- Multi-layered permission system
- Owner-based document access
- Admin emergency functions
- Member privacy protection

### Data Integrity
- IPFS content addressing ensures data integrity
- Filecoin provides redundancy and availability
- Automatic backup verification

### Financial Security
- Reentrancy protection on all payable functions
- Excess payment refunding
- Emergency fund withdrawal capabilities

## Gas Optimization

### Batch Operations
- Batch document storage reduces gas costs
- Batch member backups for efficiency
- Optimized struct packing

### Storage Efficiency
- Mapping-based document organization
- Array-based categorization
- Minimal on-chain metadata storage

## Testing

The integration includes comprehensive tests covering:

- Basic document storage and retrieval
- Access control enforcement
- Storage deal creation and tracking
- Automatic backup functionality
- Fee collection and management
- Batch operations
- Edge cases and error handling

Run tests:
```bash
npx hardhat test test/FilecoinIntegration.test.js
```

## Deployment

### Prerequisites
1. Hardhat environment configured
2. Sufficient ETH for deployment gas
3. OpenZeppelin contracts installed

### Steps
1. Deploy LendingDAOWithFilecoin contract
2. FilecoinStorage is automatically deployed in constructor
3. Initialize DAO with desired parameters
4. Configure storage settings as needed

### Configuration
```javascript
// Enable automatic features
await dao.setAutoDocumentStorageEnabled(true);
await dao.setAutoBackupEnabled(true);

// Configure storage pricing
await dao.configureFilecoinStorage(
    ethers.parseEther("0.002"), // 0.002 ETH per GB per year
    14 * 24 * 60 * 60          // 14 day backup interval
);
```

## Monitoring and Analytics

### Storage Overview
```solidity
function getStorageOverview() external view returns (
    uint256 totalDocuments,
    uint256 totalStorageDeals,
    uint256 totalBackups,
    uint256 availableStorageFees,
    bool autoStorageEnabled,
    bool autoBackupEnabledStatus,
    uint256 lastBackupTime,
    bool needsBackup
)
```

### Storage Statistics
```solidity
function getStorageStatistics() external view returns (
    uint256 totalDocuments,
    uint256 totalDeals,
    uint256 totalSnapshots,
    uint256 storageFees
)
```

## Future Enhancements

### Planned Features
1. **Advanced Encryption**: Integration with member-specific encryption keys
2. **Storage Provider Selection**: Choose specific Filecoin storage providers
3. **Data Lifecycle Management**: Automatic data archival and retrieval
4. **Enhanced Metadata**: Rich metadata schemas for different document types
5. **Cross-Chain Storage**: Integration with other decentralized storage networks

### Optimization Opportunities
1. **Gas Optimization**: Further reduce gas costs through optimized storage patterns
2. **Bulk Operations**: Enhanced batch operations for large-scale document management
3. **Caching Layer**: IPFS pinning services for faster retrieval
4. **Compression**: Automatic data compression before storage

## Troubleshooting

### Common Issues

#### Contract Size Limit
If deployment fails due to contract size:
```javascript
// In hardhat.config.js
networks: {
  hardhat: {
    allowUnlimitedContractSize: true
  }
}
```

#### Insufficient Storage Payment
Ensure sufficient payment for storage operations:
```javascript
const requiredCost = await filecoinStorage.calculateStorageCost(fileSize, duration);
// Add 10% buffer for gas price fluctuations
const payment = requiredCost * 110 / 100;
```

#### Access Denied Errors
Verify document access permissions:
- Check if document is public or owned by caller
- Ensure caller is admin for restricted operations
- Verify member status for member-only functions

## Security Best Practices

1. **Input Validation**: Always validate IPFS hashes and file sizes
2. **Payment Verification**: Verify sufficient payment before storage operations
3. **Access Control**: Implement proper permission checks
4. **Backup Verification**: Regularly verify backup integrity
5. **Emergency Procedures**: Maintain admin emergency functions

## Contributing

When contributing to the Filecoin integration:

1. Follow existing code patterns and documentation standards
2. Add comprehensive tests for new features
3. Update documentation for any API changes
4. Consider gas optimization impacts
5. Ensure backward compatibility where possible

## License

This Filecoin integration is part of the LendingDAO project and follows the same MIT license terms.
