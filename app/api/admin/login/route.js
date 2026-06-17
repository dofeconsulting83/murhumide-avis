import { cookies } from "next/headers";

export async function POST(request) {
  const { password } = await request.json();

  if (!password || password !== process.env.ADMIN_SECRET) {
    return Response.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set("admin_session", process.env.ADMIN_SECRET, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 jours
    path: "/",
  });

  return Response.json({ ok: true });
}
