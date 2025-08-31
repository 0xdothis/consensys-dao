"use client";
import { useState } from "react";
import { Plus, Eye, Edit, DollarSign, Calendar, TrendingUp } from "lucide-react";

export default function LoansPage() {
  const [activeTab, setActiveTab] = useState("active");
  const [showNewLoanModal, setShowNewLoanModal] = useState(false);

  const activeLoans = [
    {
      id: 1,
      amount: "$5,000",
      remaining: "$3,200",
      interestRate: "8.5%",
      startDate: "2024-01-15",
      dueDate: "2025-01-15",
      status: "active",
      nextPayment: "$800",
      nextPaymentDate: "2024-09-15"
    },
    {
      id: 2,
      amount: "$2,500",
      remaining: "$1,800",
      interestRate: "7.2%",
      startDate: "2024-03-20",
      dueDate: "2026-03-20",
      status: "active",
      nextPayment: "$350",
      nextPaymentDate: "2024-09-20"
    }
  ];

  const loanHistory = [
    {
      id: 3,
      amount: "$3,000",
      status: "completed",
      startDate: "2023-01-10",
      endDate: "2024-01-10",
      interestRate: "9.0%"
    },
    {
      id: 4,
      amount: "$1,500",
      status: "defaulted",
      startDate: "2023-06-15",
      endDate: "2024-06-15",
      interestRate: "8.8%"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "defaulted":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Loans</h1>
              <p className="text-gray-600">Manage your lending activities and view loan history</p>
            </div>
            <button
              onClick={() => setShowNewLoanModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Loan Request
            </button>
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
              Active Loans ({activeLoans.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "history"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Loan History ({loanHistory.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "active" && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Borrowed</p>
                    <p className="text-2xl font-semibold text-gray-900">$7,500</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Remaining Balance</p>
                    <p className="text-2xl font-semibold text-gray-900">$5,000</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Next Payment</p>
                    <p className="text-2xl font-semibold text-gray-900">$1,150</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Loans List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Active Loans</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {activeLoans.map((loan) => (
                  <div key={loan.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-medium text-gray-900">
                            Loan #{loan.id}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                            {loan.status}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Original Amount</p>
                            <p className="font-medium text-gray-900">{loan.amount}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Remaining</p>
                            <p className="font-medium text-gray-900">{loan.remaining}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Interest Rate</p>
                            <p className="font-medium text-gray-900">{loan.interestRate}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Next Payment</p>
                            <p className="font-medium text-gray-900">{loan.nextPayment}</p>
                          </div>
                        </div>
                        <div className="mt-3 text-sm text-gray-500">
                          <p>Started: {loan.startDate} • Due: {loan.dueDate}</p>
                          <p>Next payment due: {loan.nextPaymentDate}</p>
                        </div>
                      </div>
                      <div className="ml-6 flex space-x-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Loan History</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {loanHistory.map((loan) => (
                <div key={loan.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-medium text-gray-900">
                          Loan #{loan.id}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                          {loan.status}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Amount</p>
                          <p className="font-medium text-gray-900">{loan.amount}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Interest Rate</p>
                          <p className="font-medium text-gray-900">{loan.interestRate}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Duration</p>
                          <p className="font-medium text-gray-900">{loan.startDate} - {loan.endDate}</p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-6 flex space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Loan Modal */}
      {showNewLoanModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">New Loan Request</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="text"
                    placeholder="$0.00"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Purpose</label>
                  <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                    <option>Business</option>
                    <option>Education</option>
                    <option>Real Estate</option>
                    <option>Personal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration</label>
                  <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                    <option>12 months</option>
                    <option>24 months</option>
                    <option>36 months</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowNewLoanModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
