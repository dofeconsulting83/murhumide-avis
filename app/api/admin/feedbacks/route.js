import { getFeedbacks } from "@/lib/db";

export async function GET() {
  try {
    const feedbacks = await getFeedbacks();
    return Response.json({ feedbacks });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Erreur base de données" }, { status: 500 });
  }
}
