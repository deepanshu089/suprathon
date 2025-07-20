import React from 'react';
import ChatInterface from '../components/chat/ChatInterface';

const Chat: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Interactive Chat</h1>
      
      <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
        <p className="text-blue-700">
          Use this chat interface to interact with candidates or test the screening bot.
        </p>
      </div>
      
      <ChatInterface />
    </div>
  );
};

export default Chat;