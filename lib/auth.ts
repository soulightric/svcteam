import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-secret-ganti-di-env"
);

export async function signToken(payload: Record<string, string>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

export interface AdminPayload {
  id: string;
  username: string;
  role: "SUPER_ADMIN" | "ADMIN";
}

export async function signAdminToken(payload: AdminPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}

export async function verifyAdminToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as AdminPayload;
  } catch {
    return null;
  }
}
