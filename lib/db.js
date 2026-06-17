// Base de données Supabase via leur API REST — aucune librairie nécessaire

const getHeaders = () => ({
  "apikey": process.env.SUPABASE_SERVICE_KEY,
  "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
  "Content-Type": "application/json",
});

export async function saveFeedback({ rating, locationId, locationName, prestations, ville, commentaire }) {
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/feedbacks`, {
    method: "POST",
    headers: { ...getHeaders(), "Prefer": "return=minimal" },
    body: JSON.stringify({
      rating,
      location_id: locationId ?? null,
      location_name: locationName ?? null,
      prestations: JSON.stringify(prestations ?? []),
      ville: ville ?? null,
      commentaire: commentaire ?? null,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function getFeedbacks() {
  const res = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/feedbacks?order=created_at.desc&select=*`,
    { headers: getHeaders() }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function setStatus(id, status) {
  const res = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/feedbacks?id=eq.${id}`,
    {
      method: "PATCH",
      headers: { ...getHeaders(), "Prefer": "return=minimal" },
      body: JSON.stringify({ status }),
    }
  );
  if (!res.ok) throw new Error(await res.text());
}
