// Type definitions for Deno runtime in Supabase Edge Functions
declare namespace Deno {
  export namespace env {
    export function get(key: string): string | undefined;
  }
}

// Types for Deno std/http/server
declare module 'https://deno.land/std@0.168.0/http/server.ts' {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

// Types for Supabase client
declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export function createClient(url: string, key: string): any;
}

// Global Request type
interface Request {
  method: string;
  json(): Promise<any>;
  text(): Promise<string>;
  headers: Headers;
  url: string;
}

interface Headers {
  get(name: string): string | null;
  set(name: string, value: string): void;
}

interface Response {
  status: number;
  statusText: string;
  headers: Headers;
  json(): Promise<any>;
  text(): Promise<string>;
}

// Error type
interface Error {
  message: string;
  name?: string;
}

