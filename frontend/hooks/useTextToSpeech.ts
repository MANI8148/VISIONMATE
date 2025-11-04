import { useState, useEffect, useCallback, useRef } from 'react';

export interface TextToSpeechControls {
  isSpeaking: boolean;
  isPaused: boolean;
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

export const useTextToSpeech = (): TextToSpeechControls => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceQueueRef = useRef<SpeechSynthesisUtterance[]>([]);

  // Memoized function to process the next utterance in the queue.
  const processQueue = useCallback(() => {
    if (utteranceQueueRef.current.length > 0) {
      const utterance = utteranceQueueRef.current.shift();
      if (utterance) {
        window.speechSynthesis.speak(utterance);
      }
    } else {
      // Queue is empty, so we are no longer speaking.
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []);

  const stop = useCallback(() => {
    utteranceQueueRef.current = []; // Clear the queue
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    // Manually reset state because cancel() doesn't reliably fire onend event
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window) || !text) {
      console.error('Text-to-speech not supported or text is empty.');
      return;
    }

    stop(); // Stop and clear any previous speech

    // Split text into sentences to avoid issues with long text on some browsers.
    // Regex matches sentences ending with a period, question mark, or exclamation mark.
    const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
    
    const utterances = sentences.map(sentence => {
      if (!sentence.trim()) return null; // Skip empty sentences
      const utterance = new SpeechSynthesisUtterance(sentence.trim());
      
      utterance.onend = () => {
        // When one utterance ends, process the next one.
        processQueue();
      };
      
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        // 'interrupted' is a common error when speech is cancelled. We can ignore it.
        if (event.error === 'interrupted') {
          return;
        }
        // Log the specific error and stop everything for other errors.
        console.error('SpeechSynthesisUtterance.onerror:', event.error);
        stop();
      };
      return utterance;
    }).filter((u): u is SpeechSynthesisUtterance => u !== null);

    if (utterances.length > 0) {
      utteranceQueueRef.current = utterances;
      setIsSpeaking(true);
      setIsPaused(false);
      processQueue(); // Start processing the queue
    }

  }, [stop, processQueue]);

  const pause = useCallback(() => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  return { isSpeaking, isPaused, speak, pause, resume, stop };
};
