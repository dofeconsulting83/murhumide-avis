import { setStatus } from "@/lib/db";

const ALLOWED = ["nouveau", "en_cours", "resolu"];

export async function POST(request) {
  try {
    const { id, status } = await request.json();
    if (!id || !ALLOWED.includes(status)) {
      return Response.json({ error: "Paramètres invalides" }, { status: 400 });
    }
    await setStatus(id, status);
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Erreur base de données" }, { status: 500 });
  }
}
