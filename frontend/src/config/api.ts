// =============================================================================
// GATEMATE Frontend - API Configuration
// =============================================================================

export const config = {
    API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
    WS_URL: import.meta.env.VITE_WS_URL || 'http://localhost:3000',
};
