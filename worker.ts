import { handleApiStateRequest, Env } from './functions/api/state';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Route /api/state to Cloudflare D1 Database handler
    if (url.pathname === '/api/state' || url.pathname === '/api/state/') {
      return handleApiStateRequest(request, env);
    }

    // Serve static frontend assets for all other routes
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
};
