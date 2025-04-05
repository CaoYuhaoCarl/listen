// This file is used to declare environment variables for TypeScript

declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SPEECH_KEY?: string;
    NEXT_PUBLIC_SPEECH_REGION?: string;
  }
}
