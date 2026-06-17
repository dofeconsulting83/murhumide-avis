import { saveFeedback } from "@/lib/db";

export async function POST(request) {
  try {
    const body = await request.json();
    await saveFeedback(body);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Feedback save error:", error);
    return Response.json({ error: "Erreur" }, { status: 500 });
  }
}
