import { ImageResponse } from "next/og";

export const alt = "plsfix — Client Feedback & Bug Tracking";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 15% 20%, #172554 0%, #0f172a 45%, #020617 100%)",
          color: "#f8fafc",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          padding: "72px",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            borderRadius: "28px",
            border: "1px solid rgba(148,163,184,0.22)",
            background: "linear-gradient(145deg, rgba(15,23,42,0.9), rgba(2,6,23,0.8))",
            padding: "56px",
            alignItems: "center",
            gap: "44px",
          }}
        >
          <div
            style={{
              width: 190,
              height: 190,
              borderRadius: 36,
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 150,
                height: 150,
                borderRadius: 75,
                background: "#000000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "36px solid transparent",
                  borderRight: "36px solid transparent",
                  borderBottom: "64px solid #f8fafc",
                  transform: "translateY(4px)",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              maxWidth: "760px",
            }}
          >
            <div style={{ fontSize: 66, fontWeight: 700, lineHeight: 1.05 }}>plsfix</div>
            <div style={{ fontSize: 36, opacity: 0.95, lineHeight: 1.2 }}>
              Client Feedback & Bug Tracking
            </div>
            <div style={{ fontSize: 28, color: "#cbd5e1", lineHeight: 1.3 }}>
              Feedback and bugs, shared with clients.
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
