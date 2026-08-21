import { ImageResponse } from "next/og"

export const alt = "Counter — the till and the pay-later book, in one place"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
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
          background: "#097c87",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 100,
            height: 100,
            borderRadius: 28,
            background: "#ffffff",
            color: "#097c87",
            fontSize: 60,
            fontWeight: 700,
            marginBottom: 36,
          }}
        >
          C
        </div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 700, color: "#ffffff" }}>
          Counter
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 22,
            maxWidth: 920,
            textAlign: "center",
            fontSize: 34,
            color: "#fca47c",
          }}
        >
          The till and the pay-later book, in one place.
        </div>
      </div>
    ),
    { ...size }
  )
}
