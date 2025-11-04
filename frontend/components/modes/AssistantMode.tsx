import React, { useState, useEffect, useRef } from 'react';
import { Chat } from '@google/genai';
import { startChat } from '../../services/geminiService';
import { ChatMessage } from '../../types';
import { DashboardCard } from '../DashboardCard';
import { Button } from '../Button';
import { UserIcon } from '../icons/UserIcon';
import { AssistantIcon } from '../icons/AssistantIcon';

export const AssistantMode: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const newChat = startChat();
        setChat(newChat);
        setHistory([{ role: 'model', text: 'Hello! How can I help you today? Ask me anything.' }]);
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [history]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || !chat || isLoading) return;

        const message = userInput.trim();
        setUserInput('');
        setIsLoading(true);
        setError('');
        setHistory(prev => [...prev, { role: 'user', text: message }]);

        try {
            const stream = await chat.sendMessageStream({ message });
            let modelResponse = '';
            setHistory(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setHistory(prev => {
                    const newHistory = [...prev];
                    newHistory[newHistory.length - 1].text = modelResponse;
                    return newHistory;
                });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            setHistory(prev => {
                const newHistory = [...prev];
                const lastMessage = newHistory[newHistory.length - 1];
                if (lastMessage.role === 'model' && lastMessage.text === '') {
                    lastMessage.text = `Sorry, I encountered an error. Please try again.\nError: ${errorMessage}`;
                } else {
                    newHistory.push({ role: 'model', text: `Sorry, I encountered an error. Please try again.\nError: ${errorMessage}` });
                }
                return newHistory;
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardCard title="AI Assistant">
            <div className="flex flex-col h-[75vh]">
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto bg-gray-900 p-4 rounded-lg mb-4 space-y-4" aria-live="polite">
                     {history.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && <div className="p-2 bg-blue-500 rounded-full flex-shrink-0"><AssistantIcon className="w-5 h-5"/></div>}
                            <div className={`max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                            {msg.role === 'user' && <div className="p-2 bg-gray-600 rounded-full flex-shrink-0"><UserIcon className="w-5 h-5"/></div>}
                        </div>
                    ))}
                    {isLoading && history.length > 0 && history[history.length-1].role === 'model' && history[history.length-1].text === '' && (
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-500 rounded-full"><AssistantIcon className="w-5 h-5"/></div>
                            <div className="max-w-md p-3 rounded-lg bg-gray-700">
                                <div className="animate-pulse flex space-x-2">
                                    <div className="rounded-full bg-slate-500 h-2 w-2"></div>
                                    <div className="rounded-full bg-slate-500 h-2 w-2"></div>
                                    <div className="rounded-full bg-slate-500 h-2 w-2"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {error && <p className="text-red-500 text-sm mb-2 text-center">{error}</p>}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input 
                        type="text" 
                        value={userInput} 
                        onChange={e => setUserInput(e.target.value)} 
                        disabled={isLoading}
                        placeholder="Type your message..."
                        className="flex-1 w-full bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-3"
                    />
                    <Button type="submit" isLoading={isLoading} className="w-24">Send</Button>
                </form>
            </div>
        </DashboardCard>
    );
};