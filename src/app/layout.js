import "./globals.css";

export const metadata = {
  title: "Live Market",
  description: "Social commerce para tiendas que venden por live y WhatsApp.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
