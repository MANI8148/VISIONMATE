import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import { Chat } from "@google/genai";
import { startChat } from "../../services/geminiService";
import { DashboardCard } from "../DashboardCard";
import { Button } from "../Button";
import { ChatMessage } from "../../types";
import { UserIcon } from "../icons/UserIcon";
import { EyeIcon } from "../icons/EyeIcon";
import { MicIcon } from "../icons/MicIcon";
import { AlertContext } from "../../context/AlertContext";
import { useTextToSpeech } from "../../hooks/useTextToSpeech";
import { AuthContext } from "../../context/AuthContext"; // Access user
import { saveChatMessage } from "../../services/chatService"; // Save chat
import { saveAlert } from "../../services/alertService"; // Save alerts

// 🗣️ Minimal SpeechRecognition type fix for TS
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
  new (): SpeechRecognition;
}

const SpeechRecognition: SpeechRecognitionStatic | undefined =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const isSpeechRecognitionSupported = !!SpeechRecognition;

export const LiveVisionMode: React.FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [error, setError] = useState("");

  const { addAlert } = useContext(AlertContext);
  const { user } = useContext(AuthContext);
  const { speak, stop: stopSpeech } = useTextToSpeech();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // 🎥 Start camera safely
  const startCamera = useCallback(async () => {
    setError("");
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Listen for actual frame readiness
          videoRef.current.onplaying = () => {
            console.log("✅ Camera feed is live with dimensions:", {
              width: videoRef.current?.videoWidth,
              height: videoRef.current?.videoHeight,
            });
            setIsVideoReady(true);
          };
        }
        setIsCameraOn(true);
      } else {
        setError("Your browser does not support camera access.");
      }
    } catch (err) {
      console.error(err);
      setError("Could not access the camera. Please allow permission.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    setIsCameraOn(false);
    setIsVideoReady(false);
  }, []);

  // 🧠 Init chat, speech, and camera
  useEffect(() => {
    setChat(startChat());
    setHistory([
      { role: "model", text: "Hello! I’m your AI assistant. Let’s explore the world together." },
    ]);

    if (isSpeechRecognitionSupported) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = "en-US";
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setError("Sorry, I didn’t catch that. Please try again.");
      };
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim()) {
          sendMultiModalMessage(transcript, transcript);
        }
      };
      recognitionRef.current = recognition;
    } else {
      setError("Voice input is not supported in this browser.");
    }

    startCamera();

    return () => {
      stopCamera();
      recognitionRef.current?.stop();
      stopSpeech();
    };
  }, [startCamera, stopCamera, stopSpeech]);

  useEffect(() => {
    if (chatContainerRef.current)
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [history]);

  // 📸 Capture a video frame (safe)
  const captureFrame = (): string | null => {
    if (!isCameraOn || !isVideoReady || !videoRef.current || !canvasRef.current) {
      console.warn("⚠️ Tried capturing before camera ready.");
      return null;
    }

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn("⚠️ Video dimensions invalid:", video.videoWidth, video.videoHeight);
      return null;
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg").split(",")[1];
    }
    return null;
  };

  // 🎯 Send multimodal (text + image) request to Gemini
  const sendMultiModalMessage = async (prompt: string, userMessageText: string) => {
    if (!chat || isLoading) return;
    stopSpeech();

    const base64Image = captureFrame();
    if (!base64Image) {
      setError("Camera not ready yet. Please wait a second and try again.");
      return;
    }

    setIsLoading(true);
    setError("");
    setHistory((prev) => [...prev, { role: "user", text: userMessageText }]);

    // 🧠 Save user message in MongoDB
    if (user?._id) {
      await saveChatMessage({ userId: user._id, role: "user", message: userMessageText });
    }

    const imagePart = { inlineData: { mimeType: "image/jpeg", data: base64Image } };
    const textPart = { text: prompt };

    try {
      const stream = await chat.sendMessageStream({ message: [imagePart, textPart] });
      let modelResponse = "";
      setHistory((prev) => [...prev, { role: "model", text: "" }]);

      for await (const chunk of stream) {
        modelResponse += chunk.text;
        setHistory((prev) => {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1].text = modelResponse;
          return newHistory;
        });
      }

      if (modelResponse.trim()) {
        // 💾 Save AI message in MongoDB
        if (user?._id) {
          await saveChatMessage({ userId: user._id, role: "model", message: modelResponse });
        }

        speak(modelResponse);
        // 🚨 If it’s an alert, save in alerts collection too
        if (modelResponse.toUpperCase().startsWith("ALERT:")) {
          addAlert(modelResponse);
          if (user?._id) {
            await saveAlert(modelResponse, user._id);
          }
        }
      } else {
        const emptyMsg = "I'm sorry, I couldn’t analyze the image. Please try again.";
        setHistory((prev) => {
          const newH = [...prev];
          newH[newH.length - 1].text = emptyMsg;
          return newH;
        });
        speak(emptyMsg);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      setHistory((prev) => [...prev, { role: "model", text: `Error: ${errorMessage}` }]);
      speak(`Sorry, I encountered an error. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 🎙️ Mic control
  const handleToggleListening = () => {
    if (!recognitionRef.current || isLoading) return;
    if (isListening) recognitionRef.current.stop();
    else {
      setError("");
      recognitionRef.current.start();
    }
  };

  // 👁️ Task handlers
  const handleDescribeScene = () => {
    sendMultiModalMessage(
      "Describe this scene in detail. Identify objects and possible obstacles. If hazards exist, start with 'ALERT:'.",
      "[Describe Scene]"
    );
  };

  const handleIdentifyObjects = () => {
    sendMultiModalMessage(
      "Identify the main objects in this image and describe their position (left, center, right).",
      "[Identify Objects]"
    );
  };

  const handleReadText = () => {
    sendMultiModalMessage(
      "Read all visible text from this image clearly and in order.",
      "[Read Text]"
    );
  };

  return (
    <DashboardCard title="Live Vision">
      <div className="flex flex-col lg:flex-row gap-4 h-[75vh]">
        {/* Left Column: Camera & Controls */}
        <div className="lg:w-1/2 flex flex-col">
          <div className="relative mb-4 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-auto aspect-video bg-black"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {isCameraOn && (
            <div className="grid grid-cols-2 lg:flex lg:flex-row gap-2 mb-4">
              <Button
                onClick={handleDescribeScene}
                disabled={!isVideoReady || isLoading}
                className="flex-1"
              >
                Describe Scene
              </Button>
              <Button
                onClick={handleIdentifyObjects}
                disabled={!isVideoReady || isLoading}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                Identify Objects
              </Button>
              <Button
                onClick={handleReadText}
                disabled={!isVideoReady || isLoading}
                className="flex-1"
              >
                Read Text
              </Button>
              <Button
                onClick={stopCamera}
                className="bg-red-600 hover:bg-red-700 lg:w-auto w-full col-span-2"
              >
                Stop Camera
              </Button>
            </div>
          )}
        </div>

        {/* Right Column: Chat */}
        <div className="lg:w-1/2 flex flex-col h-full">
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto bg-gray-900 p-4 rounded-lg mb-4 space-y-4"
            aria-live="polite"
          >
            {history.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "model" && (
                  <div className="p-2 bg-blue-500 rounded-full flex-shrink-0">
                    <EyeIcon className="w-5 h-5" />
                  </div>
                )}
                <div
                  className={`max-w-md p-3 rounded-lg ${
                    msg.role === "user" ? "bg-blue-600" : "bg-gray-700"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                {msg.role === "user" && (
                  <div className="p-2 bg-gray-600 rounded-full flex-shrink-0">
                    <UserIcon className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
          {error && <p className="text-red-500 text-sm mb-2 text-center">{error}</p>}
          <div className="flex flex-col items-center justify-center pt-2">
            <button
              onClick={handleToggleListening}
              disabled={!isCameraOn || isLoading}
              className={`relative flex items-center justify-center w-16 h-16 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed ${
                isListening
                  ? "bg-red-600 text-white"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              <MicIcon className="w-8 h-8" />
              {isListening && (
                <span className="absolute h-full w-full rounded-full bg-red-600 animate-ping opacity-75"></span>
              )}
            </button>
            <p className="text-gray-400 text-sm mt-2 h-4">
              {!isCameraOn
                ? "Start camera to ask questions"
                : isListening
                ? "Listening..."
                : isVideoReady
                ? "Tap to ask"
                : "Initializing camera..."}
            </p>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
};