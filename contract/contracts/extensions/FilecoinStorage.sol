// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IFilecoin.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FilecoinStorage
 * @dev Filecoin integration for decentralized document storage and governance audit trails
 * @notice Manages storage deals for loan documents, member data, and governance records
 */
contract FilecoinStorage is Ownable, ReentrancyGuard {
    
    // Storage configuration
    uint256 public constant DEFAULT_STORAGE_DURATION = 365 days; // 1 year default storage
    uint256 public constant MIN_STORAGE_DURATION = 30 days;
    uint256 public constant MAX_STORAGE_DURATION = 1095 days; // 3 years max
    
    // Storage pricing (per GB per year in FIL/ETH equivalent)
    uint256 public storagePrice = 0.001 ether; // Configurable storage price
    uint256 public autoBackupInterval = 7 days; // Weekly auto-backup
    
    // Document registry
    mapping(uint256 => DocumentRecord) public documents; // documentId => DocumentRecord
    mapping(address => uint256[]) public memberDocuments; // member => documentIds
    mapping(DocumentType => uint256[]) public documentsByType; // type => documentIds
    mapping(uint256 => string) public documentIPFSHashes; // documentId => IPFS hash
    
    // Storage deals tracking
    mapping(uint256 => StorageDeal) public storageDeals; // dealId => StorageDeal
    mapping(string => uint256) public ipfsHashToDeal; // ipfsHash => dealId
    mapping(uint256 => uint256[]) public documentStorageDeals; // documentId => dealIds[]
    
    // Auto-backup system
    mapping(uint256 => uint256) public lastBackupTime; // proposalId/loanId => timestamp
    mapping(address => uint256) public memberLastBackup; // member => timestamp
    
    uint256 public documentCounter;
    uint256 public dealCounter;
    
    // Document record structure
    struct DocumentRecord {
        uint256 documentId;
        DocumentType docType;
        address owner;          // Member who owns/created the document
        string title;           // Human-readable title
        string description;     // Document description
        uint256 createdAt;      // Creation timestamp
        uint256 fileSize;       // Size in bytes
        bool isEncrypted;       // Whether document is encrypted
        string encryptionKey;   // Encryption key reference (if applicable)
        bool isPublic;          // Whether document is publicly accessible to all members
        uint256[] associatedDeals; // Storage deal IDs
        string metadata;        // Additional metadata JSON
    }
    
    // Backup snapshot structure
    struct BackupSnapshot {
        uint256 snapshotId;
        uint256 blockNumber;
        uint256 timestamp;
        string snapshotHash;    // IPFS hash of the backup data
        uint256 memberCount;
        uint256 proposalCount;
        uint256 loanCount;
        uint256 treasuryBalance;
    }
    
    mapping(uint256 => BackupSnapshot) public backupSnapshots;
    uint256 public snapshotCounter;
    uint256 public lastSnapshotTime;
    
    // Events
    event DocumentStored(
        uint256 indexed documentId,
        DocumentType indexed docType,
        address indexed owner,
        string ipfsHash,
        uint256 fileSize
    );
    
    event StorageDealCreated(
        uint256 indexed dealId,
        uint256 indexed documentId,
        string ipfsHash,
        uint256 duration,
        uint256 price
    );
    
    event DocumentRetrieved(
        uint256 indexed documentId,
        address indexed requester,
        string ipfsHash
    );
    
    event BackupCreated(
        uint256 indexed snapshotId,
        uint256 blockNumber,
        string snapshotHash,
        uint256 dataPoints
    );
    
    event StoragePriceUpdated(uint256 newPrice);
    event BackupIntervalUpdated(uint256 newInterval);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice Store a document on Filecoin with IPFS integration
     * @param _docType Type of document being stored
     * @param _title Human-readable title for the document
     * @param _description Description of the document
     * @param _ipfsHash IPFS hash of the uploaded document
     * @param _fileSize Size of the file in bytes
     * @param _isEncrypted Whether the document is encrypted
     * @param _isPublic Whether the document is accessible to all members
     * @param _metadata Additional metadata in JSON format
     * @return documentId The ID of the stored document
     */
    function storeDocument(
        DocumentType _docType,
        string memory _title,
        string memory _description,
        string memory _ipfsHash,
        uint256 _fileSize,
        bool _isEncrypted,
        bool _isPublic,
        string memory _metadata
    ) external payable nonReentrant returns (uint256) {
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_fileSize > 0, "File size must be greater than 0");
        
        // Calculate storage cost
        uint256 storageCost = calculateStorageCost(_fileSize, DEFAULT_STORAGE_DURATION);
        require(msg.value >= storageCost, "Insufficient payment for storage");
        
        uint256 documentId = ++documentCounter;
        
        // Create document record
        documents[documentId] = DocumentRecord({
            documentId: documentId,
            docType: _docType,
            owner: msg.sender,
            title: _title,
            description: _description,
            createdAt: block.timestamp,
            fileSize: _fileSize,
            isEncrypted: _isEncrypted,
            encryptionKey: "", // Set separately if needed
            isPublic: _isPublic,
            associatedDeals: new uint256[](0),
            metadata: _metadata
        });
        
        // Store IPFS hash mapping
        documentIPFSHashes[documentId] = _ipfsHash;
        
        // Add to member's documents
        memberDocuments[msg.sender].push(documentId);
        
        // Add to type-based categorization
        documentsByType[_docType].push(documentId);
        
        // Create Filecoin storage deal
        uint256 dealId = _createStorageDeal(documentId, _ipfsHash, _fileSize, DEFAULT_STORAGE_DURATION, storageCost);
        
        emit DocumentStored(documentId, _docType, msg.sender, _ipfsHash, _fileSize);
        
        // Refund excess payment
        if (msg.value > storageCost) {
            payable(msg.sender).transfer(msg.value - storageCost);
        }
        
        return documentId;
    }
    
    /**
     * @notice Store loan agreement document automatically
     * @param _loanId The loan ID this document relates to
     * @param _borrower The borrower address
     * @param _ipfsHash IPFS hash of the loan agreement
     * @param _fileSize Size of the file
     * @return documentId The stored document ID
     */
    function storeLoanAgreement(
        uint256 _loanId,
        address _borrower,
        string memory _ipfsHash,
        uint256 _fileSize
    ) external payable onlyOwner returns (uint256) {
        
        string memory title = string(abi.encodePacked("Loan Agreement #", _uint2str(_loanId)));
        string memory description = string(abi.encodePacked("Loan agreement for borrower ", _addressToString(_borrower)));
        
        // Create metadata JSON
        string memory metadata = string(abi.encodePacked(
            '{"loanId":', _uint2str(_loanId), 
            ',"borrower":"', _addressToString(_borrower), 
            '","type":"loan_agreement"}'
        ));
        
        return this.storeDocument(
            DocumentType.LOAN_AGREEMENT,
            title,
            description,
            _ipfsHash,
            _fileSize,
            false, // Not encrypted by default
            false, // Not public - only accessible to involved parties
            metadata
        );
    }
    
    /**
     * @notice Create automatic backup of DAO state
     * @param _memberCount Current number of members
     * @param _proposalCount Current number of proposals
     * @param _loanCount Current number of loans
     * @param _treasuryBalance Current treasury balance
     * @param _backupHash IPFS hash of the backup data
     * @return snapshotId The backup snapshot ID
     */
    function createDAOBackup(
        uint256 _memberCount,
        uint256 _proposalCount,
        uint256 _loanCount,
        uint256 _treasuryBalance,
        string memory _backupHash
    ) external onlyOwner returns (uint256) {
        require(bytes(_backupHash).length > 0, "Backup hash cannot be empty");
        require(block.timestamp >= lastSnapshotTime + autoBackupInterval, "Backup interval not reached");
        
        uint256 snapshotId = ++snapshotCounter;
        
        backupSnapshots[snapshotId] = BackupSnapshot({
            snapshotId: snapshotId,
            blockNumber: block.number,
            timestamp: block.timestamp,
            snapshotHash: _backupHash,
            memberCount: _memberCount,
            proposalCount: _proposalCount,
            loanCount: _loanCount,
            treasuryBalance: _treasuryBalance
        });
        
        lastSnapshotTime = block.timestamp;
        
        // Store as document for Filecoin storage
        string memory metadata = string(abi.encodePacked(
            '{"snapshotId":', _uint2str(snapshotId),
            ',"blockNumber":', _uint2str(block.number),
            ',"memberCount":', _uint2str(_memberCount),
            ',"proposalCount":', _uint2str(_proposalCount),
            ',"loanCount":', _uint2str(_loanCount),
            ',"treasuryBalance":', _uint2str(_treasuryBalance), '}'
        ));
        
        // Estimate backup size (simplified)
        uint256 estimatedSize = (_memberCount + _proposalCount + _loanCount) * 256; // bytes per record estimate
        
        uint256 documentId = ++documentCounter;
        documents[documentId] = DocumentRecord({
            documentId: documentId,
            docType: DocumentType.AUDIT_LOG,
            owner: owner(),
            title: string(abi.encodePacked("DAO Backup #", _uint2str(snapshotId))),
            description: "Automated DAO state backup",
            createdAt: block.timestamp,
            fileSize: estimatedSize,
            isEncrypted: true, // Backups should be encrypted
            encryptionKey: "",
            isPublic: false,
            associatedDeals: new uint256[](0),
            metadata: metadata
        });
        
        documentIPFSHashes[documentId] = _backupHash;
        documentsByType[DocumentType.AUDIT_LOG].push(documentId);
        
        emit BackupCreated(snapshotId, block.number, _backupHash, _memberCount + _proposalCount + _loanCount);
        emit DocumentStored(documentId, DocumentType.AUDIT_LOG, owner(), _backupHash, estimatedSize);
        
        return snapshotId;
    }
    
    /**
     * @notice Retrieve document information
     * @param _documentId The document ID to retrieve
     * @return document The document record
     * @return ipfsHash The IPFS hash for retrieval
     */
    function getDocument(uint256 _documentId) external view returns (
        DocumentRecord memory document,
        string memory ipfsHash
    ) {
        require(_documentId <= documentCounter && _documentId > 0, "Document not found");
        
        document = documents[_documentId];
        ipfsHash = documentIPFSHashes[_documentId];
        
        // Check access permissions
        require(
            document.isPublic || 
            document.owner == msg.sender || 
            msg.sender == owner(),
            "Access denied to document"
        );
    }
    
    /**
     * @notice Get documents by type
     * @param _docType The document type to filter by
     * @return documentIds Array of document IDs of the specified type
     */
    function getDocumentsByType(DocumentType _docType) external view returns (uint256[] memory) {
        return documentsByType[_docType];
    }
    
    /**
     * @notice Get documents owned by a member
     * @param _member The member address
     * @return documentIds Array of document IDs owned by the member
     */
    function getMemberDocuments(address _member) external view returns (uint256[] memory) {
        return memberDocuments[_member];
    }
    
    /**
     * @notice Renew storage deal for a document
     * @param _documentId The document ID
     * @param _additionalDuration Additional storage duration
     */
    function renewDocumentStorage(uint256 _documentId, uint256 _additionalDuration) external payable {
        require(_documentId <= documentCounter && _documentId > 0, "Document not found");
        require(_additionalDuration >= MIN_STORAGE_DURATION, "Duration too short");
        require(_additionalDuration <= MAX_STORAGE_DURATION, "Duration too long");
        
        DocumentRecord storage document = documents[_documentId];
        require(document.owner == msg.sender || msg.sender == owner(), "Not authorized");
        
        // Calculate renewal cost
        uint256 renewalCost = calculateStorageCost(document.fileSize, _additionalDuration);
        require(msg.value >= renewalCost, "Insufficient payment for renewal");
        
        // Create new storage deal for renewal
        string memory ipfsHash = documentIPFSHashes[_documentId];
        uint256 dealId = _createStorageDeal(_documentId, ipfsHash, document.fileSize, _additionalDuration, renewalCost);
        
        // Refund excess payment
        if (msg.value > renewalCost) {
            payable(msg.sender).transfer(msg.value - renewalCost);
        }
    }
    
    /**
     * @notice Calculate storage cost for given file size and duration
     * @param _fileSize File size in bytes
     * @param _duration Storage duration in seconds
     * @return cost The calculated storage cost
     */
    function calculateStorageCost(uint256 _fileSize, uint256 _duration) public view returns (uint256) {
        // Convert bytes to GB (simplified)
        uint256 fileSizeGB = (_fileSize / 1e9) + 1; // Round up to nearest GB
        
        // Convert duration to years (simplified)
        uint256 durationYears = (_duration / 365 days) + 1; // Round up to nearest year
        
        return storagePrice * fileSizeGB * durationYears;
    }
    
    /**
     * @notice Get backup snapshot information
     * @param _snapshotId The snapshot ID
     * @return snapshot The backup snapshot data
     */
    function getBackupSnapshot(uint256 _snapshotId) external view returns (BackupSnapshot memory) {
        require(_snapshotId <= snapshotCounter && _snapshotId > 0, "Snapshot not found");
        return backupSnapshots[_snapshotId];
    }
    
    /**
     * @notice Get recent backup snapshots
     * @param _count Number of recent snapshots to retrieve
     * @return snapshots Array of recent backup snapshots
     */
    function getRecentBackups(uint256 _count) external view returns (BackupSnapshot[] memory) {
        require(_count > 0, "Count must be greater than 0");
        
        uint256 actualCount = (_count > snapshotCounter) ? snapshotCounter : _count;
        BackupSnapshot[] memory snapshots = new BackupSnapshot[](actualCount);
        
        for (uint256 i = 0; i < actualCount; i++) {
            snapshots[i] = backupSnapshots[snapshotCounter - i];
        }
        
        return snapshots;
    }
    
    /**
     * @notice Check if member needs backup
     * @param _member The member address
     * @return needsBackup Whether member data should be backed up
     */
    function memberNeedsBackup(address _member) external view returns (bool) {
        return block.timestamp >= memberLastBackup[_member] + autoBackupInterval;
    }
    
    /**
     * @notice Check if DAO state needs backup
     * @return needsBackup Whether DAO state should be backed up
     */
    function daoNeedsBackup() external view returns (bool) {
        return block.timestamp >= lastSnapshotTime + autoBackupInterval;
    }
    
    /**
     * @notice Set storage pricing
     * @param _newPrice New storage price per GB per year
     */
    function setStoragePrice(uint256 _newPrice) external onlyOwner {
        require(_newPrice > 0, "Price must be greater than 0");
        storagePrice = _newPrice;
        emit StoragePriceUpdated(_newPrice);
    }
    
    /**
     * @notice Set auto-backup interval
     * @param _newInterval New backup interval in seconds
     */
    function setBackupInterval(uint256 _newInterval) external onlyOwner {
        require(_newInterval >= 1 days, "Interval too short");
        require(_newInterval <= 30 days, "Interval too long");
        autoBackupInterval = _newInterval;
        emit BackupIntervalUpdated(_newInterval);
    }
    
    /**
     * @notice Emergency function to withdraw accumulated storage fees
     */
    function withdrawStorageFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        payable(owner()).transfer(balance);
    }
    
    /**
     * @notice Batch store multiple documents
     * @param _documents Array of document data
     * @param _ipfsHashes Array of corresponding IPFS hashes
     * @return documentIds Array of created document IDs
     */
    function batchStoreDocuments(
        DocumentData[] memory _documents,
        string[] memory _ipfsHashes
    ) external payable nonReentrant returns (uint256[] memory) {
        require(_documents.length == _ipfsHashes.length, "Mismatched arrays");
        require(_documents.length > 0, "No documents provided");
        
        uint256[] memory documentIds = new uint256[](_documents.length);
        uint256 totalCost = 0;
        
        // Calculate total cost first
        for (uint256 i = 0; i < _documents.length; i++) {
            totalCost += calculateStorageCost(_documents[i].fileSize, DEFAULT_STORAGE_DURATION);
        }
        
        require(msg.value >= totalCost, "Insufficient payment for batch storage");
        
        // Store each document
        for (uint256 i = 0; i < _documents.length; i++) {
            DocumentData memory doc = _documents[i];
            uint256 documentId = ++documentCounter;
            
            documents[documentId] = DocumentRecord({
                documentId: documentId,
                docType: doc.docType,
                owner: msg.sender,
                title: doc.title,
                description: doc.description,
                createdAt: block.timestamp,
                fileSize: doc.fileSize,
                isEncrypted: doc.isEncrypted,
                encryptionKey: "",
                isPublic: doc.isPublic,
                associatedDeals: new uint256[](0),
                metadata: doc.metadata
            });
            
            documentIPFSHashes[documentId] = _ipfsHashes[i];
            memberDocuments[msg.sender].push(documentId);
            documentsByType[doc.docType].push(documentId);
            
            // Create storage deal
            uint256 storageCost = calculateStorageCost(doc.fileSize, DEFAULT_STORAGE_DURATION);
            _createStorageDeal(documentId, _ipfsHashes[i], doc.fileSize, DEFAULT_STORAGE_DURATION, storageCost);
            
            documentIds[i] = documentId;
            
            emit DocumentStored(documentId, doc.docType, msg.sender, _ipfsHashes[i], doc.fileSize);
        }
        
        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
        
        return documentIds;
    }
    
    // Internal function to create storage deal
    function _createStorageDeal(
        uint256 _documentId,
        string memory _ipfsHash,
        uint256 _fileSize,
        uint256 _duration,
        uint256 _price
    ) internal returns (uint256) {
        uint256 dealId = ++dealCounter;
        
        storageDeals[dealId] = StorageDeal({
            dealId: dealId,
            ipfsHash: _ipfsHash,
            fileSize: _fileSize,
            duration: _duration,
            price: _price,
            client: msg.sender,
            startTime: block.timestamp,
            endTime: block.timestamp + _duration,
            status: DealStatus.ACTIVE,
            metadata: string(abi.encodePacked('{"documentId":', _uint2str(_documentId), '}'))
        });
        
        // Link deal to document
        documents[_documentId].associatedDeals.push(dealId);
        ipfsHashToDeal[_ipfsHash] = dealId;
        
        emit StorageDealCreated(dealId, _documentId, _ipfsHash, _duration, _price);
        
        return dealId;
    }
    
    // Utility functions
    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
    
    function _addressToString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }
    
    receive() external payable {
        // Accept ETH for storage payments
    }
}

// Helper struct for batch operations
struct DocumentData {
    DocumentType docType;
    string title;
    string description;
    uint256 fileSize;
    bool isEncrypted;
    bool isPublic;
    string metadata;
}
