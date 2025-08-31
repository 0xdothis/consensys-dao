"use client";
import { useState } from "react";
import { Users, MessageCircle, Trophy, Calendar } from "lucide-react";

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("members");

  const communityStats = [
    {
      label: "Total Members",
      value: "2,500",
      icon: <Users className="w-6 h-6 text-blue-600" />,
      change: "+150 this month"
    },
    {
      label: "Active Discussions",
      value: "45",
      icon: <MessageCircle className="w-6 h-6 text-green-600" />,
      change: "12 new today"
    },
    {
      label: "Events This Month",
      value: "8",
      icon: <Calendar className="w-6 h-6 text-purple-600" />,
      change: "2 upcoming"
    },
    {
      label: "Top Contributors",
      value: "25",
      icon: <Trophy className="w-6 h-6 text-yellow-600" />,
      change: "5 new this week"
    }
  ];

  const topMembers = [
    {
      id: 1,
      name: "Alice Johnson",
      wallet: "0x1234...5678",
      role: "DAO Governor",
      contribution: "High",
      joined: "2023-01-15",
      avatar: "👩‍💼"
    },
    {
      id: 2,
      name: "Bob Smith",
      wallet: "0x9876...4321",
      role: "Active Member",
      contribution: "High",
      joined: "2023-03-20",
      avatar: "👨‍💻"
    },
    {
      id: 3,
      name: "Carol Davis",
      wallet: "0xABCD...EFGH",
      role: "Community Moderator",
      contribution: "Medium",
      joined: "2023-06-10",
      avatar: "👩‍🎨"
    }
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: "DAO Governance Workshop",
      description: "Learn about the governance process and how to participate in decision making.",
      date: "2024-09-25",
      time: "14:00 UTC",
      type: "Workshop",
      attendees: 45
    },
    {
      id: 2,
      title: "Community Town Hall",
      description: "Monthly community meeting to discuss platform updates and gather feedback.",
      date: "2024-10-01",
      time: "16:00 UTC",
      type: "Meeting",
      attendees: 120
    },
    {
      id: 3,
      title: "DeFi Strategy Session",
      description: "Advanced strategies for maximizing returns on the lending platform.",
      date: "2024-10-08",
      time: "15:00 UTC",
      type: "Strategy",
      attendees: 30
    }
  ];

  const recentDiscussions = [
    {
      id: 1,
      title: "Proposal for Lower Interest Rates",
      author: "0x1234...5678",
      replies: 23,
      views: 156,
      lastActivity: "2 hours ago",
      category: "Governance"
    },
    {
      id: 2,
      title: "New Feature Request: Mobile App",
      author: "0x9876...4321",
      replies: 18,
      views: 89,
      lastActivity: "5 hours ago",
      category: "Platform"
    },
    {
      id: 3,
      title: "Security Best Practices Discussion",
      author: "0xABCD...EFGH",
      replies: 31,
      views: 234,
      lastActivity: "1 day ago",
      category: "Security"
    }
  ];

  const getContributionColor = (contribution: string) => {
    switch (contribution) {
      case "High":
        return "bg-green-100 text-green-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "Workshop":
        return "bg-blue-100 text-blue-800";
      case "Meeting":
        return "bg-green-100 text-green-800";
      case "Strategy":
        return "bg-purple-100 text-purple-800";
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
              <h1 className="text-2xl font-bold text-gray-900">Community</h1>
              <p className="text-gray-600">Connect with fellow DAO members and participate in discussions</p>
            </div>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Start Discussion
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {communityStats.map((stat, index) => (
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
              onClick={() => setActiveTab("members")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "members"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Members
            </button>
            <button
              onClick={() => setActiveTab("events")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "events"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab("discussions")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "discussions"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Discussions
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "members" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Top Community Members</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {topMembers.map((member) => (
                  <div key={member.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{member.avatar}</div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{member.name}</h4>
                          <p className="text-sm text-gray-500 font-mono">{member.wallet}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-600">{member.role}</span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getContributionColor(member.contribution)}`}>
                              {member.contribution} Contributor
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Joined</p>
                        <p className="text-sm font-medium text-gray-900">{member.joined}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "events" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Upcoming Events</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                            {event.type}
                          </span>
                          <span className="text-sm text-gray-500">{event.date} at {event.time}</span>
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 mb-2">{event.title}</h4>
                        <p className="text-gray-600 mb-3">{event.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {event.attendees} attending
                          </span>
                        </div>
                      </div>
                      <button className="ml-6 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                        Join Event
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "discussions" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Discussions</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {recentDiscussions.map((discussion) => (
                  <div key={discussion.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm text-gray-500">{discussion.category}</span>
                          <span className="text-sm text-gray-500">{discussion.lastActivity}</span>
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 mb-2">{discussion.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {discussion.replies} replies
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {discussion.views} views
                          </span>
                          <span className="font-mono">{discussion.author}</span>
                        </div>
                      </div>
                      <button className="ml-6 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                        View Discussion
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
