import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { getNavigationDirections } from '../../services/geminiService';
import { DashboardCard } from '../DashboardCard';
import { MicIcon } from '../icons/MicIcon';
import { AlertContext } from '../../context/AlertContext';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { Button } from '../Button';

// Fix for SpeechRecognition API types not being present in default TS lib.
// This defines minimal interfaces to allow the code to compile without adding new dependencies.
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
const isSpeechRecognitionSupported = !!SpeechRecognition;

export const NavigationMode: React.FC = () => {
    const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
    const [destination, setDestination] = useState('');
    const [directions, setDirections] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState('');
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const { addAlert } = useContext(AlertContext);
    const { speak, stop, pause, resume, isSpeaking, isPaused } = useTextToSpeech();

    const fetchLocation = useCallback(() => {
        setIsLoading(true);
        setError('');
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                    });
                    setIsLoading(false);
                },
                (err) => {
                    let errorMessage = `Error getting location: ${err.message}.`;
                    if (err.code === err.PERMISSION_DENIED) {
                        errorMessage = "Location access was denied. Please enable location permissions in your browser settings to use navigation.";
                    } else if (err.code === err.POSITION_UNAVAILABLE) {
                        errorMessage = "Location information is currently unavailable. Please check your device's location services.";
                    } else if (err.code === err.TIMEOUT) {
                        errorMessage = "Could not get your location in time. Please try again with a better signal.";
                    }
                    setError(errorMessage);
                    speak(errorMessage);
                    setIsLoading(false);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000, // 10 seconds
                    maximumAge: 0,   // Don't use a cached position
                }
            );
        } else {
            const unsupportedError = "Geolocation is not supported by your browser.";
            setError(unsupportedError);
            speak(unsupportedError);
            setIsLoading(false);
        }
    }, [speak]);

    const handleGetDirections = useCallback(async (destinationQuery: string) => {
        if (!location) {
            setError("Could not determine current location.");
            return;
        }
        setIsLoading(true);
        setError('');
        setDirections('');
        stop();
        try {
            const result = await getNavigationDirections(location, destinationQuery);

            if (result && result.trim()) {
                setDirections(result);
                speak(result);
                addAlert(`Directions to ${destinationQuery} loaded.`);
                result.split('\n').forEach(line => {
                    if (line.trim().length > 0 && line.startsWith("ALERT:")) {
                        addAlert(line);
                    }
                });
            } else {
                const errorMsg = `Sorry, I could not find directions to "${destinationQuery}". Please try being more specific.`;
                setError(errorMsg);
                speak(errorMsg);
                setDirections('');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to get directions. Please try again.';
            setError(errorMessage);
            speak(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [location, stop, speak, addAlert]);

    useEffect(() => {
        fetchLocation();

        if (isSpeechRecognitionSupported) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'en-US';
            recognition.interimResults = false;

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                const errorMsg = "Sorry, I didn't catch that. Please try again.";
                setError(errorMsg);
                speak(errorMsg);
            };
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                if (transcript && transcript.trim()) {
                    setDestination(transcript);
                    handleGetDirections(transcript);
                } else {
                    const errorMsg = "I didn't catch that. Could you please try again?";
                    setError(errorMsg);
                    speak(errorMsg);
                }
            };
            recognitionRef.current = recognition;
        } else {
            setError("Voice input is not supported by your browser.");
        }

        return () => {
            stop(); // Cleanup speech synthesis on unmount
        }
    }, [fetchLocation, handleGetDirections, speak]);
    
    const handleToggleListening = () => {
      if (!recognitionRef.current || isLoading) return;
    
      if (isListening) {
        recognitionRef.current.stop();
        return;
      }
    
      setDestination('');
      setDirections('');
      setError('');
      stop();
      speak("Listening for destination...");
    
      const recognition = recognitionRef.current;
      let finalTranscript = '';
    
      recognition.start();
    
      // Force stop after 5seconds (of listening)
      const stopTimeout = setTimeout(() => {
        recognition.stop();
      }, 5000);
    
      recognition.onresult = (event) => {
        for (let i = 0; i < event.results.length; ++i) {
          finalTranscript += event.results[i][0].transcript;
        }
      };
    
      recognition.onend = () => {
        clearTimeout(stopTimeout);
        setIsListening(false);
        if (finalTranscript.trim()) {
          setDestination(finalTranscript.trim());
          handleGetDirections(finalTranscript.trim());
        } else {
          const msg = "I didn’t catch that clearly. Please try again.";
          setError(msg);
          speak(msg);
        }
      };
    
      recognition.onerror = (event) => {
        clearTimeout(stopTimeout);
        console.error("Speech recognition error:", event.error);
        const msg = "Voice recognition error. Please try again.";
        setError(msg);
        speak(msg);
      };
    
      setIsListening(true);
    };

    const getMicButtonLabel = () => {
        if (isLoading && !isListening) return "Getting Directions...";
        if (isListening) return "Listening...";
        return "Tap to Speak Destination";
    }

    return (
        <DashboardCard title="Navigation Mode">
            <div className="space-y-4">
                <div className="bg-gray-900 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-400 mb-2">Current Location:</h4>
                    {location ? (
                        <p className="text-gray-300 font-mono text-sm">Lat: {location.lat.toFixed(5)}, Lon: {location.lon.toFixed(5)}</p>
                    ): (
                        <p className="text-gray-400 text-sm">{isLoading ? 'Fetching location...' : 'Location not available'}</p>
                    )}
                </div>
                
                <div className="flex flex-col items-center justify-center text-center p-4">
                    <p className="text-gray-300 mb-4 h-5">{getMicButtonLabel()}</p>
                    <button 
                        onClick={handleToggleListening}
                        disabled={!location || isLoading}
                        className={`relative flex items-center justify-center w-24 h-24 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed ${isListening ? 'bg-red-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        aria-label="Speak destination"
                    >
                        <MicIcon className="w-10 h-10" />
                        {isListening && <span className="absolute h-full w-full rounded-full bg-red-600 animate-ping opacity-75"></span>}
                    </button>
                </div>
                
                {destination && !directions && !isLoading && (
                    <div className="bg-gray-900 p-3 rounded-lg text-center">
                        <p className="text-gray-400 text-sm">Headed to:</p>
                        <p className="font-semibold text-lg">{destination}</p>
                    </div>
                )}

                {error && (
                    <div className="text-center space-y-2">
                        <p className="text-red-500 text-sm">{error}</p>
                        {error.toLowerCase().includes('location') && (
                            <Button 
                                onClick={fetchLocation} 
                                className="py-1 px-3 text-sm w-auto mx-auto" 
                                isLoading={isLoading}
                            >
                                Retry
                            </Button>
                        )}
                    </div>
                )}

                {directions && (
                    <div className="bg-gray-900 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-400 mb-2">Directions to {destination}:</h4>
                        <p className="text-gray-300 whitespace-pre-wrap">{directions}</p>
                        {isSpeaking && (
                            <div className="flex items-center justify-center gap-4 border-t border-gray-700 pt-4 mt-4">
                                <Button onClick={isPaused ? resume : pause} className="w-32 bg-gray-600 hover:bg-gray-500">
                                    {isPaused ? 'Resume' : 'Pause'}
                                </Button>
                                <Button onClick={stop} className="w-32 bg-red-600 hover:bg-red-700">
                                    Stop
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardCard>
    );
}