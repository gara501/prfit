import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

const supportedSizes = new Set([180, 192, 512]);

export function GET(request: NextRequest) {
  const requestedSize = Number(request.nextUrl.searchParams.get("size"));
  const size = supportedSizes.has(requestedSize) ? requestedSize : 512;
  const monogramSize = Math.round(size * 0.42);

  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#172033",
        border: `${Math.round(size * 0.055)}px solid #c2410c`,
        borderRadius: Math.round(size * 0.22),
        color: "#ffffff",
        display: "flex",
        fontFamily: "sans-serif",
        fontSize: monogramSize,
        fontWeight: 800,
        height: "100%",
        justifyContent: "center",
        letterSpacing: Math.round(size * -0.035),
        width: "100%",
      }}
    >
      PR
    </div>,
    { height: size, width: size },
  );
}
