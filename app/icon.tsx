import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1a1817",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#c97b5a",
          fontStyle: "italic",
          fontFamily: "Georgia, serif",
          fontSize: 320,
        }}
      >
        C
      </div>
    ),
    { ...size },
  );
}
