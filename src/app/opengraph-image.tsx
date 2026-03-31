import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "TechNurture Labs — Immersive Learning Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          padding: "80px",
          position: "relative",
        }}
      >
        {/* Subtle grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Top badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(59,130,246,0.15)",
            border: "1px solid rgba(59,130,246,0.3)",
            borderRadius: "8px",
            padding: "8px 16px",
            marginBottom: "32px",
          }}
        >
          <span style={{ color: "#60a5fa", fontSize: "14px", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            TechNurture Labs
          </span>
        </div>

        {/* Main headline */}
        <h1
          style={{
            fontSize: "68px",
            fontWeight: 900,
            color: "#f8fafc",
            textAlign: "center",
            lineHeight: 1.1,
            margin: "0 0 24px 0",
            maxWidth: "900px",
          }}
        >
          The learning platform your students will{" "}
          <span style={{ color: "#3b82f6" }}>actually love.</span>
        </h1>

        {/* Sub-headline */}
        <p
          style={{
            fontSize: "26px",
            color: "#94a3b8",
            textAlign: "center",
            margin: "0 0 48px 0",
            maxWidth: "700px",
            fontWeight: 500,
          }}
        >
          Gamified LMS for K-12 Schools — IoT, Embedded Systems, Full-Stack Development
        </p>

        {/* Bottom URL */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            padding: "12px 24px",
          }}
        >
          <span style={{ color: "#64748b", fontSize: "18px", fontWeight: 700 }}>
            technurturelms.in
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
