import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const CREAM = "#F8F5EF";
const INK = "#16181D";
const BURGUNDY = "#8E1E2C";
const MUTED = "#5A5851";
const RULE = "#16181D";
const HAIRLINE = "#DCD3C2";

async function loadFont(family: "spectral" | "spectral-italic" | "spectral-extra") {
  // Google Fonts CSS API resolves to a single woff2 we can fetch from edge
  const url =
    family === "spectral-italic"
      ? "https://fonts.gstatic.com/s/spectral/v16/rnCu-xZa_krGokauCeNq1wWyafOPXHIJErY.woff2"
      : family === "spectral-extra"
        ? "https://fonts.gstatic.com/s/spectral/v16/rnCr-xZa_krGokauCeNq1wWyZQW1zMM.woff2" // 800
        : "https://fonts.gstatic.com/s/spectral/v16/rnCr-xZa_krGokauCeNq1wWyZQW1zMM.woff2"; // 700/800 fallback
  const res = await fetch(url, { cache: "force-cache" });
  return res.arrayBuffer();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "Le Relief";
  const category = searchParams.get("category") || "";
  const author = searchParams.get("author") || "";
  const date = searchParams.get("date") || "";
  const locale = (searchParams.get("locale") || "fr") as "fr" | "en";

  const len = title.length;
  const fontSize = len > 110 ? 56 : len > 80 ? 66 : len > 50 ? 78 : 92;

  // Apply minimal smart-typography on FR titles for better look
  const displayTitle =
    locale === "fr"
      ? title
          .replace(/\s+([:;!?])/g, "\u00A0$1")
          .replace(/"([^"]+)"/g, "\u00AB\u00A0$1\u00A0\u00BB")
      : title;

  let spectralBold: ArrayBuffer | null = null;
  let spectralItalic: ArrayBuffer | null = null;
  try {
    [spectralBold, spectralItalic] = await Promise.all([
      loadFont("spectral-extra"),
      loadFont("spectral-italic"),
    ]);
  } catch {
    spectralBold = null;
    spectralItalic = null;
  }

  const editionLabel =
    locale === "fr" ? "Édition numérique" : "Digital edition";
  const bylinePrefix = locale === "fr" ? "Par" : "By";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          backgroundColor: CREAM,
          fontFamily: "Spectral, Georgia, serif",
          color: INK,
          position: "relative",
        }}
      >
        {/* Top burgundy hairline */}
        <div style={{ backgroundColor: BURGUNDY, height: "6px", width: "100%", display: "flex" }} />

        {/* Masthead */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "28px 64px 18px",
            borderBottom: `1px solid ${HAIRLINE}`,
          }}
        >
          <span
            style={{
              fontFamily: "Spectral, Georgia, serif",
              fontSize: "34px",
              fontWeight: 800,
              letterSpacing: "-1.2px",
              color: INK,
              display: "flex",
            }}
          >
            Le Relief
          </span>
          <span
            style={{
              fontSize: "13px",
              fontFamily: "Helvetica, Arial, sans-serif",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "2px",
              color: MUTED,
              display: "flex",
            }}
          >
            Port-au-Prince · {editionLabel}
          </span>
        </div>

        {/* Body */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "40px 64px 32px",
            justifyContent: "space-between",
          }}
        >
          {/* Kicker */}
          {category ? (
            <span
              style={{
                fontSize: "16px",
                fontFamily: "Helvetica, Arial, sans-serif",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "3px",
                color: BURGUNDY,
                display: "flex",
              }}
            >
              {category}
            </span>
          ) : <span style={{ display: "flex", height: "16px" }} />}

          {/* Headline */}
          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              paddingTop: "20px",
              paddingBottom: "20px",
            }}
          >
            <h1
              style={{
                fontFamily: "Spectral, Georgia, serif",
                fontSize: `${fontSize}px`,
                fontWeight: 800,
                color: INK,
                lineHeight: 1.02,
                margin: 0,
                letterSpacing: "-0.015em",
                // Allow up to ~6 lines visually
                maxHeight: "440px",
                overflow: "hidden",
                display: "flex",
              }}
            >
              {displayTitle}
            </h1>
          </div>

          {/* Italic dateline */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: `2px solid ${RULE}`,
              paddingTop: "18px",
            }}
          >
            <span
              style={{
                fontSize: "20px",
                fontFamily: "Spectral, Georgia, serif",
                fontStyle: "italic",
                color: MUTED,
                display: "flex",
              }}
            >
              {author ? `${bylinePrefix} ${author}` : "Le Relief"}
              {date ? ` · ${date}` : ""}
            </span>
            <span
              style={{
                fontSize: "13px",
                fontFamily: "Helvetica, Arial, sans-serif",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "2px",
                color: MUTED,
                display: "flex",
              }}
            >
              lerelief.ht
            </span>
          </div>
        </div>

        {/* Bottom burgundy hairline */}
        <div style={{ backgroundColor: BURGUNDY, height: "3px", width: "100%", display: "flex" }} />
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts:
        spectralBold && spectralItalic
          ? [
              {
                name: "Spectral",
                data: spectralBold,
                style: "normal",
                weight: 800,
              },
              {
                name: "Spectral",
                data: spectralItalic,
                style: "italic",
                weight: 400,
              },
            ]
          : undefined,
    },
  );
}
