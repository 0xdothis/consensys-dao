// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./LendingDAOWithENS.sol";
import "./extensions/FilecoinStorage.sol";
import "./interfaces/IFilecoin.sol";

/**
 * @title LendingDAOWithFilecoin
 * @dev Enhanced LendingDAO with ENS governance and Filecoin document storage
 * @notice This contract implements a lending cooperative with decentralized document storage,
 *         automatic backup system, and immutable audit trails
 */
contract LendingDAOWithFilecoin is LendingDAOWithENS {
    
    // Filecoin Integration
    FilecoinStorage public filecoinStorage;
    bool public autoDocumentStorageEnabled; // Whether to automatically store loan documents
    bool public autoBackupEnabled; // Whether to automatically backup DAO state
    
    // Document tracking for loans and proposals
    mapping(uint256 => uint256) public loanDocuments; // loanId => documentId
    mapping(uint256 => uint256) public proposalDocuments; // proposalId => documentId
    mapping(address => uint256) public memberKYCDocuments; // member => documentId
    
    // Storage fee pool
    uint256 public storageFeePool; // Accumulated fees for storage operations
    uint256 public constant STORAGE_FEE_PERCENTAGE = 100; // 1% of transaction for storage fees
    
    // Events
    event FilecoinStorageEnabled(bool enabled);
    event AutoBackupEnabled(bool enabled);
    event LoanDocumentStored(uint256 indexed loanId, uint256 indexed documentId, string ipfsHash);
    event ProposalDocumentStored(uint256 indexed proposalId, uint256 indexed documentId, string ipfsHash);
    event MemberKYCStored(address indexed member, uint256 indexed documentId, string ipfsHash);
    event AutoBackupTriggered(uint256 indexed snapshotId, string ipfsHash);
    event StorageFeeCollected(uint256 amount, string purpose);
    event StorageFeeWithdrawn(address indexed admin, uint256 amount);
    
    constructor() {
        // Deploy Filecoin storage contract and transfer ownership
        filecoinStorage = new FilecoinStorage();
        filecoinStorage.transferOwnership(address(this));
        
        autoDocumentStorageEnabled = false;
        autoBackupEnabled = false;
    }
    
    /**
     * @notice Enhanced loan approval with automatic document storage
     */
    function _approveLoan(uint256 _proposalId) internal override {
        // Call parent function for loan approval logic
        super._approveLoan(_proposalId);
        
        // Auto-store loan agreement if enabled
        if (autoDocumentStorageEnabled) {
            _autoStoreLoanDocument(_proposalId);
        }
        
        // Trigger backup if enabled
        if (autoBackupEnabled && filecoinStorage.daoNeedsBackup()) {
            _triggerAutoBackup();
        }
    }
    
    /**
     * @notice Enhanced member registration with KYC document option
     */
    function registerMemberWithKYC(string memory _kycIPFSHash, uint256 _kycFileSize) 
        external 
        payable 
        onlyInitialized 
        whenNotPaused 
    {
        // Calculate total cost (membership + storage)
        uint256 storageCost = filecoinStorage.calculateStorageCost(_kycFileSize, filecoinStorage.DEFAULT_STORAGE_DURATION());
        uint256 totalCost = membershipFee + storageCost;
        
        require(msg.value >= totalCost, "Insufficient payment for membership and KYC storage");
        
        // Register as member first
        if (isMember(msg.sender) || members[msg.sender].memberAddress != address(0)) {
            revert DAOErrors.AlreadyMember();
        }
        
        members[msg.sender] = Member({
            memberAddress: msg.sender,
            status: MemberStatus.ACTIVE_MEMBER,
            joinDate: block.timestamp,
            contributionAmount: membershipFee,
            shareBalance: membershipFee,
            hasActiveLoan: false,
            lastLoanDate: 0
        });
        
        memberAddresses.push(msg.sender);
        totalMembers++;
        activeMembers++;
        
        // Store KYC document if provided
        if (bytes(_kycIPFSHash).length > 0) {
            uint256 documentId = filecoinStorage.storeDocument{value: storageCost}(
                DocumentType.MEMBER_KYC,
                string(abi.encodePacked("KYC Document - ", _addressToString(msg.sender))),
                "Know Your Customer verification document",
                _kycIPFSHash,
                _kycFileSize,
                true, // KYC should be encrypted
                false, // Not public
                string(abi.encodePacked('{"member":"', _addressToString(msg.sender), '","type":"kyc"}'))
            );
            
            memberKYCDocuments[msg.sender] = documentId;
            emit MemberKYCStored(msg.sender, documentId, _kycIPFSHash);
        }
        
        emit MembershipFeeReceived(msg.sender, membershipFee);
        emit MemberActivated(msg.sender);
        
        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
    }
    
    /**
     * @notice Store governance proposal document
     * @param _proposalId The proposal ID
     * @param _ipfsHash IPFS hash of the proposal document
     * @param _fileSize Size of the proposal document
     * @param _title Title of the proposal document
     * @return documentId The stored document ID
     */
    function storeProposalDocument(
        uint256 _proposalId,
        string memory _ipfsHash,
        uint256 _fileSize,
        string memory _title
    ) external payable onlyMember returns (uint256) {
        require(proposalTypes[_proposalId] != ProposalType(0), "Proposal not found");
        
        // Calculate storage cost
        uint256 storageCost = filecoinStorage.calculateStorageCost(_fileSize, filecoinStorage.DEFAULT_STORAGE_DURATION());
        require(msg.value >= storageCost, "Insufficient payment for storage");
        
        // Create metadata
        string memory metadata = string(abi.encodePacked(
            '{"proposalId":', _uint2str(_proposalId),
            ',"proposer":"', _addressToString(msg.sender),
            '","type":"governance_proposal"}'
        ));
        
        uint256 documentId = filecoinStorage.storeDocument{value: storageCost}(
            DocumentType.GOVERNANCE_PROPOSAL,
            _title,
            string(abi.encodePacked("Governance proposal #", _uint2str(_proposalId))),
            _ipfsHash,
            _fileSize,
            false, // Not encrypted by default
            true,  // Public to all members
            metadata
        );
        
        proposalDocuments[_proposalId] = documentId;
        
        emit ProposalDocumentStored(_proposalId, documentId, _ipfsHash);
        
        // Refund excess payment
        if (msg.value > storageCost) {
            payable(msg.sender).transfer(msg.value - storageCost);
        }
        
        return documentId;
    }
    
    /**
     * @notice Manually trigger DAO backup
     * @param _backupIPFSHash IPFS hash of the backup data
     * @return snapshotId The created snapshot ID
     */
    function triggerManualBackup(string memory _backupIPFSHash) external onlyAdmin returns (uint256) {
        return _createBackupSnapshot(_backupIPFSHash);
    }
    
    /**
     * @notice Get loan's associated documents
     * @param _loanId The loan ID
     * @return documentId The document ID for the loan
     * @return ipfsHash The IPFS hash of the loan document
     */
    function getLoanDocument(uint256 _loanId) external view returns (uint256 documentId, string memory ipfsHash) {
        documentId = loanDocuments[_loanId];
        if (documentId > 0) {
            ipfsHash = filecoinStorage.documentIPFSHashes(documentId);
        }
    }
    
    /**
     * @notice Get proposal's associated documents
     * @param _proposalId The proposal ID
     * @return documentId The document ID for the proposal
     * @return ipfsHash The IPFS hash of the proposal document
     */
    function getProposalDocument(uint256 _proposalId) external view returns (uint256 documentId, string memory ipfsHash) {
        documentId = proposalDocuments[_proposalId];
        if (documentId > 0) {
            ipfsHash = filecoinStorage.documentIPFSHashes(documentId);
        }
    }
    
    /**
     * @notice Get member's KYC document
     * @param _member The member address
     * @return documentId The document ID for the member's KYC
     * @return ipfsHash The IPFS hash of the KYC document
     */
    function getMemberKYCDocument(address _member) external view returns (uint256 documentId, string memory ipfsHash) {
        // Only member or admin can access
        require(_member == msg.sender || admins[msg.sender], "Access denied");
        
        documentId = memberKYCDocuments[_member];
        if (documentId > 0) {
            ipfsHash = filecoinStorage.documentIPFSHashes(documentId);
        }
    }
    
    /**
     * @notice Enable or disable automatic document storage
     * @param _enabled Whether to enable automatic storage
     */
    function setAutoDocumentStorageEnabled(bool _enabled) external onlyAdmin {
        autoDocumentStorageEnabled = _enabled;
        emit FilecoinStorageEnabled(_enabled);
    }
    
    /**
     * @notice Enable or disable automatic backup
     * @param _enabled Whether to enable automatic backup
     */
    function setAutoBackupEnabled(bool _enabled) external onlyAdmin {
        autoBackupEnabled = _enabled;
        emit AutoBackupEnabled(_enabled);
    }
    
    /**
     * @notice Configure Filecoin storage settings
     * @param _storagePrice New storage price per GB per year
     * @param _backupInterval New backup interval in seconds
     */
    function configureFilecoinStorage(uint256 _storagePrice, uint256 _backupInterval) external onlyAdmin {
        filecoinStorage.setStoragePrice(_storagePrice);
        filecoinStorage.setBackupInterval(_backupInterval);
    }
    
    /**
     * @notice Get storage statistics
     * @return totalDocuments Total number of documents stored
     * @return totalDeals Total number of storage deals
     * @return totalSnapshots Total number of backup snapshots
     * @return storageFees Total accumulated storage fees
     */
    function getStorageStatistics() external view returns (
        uint256 totalDocuments,
        uint256 totalDeals,
        uint256 totalSnapshots,
        uint256 storageFees
    ) {
        totalDocuments = filecoinStorage.documentCounter();
        totalDeals = filecoinStorage.dealCounter();
        totalSnapshots = filecoinStorage.snapshotCounter();
        storageFees = address(filecoinStorage).balance;
    }
    
    /**
     * @notice Get documents by type with pagination
     * @param _docType Document type to filter
     * @param _offset Starting index
     * @param _limit Maximum number of documents to return
     * @return documentIds Array of document IDs
     * @return hasMore Whether there are more documents available
     */
    function getDocumentsByTypePaginated(
        DocumentType _docType,
        uint256 _offset,
        uint256 _limit
    ) external view returns (uint256[] memory documentIds, bool hasMore) {
        uint256[] memory allDocs = filecoinStorage.getDocumentsByType(_docType);
        
        if (_offset >= allDocs.length) {
            return (new uint256[](0), false);
        }
        
        uint256 end = _offset + _limit;
        if (end > allDocs.length) {
            end = allDocs.length;
        }
        
        uint256 length = end - _offset;
        documentIds = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            documentIds[i] = allDocs[_offset + i];
        }
        
        hasMore = end < allDocs.length;
    }
    
    /**
     * @notice Withdraw accumulated storage fees
     */
    function withdrawStorageFees() external onlyAdmin {
        require(storageFeePool > 0, "No fees to withdraw");
        
        uint256 amount = storageFeePool;
        storageFeePool = 0;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit StorageFeeWithdrawn(msg.sender, amount);
    }
    
    // Internal functions
    function _autoStoreLoanDocument(uint256 _proposalId) internal {
        LoanProposal storage proposal = loanProposals[_proposalId];
        
        // Create loan agreement document hash (simplified - in practice, you'd generate actual document)
        string memory documentHash = string(abi.encodePacked(
            "QmLoanAgreement", 
            _uint2str(_proposalId),
            _uint2str(block.timestamp)
        ));
        
        // Estimate document size
        uint256 estimatedSize = 5000; // 5KB estimated for loan agreement
        
        // Calculate storage cost from storage fee pool
        uint256 storageCost = filecoinStorage.calculateStorageCost(estimatedSize, filecoinStorage.DEFAULT_STORAGE_DURATION());
        
        if (storageFeePool >= storageCost) {
            storageFeePool -= storageCost;
            
            try filecoinStorage.storeLoanAgreement{value: storageCost}(
                loanCounter, // Current loan ID
                proposal.borrower,
                documentHash,
                estimatedSize
            ) returns (uint256 documentId) {
                loanDocuments[loanCounter] = documentId;
                emit LoanDocumentStored(loanCounter, documentId, documentHash);
            } catch {
                // If storage fails, add back to pool
                storageFeePool += storageCost;
            }
        }
    }
    
    function _triggerAutoBackup() internal {
        // Create backup hash (simplified - in practice, you'd serialize actual state)
        string memory backupHash = string(abi.encodePacked(
            "QmDAOBackup",
            _uint2str(block.number),
            _uint2str(block.timestamp)
        ));
        
        try filecoinStorage.createDAOBackup(
            totalMembers,
            proposalCounter,
            loanCounter,
            address(this).balance,
            backupHash
        ) returns (uint256 snapshotId) {
            emit AutoBackupTriggered(snapshotId, backupHash);
        } catch {
            // Backup failed, but don't revert the main transaction
        }
    }
    
    function _createBackupSnapshot(string memory _backupIPFSHash) internal returns (uint256) {
        return filecoinStorage.createDAOBackup(
            totalMembers,
            proposalCounter,
            loanCounter,
            address(this).balance,
            _backupIPFSHash
        );
    }
    
    /**
     * @notice Enhanced repayment with automatic fee collection for storage
     */
    function repayLoan(uint256 _loanId) 
        external 
        payable 
        override 
        onlyInitialized 
        nonReentrant 
        whenNotPaused 
    {
        // Calculate storage fee
        uint256 storageFee = (msg.value * STORAGE_FEE_PERCENTAGE) / BASIS_POINTS;
        storageFeePool += storageFee;
        
        emit StorageFeeCollected(storageFee, "Loan repayment");
        
        // Call parent repayment function with adjusted value
        uint256 adjustedValue = msg.value - storageFee;
        
        // Handle the loan repayment logic directly (since super call won't work with payable)
        Loan storage loan = loans[_loanId];
        
        if (loan.loanId == 0) revert DAOErrors.LoanNotFound();
        if (loan.borrower != msg.sender) revert DAOErrors.NotAuthorized();
        if (loan.status != LoanStatus.ACTIVE) revert DAOErrors.LoanNotActive();
        if (adjustedValue != loan.totalRepayment) revert DAOErrors.IncorrectRepaymentAmount();

        loan.status = LoanStatus.REPAID;
        loan.amountRepaid = adjustedValue;

        Member storage borrower = members[msg.sender];
        borrower.hasActiveLoan = false;

        _removeActiveLoan(_loanId);

        uint256 interestAmount = loan.totalRepayment - loan.principalAmount;
        _distributeInterest(interestAmount);

        emit LoanRepaid(_loanId, msg.sender, adjustedValue);
    }
    
    /**
     * @notice Enhanced membership with storage fee collection
     */
    function registerMember() external payable override onlyInitialized whenNotPaused {
        // Calculate storage fee
        uint256 storageFee = (msg.value * STORAGE_FEE_PERCENTAGE) / BASIS_POINTS;
        
        // Ensure sufficient payment for both membership and storage fee
        require(msg.value >= membershipFee + storageFee, "Insufficient payment");
        
        storageFeePool += storageFee;
        emit StorageFeeCollected(storageFee, "Member registration");
        
        // Adjust the actual membership fee received
        uint256 adjustedValue = msg.value - storageFee;
        
        if (isMember(msg.sender) || members[msg.sender].memberAddress != address(0)) {
            revert DAOErrors.AlreadyMember();
        }
        if (adjustedValue < membershipFee) revert DAOErrors.IncorrectMembershipFee();

        members[msg.sender] = Member({
            memberAddress: msg.sender,
            status: MemberStatus.ACTIVE_MEMBER,
            joinDate: block.timestamp,
            contributionAmount: membershipFee,
            shareBalance: membershipFee,
            hasActiveLoan: false,
            lastLoanDate: 0
        });
        
        memberAddresses.push(msg.sender);
        totalMembers++;
        activeMembers++;

        emit MembershipFeeReceived(msg.sender, membershipFee);
        emit MemberActivated(msg.sender);
        
        // Refund excess (after storage fee)
        if (adjustedValue > membershipFee) {
            payable(msg.sender).transfer(adjustedValue - membershipFee);
        }
    }
    
    // Document management functions accessible to DAO
    function storeGovernanceDocument(
        string memory _title,
        string memory _description,
        string memory _ipfsHash,
        uint256 _fileSize,
        bool _isPublic
    ) external payable onlyMember returns (uint256) {
        uint256 storageCost = filecoinStorage.calculateStorageCost(_fileSize, filecoinStorage.DEFAULT_STORAGE_DURATION());
        require(msg.value >= storageCost, "Insufficient payment for storage");
        
        uint256 documentId = filecoinStorage.storeDocument{value: storageCost}(
            DocumentType.GOVERNANCE_PROPOSAL,
            _title,
            _description,
            _ipfsHash,
            _fileSize,
            false, // Not encrypted
            _isPublic,
            string(abi.encodePacked('{"author":"', _addressToString(msg.sender), '"}'))
        );
        
        if (msg.value > storageCost) {
            payable(msg.sender).transfer(msg.value - storageCost);
        }
        
        return documentId;
    }
    
    /**
     * @notice Get comprehensive DAO storage overview
     * @return totalDocuments Total number of documents
     * @return totalStorageDeals Total number of storage deals
     * @return totalBackups Total number of backups
     * @return availableStorageFees Available storage fees
     * @return autoStorageEnabled Whether auto storage is enabled
     * @return autoBackupEnabledStatus Whether auto backup is enabled
     * @return lastBackupTime Last backup timestamp
     * @return needsBackup Whether backup is needed
     */
    function getStorageOverview() external view returns (
        uint256 totalDocuments,
        uint256 totalStorageDeals,
        uint256 totalBackups,
        uint256 availableStorageFees,
        bool autoStorageEnabled,
        bool autoBackupEnabledStatus,
        uint256 lastBackupTime,
        bool needsBackup
    ) {
        totalDocuments = filecoinStorage.documentCounter();
        totalStorageDeals = filecoinStorage.dealCounter();
        totalBackups = filecoinStorage.snapshotCounter();
        availableStorageFees = storageFeePool;
        autoStorageEnabled = autoDocumentStorageEnabled;
        autoBackupEnabledStatus = autoBackupEnabled;
        lastBackupTime = filecoinStorage.lastSnapshotTime();
        needsBackup = filecoinStorage.daoNeedsBackup();
    }
    
    // Admin functions for Filecoin integration
    function batchBackupMembers(address[] memory _members, string[] memory _backupHashes) external onlyAdmin {
        require(_members.length == _backupHashes.length, "Mismatched arrays");
        
        for (uint256 i = 0; i < _members.length; i++) {
            // Store member backup
            uint256 estimatedSize = 2000; // 2KB per member backup
            
            if (storageFeePool >= filecoinStorage.calculateStorageCost(estimatedSize, filecoinStorage.DEFAULT_STORAGE_DURATION())) {
                uint256 cost = filecoinStorage.calculateStorageCost(estimatedSize, filecoinStorage.DEFAULT_STORAGE_DURATION());
                storageFeePool -= cost;
                
                filecoinStorage.storeDocument{value: cost}(
                    DocumentType.MEMBER_BACKUP,
                    string(abi.encodePacked("Member Backup - ", _addressToString(_members[i]))),
                    "Automated member data backup",
                    _backupHashes[i],
                    estimatedSize,
                    true, // Encrypted
                    false, // Not public
                    string(abi.encodePacked('{"member":"', _addressToString(_members[i]), '","timestamp":', _uint2str(block.timestamp), '}'))
                );
            }
        }
    }
    
    // Utility function for string conversion
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
}
