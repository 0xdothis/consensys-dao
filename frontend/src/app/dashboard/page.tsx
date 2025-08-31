"use client";
import { useState } from "react";
import { Circle } from "rc-progress";
import {
  Menu,
  Home,
  CreditCard,
  Wallet,
  Settings,
  BarChart,
  LogOut,
  Users,
  TrendingUp,
  DollarSign,
  Shield,
  Eye,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const [score] = useState(72);
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", icon: <Home className="w-5 h-5" /> },
    { name: "My Loans", icon: <CreditCard className="w-5 h-5" /> },
    { name: "Credit Score", icon: <BarChart className="w-5 h-5" /> },
    { name: "Transactions", icon: <Wallet className="w-5 h-5" /> },
    { name: "Community", icon: <Users className="w-5 h-5" /> },
    { name: "Settings", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Navbar */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex justify-between items-center px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">DAO Lending</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-xs sm:text-sm bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">
              <span className="text-gray-600">Wallet:</span>
              <span className="text-gray-900 font-medium ml-1">0xABC1...DEF9</span>
            </div>
            <button className="bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium">
              Disconnect
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <div
          className={`fixed md:static top-0 left-0 h-full z-40 bg-white border-r border-gray-200 flex flex-col justify-between py-6 transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0 w-56" : "-translate-x-full w-56"
          } md:translate-x-0 md:w-56`}
        >
          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.name}
                className={`flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-gray-50 transition-all duration-200 rounded-lg mx-2 ${
                  activeMenu === item.name ? "bg-purple-50 text-purple-700 font-semibold border-r-2 border-purple-500" : "text-gray-600"
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
            <button className="flex items-center gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors w-full">
              <LogOut className="w-5 h-5" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {activeMenu === "Dashboard" && (
            <div className="space-y-6">
              {/* Welcome Section */}
              <div className="card-enhanced p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Welcome back! 👋
                    </h2>
                    <p className="text-gray-600">Here&apos;s what&apos;s happening with your account today</p>
                  </div>
                  <div className="hidden md:block">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Credit Score */}
                <div className="card-enhanced p-6 text-center group">
                  <div className="flex justify-center items-center flex-col">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <BarChart className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                      Credit Score
                    </h2>
                    <Circle
                      percent={score}
                      strokeWidth={8}
                      strokeColor="#6366f1"
                      trailWidth={8}
                      trailColor="#e2e8f0"
                      className="mb-4"
                    />
                    <p className="text-lg font-semibold text-blue-600 mb-2">{score}%</p>
                    <p className="text-sm text-gray-500">Good standing</p>
                  </div>
                </div>

                {/* Active Loans */}
                <div className="card-enhanced p-6 group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-green-600" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 mb-2">
                    Active Loans
                  </h2>
                  <p className="text-gray-600 mb-2">You currently owe:</p>
                  <p className="text-2xl font-bold text-green-600 mb-4">$2,450 USDC</p>
                  <button className="btn-enhanced w-full text-sm">
                    View Details
                  </button>
                </div>

                {/* Rewards */}
                <div className="card-enhanced p-6 group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                    <DollarSign className="w-5 h-5 text-purple-500" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 mb-2">Rewards</h2>
                  <p className="text-gray-600 mb-2">Earned from governance:</p>
                  <p className="text-2xl font-bold text-purple-600 mb-4">320 DAO Tokens</p>
                  <button className="btn-enhanced w-full text-sm">
                    Claim Rewards
                  </button>
                </div>

                {/* Portfolio Value */}
                <div className="card-enhanced p-6 group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 mb-2">Portfolio</h2>
                  <p className="text-gray-600 mb-2">Total value:</p>
                  <p className="text-2xl font-bold text-blue-600 mb-2">$8,750</p>
                  <div className="text-sm text-green-600 font-medium flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    +12.5% this month
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="card-enhanced p-6 overflow-x-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Recent Transactions
                  </h2>
                  <button className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1">
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-3 text-left font-semibold text-gray-700">Date</th>
                      <th className="py-3 px-3 text-left font-semibold text-gray-700">Type</th>
                      <th className="py-3 px-3 text-left font-semibold text-gray-700">Amount</th>
                      <th className="py-3 px-3 text-left font-semibold text-gray-700">Status</th>
                      <th className="py-3 px-3 text-left font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        date: "2025-08-20",
                        type: "Loan Borrowed",
                        amount: "$1,200",
                        status: "Approved",
                        color: "text-green-600"
                      },
                      {
                        date: "2025-08-15",
                        type: "Reward Claimed",
                        amount: "50 DAO",
                        status: "Completed",
                        color: "text-blue-600"
                      },
                      {
                        date: "2025-08-10",
                        type: "Loan Repaid",
                        amount: "$500",
                        status: "Confirmed",
                        color: "text-green-600"
                      },
                    ].map((tx, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-3 font-medium text-gray-900">{tx.date}</td>
                        <td className="py-3 px-3 text-gray-700">{tx.type}</td>
                        <td className="py-3 px-3 font-semibold text-gray-900">{tx.amount}</td>
                        <td className={`py-3 px-3 font-medium ${tx.color}`}>
                          {tx.status}
                        </td>
                        <td className="py-3 px-3">
                          <button className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Other Menu Sections */}
          {activeMenu !== "Dashboard" && (
            <div className="card-enhanced p-6 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-10 h-10 text-gray-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{activeMenu}</h2>
              <p className="text-gray-600">
                This section is under construction 🚧
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
