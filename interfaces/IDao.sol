// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IDao {
    struct Proposal{
        uint256 proposalId;
        string title;
        string description;
        uint256 startDate;
        uint256 endDate;
        uint256 totalVotes;
        uint256 yesVotes;
        uint256 noVotes;
        address proposedBy;
        ProposalStatus status;
        proposalType pType;
        uint256 amount;
    }

    struct Member{
        address memberAddress;
        uint256 joinDate;
        uint256 totalAmountProposals;
        bool isMember;
    }

    enum ProposalStatus {
        PENDING,
        ACCEPTED,
        REJECTED,
        CANCELED
    }

    enum proposalType {
        REGULAR,
        LOAN
    }

    event DaoJoined(address indexed memberAddress,uint256 amount);
    event ProposalCreated(uint256 indexed proposalId,string title, string proposalType);
    event VoteCast(uint256 indexed proposalId,address voter,bool vote);
    // event stakeWithdrawnAndNotMemberAnymore(address memberAddress,uint256 amount);
    event withdrawMembership(address memberAddress);

    function joinDao() external payable;
    function createProposal(string memory _title, string memory _description, uint256 _amount) external;
    // function withdrawAndExitDao() external;
    function withdrawMembership() external;
    
}