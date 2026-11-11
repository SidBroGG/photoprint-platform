import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#F5F6F8",
        fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          background: "#FFFFFF",
          border: "1px solid #E3E6EB",
          borderRadius: 6,
          padding: 28,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: "#B26A00", letterSpacing: "0.04em" }}>
          404
        </div>
        <h1 style={{ fontSize: 22, margin: "8px 0 10px", color: "#17181C" }}>
          Страница не найдена
        </h1>
        <p style={{ fontSize: 14, color: "#5F6570", margin: "0 0 20px" }}>
          Проверьте адрес или вернитесь на домашний раздел платформы.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            background: "#FFC400",
            color: "#1A1A1A",
            borderRadius: 4,
            padding: "10px 18px",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          На главную
        </Link>
      </div>
    </main>
  );
}
