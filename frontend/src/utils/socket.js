import { io } from "socket.io-client";

// Assuming backend runs on port 5000 from existing setup
// Best practice is to use an env var or relative path in production,
// but hardcoded to 5000 based on standard dev environment instructions here.
export const socket = io(import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || "http://localhost:5000");
