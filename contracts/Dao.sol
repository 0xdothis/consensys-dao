// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import "../interfaces/IDao.sol";

import "../libraries/Errors.sol";

contract Dao is IDao {

    mapping(address => Member) public members;
    mapping(uint => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => address) public proposalCreator;

    uint256 uuid;
    address [] membersList;
    uint256 public constant MEMBERSHIP_FEE = 1 ether;


    function joinDao() external payable{
        require(msg.value == MEMBERSHIP_FEE, Errors.MembershipFeeNotMet());
        require(members[msg.sender].isMember != true,Errors.AlreadyMember());
        Member memory newMember;
        newMember.isMember = true;
        members[msg.sender] = newMember;
        emit DaoJoined(msg.sender,msg.value);
        membersList.push(msg.sender);
    }


    function createProposal(string memory _title, string memory _description) external{
        require(members[msg.sender].isMember == true,Errors.NotAMember());
        Proposal memory newProposal;
        newProposal.title = _title;
        newProposal.description = _description;
        newProposal.proposedBy = msg.sender;
        newProposal.startDate = block.timestamp;
        proposals[uuid] = newProposal;
        proposalCreator[uuid] = msg.sender;
        uuid++;
        emit ProposalCreated(uuid,_title);
    }

}