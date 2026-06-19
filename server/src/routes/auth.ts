import type { FastifyPluginAsync } from "fastify";

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: { password: string } }>("/api/auth/login", async (req, reply) => {
    const { password } = req.body;
    if (!password || password !== process.env.AUTH_PASSWORD) {
      return reply.status(401).send({ error: "Invalid password" });
    }
    const token = app.jwt.sign({ sub: "owner" }, { expiresIn: "30d" });
    return { token };
  });
};
