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
    event DaoJoined(address indexed memberAddress,uint256 amount);
    event ProposalCreated(uint256 indexed proposalId,string title);
    event VoteCast(uint256 indexed proposalId,address voter,bool vote);




    function joinDao() external payable;
    function createProposal(string memory _title, string memory _description) external;
//    function vote(uint256 _proposalId,bool _vote) external;
//    function updateMember(address _memberAddress) external;


}