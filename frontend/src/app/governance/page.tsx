"use client";
import { useState } from "react";
import { Vote, Clock, CheckCircle, XCircle, Users, TrendingUp, DollarSign } from "lucide-react";

export default function GovernancePage() {
  const [activeTab, setActiveTab] = useState("active");


  const activeProposals = [
    {
      id: 1,
      title: "Increase Maximum Loan Amount",
      description: "Proposal to increase the maximum loan amount from $10,000 to $25,000 for verified users with credit scores above 750.",
      creator: "0x1234...5678",
      endDate: "2024-09-30",
      votesFor: 1250,
      votesAgainst: 320,
      totalVotes: 1570,
      status: "active",
      category: "Lending Policy"
    },
    {
      id: 2,
      title: "Add New Collateral Type",
      description: "Proposal to accept USDC as collateral for loans, expanding the platform's flexibility.",
      creator: "0x9876...4321",
      endDate: "2024-09-25",
      votesFor: 890,
      votesAgainst: 450,
      totalVotes: 1340,
      status: "active",
      category: "Platform Features"
    },
    {
      id: 3,
      title: "Adjust Interest Rate Model",
      description: "Proposal to implement a dynamic interest rate model based on market conditions and risk assessment.",
      creator: "0xABCD...EFGH",
      endDate: "2024-10-05",
      votesFor: 650,
      votesAgainst: 780,
      totalVotes: 1430,
      status: "active",
      category: "Financial Policy"
    }
  ];

  const pastProposals = [
    {
      id: 4,
      title: "Implement KYC Requirements",
      description: "Proposal to add Know Your Customer requirements for loans above $5,000.",
      creator: "0x1111...2222",
      endDate: "2024-08-15",
      votesFor: 1200,
      votesAgainst: 800,
      totalVotes: 2000,
      status: "passed",
      category: "Security"
    },
    {
      id: 5,
      title: "Reduce Platform Fees",
      description: "Proposal to reduce platform fees from 2% to 1.5% for all users.",
      creator: "0x3333...4444",
      endDate: "2024-08-10",
      votesFor: 1500,
      votesAgainst: 300,
      totalVotes: 1800,
      status: "passed",
      category: "Financial Policy"
    }
  ];

  const governanceStats = [
    {
      label: "Total DAO Members",
      value: "2,500",
      icon: <Users className="w-6 h-6 text-blue-600" />,
      change: "+150 this month"
    },
    {
      label: "Active Proposals",
      value: "3",
      icon: <Vote className="w-6 h-6 text-green-600" />,
      change: "2 ending soon"
    },
    {
      label: "Total Votes Cast",
      value: "15,420",
      icon: <TrendingUp className="w-6 h-6 text-purple-600" />,
      change: "+2,100 this week"
    },
    {
      label: "DAO Treasury",
      value: "$2.4M",
      icon: <DollarSign className="w-6 h-6 text-yellow-600" />,
      change: "+$150K this month"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800";
      case "passed":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getVotePercentage = (votesFor: number, totalVotes: number) => {
    return totalVotes > 0 ? Math.round((votesFor / totalVotes) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">DAO Governance</h1>
              <p className="text-gray-600">Participate in platform decisions and vote on proposals</p>
            </div>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
              <Vote className="w-4 h-4" />
              Create Proposal
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {governanceStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
                <div className="text-xs text-green-600 mt-1">{stat.change}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("active")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "active"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Active Proposals ({activeProposals.length})
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "past"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Past Proposals ({pastProposals.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "active" && (
          <div className="space-y-6">
            {activeProposals.map((proposal) => (
              <div key={proposal.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                          {proposal.status}
                        </span>
                        <span className="text-sm text-gray-500">{proposal.category}</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{proposal.title}</h3>
                      <p className="text-gray-600 mb-4">{proposal.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-gray-500">Creator</p>
                          <p className="font-medium text-gray-900 font-mono">{proposal.creator}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">End Date</p>
                          <p className="font-medium text-gray-900">{proposal.endDate}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total Votes</p>
                          <p className="font-medium text-gray-900">{proposal.totalVotes}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Voting Ends</p>
                          <p className="font-medium text-gray-900 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {proposal.endDate}
                          </p>
                        </div>
                      </div>

                      {/* Voting Progress */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Votes For: {proposal.votesFor}</span>
                          <span>Votes Against: {proposal.votesAgainst}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${getVotePercentage(proposal.votesFor, proposal.totalVotes)}%` }}
                          ></div>
                        </div>
                        <div className="text-right text-sm text-gray-500 mt-1">
                          {getVotePercentage(proposal.votesFor, proposal.totalVotes)}% in favor
                        </div>
                      </div>

                      {/* Voting Actions */}
                      <div className="flex gap-3">
                        <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                          <CheckCircle className="w-4 h-4" />
                          Vote For
                        </button>
                        <button className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                          <XCircle className="w-4 h-4" />
                          Vote Against
                        </button>
                        <button className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <Vote className="w-4 h-4" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "past" && (
          <div className="space-y-6">
            {pastProposals.map((proposal) => (
              <div key={proposal.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                          {proposal.status}
                        </span>
                        <span className="text-sm text-gray-500">{proposal.category}</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{proposal.title}</h3>
                      <p className="text-gray-600 mb-4">{proposal.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-gray-500">Creator</p>
                          <p className="font-medium text-gray-900 font-mono">{proposal.creator}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">End Date</p>
                          <p className="font-medium text-gray-900">{proposal.endDate}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total Votes</p>
                          <p className="font-medium text-gray-900">{proposal.totalVotes}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Result</p>
                          <p className="font-medium text-gray-900">{proposal.status}</p>
                        </div>
                      </div>

                      {/* Final Results */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Votes For: {proposal.votesFor}</span>
                          <span>Votes Against: {proposal.votesAgainst}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${getVotePercentage(proposal.votesFor, proposal.totalVotes)}%` }}
                          ></div>
                        </div>
                        <div className="text-right text-sm text-gray-500 mt-1">
                          Final Result: {getVotePercentage(proposal.votesFor, proposal.totalVotes)}% in favor
                        </div>
                      </div>

                      <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
