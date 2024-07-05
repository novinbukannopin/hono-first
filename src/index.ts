import { Hono } from "hono";
import { logger } from "hono/logger";
import { zValidator } from "@hono/zod-validator";
import { LoginSchema } from "./schema/login";
import { HTTPException } from "hono/http-exception";
import { sign } from "hono/jwt";
import { getCookie, setCookie } from "hono/cookie";
import { bearerAuth } from "hono/bearer-auth";

const app = new Hono();

app.use(logger());

app.post("/login", zValidator("json", LoginSchema), async (c) => {
  const { email, password } = await c.req.json();

  if (password !== "password") {
    throw new HTTPException(401, { message: "Invalid credentials" });
  }

  const payload = {
    email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };

  const token = await sign(payload, Bun.env.JWT_SECRET || "");
  setCookie(c, "token", token);
  return c.json({
    payload,
    token,
  });
});

app.use(
  "/index/*",
  bearerAuth({
    verifyToken: async (token, c) => {
      return token === getCookie(c, "token");
    },
  }),
);

app.get("/index/movies", (c) => {
  return c.json({
    movies: [
      { title: "Inception", year: 2010 },
      { title: "Interstellar", year: 2014 },
      { title: "Dunkirk", year: 2017 },
    ],
  });
});

export default app;
