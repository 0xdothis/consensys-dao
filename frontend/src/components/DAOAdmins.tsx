"use client";
import { useState } from "react";

import {
  Menu,
  Home,
  Users,
  DollarSign,
  TrendingUp,
  Settings,
  Shield,
  LogOut,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Gavel,
  PieChart,
} from "lucide-react";

function DAOAdminPage({ onDisconnect, walletAddress }: { onDisconnect: () => void; walletAddress: string }) {
  const [activeMenu, setActiveMenu] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);


  // const walletAddress = "0xABC1...DEF9"; // Now passed as prop

  const menuItems = [
    { name: "Overview", icon: <Home className="w-5 h-5" /> },
    { name: "Loan Requests", icon: <DollarSign className="w-5 h-5" /> },
    { name: "Active Loans", icon: <TrendingUp className="w-5 h-5" /> },
    { name: "User Management", icon: <Users className="w-5 h-5" /> },
    { name: "Governance", icon: <Gavel className="w-5 h-5" /> },
    { name: "Analytics", icon: <PieChart className="w-5 h-5" /> },
    { name: "Security", icon: <Shield className="w-5 h-5" /> },
    { name: "Settings", icon: <Settings className="w-5 h-5" /> },
  ];

  const pendingLoans = [
    {
      id: 1,
      borrower: "0x1234...5678",
      amount: "$5,000",
      creditScore: 78,
      purpose: "Business Expansion",
      duration: "12 months",
      interestRate: "8.5%",
      collateral: "$6,000 ETH",
      status: "pending",
    },
    {
      id: 2,
      borrower: "0x9876...4321",
      amount: "$2,500",
      creditScore: 65,
      purpose: "Education",
      duration: "24 months",
      interestRate: "7.2%",
      collateral: "$3,000 BTC",
      status: "pending",
    },
    {
      id: 3,
      borrower: "0xABCD...EFGH",
      amount: "$10,000",
      creditScore: 82,
      purpose: "Real Estate",
      duration: "36 months",
      interestRate: "9.1%",
      collateral: "$12,000 USDC",
      status: "pending",
    },
  ];

  const activeLoans = [
    {
      id: 1,
      borrower: "0x1111...2222",
      amount: "$8,000",
      remaining: "$6,200",
      dueDate: "2025-12-15",
      status: "healthy",
    },
    {
      id: 2,
      borrower: "0x3333...4444",
      amount: "$3,500",
      remaining: "$1,200",
      dueDate: "2025-10-30",
      status: "at-risk",
    },
    {
      id: 3,
      borrower: "0x5555...6666",
      amount: "$15,000",
      remaining: "$12,800",
      dueDate: "2026-03-20",
      status: "healthy",
    },
  ];

  const governanceProposals = [
    {
      id: 1,
      title: "Increase Maximum Loan Amount",
      votes: 145,
      totalVotes: 200,
      status: "active",
    },
    {
      id: 2,
      title: "Update Interest Rate Model",
      votes: 89,
      totalVotes: 200,
      status: "active",
    },
    {
      id: 3,
      title: "Add New Collateral Types",
      votes: 167,
      totalVotes: 200,
      status: "passed",
    },
  ];

  const handleLoanAction = (loanId: number, action: string) => {
    console.log(`${action} loan ${loanId}`);
    // Here you would integrate with your smart contract
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Value Locked</p>
              <p className="text-2xl font-bold">$2.4M</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Active Loans</p>
              <p className="text-2xl font-bold">127</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Default Rate</p>
              <p className="text-2xl font-bold">2.3%</p>
            </div>
            <Shield className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-700 text-white rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Pending Requests</p>
              <p className="text-2xl font-bold">23</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Protocol Health</h3>
          <div className="flex justify-center">
            <div className="relative w-32 h-32">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 36 36"
              >
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="92, 100"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600">92%</span>
              </div>
            </div>
          </div>
          <p className="text-center mt-4 text-lg font-semibold text-green-600">
            92% Healthy
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-semibold">Loan Approved</p>
                <p className="text-xs text-gray-600">$5,000 to 0x1234...5678</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Eye className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-semibold">New Loan Request</p>
                <p className="text-xs text-gray-600">
                  $3,200 from 0x9876...4321
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Gavel className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-semibold">Governance Vote</p>
                <p className="text-xs text-gray-600">
                  Interest rate proposal passed
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLoanRequests = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Pending Loan Requests</h2>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
            {pendingLoans.length} Pending
          </span>
        </div>
      </div>

      <div className="grid gap-6">
        {pendingLoans.map((loan) => (
          <div
            key={loan.id}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Loan Request #{loan.id}</h3>
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                    Pending Review
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Borrower</p>
                    <p className="font-semibold">{loan.borrower}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Amount Requested</p>
                    <p className="font-semibold text-green-600">
                      {loan.amount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Purpose</p>
                    <p className="font-semibold">{loan.purpose}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-semibold">{loan.duration}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Interest Rate</p>
                    <p className="font-semibold">{loan.interestRate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Collateral</p>
                    <p className="font-semibold">{loan.collateral}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-gray-600">Credit Score:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"
                        style={{ width: `${loan.creditScore}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold">
                      {loan.creditScore}/100
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center gap-3">
                <button
                  onClick={() => handleLoanAction(loan.id, "approve")}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition w-full min-h-[44px]"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve Loan
                </button>
                <button
                  onClick={() => handleLoanAction(loan.id, "reject")}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition w-full min-h-[44px]"
                >
                  <XCircle className="w-5 h-5" />
                  Reject Loan
                </button>
                <button
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition w-full min-h-[44px]"
                >
                  <Eye className="w-5 h-5" />
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderActiveLoans = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Active Loans</h2>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            {activeLoans.filter((l) => l.status === "healthy").length} Healthy
          </span>
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
            {activeLoans.filter((l) => l.status === "at-risk").length} At Risk
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-4 px-6 font-semibold">Loan ID</th>
                <th className="text-left py-4 px-6 font-semibold">Borrower</th>
                <th className="text-left py-4 px-6 font-semibold">
                  Original Amount
                </th>
                <th className="text-left py-4 px-6 font-semibold">Remaining</th>
                <th className="text-left py-4 px-6 font-semibold">Due Date</th>
                <th className="text-left py-4 px-6 font-semibold">Status</th>
                <th className="text-left py-4 px-6 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeLoans.map((loan) => (
                <tr key={loan.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6 font-semibold">#{loan.id}</td>
                  <td className="py-4 px-6">{loan.borrower}</td>
                  <td className="py-4 px-6">{loan.amount}</td>
                  <td className="py-4 px-6 font-semibold">{loan.remaining}</td>
                  <td className="py-4 px-6">{loan.dueDate}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        loan.status === "healthy"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {loan.status === "healthy" ? "Healthy" : "At Risk"}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-start gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      {loan.status === "at-risk" && (
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderGovernance = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Governance Proposals</h2>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          Create Proposal
        </button>
      </div>

      <div className="grid gap-6">
        {governanceProposals.map((proposal) => (
          <div key={proposal.id} className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold">{proposal.title}</h3>
                <p className="text-sm text-gray-600">Proposal #{proposal.id}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  proposal.status === "passed"
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {proposal.status === "passed" ? "Passed" : "Active"}
              </span>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>
                  {proposal.votes}/{proposal.totalVotes} votes
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{
                    width: `${(proposal.votes / proposal.totalVotes) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                Vote For
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                Vote Against
              </button>
              <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeMenu) {
      case "Overview":
        return renderOverview();
      case "Loan Requests":
        return renderLoanRequests();
      case "Active Loans":
        return renderActiveLoans();
      case "Governance":
        return renderGovernance();
      default:
        return (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <h2 className="text-xl font-bold">{activeMenu}</h2>
            <p className="mt-2 text-gray-600">
              This section is under construction 🚧
            </p>
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Navbar */}
      <div className="bg-purple-950 text-white flex justify-between items-center px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold">DAO Lending - Admin</h1>
        </div>

        <div className="flex items-center gap-3">
          <p className="hidden sm:block text-xs sm:text-sm bg-purple-800 px-2 sm:px-3 py-1 rounded-lg">
            {walletAddress}
          </p>
          <button
            onClick={onDisconnect}
            className="bg-red-600 px-2 sm:px-3 py-1 rounded-lg hover:bg-red-700 text-sm"
          >
            Disconnect
          </button>
        </div>
      </div>

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <div
          className={`fixed md:static top-0 left-0 h-full z-40 bg-purple-950 text-gray-200 flex flex-col justify-between py-6 transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0 w-56" : "-translate-x-full w-56"
          } md:translate-x-0 md:w-56`}
        >
          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.name}
                className={`flex items-center gap-3 px-4 py-2 w-full text-left hover:bg-purple-800 transition ${
                  activeMenu === item.name ? "bg-purple-800 font-bold" : ""
                }`}
                onClick={() => {
                  setActiveMenu(item.name);
                  setSidebarOpen(false);
                }}
              >
                {item.icon}
                <span className="hidden md:inline">{item.name}</span>
              </button>
            ))}
          </div>

          <div className="px-4 mt-auto">
            <button className="flex items-center gap-3 text-red-400 hover:text-red-500">
              <LogOut className="w-5 h-5" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {renderContent()}
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}

export default DAOAdminPage;
