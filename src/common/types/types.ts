// fastify.d.ts (o cualquier archivo .d.ts)
import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user: any;
  }
}