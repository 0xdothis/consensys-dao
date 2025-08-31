// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IFilecoin Interface
 * @dev Interface for Filecoin storage deals and data management
 */

// Storage deal structure for Filecoin integration
struct StorageDeal {
    uint256 dealId;
    string ipfsHash;        // IPFS hash of the stored data
    uint256 fileSize;       // Size of the file in bytes
    uint256 duration;       // Storage duration in seconds
    uint256 price;          // Price paid for storage
    address client;         // Who initiated the storage
    uint256 startTime;      // When storage deal started
    uint256 endTime;        // When storage deal expires
    DealStatus status;      // Current status of the deal
    string metadata;        // Additional metadata about the stored content
}

enum DealStatus {
    PENDING,
    ACTIVE,
    EXPIRED,
    TERMINATED
}

// Document types for categorization
enum DocumentType {
    LOAN_AGREEMENT,
    MEMBER_KYC,
    GOVERNANCE_PROPOSAL,
    TREASURY_RECORD,
    AUDIT_LOG,
    MEMBER_BACKUP
}

/**
 * @title IFilecoinStorageMarket
 * @dev Interface for interacting with Filecoin storage market
 */
interface IFilecoinStorageMarket {
    function publishStorageDeals(StorageDeal[] memory deals) external;
    function getStorageDeal(uint256 dealId) external view returns (StorageDeal memory);
    function verifyStorageProof(uint256 dealId, bytes memory proof) external view returns (bool);
}

/**
 * @title IDataDAO
 * @dev Interface for Filecoin DataDAO functionality
 */
interface IDataDAO {
    function storeData(bytes memory data, uint256 duration) external payable returns (uint256 dealId);
    function retrieveData(uint256 dealId) external view returns (bytes memory);
    function renewStorageDeal(uint256 dealId, uint256 additionalDuration) external payable;
}

/**
 * @title IIPFS
 * @dev Interface for IPFS operations
 */
interface IIPFS {
    function addFile(bytes memory data) external returns (string memory ipfsHash);
    function getFile(string memory ipfsHash) external view returns (bytes memory);
    function pinFile(string memory ipfsHash) external;
    function unpinFile(string memory ipfsHash) external;
}
