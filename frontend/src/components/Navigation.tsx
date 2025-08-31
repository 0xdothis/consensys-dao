"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, Users, DollarSign, Vote, Settings, LogOut, Shield } from "lucide-react";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: <Home className="w-5 h-5" /> },
    { name: "Loans", href: "/loans", icon: <DollarSign className="w-5 h-5" /> },
    { name: "Governance", href: "/governance", icon: <Vote className="w-5 h-5" /> },
    { name: "Community", href: "/community", icon: <Users className="w-5 h-5" /> },
    { name: "Settings", href: "/settings", icon: <Settings className="w-5 h-5" /> },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="nav-enhanced sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900">
                  DAO Foundation
                </span>
                <span className="text-xs text-gray-500 -mt-1">Decentralized Lending</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`nav-item flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive(item.href)
                    ? "text-purple-600 bg-purple-50 border border-purple-200 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-xl border border-gray-200 font-medium">
              <span className="text-gray-500">Wallet:</span>
              <span className="text-gray-900 ml-1">0xABC1...DEF9</span>
            </div>
            <button className="text-gray-600 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-all duration-200 group">
              <LogOut className="w-5 h-5 group-hover:scale-110" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-purple-600 p-2 rounded-xl hover:bg-purple-50 transition-all duration-200"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
          <div className="px-4 py-6 space-y-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`nav-item flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? "text-purple-600 bg-purple-50 border border-purple-200"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
            
            <div className="pt-4 border-t border-gray-200">
              <div className="px-4 py-3 text-sm text-gray-600 bg-gray-100 rounded-xl border border-gray-200 mb-3">
                <span className="text-gray-500">Wallet:</span>
                <span className="text-gray-900 font-medium ml-1">0xABC1...DEF9</span>
              </div>
              <button className="flex items-center space-x-3 w-full px-4 py-3 text-left text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 group">
                <LogOut className="w-5 h-5 group-hover:scale-110" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
