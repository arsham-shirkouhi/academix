import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

// Plugin to serve API routes
function apiRoutesPlugin() {
  return {
    name: 'api-routes',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        // Only handle /api/* routes
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        try {
          // Extract route name (e.g., /api/canvas-events -> canvas-events)
          const routeName = req.url.split('?')[0].replace('/api/', '');

          // Use Vite's SSR module loading to handle TypeScript files
          // Path is relative to the vite.config.ts location (academix directory)
          const modulePath = `./api/${routeName}.ts`;

          const handlerModule = await server.ssrLoadModule(modulePath);
          const handler = handlerModule.default;

          if (!handler) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'API route not found' }));
            return;
          }

          // Read request body once
          let requestBody = '';
          if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            requestBody = Buffer.concat(chunks).toString();
          }

          // Try Edge Runtime format first (Request/Response)
          let triedEdge = false;
          try {
            const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
            const method = req.method || 'GET';
            const headers = new Headers();
            Object.keys(req.headers).forEach(key => {
              const value = req.headers[key];
              if (value) {
                headers.set(key, Array.isArray(value) ? value.join(', ') : value);
              }
            });

            const request = new Request(url.toString(), {
              method,
              headers,
              body: requestBody || undefined,
            });

            const response = await handler(request);

            // Check if response is a Response object
            if (response && typeof response.status === 'number' && response.headers && typeof response.text === 'function') {
              triedEdge = true;
              // Send response
              res.statusCode = response.status;
              response.headers.forEach((value: string, key: string) => {
                res.setHeader(key, value);
              });
              const responseBody = await response.text();
              res.end(responseBody);
              return;
            }
          } catch (edgeError: any) {
            // If Edge Runtime format fails, try Next.js format
            if (edgeError.message && !edgeError.message.includes('is not a function')) {
              console.log('Edge Runtime format failed, trying Next.js format for', routeName, edgeError.message);
            }
          }

          // If Edge Runtime didn't work, use Next.js format
          if (!triedEdge) {
            // Handle Next.js format (NextApiRequest/NextApiResponse)
            const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
            const mockReq = {
              method: req.method || 'GET',
              query: Object.fromEntries(url.searchParams),
              body: {},
              headers: req.headers,
            };

            const mockRes = {
              statusCode: 200,
              headers: {} as Record<string, string>,
              setHeader: (key: string, value: string) => {
                mockRes.headers[key] = value;
                res.setHeader(key, value);
              },
              status: (code: number) => {
                mockRes.statusCode = code;
                res.statusCode = code;
                return mockRes;
              },
              json: (data: any) => {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = mockRes.statusCode;
                res.end(JSON.stringify(data));
              },
              end: (data?: string) => {
                res.statusCode = mockRes.statusCode;
                Object.keys(mockRes.headers).forEach(key => {
                  res.setHeader(key, mockRes.headers[key]);
                });
                res.end(data);
              },
            };

            // Parse body for POST requests
            if (requestBody) {
              try {
                mockReq.body = JSON.parse(requestBody);
              } catch {
                mockReq.body = {};
              }
            }

            await handler(mockReq, mockRes);
          }
        } catch (error: any) {
          console.error('API route error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            error: 'Internal server error',
            message: error.message
          }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    svgr(),
    apiRoutesPlugin(),
  ],
  server: {
    hmr: {
      overlay: true,
    },
  },
  publicDir: 'public',
});
