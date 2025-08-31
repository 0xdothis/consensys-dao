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

export default function AdminPage() {
  const [activeMenu, setActiveMenu] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);


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



  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <AlertTriangle className="w-4 h-4" />;
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Navbar */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white flex justify-between items-center px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold">DAO Admin Dashboard</h1>
        </div>

        <div className="flex items-center gap-3">
          <p className="hidden sm:block text-xs sm:text-sm bg-orange-700 px-2 sm:px-3 py-1 rounded-lg">
            0xABC1...DEF9
          </p>
          <button className="bg-red-600 px-2 sm:px-3 py-1 rounded-lg hover:bg-red-700 text-sm">
            Disconnect
          </button>
        </div>
      </div>

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <div
          className={`fixed md:static top-0 left-0 h-full z-40 bg-gradient-to-b from-orange-800 to-orange-900 text-white flex flex-col justify-between py-6 transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0 w-56" : "-translate-x-full w-56"
          } md:translate-x-0 md:w-56`}
        >
          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.name}
                className={`flex items-center gap-3 px-4 py-2 w-full text-left hover:bg-orange-700 transition ${
                  activeMenu === item.name ? "bg-orange-700 font-bold" : ""
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
        <div className="flex-1 p-4 md:p-8 overflow-y-auto ml-0 md:ml-0">
          {activeMenu === "Overview" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold">1,247</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Loans</p>
                      <p className="text-2xl font-bold">89</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pending Requests</p>
                      <p className="text-2xl font-bold">12</p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-full">
                      <DollarSign className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Value Locked</p>
                      <p className="text-2xl font-bold">$2.4M</p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-full">
                      <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Loans */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">Pending Loan Requests</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="py-2 px-2 text-left">Borrower</th>
                        <th className="py-2 px-2 text-left">Amount</th>
                        <th className="py-2 px-2 text-left">Credit Score</th>
                        <th className="py-2 px-2 text-left">Purpose</th>
                        <th className="py-2 px-2 text-left">Status</th>
                        <th className="py-2 px-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingLoans.map((loan) => (
                        <tr key={loan.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-2 font-mono">{loan.borrower}</td>
                          <td className="py-3 px-2 font-semibold">{loan.amount}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              loan.creditScore >= 80 ? "bg-green-100 text-green-800" :
                              loan.creditScore >= 70 ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {loan.creditScore}
                            </span>
                          </td>
                          <td className="py-3 px-2">{loan.purpose}</td>
                          <td className="py-3 px-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(loan.status)}`}>
                              {getStatusIcon(loan.status)}
                              {loan.status}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex gap-2">
                              <button className="p-1 text-blue-600 hover:text-blue-800">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-green-600 hover:text-green-800">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-red-600 hover:text-red-800">
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Other Menu Sections */}
          {activeMenu !== "Overview" && (
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <h2 className="text-xl font-bold">{activeMenu}</h2>
              <p className="mt-2 text-gray-600">
                This section is under construction 🚧
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
