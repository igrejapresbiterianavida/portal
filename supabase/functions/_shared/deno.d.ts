// Type definitions for Deno runtime in Supabase Edge Functions
declare namespace Deno {
  export namespace env {
    export function get(key: string): string | undefined;
  }
}

