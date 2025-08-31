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
} from "lucide-react";

function App({ onDisconnect, walletAddress }: { onDisconnect: () => void; walletAddress: string }) {
  const [score] = useState(72);
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // const walletAddress = "0x1234...89af"; // Now passed as prop

  const menuItems = [
    { name: "Dashboard", icon: <Home className="w-5 h-5" /> },
    { name: "My Loans", icon: <CreditCard className="w-5 h-5" /> },
    { name: "Credit Score", icon: <BarChart className="w-5 h-5" /> },
    { name: "Transactions", icon: <Wallet className="w-5 h-5" /> },
    { name: "Community", icon: <Users className="w-5 h-5" /> },
    { name: "Settings", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Navbar */}
      <div className="bg-purple-950 text-white flex justify-between items-center px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          {/* Hamburger (mobile only) */}
          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold">DAO Lending</h1>
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
                  setSidebarOpen(false); // close on mobile when clicked
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
          {activeMenu === "Dashboard" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Credit Score */}
              <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                <h2 className="text-lg md:text-xl font-bold mb-4">
                  Credit Score
                </h2>
                <div className="flex justify-center items-center flex-col">
                  <Circle
                    percent={score}
                    strokeWidth={8}
                    strokeColor="#3b82f6"
                    trailWidth={8}
                    trailColor="#e5e7eb"
                  />
                  <p className="mt-4 text-lg font-semibold">{score}%</p>
                </div>
              </div>

              {/* Active Loans */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg md:text-xl font-bold mb-4">
                  Active Loans
                </h2>
                <p className="text-gray-600">You currently owe:</p>
                <p className="text-2xl font-bold mt-2">$2,450 USDC</p>
                <button className="mt-4 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 w-full">
                  View Details
                </button>
              </div>

              {/* Rewards */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg md:text-xl font-bold mb-4">Rewards</h2>
                <p className="text-gray-600">Earned from governance:</p>
                <p className="text-2xl font-bold mt-2">320 DAO Tokens</p>
                <button className="mt-4 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 w-full">
                  Claim Rewards
                </button>
              </div>

              {/* Transactions Table */}
              <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 col-span-1 md:col-span-2 lg:col-span-3 overflow-x-auto">
                <h2 className="text-lg md:text-xl font-bold mb-4">
                  Recent Transactions
                </h2>
                <table className="w-full text-xs sm:text-sm text-left">
                  <thead className="border-b">
                    <tr>
                      <th className="py-2 px-2">Date</th>
                      <th className="py-2 px-2">Type</th>
                      <th className="py-2 px-2">Amount</th>
                      <th className="py-2 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        date: "2025-08-20",
                        type: "Loan Borrowed",
                        amount: "$1,200",
                        status: "Approved",
                      },
                      {
                        date: "2025-08-15",
                        type: "Reward Claimed",
                        amount: "50 DAO",
                        status: "Completed",
                      },
                      {
                        date: "2025-08-10",
                        type: "Loan Repaid",
                        amount: "$500",
                        status: "Confirmed",
                      },
                    ].map((tx, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2 px-2">{tx.date}</td>
                        <td className="py-2 px-2">{tx.type}</td>
                        <td className="py-2 px-2">{tx.amount}</td>
                        <td className="py-2 px-2 text-green-600">
                          {tx.status}
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

export default App;
