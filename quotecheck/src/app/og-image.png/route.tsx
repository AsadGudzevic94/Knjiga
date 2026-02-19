import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
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
          background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
            }}
          >
            ✓
          </div>
          <span
            style={{
              fontSize: "52px",
              fontWeight: 800,
              color: "white",
            }}
          >
            QuoteCheck
          </span>
        </div>
        <div
          style={{
            fontSize: "36px",
            fontWeight: 700,
            color: "white",
            textAlign: "center",
            lineHeight: 1.3,
            maxWidth: "800px",
          }}
        >
          Is This Price Fair?
          <br />
          Find Out in Seconds.
        </div>
        <div
          style={{
            fontSize: "20px",
            color: "rgba(255,255,255,0.8)",
            marginTop: "24px",
            textAlign: "center",
            maxWidth: "700px",
          }}
        >
          AI-powered quote analysis for car repairs, plumbing, dental, and more
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
