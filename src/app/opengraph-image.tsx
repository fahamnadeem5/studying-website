import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  const subjects = [
    { name: "Maths", code: "9709", color: "#2563eb" },
    { name: "Physics", code: "9702", color: "#7c3aed" },
    { name: "CS", code: "9618", color: "#0891b2" },
    { name: "Further Maths", code: "9231", color: "#d97706" },
    { name: "Biology", code: "9700", color: "#16a34a" },
    { name: "Chemistry", code: "9701", color: "#dc2626" },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 60%, #0f172a 100%)",
          color: "#fafafa",
          padding: "64px",
          gap: 24,
        }}
      >
        {/* Top brand mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 24,
            fontWeight: 700,
            color: "#818cf8",
            marginBottom: 12,
          }}
        >
          <span
            style={{
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1, #06b6d4)",
              color: "white",
              fontSize: 20,
              fontWeight: 900,
            }}
          >
            AL
          </span>
          A-Level Hub
        </div>

        {/* Main title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            letterSpacing: -2,
            background: "linear-gradient(135deg, #818cf8 0%, #67e8f9 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          CAIE Past Papers,
          <br />
          Notes &amp; Books
        </div>

        <div
          style={{
            fontSize: 22,
            color: "#a1a1aa",
            textAlign: "center",
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          Every CAIE A-Level resource in one place — yearly past papers, topical
          questions, revision notes and textbooks, all one click away.
        </div>

        {/* Subject chips */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "center",
            marginTop: 16,
            maxWidth: 900,
          }}
        >
          {subjects.map((s) => (
            <span
              key={s.code}
              style={{
                padding: "10px 18px",
                borderRadius: 999,
                background: `${s.color}22`,
                border: `1px solid ${s.color}66`,
                color: s.color,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {s.name} {s.code}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 14,
            color: "#52525b",
            display: "flex",
            gap: 24,
          }}
        >
          <span>studying-website.vercel.app</span>
          <span>•</span>
          <span>Free · No ads · No paywalls</span>
        </div>
      </div>
    ),
    { ...size }
  );
}