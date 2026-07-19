import "./globals.css";

export const metadata = {
  title: "منصة تسيير الصفقات",
  description: "منصة إدارة الموارد والتوريدات",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}