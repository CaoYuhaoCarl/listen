/**
 * Edge TTS API wrapper for browser
 * This provides a simple interface to use Edge TTS in the browser
 */

export interface TTSOptions {
  voice?: string;
  rate?: string; // e.g. "+0%", "-50%"
  volume?: string; // e.g. "+0%", "-50%"
  pitch?: string; // e.g. "+0Hz", "-50Hz"
}

export interface TTSResponse {
  audioUrl: string;
}

/**
 * Generate speech using Edge TTS API
 * @param text Text to convert to speech
 * @param options TTS options
 * @returns Promise with audio URL
 */
export async function generateSpeech(
  text: string,
  options: TTSOptions = {},
): Promise<TTSResponse> {
  // Default options
  const voice = options.voice || "en-US-AriaNeural";
  const rate = options.rate || "+0%";
  const volume = options.volume || "+0%";
  const pitch = options.pitch || "+0Hz";

  // Create API URL with query parameters - use our own API route to avoid CORS issues
  // Add a timestamp to prevent caching which might be causing the ERR_BLOCKED_BY_CLIENT issue
  const apiUrl = new URL(`/api/tts?_t=${Date.now()}`, window.location.origin);
  apiUrl.searchParams.append("text", text);
  apiUrl.searchParams.append("voice", voice);
  apiUrl.searchParams.append("rate", rate);
  apiUrl.searchParams.append("volume", volume);
  apiUrl.searchParams.append("pitch", pitch);

  try {
    // Fetch audio from API
    const response = await fetch(apiUrl.toString());

    if (!response.ok) {
      throw new Error(
        `Edge TTS API error: ${response.status} ${response.statusText}`,
      );
    }

    // Get audio blob
    const audioBlob = await response.blob();

    // Create object URL for the audio blob
    const audioUrl = URL.createObjectURL(audioBlob);

    return { audioUrl };
  } catch (error) {
    console.error("Edge TTS error:", error);
    throw error;
  }
}

/**
 * Convert pitch and rate values from decimal to Edge TTS format
 * @param value Decimal value (e.g. 1.0, 0.5, 1.5)
 * @param type "pitch" or "rate"
 * @returns Formatted string for Edge TTS
 */
export function formatTTSValue(
  value: number,
  type: "pitch" | "rate" | "volume",
): string {
  if (type === "pitch") {
    // Convert pitch from 0.5-2.0 scale to -50Hz to +50Hz
    const pitchHz = Math.round((value - 1) * 100);
    return `${pitchHz >= 0 ? "+" : ""}${pitchHz}Hz`;
  } else {
    // Convert rate/volume from 0.5-2.0 scale to -50% to +100%
    const percentage = Math.round((value - 1) * 100);
    return `${percentage >= 0 ? "+" : ""}${percentage}%`;
  }
}
