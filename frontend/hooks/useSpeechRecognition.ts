import { useEffect, useRef, useState, useCallback } from "react";

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
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

export function useSpeechRecognition(onResult: (text: string) => void) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortCountRef = useRef(0);

  useEffect(() => {
    const SpeechRecognitionClass: SpeechRecognitionStatic | undefined =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setError("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      console.log("🎤 Mic is live — start speaking now!");
      setError(null);
      setIsListening(true);
    };

    recognition.onend = () => {
      console.log("Recognition ended");
      setIsListening(false);

      // Prevent infinite restart loop
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);

      if (event.error === "no-speech") {
        setError("No speech detected. Please try again.");
      } else if (event.error === "aborted") {
        console.log("Recognition aborted — delaying restart...");
        // Delay restart slightly to let mic recover
        setTimeout(() => {
          if (!isListening) {
            try {
              recognition.start();
            } catch (err) {
              console.error("Restart failed:", err);
            }
          }
        }, 2000);
      } else if (event.error === "network") {
        setError("Network error — please check your connection.");
      } else if (event.error === "not-allowed") {
        setError("Microphone permission denied. Please enable it in your browser settings.");
      } else {
        setError(`Speech error: ${event.error}`);
      }

      setIsListening(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current as number);
        timeoutRef.current = null;
      }
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      console.log("🎤 Recognized speech:", transcript);

      if (transcript) {
        onResult(transcript);
        abortCountRef.current = 0; // Reset abort count on successful result
        recognition.stop();
      } else {
        console.warn("⚠️ Empty transcript received");
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) return; // Avoid double starts
    setError(null);

    abortCountRef.current = 0; // Reset counter on manual start
    try {
      // ✅ slight delay to avoid “aborted” error
      setTimeout(() => {
        recognitionRef.current?.start();
      }, 500);
    } catch (e) {
      setError("Failed to start speech recognition.");
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  return { startListening, stopListening, isListening, error };
}