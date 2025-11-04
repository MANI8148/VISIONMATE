import React, { useState, useEffect, useRef, useCallback } from 'react';
import { readTextFromImage } from '../../services/geminiService';
import { DashboardCard } from '../DashboardCard';
import { Button } from '../Button';
import { ReadingIcon } from '../icons/ReadingIcon';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';

export const ReadingMode: React.FC = () => {
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [extractedText, setExtractedText] = useState('');
    const { speak, stop, pause, resume, isSpeaking, isPaused } = useTextToSpeech();

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    const startCamera = useCallback(async () => {
        setError('');
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                mediaStreamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setIsCameraOn(true);
            } else {
                setError('Your browser does not support camera access.');
            }
        } catch (err) {
            console.error(err);
            setError('Could not access the camera. Please ensure you have given permission.');
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }
        setIsCameraOn(false);
        stop(); // Stop speaking when camera is turned off
    }, [stop]);

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, [startCamera, stopCamera]);

    const captureFrame = (): string | null => {
        if (!isCameraOn || !videoRef.current || !canvasRef.current) return null;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL('image/jpeg').split(',')[1];
        }
        return null;
    };

    const handleScanAndRead = async () => {
        stop();
        setExtractedText('');

        const base64Image = captureFrame();
        if (!base64Image) {
            setError('Could not capture frame from camera.');
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            const text = await readTextFromImage(base64Image);
            if (text && text.trim()) {
                setExtractedText(text);
                speak(text);
            } else {
                setExtractedText("No text found in the image.");
                speak("No text found.");
            }
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to read text from the image.';
            setError(errorMessage);
            speak(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardCard title="Reading Mode">
            <div className="flex flex-col lg:flex-row gap-4 h-[75vh]">
                {/* Left Column: Camera & Controls */}
                <div className="lg:w-1/2 flex flex-col">
                    <div className="relative mb-4 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-auto aspect-video bg-black" />
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    {isCameraOn && (
                        <div className="flex gap-2 mb-4 lg:mb-0">
                            <Button onClick={handleScanAndRead} isLoading={isLoading} className="flex-1">Scan and Read Text</Button>
                            <Button onClick={stopCamera} className="bg-red-600 hover:bg-red-700">Stop Camera</Button>
                        </div>
                    )}
                </div>

                {/* Right Column: Text Output */}
                <div className="flex-1 flex flex-col min-h-0">
                    {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                    
                    <div className="flex-1 flex flex-col bg-gray-900 p-4 rounded-lg">
                        {isLoading ? (
                             <div className="flex-grow flex items-center justify-center">
                                <p className="text-gray-400">Reading text from image...</p>
                            </div>
                        ) : extractedText ? (
                            <>
                                <h4 className="font-semibold text-blue-400 mb-2">Extracted Text:</h4>
                                <div className="flex-1 overflow-y-auto mb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 min-h-0">
                                    <p className="text-gray-300 whitespace-pre-wrap">{extractedText}</p>
                                </div>
                                {isSpeaking && (
                                    <div className="flex items-center justify-center gap-4 border-t border-gray-700 pt-4">
                                        <Button onClick={isPaused ? resume : pause} disabled={!isSpeaking} className="w-32 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500">
                                            {isPaused ? 'Resume' : 'Pause'}
                                        </Button>
                                        <Button onClick={stop} disabled={!isSpeaking} className="w-32 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:text-gray-500">
                                            Stop
                                        </Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex-grow flex items-center justify-center">
                                <p className="text-gray-500 text-center">Scan an image to see the extracted text here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardCard>
    );
};
