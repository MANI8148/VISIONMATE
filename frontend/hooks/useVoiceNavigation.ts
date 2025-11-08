import { useCallback, useEffect, useState } from "react";
import { useSpeechRecognition } from "./useSpeechRecognition"; // the updated version I gave earlier

export function useVoiceNavigation({
  fetchDirections,
  fetchLocation,
  setDestination,
  setDirections,
  setError,
  speak,
  stop,
  isLoading
}) {
  const [speechError, setSpeechError] = useState<string | null>(null);

  // 🔹 Called whenever user says a destination
  const handleGetDirections = useCallback(
    async (destinationQuery: string) => {
      if (destinationQuery) {
        setDestination(destinationQuery);
        await fetchDirections(destinationQuery);
      }
    },
    [fetchDirections, setDestination]
  );

  // ✅ Hook with continuous listening enabled
  const { startListening, stopListening, isListening, error: recognitionError } =
    useSpeechRecognition(handleGetDirections);

  // 🔹 Initialize on mount
  useEffect(() => {
    fetchLocation();
    if (!(window as any).SpeechRecognition && !(window as any).webkitSpeechRecognition) {
      setError("Voice input not supported on this browser.");
    }
    return () => {
      stop(); // stop any speech synthesis on unmount
      stopListening(); // stop recognition
    };
  }, [fetchLocation, stop, stopListening, setError]);

  // 🔹 Handle recognition errors gracefully
  useEffect(() => {
    if (recognitionError) {
      setSpeechError(recognitionError);
      speak(recognitionError);
    }
  }, [recognitionError, speak]);

  // 🔹 Trigger mic toggle (speech synth → recognition)
  const handleToggleListening = useCallback(() => {
    if (isLoading || isListening) return;

    setDestination("");
    setDirections("");
    setError("");
    stop(); // Stop any current speech output

    const utterance = new SpeechSynthesisUtterance("Listening for your destination...");
    utterance.onend = () => {
      console.log("Speech ended — waiting before listening...");
      setTimeout(() => {
        startListening();
      }, 1500); // Wait 1.5 sec after voice stops before starting recognition
    };
    window.speechSynthesis.speak(utterance);
  }, [isLoading, isListening, setDestination, setDirections, setError, stop, startListening]);

  // 🔹 Button label logic
  const getMicButtonLabel = () => {
    if (isLoading) return "Getting Directions...";
    if (isListening) return "Listening...";
    return "Tap to Speak Destination";
  };

  return {
    handleToggleListening,
    isListening,
    getMicButtonLabel,
    speechError
  };
}