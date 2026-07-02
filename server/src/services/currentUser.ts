import type { FastifyRequest, FastifyReply } from "fastify";

interface JwtPayload {
  sub?: string;
  username?: string;
}

// Returns the authenticated user's id, or null when there is no valid identity
// (e.g. auth disabled because JWT_SECRET is unset).
export function getUserId(req: FastifyRequest): string | null {
  const user = req.user as JwtPayload | undefined;
  return user?.sub ?? null;
}

// Resolves the user id or sends a 401 and returns null. Callers should return
// early when this returns null.
export function requireUserId(req: FastifyRequest, reply: FastifyReply): string | null {
  const id = getUserId(req);
  if (!id) {
    reply.status(401).send({ error: "Authentication required" });
    return null;
  }
  return id;
}
