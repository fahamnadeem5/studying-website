export const runtime = "edge";

import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
          borderRadius: 14,
          color: "white",
          fontSize: 32,
          fontWeight: 900,
          letterSpacing: -1,
        }}
      >
        AL
      </div>
    ),
    { ...size }
  );
}