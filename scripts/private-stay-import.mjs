import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadEnv } from 'vite';

/** 僅限本機開發伺服器；私人訂房檔不參與正式網站建置。 */
export function privateStayImport() {
  return {
    name: 'private-stay-import', apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, 'VITE_');
      server.middlewares.use(async (request, response, next) => {
        let path;
        try { path = decodeURIComponent((request.url || '').split('?')[0]).replaceAll('\\', '/'); }
        catch { response.writeHead(400).end(); return; }
        const page = '/__private/stay-import';
        const endpoint = '/__private/stay-booking';
        const flightPage = '/__private/flight-import';
        const flightEndpoint = '/__private/flight-booking';
        if (path.toLowerCase().includes('/private-imports/')) { response.writeHead(404).end(); return; }
        if (![page, endpoint, flightPage, flightEndpoint].includes(path)) return next();
        response.setHeader('Cache-Control', 'no-store');
        if (request.method !== 'GET') { response.writeHead(405).end(); return; }
        if (path === page || path === flightPage) {
          response.setHeader('Content-Type', 'text/html; charset=utf-8');
          response.end(await readFile(resolve(server.config.root, path === flightPage ? 'private-imports/upload-flight.html' : 'private-imports/upload-stay.html'), 'utf8'));
          return;
        }
        try {
          const token = request.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
          if (!token) { response.writeHead(401).end(); return; }
          const lookup = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(env.VITE_FIREBASE_API_KEY)}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token })
          });
          if (!lookup.ok) { response.writeHead(401).end(); return; }
          const user = (await lookup.json()).users?.[0];
          const emails = (env.VITE_ALLOWED_EMAILS || '').split(',').map(email => email.trim().toLowerCase()).filter(Boolean);
          const allowed = user && (user.localId === env.VITE_ALLOWED_FIREBASE_UID?.trim() || (user.emailVerified && emails.includes((user.email || '').toLowerCase())));
          if (!allowed) { response.writeHead(403).end(); return; }
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          response.end(await readFile(resolve(server.config.root, path === flightEndpoint ? 'private-imports/flight-booking.json' : 'private-imports/住宿資訊.json'), 'utf8'));
        } catch { response.writeHead(500).end('Private import unavailable'); }
      });
    }
  };
}
