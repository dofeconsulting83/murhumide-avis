import "./globals.css";

export const metadata = {
  title: "Donnez votre avis — Mur Humide",
  description: "Partagez votre expérience avec Mur Humide en quelques secondes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
