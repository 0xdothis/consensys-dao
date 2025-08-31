// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IENS.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ENSGovernance
 * @dev ENS integration for domain-based governance and member identity
 * @notice Allows ENS domain holders to participate in governance with enhanced voting power
 */
contract ENSGovernance is Ownable {
    using Strings for uint256;

    // ENS Contract addresses (Mainnet)
    IENS public constant ENS_REGISTRY = IENS(0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e);
    IENSReverseRegistrar public constant REVERSE_REGISTRAR = IENSReverseRegistrar(0x084b1c3C81545d370f3634392De611CaaBFf8148);
    
    // DAO's ENS domain configuration
    string public daoEnsName; // e.g., "lendingdao.eth"
    bytes32 public daoEnsNode; // namehash of daoEnsName
    address public ensResolver;
    
    // Member ENS mapping
    struct ENSMemberData {
        string ensName;           // Full ENS name (e.g., "member1.lendingdao.eth")
        bytes32 ensNode;          // namehash of ENS name
        bool hasSubdomain;        // Whether member has been assigned a subdomain
        uint256 ensRegistrationDate; // When the ENS was verified
        uint256 votingWeight;     // Enhanced voting weight based on ENS reputation
        bool isENSVerified;       // Whether the ENS ownership is verified
    }
    
    mapping(address => ENSMemberData) public memberENSData;
    mapping(bytes32 => address) public ensNodeToMember; // ENS node to member address
    mapping(string => bool) public reservedSubdomains; // Reserved subdomain names
    
    // ENS reputation scoring
    struct ENSReputation {
        uint256 domainAge;        // Age of the ENS domain in seconds
        bool hasReverseRecord;    // Whether reverse record is set
        uint256 subdomainCount;   // Number of subdomains owned
        uint256 reputationScore;  // Calculated reputation score (0-1000)
    }
    
    mapping(address => ENSReputation) public ensReputation;
    
    // Configuration
    uint256 public constant BASE_VOTING_WEIGHT = 100; // Base voting weight for all members
    uint256 public constant MAX_ENS_VOTING_BONUS = 50; // Max additional voting weight from ENS (50%)
    uint256 public constant MIN_DOMAIN_AGE_FOR_BONUS = 30 days; // Minimum domain age for reputation bonus
    uint256 public subdomainPrice = 0.01 ether; // Price to mint a subdomain
    
    // Events
    event DAOENSConfigured(string daoEnsName, bytes32 daoEnsNode, address resolver);
    event MemberENSVerified(address indexed member, string ensName, uint256 votingWeight);
    event SubdomainMinted(address indexed member, string subdomain, uint256 price);
    event ENSReputationUpdated(address indexed member, uint256 newScore);
    event VotingWeightCalculated(address indexed member, uint256 baseWeight, uint256 ensBonus, uint256 totalWeight);
    
    modifier onlyDAOContract() {
        require(msg.sender == owner(), "Only DAO contract can call this");
        _;
    }
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice Configure the DAO's main ENS domain
     * @param _daoEnsName The ENS name for the DAO (e.g., "lendingdao.eth")
     * @param _ensResolver The ENS resolver address for the domain
     */
    function configureDaoENS(string memory _daoEnsName, address _ensResolver) external onlyOwner {
        require(bytes(_daoEnsName).length > 0, "ENS name cannot be empty");
        require(_ensResolver != address(0), "Invalid resolver address");
        
        daoEnsName = _daoEnsName;
        daoEnsNode = _namehash(_daoEnsName);
        ensResolver = _ensResolver;
        
        // Verify DAO owns this ENS domain
        address domainOwner = ENS_REGISTRY.owner(daoEnsNode);
        require(domainOwner == owner(), "DAO must own the ENS domain");
        
        emit DAOENSConfigured(_daoEnsName, daoEnsNode, _ensResolver);
    }
    
    /**
     * @notice Verify and register a member's ENS domain for enhanced governance
     * @param _ensName The ENS name to verify (e.g., "alice.eth")
     * @param _member The member address to associate with the ENS
     */
    function verifyMemberENS(string memory _ensName, address _member) external {
        require(bytes(_ensName).length > 0, "ENS name cannot be empty");
        require(_member != address(0), "Invalid member address");
        
        bytes32 ensNode = _namehash(_ensName);
        
        // Verify ENS ownership
        address domainOwner = ENS_REGISTRY.owner(ensNode);
        address resolvedAddress = _resolveENSToAddress(ensNode);
        
        require(domainOwner == _member || resolvedAddress == _member, "Member must own the ENS domain");
        
        // Calculate ENS reputation and voting weight
        ENSReputation memory reputation = _calculateENSReputation(_ensName, ensNode, _member);
        ensReputation[_member] = reputation;
        
        uint256 votingWeight = _calculateVotingWeight(reputation);
        
        // Store member ENS data
        memberENSData[_member] = ENSMemberData({
            ensName: _ensName,
            ensNode: ensNode,
            hasSubdomain: false,
            ensRegistrationDate: block.timestamp,
            votingWeight: votingWeight,
            isENSVerified: true
        });
        
        ensNodeToMember[ensNode] = _member;
        
        emit MemberENSVerified(_member, _ensName, votingWeight);
        emit ENSReputationUpdated(_member, reputation.reputationScore);
    }
    
    /**
     * @notice Mint a subdomain under the DAO's ENS for a member
     * @param _subdomain The subdomain name (e.g., "alice" for "alice.lendingdao.eth")
     * @param _member The member to assign the subdomain to
     */
    function mintMemberSubdomain(string memory _subdomain, address _member) external payable {
        require(bytes(daoEnsName).length > 0, "DAO ENS not configured");
        require(bytes(_subdomain).length > 0, "Subdomain cannot be empty");
        require(_member != address(0), "Invalid member address");
        require(msg.value >= subdomainPrice, "Insufficient payment for subdomain");
        require(!reservedSubdomains[_subdomain], "Subdomain is reserved");
        
        // Create full subdomain name
        string memory fullSubdomain = string(abi.encodePacked(_subdomain, ".", daoEnsName));
        bytes32 subdomainNode = _namehash(fullSubdomain);
        
        // Verify subdomain is available
        address currentOwner = ENS_REGISTRY.owner(subdomainNode);
        require(currentOwner == address(0) || currentOwner == owner(), "Subdomain already taken");
        
        // Update member ENS data
        memberENSData[_member].ensName = fullSubdomain;
        memberENSData[_member].ensNode = subdomainNode;
        memberENSData[_member].hasSubdomain = true;
        memberENSData[_member].ensRegistrationDate = block.timestamp;
        
        // If member doesn't have ENS verification yet, set basic voting weight
        if (!memberENSData[_member].isENSVerified) {
            memberENSData[_member].votingWeight = BASE_VOTING_WEIGHT + 10; // Small bonus for subdomain
            memberENSData[_member].isENSVerified = true;
        }
        
        ensNodeToMember[subdomainNode] = _member;
        
        emit SubdomainMinted(_member, fullSubdomain, msg.value);
        
        // Refund excess payment
        if (msg.value > subdomainPrice) {
            payable(msg.sender).transfer(msg.value - subdomainPrice);
        }
    }
    
    /**
     * @notice Get enhanced voting weight for a member based on ENS reputation
     * @param _member The member address
     * @return votingWeight The calculated voting weight
     */
    function getMemberVotingWeight(address _member) external view returns (uint256) {
        ENSMemberData memory ensData = memberENSData[_member];
        
        if (!ensData.isENSVerified) {
            return BASE_VOTING_WEIGHT;
        }
        
        return ensData.votingWeight;
    }
    
    /**
     * @notice Get member's ENS information
     * @param _member The member address
     * @return ensData The member's ENS data
     */
    function getMemberENSData(address _member) external view returns (ENSMemberData memory) {
        return memberENSData[_member];
    }
    
    /**
     * @notice Reserve subdomain names for future use
     * @param _subdomains Array of subdomain names to reserve
     */
    function reserveSubdomains(string[] memory _subdomains) external onlyOwner {
        for (uint256 i = 0; i < _subdomains.length; i++) {
            reservedSubdomains[_subdomains[i]] = true;
        }
    }
    
    /**
     * @notice Update subdomain pricing
     * @param _newPrice New price in wei for minting subdomains
     */
    function setSubdomainPrice(uint256 _newPrice) external onlyOwner {
        subdomainPrice = _newPrice;
    }
    
    /**
     * @notice Calculate ENS reputation score for a domain
     * @param _ensName The ENS name
     * @param _member The member address
     * @return reputation The calculated reputation data
     */
    function _calculateENSReputation(
        string memory _ensName, 
        bytes32, // _ensNode - unused parameter 
        address _member
    ) internal view returns (ENSReputation memory reputation) {
        // Get domain registration date (simplified - in practice, you'd query ENS history)
        // For now, we'll use a proxy method based on current timestamp
        uint256 estimatedAge = 365 days; // Default assumption for existing domains
        
        // Check if reverse record is set
        bool hasReverse = _hasReverseRecord(_member);
        
        // Calculate reputation score (0-1000)
        uint256 score = 100; // Base score
        
        // Age bonus (up to 300 points)
        if (estimatedAge >= MIN_DOMAIN_AGE_FOR_BONUS) {
            uint256 ageBonusMonths = estimatedAge / 30 days;
            score += (ageBonusMonths > 10) ? 300 : (ageBonusMonths * 30);
        }
        
        // Reverse record bonus (200 points)
        if (hasReverse) {
            score += 200;
        }
        
        // Domain length bonus (shorter = better, up to 100 points)
        uint256 nameLength = bytes(_ensName).length;
        if (nameLength <= 8) {
            score += (9 - nameLength) * 10;
        }
        
        // Cap at 1000
        if (score > 1000) score = 1000;
        
        reputation = ENSReputation({
            domainAge: estimatedAge,
            hasReverseRecord: hasReverse,
            subdomainCount: 0, // Could be enhanced to count actual subdomains
            reputationScore: score
        });
    }
    
    /**
     * @notice Calculate voting weight based on ENS reputation
     * @param _reputation The ENS reputation data
     * @return weight The calculated voting weight
     */
    function _calculateVotingWeight(ENSReputation memory _reputation) internal pure returns (uint256) {
        uint256 baseWeight = BASE_VOTING_WEIGHT;
        
        // Calculate bonus based on reputation score
        // Max bonus is 50% of base weight (MAX_ENS_VOTING_BONUS)
        uint256 bonus = (baseWeight * MAX_ENS_VOTING_BONUS * _reputation.reputationScore) / (100 * 1000);
        
        return baseWeight + bonus;
    }
    
    /**
     * @notice Check if address has reverse ENS record
     * @param _member The address to check
     * @return hasReverse Whether the address has a reverse record
     */
    function _hasReverseRecord(address _member) internal view returns (bool) {
        try this._tryGetReverseName(_member) returns (string memory name) {
            return bytes(name).length > 0;
        } catch {
            return false;
        }
    }
    
    /**
     * @notice Try to get reverse ENS name (external function for try/catch)
     * @param _member The address to resolve
     * @return name The reverse-resolved name
     */
    function _tryGetReverseName(address _member) external view returns (string memory name) {
        bytes32 reverseNode = keccak256(abi.encodePacked(
            keccak256(abi.encodePacked("addr.reverse")),
            keccak256(abi.encodePacked(_addressToString(_member), ".addr.reverse"))
        ));
        
        address resolver = ENS_REGISTRY.resolver(reverseNode);
        if (resolver != address(0)) {
            return IENSResolver(resolver).name(reverseNode);
        }
        return "";
    }
    
    /**
     * @notice Resolve ENS name to address
     * @param _ensNode The ENS node to resolve
     * @return addr The resolved address
     */
    function _resolveENSToAddress(bytes32 _ensNode) internal view returns (address) {
        address resolver = ENS_REGISTRY.resolver(_ensNode);
        if (resolver == address(0)) return address(0);
        
        try IENSResolver(resolver).addr(_ensNode) returns (address addr) {
            return addr;
        } catch {
            return address(0);
        }
    }
    
    /**
     * @notice Convert address to string for reverse resolution
     * @param _addr The address to convert
     * @return The address as a string
     */
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
    
    /**
     * @notice Calculate namehash for ENS domain
     * @param _name The ENS name
     * @return The namehash
     */
    function _namehash(string memory _name) internal pure returns (bytes32) {
        bytes32 node = 0x0000000000000000000000000000000000000000000000000000000000000000;
        bytes memory nameBytes = bytes(_name);
        
        if (nameBytes.length == 0) {
            return node;
        }
        
        // Split name by dots and hash each label
        uint256 start = 0;
        for (uint256 i = 0; i <= nameBytes.length; i++) {
            if (i == nameBytes.length || nameBytes[i] == '.') {
                if (i > start) {
                    bytes memory label = new bytes(i - start);
                    for (uint256 j = start; j < i; j++) {
                        label[j - start] = nameBytes[j];
                    }
                    node = keccak256(abi.encodePacked(node, keccak256(label)));
                }
                start = i + 1;
            }
        }
        
        return node;
    }
    
    /**
     * @notice Emergency function to withdraw accumulated subdomain fees
     */
    function withdrawSubdomainFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        payable(owner()).transfer(balance);
    }
    
    /**
     * @notice Get ENS voting weight for governance calculations
     * @param _member The member address
     * @return baseWeight The base voting weight
     * @return ensBonus The ENS reputation bonus
     * @return totalWeight The total voting weight
     */
    function getVotingWeightBreakdown(address _member) external returns (
        uint256 baseWeight,
        uint256 ensBonus,
        uint256 totalWeight
    ) {
        baseWeight = BASE_VOTING_WEIGHT;
        
        if (memberENSData[_member].isENSVerified) {
            totalWeight = memberENSData[_member].votingWeight;
            ensBonus = totalWeight - baseWeight;
        } else {
            ensBonus = 0;
            totalWeight = baseWeight;
        }
        
        emit VotingWeightCalculated(_member, baseWeight, ensBonus, totalWeight);
    }
    
    receive() external payable {
        // Accept ETH for subdomain purchases
    }
}
