import React, { useState, useContext, useEffect, useRef } from 'react';
import { Button } from '../components/Button';
import { LiveVisionMode } from '../components/modes/LiveVisionMode';
import { NavigationMode } from '../components/modes/NavigationMode';
import { ReadingMode } from '../components/modes/ReadingMode';
import { AssistantMode } from '../components/modes/AssistantMode';
import { EyeIcon } from '../components/icons/EyeIcon';
import { NavigationIcon } from '../components/icons/NavigationIcon';
import { ReadingIcon } from '../components/icons/ReadingIcon';
import { AssistantIcon } from '../components/icons/AssistantIcon';
import { DashboardCard } from '../components/DashboardCard';
import { useDeviceStatus } from '../hooks/useDeviceStatus';
import { AlertContext } from '../context/AlertContext';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { MicIcon } from '../components/icons/MicIcon';

type Mode = 'VISION' | 'NAVIGATION' | 'READING' | 'ASSISTANT';

// Define minimal interfaces for SpeechRecognition to satisfy TypeScript
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    lang: string;
    interimResults: boolean;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onerror: ((event: any) => void) | null;
    onresult: ((event: any) => void) | null;
    start: () => void;
    stop: () => void;
}

interface SpeechRecognitionStatic {
    new(): SpeechRecognition;
}

const SpeechRecognition: SpeechRecognitionStatic | undefined = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;


const ModeButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        aria-pressed={isActive}
        className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 p-3 text-sm font-medium transition-colors duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-60
            ${isActive
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
    >
        {icon}
        <span className="mt-1 sm:mt-0">{label}</span>
    </button>
);


export const HomePage: React.FC = () => {
    const [activeMode, setActiveMode] = useState<Mode>('VISION');
    const { batteryState, networkState } = useDeviceStatus();
    const { alerts } = useContext(AlertContext);
    const { speak } = useTextToSpeech();
    const [isListeningForCommand, setIsListeningForCommand] = useState(false);
    const commandRecognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        if (!SpeechRecognition) {
            console.log("Voice commands for mode switching are not supported by this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.lang = 'en-US';
        recognition.interimResults = false;

        recognition.onstart = () => setIsListeningForCommand(true);
        recognition.onend = () => {
            setIsListeningForCommand(false);
            // Automatically restart listening if it stops, to ensure it's always available
            if (commandRecognitionRef.current) {
                setTimeout(() => {
                    try {
                        commandRecognitionRef.current?.start();
                    } catch (e) {
                        console.error("Could not restart command recognition:", e);
                    }
                }, 500);
            }
        };
        recognition.onerror = (event) => {
            console.error("Command recognition error:", event.error);
            setIsListeningForCommand(false);
        };
        recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();

            const switchMode = (mode: Mode, modeName: string) => {
                if (activeMode !== mode) {
                    speak(`Switching to ${modeName} mode.`);
                    setActiveMode(mode);
                }
            };
            
            if (transcript.includes('vision')) {
                switchMode('VISION', 'Live Vision');
            } else if (transcript.includes('navigation')) {
                switchMode('NAVIGATION', 'Navigation');
            } else if (transcript.includes('reading')) {
                switchMode('READING', 'Reading');
            } else if (transcript.includes('assistant')) {
                switchMode('ASSISTANT', 'Assistant');
            }
        };

        commandRecognitionRef.current = recognition;
        try {
            recognition.start();
        } catch (e) {
            console.error("Could not start command recognition:", e);
        }

        return () => {
            if (commandRecognitionRef.current) {
                commandRecognitionRef.current.onend = null; // Prevent restart on unmount
                commandRecognitionRef.current.stop();
                commandRecognitionRef.current = null;
            }
        };
    }, [activeMode, speak]);


    const renderActiveMode = () => {
        switch (activeMode) {
            case 'NAVIGATION':
                return <NavigationMode />;
            case 'READING':
                return <ReadingMode />;
            case 'ASSISTANT':
                return <AssistantMode />;
            case 'VISION':
            default:
                return <LiveVisionMode />;
        }
    }

    return (
        <main className="container mx-auto p-4 md:p-8">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-2/3 space-y-6">
                    <DashboardCard 
                        title={
                            <>
                                <span>Select Mode</span>
                                <div className="flex-grow" /> 
                                {isListeningForCommand && (
                                    <div className="flex items-center gap-1.5 text-sm font-normal text-blue-400" title="Listening for mode change commands...">
                                        <MicIcon className="w-4 h-4 animate-pulse" />
                                        <span>Listening...</span>
                                    </div>
                                )}
                            </>
                        } 
                        className="p-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <ModeButton label="Live Vision" icon={<EyeIcon className="w-5 h-5"/>} isActive={activeMode === 'VISION'} onClick={() => setActiveMode('VISION')} />
                            <ModeButton label="Navigation" icon={<NavigationIcon className="w-5 h-5"/>} isActive={activeMode === 'NAVIGATION'} onClick={() => setActiveMode('NAVIGATION')} />
                            <ModeButton label="Reading" icon={<ReadingIcon className="w-5 h-5"/>} isActive={activeMode === 'READING'} onClick={() => setActiveMode('READING')} />
                            <ModeButton label="Assistant" icon={<AssistantIcon className="w-5 h-5"/>} isActive={activeMode === 'ASSISTANT'} onClick={() => setActiveMode('ASSISTANT')} />
                        </div>
                    </DashboardCard>
                    {renderActiveMode()}
                </div>
                <div className="lg:w-1/3 space-y-6 flex flex-col">
                    <DashboardCard title="Device Status">
                        <div className="space-y-3">
                            <p><strong>Status:</strong> {networkState.isOnline ? <span className="text-green-400">Online</span> : <span className="text-red-400">Offline</span>}</p>
                            <p><strong>Battery:</strong> {batteryState ? `${batteryState.level}% ${batteryState.charging ? '(Charging)' : ''}` : 'N/A'}</p>
                            <p><strong>Connection:</strong> {networkState.isOnline ? 'WiFi/Cellular' : 'None'}</p>
                        </div>
                    </DashboardCard>
                    <DashboardCard title="Recent Alerts">
                        {alerts.length > 0 ? (
                             <ul className="space-y-2 text-sm text-gray-300">
                                {alerts.map((alert, index) => (
                                    <li key={index}>
                                        <span className="font-mono text-gray-500">[{alert.timestamp}]</span> {alert.message}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-400 text-sm">No recent alerts.</p>
                        )}
                    </DashboardCard>
                    <DashboardCard title="Quick Actions">
                        <div className="flex flex-col gap-3">
                            <Button className="bg-green-600 hover:bg-green-700">Call User</Button>
                            <Button className="bg-yellow-600 hover:bg-yellow-700">Send Alert Tone</Button>
                        </div>
                    </DashboardCard>
                </div>
            </div>
        </main>
    );
};