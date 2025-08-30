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


    function createProposal(string memory _title, string memory _description, proposalType _type, uint256 _amount) external{
        require(members[msg.sender].isMember == true,Errors.NotAMember());
        if(_type == proposalType.LOAN){
            require(_amount <= address(this).balance,Errors.AmountExceedsDaoBalance());
        }

        Proposal memory newProposal;
        newProposal.title = _title;
        newProposal.description = _description;
        newProposal.proposedBy = msg.sender;
        newProposal.startDate = block.timestamp;
        proposals[uuid] = newProposal;
        proposalCreator[uuid] = msg.sender;
        newProposal.pType = _type;
        newProposal.amount = _amount;
        newProposal.status = ProposalStatus.PENDING;
        uuid++;
        emit ProposalCreated(uuid,_title, _type);
    }

    // function withdrawAndExitDao() external{
    //     require(members[msg.sender].isMember == true,Errors.NotAMember());
    //     uint256 amountToWithdraw = MEMBERSHIP_FEE;
    //     members[msg.sender].isMember = false;
    //     members[msg.sender].memberAddress = address(0);
    //     members[msg.sender].joinDate = 0;
    //     members[msg.sender].totalAmountProposals = 0;

    //     // Remove from membersList
    //     for (uint i = 0; i < membersList.length; i++) {
    //         if (membersList[i] == msg.sender) {
    //             membersList[i] = membersList[membersList.length - 1];
    //             membersList.pop();
    //             break;
    //         }
    //     }

    //     payable(msg.sender).transfer(amountToWithdraw);
    //     emit stakeWithdrawnAndNotMemberAnymore(msg.sender, amountToWithdraw);
    // }

    function withdrawMembership() external {
        require(members[msg.sender].isMember == true, Errors.NotAMember());
        members[msg.sender].isMember = false;
        members[msg.sender].memberAddress = address(0);
        members[msg.sender].joinDate = 0;
        members[msg.sender].totalAmountProposals = 0;

        // Remove from membersList
        for (uint i = 0; i < membersList.length; i++) {
            if (membersList[i] == msg.sender) {
                membersList[i] = membersList[membersList.length - 1];
                membersList.pop();
                break;
            }
        }

        emit withdrawMembership(msg.sender);
    }

    

}