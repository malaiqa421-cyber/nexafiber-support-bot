// Paste your n8n webhook URLs here (or set VITE_QUERY_URL / VITE_RESOLUTION_URL / VITE_TICKET_URL).
const DEFAULT_QUERY_URL = "";
const DEFAULT_RESOLUTION_URL = "";
const DEFAULT_TICKET_URL = "";

export const QUERY_URL: string = import.meta.env["VITE_QUERY_URL"] || DEFAULT_QUERY_URL;
export const RESOLUTION_URL: string = import.meta.env["VITE_RESOLUTION_URL"] || DEFAULT_RESOLUTION_URL;
export const TICKET_URL: string = import.meta.env["VITE_TICKET_URL"] || DEFAULT_TICKET_URL;

export const USE_MOCK = !QUERY_URL || !RESOLUTION_URL || !TICKET_URL;
