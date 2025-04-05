import { NextResponse } from "next/server";

/**
 * This is a server-side implementation of Edge TTS
 * It connects directly to Microsoft's TTS service
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const text = url.searchParams.get("text");
    const voice = url.searchParams.get("voice") || "en-US-AriaNeural";
    const rate = url.searchParams.get("rate") || "+0%";
    const pitch = url.searchParams.get("pitch") || "+0Hz";
    const volume = url.searchParams.get("volume") || "+0%";

    if (!text) {
      return NextResponse.json(
        { error: "Text parameter is required" },
        { status: 400 },
      );
    }

    // Connect to Microsoft's Edge TTS service via a public API that doesn't require authentication
    const endpoint = "https://api.edge-tts.com/tts";

    // Create the request parameters
    const params = new URLSearchParams();
    params.append("text", text);
    params.append("voice", voice);
    params.append("rate", rate);
    params.append("pitch", pitch);
    params.append("volume", volume);

    // Set up headers
    const headers = {
      Accept: "audio/mpeg",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36 Edg/93.0.961.52",
    };

    // Make the request to the TTS service
    const response = await fetch(`${endpoint}?${params.toString()}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Microsoft TTS API error: ${response.status} ${response.statusText}`,
        },
        { status: response.status },
      );
    }

    // Get the audio data
    const audioData = await response.arrayBuffer();

    // Return the audio with appropriate headers
    return new NextResponse(audioData, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error("Error in TTS API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
