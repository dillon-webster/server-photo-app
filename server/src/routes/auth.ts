import type { FastifyPluginAsync } from "fastify";
import { eq, isNull, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db, sqlite } from "../db/client.js";
import { users, photos, albums } from "../db/schema.js";
import { hashPassword, verifyPassword } from "../services/password.js";

function normalizeUsername(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const u = raw.trim().toLowerCase();
  if (u.length < 3 || u.length > 32) return null;
  if (!/^[a-z0-9_.-]+$/.test(u)) return null;
  return u;
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: { username: string; password: string } }>(
    "/api/auth/register",
    async (req, reply) => {
      const username = normalizeUsername(req.body?.username);
      const password = req.body?.password;
      if (!username) {
        return reply.status(400).send({
          error: "Username must be 3–32 chars: letters, numbers, . _ -",
        });
      }
      if (typeof password !== "string" || password.length < 6) {
        return reply.status(400).send({ error: "Password must be at least 6 characters" });
      }

      const existing = db.select().from(users).where(eq(users.username, username)).get();
      if (existing) {
        return reply.status(409).send({ error: "Username already taken" });
      }

      const id = uuidv4();
      const passwordHash = await hashPassword(password);

      // First account to register inherits any pre-existing, ownerless photos/albums
      // (migrated from the single-user era).
      const isFirstUser =
        (db.select({ n: sql<number>`count(*)` }).from(users).get()?.n ?? 0) === 0;

      sqlite.transaction(() => {
        db.insert(users).values({ id, username, passwordHash, createdAt: Date.now() }).run();
        if (isFirstUser) {
          db.update(photos).set({ ownerId: id }).where(isNull(photos.ownerId)).run();
          db.update(albums).set({ ownerId: id }).where(isNull(albums.ownerId)).run();
        }
      })();

      const token = app.jwt.sign({ sub: id, username }, { expiresIn: "30d" });
      return reply.status(201).send({ token, username });
    }
  );

  app.post<{ Body: { username: string; password: string } }>(
    "/api/auth/login",
    async (req, reply) => {
      const username = normalizeUsername(req.body?.username);
      const password = req.body?.password;
      if (!username || typeof password !== "string") {
        return reply.status(401).send({ error: "Invalid username or password" });
      }

      const user = db.select().from(users).where(eq(users.username, username)).get();
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        return reply.status(401).send({ error: "Invalid username or password" });
      }

      const token = app.jwt.sign({ sub: user.id, username: user.username }, { expiresIn: "30d" });
      return { token, username: user.username };
    }
  );
};
