import { useEffect, useRef, useState } from "react";

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

const SpeechRecognitionClass: SpeechRecognitionStatic | undefined =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function useSpeechRecognition(onResult: (text: string) => void) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!SpeechRecognitionClass) {
      setError("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognitionClass();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      if (event.error === "no-speech") setError("No speech detected. Please try again.");
      else if (event.error === "aborted") setError("Listening stopped.");
      else setError(`Speech error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      if (transcript) onResult(transcript);
      recognition.stop(); // stop once a phrase is received
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [onResult]);

  const startListening = () => {
    if (!recognitionRef.current) return;
    setError(null);
    try {
      recognitionRef.current.start();
      // ensure it listens at least 3 s
      setTimeout(() => {
        if (isListening) recognitionRef.current?.stop();
      }, 3000);
    } catch (e) {
      setError("Failed to start speech recognition.");
    }
  };

  return { startListening, isListening, error };
}