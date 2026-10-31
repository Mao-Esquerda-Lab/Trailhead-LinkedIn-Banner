/** URL of the Cloudflare Worker (see worker/). Empty → manual mode only. */
export const WORKER_URL = (process.env.NEXT_PUBLIC_WORKER_URL ?? "").replace(/\/$/, "");
