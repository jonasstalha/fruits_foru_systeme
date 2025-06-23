import React, { useState } from 'react';
import { MessageCircle, Bell, Users, Calendar, Search, Filter } from 'lucide-react';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
}

export default function CommunicationDashboard() {
  const [activeTab, setActiveTab] = useState('messages');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');

  const mockMessages: Message[] = [
    {
      id: '1',
      sender: 'Logistics Team',
      content: 'New shipment arriving today at 14:00',
      timestamp: new Date(),
      read: false,
      priority: 'high',
    },
    {
      id: '2',
      sender: 'Quality Control',
      content: 'Daily quality report is ready for review',
      timestamp: new Date(),
      read: true,
      priority: 'medium',
    },
    // Add more mock messages as needed
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Communication Dashboard</h1>
          <p className="text-gray-600">Manage all your team communications in one place</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative w-full md:w-48">
            <Filter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <select
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={\`px-6 py-3 \${
              activeTab === 'messages'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }\`}
            onClick={() => setActiveTab('messages')}
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span>Messages</span>
            </div>
          </button>
          <button
            className={\`px-6 py-3 \${
              activeTab === 'notifications'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }\`}
            onClick={() => setActiveTab('notifications')}
          >
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </div>
          </button>
          <button
            className={\`px-6 py-3 \${
              activeTab === 'team'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }\`}
            onClick={() => setActiveTab('team')}
          >
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>Team</span>
            </div>
          </button>
          <button
            className={\`px-6 py-3 \${
              activeTab === 'schedule'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }\`}
            onClick={() => setActiveTab('schedule')}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>Schedule</span>
            </div>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {activeTab === 'messages' && (
            <div className="space-y-4">
              {mockMessages.map((message) => (
                <div
                  key={message.id}
                  className={\`p-4 rounded-lg border \${
                    message.read ? 'bg-white' : 'bg-blue-50'
                  } \${
                    message.priority === 'high'
                      ? 'border-red-200'
                      : message.priority === 'medium'
                      ? 'border-yellow-200'
                      : 'border-gray-200'
                  }\`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{message.sender}</h3>
                    <span className="text-sm text-gray-500">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-600">{message.content}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No new notifications</p>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Team view coming soon</p>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Schedule view coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


