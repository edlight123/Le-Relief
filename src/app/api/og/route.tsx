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
  const imageParam = searchParams.get("image") || "";

  // Photo-led variant — used when an article has a cover image.
  // We always render a 1200×630 PNG so social platforms get a proper
  // large-image card instead of a 300 px WordPress thumbnail.
  if (imageParam && /^https?:\/\//i.test(imageParam)) {
    return renderPhotoCard({
      image: imageParam,
      title,
      category,
      locale,
    });
  }

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

/**
 * Photo-led 1200×630 card. Renders the supplied image edge-to-edge with a
 * dark gradient and a Le Relief title strip at the bottom. Used by article
 * pages so social platforms receive a guaranteed large-image card even when
 * the source `coverImage` is a small WordPress thumbnail.
 */
async function renderPhotoCard(opts: {
  image: string;
  title: string;
  category: string;
  locale: "fr" | "en";
}) {
  const { image, title, category, locale } = opts;
  const len = title.length;
  const fontSize = len > 140 ? 38 : len > 100 ? 44 : len > 70 ? 52 : 60;

  const displayTitle =
    locale === "fr"
      ? title
          .replace(/\s+([:;!?])/g, "\u00A0$1")
          .replace(/"([^"]+)"/g, "\u00AB\u00A0$1\u00A0\u00BB")
      : title;

  let spectralBold: ArrayBuffer | null = null;
  try {
    spectralBold = await loadFont("spectral-extra");
  } catch {
    spectralBold = null;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          position: "relative",
          backgroundColor: INK,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          width={1200}
          height={630}
          style={{
            width: "1200px",
            height: "630px",
            objectFit: "cover",
            display: "flex",
          }}
          alt=""
        />

        {/* Burgundy top hairline */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "1200px",
            height: "8px",
            backgroundColor: BURGUNDY,
            display: "flex",
          }}
        />

        {/* Bottom gradient + title strip */}
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: "1200px",
            height: "320px",
            background:
              "linear-gradient(to bottom, rgba(22,24,29,0) 0%, rgba(22,24,29,0.55) 45%, rgba(22,24,29,0.92) 100%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "0 64px 48px",
          }}
        >
          {category ? (
            <span
              style={{
                fontSize: "18px",
                fontFamily: "Helvetica, Arial, sans-serif",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "3px",
                color: "#F2C9CE",
                marginBottom: "16px",
                display: "flex",
              }}
            >
              {category}
            </span>
          ) : null}
          <h1
            style={{
              fontFamily: "Spectral, Georgia, serif",
              fontSize: `${fontSize}px`,
              fontWeight: 800,
              color: CREAM,
              lineHeight: 1.05,
              margin: 0,
              letterSpacing: "-0.01em",
              maxHeight: "240px",
              overflow: "hidden",
              display: "flex",
              textShadow: "0 2px 8px rgba(0,0,0,0.35)",
            }}
          >
            {displayTitle}
          </h1>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "24px",
              borderTop: `2px solid ${CREAM}`,
              paddingTop: "16px",
            }}
          >
            <span
              style={{
                fontFamily: "Spectral, Georgia, serif",
                fontSize: "26px",
                fontWeight: 800,
                letterSpacing: "-0.6px",
                color: CREAM,
                display: "flex",
              }}
            >
              Le Relief
            </span>
            <span
              style={{
                fontSize: "14px",
                fontFamily: "Helvetica, Arial, sans-serif",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "2px",
                color: CREAM,
                display: "flex",
              }}
            >
              lerelief.ht
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: spectralBold
        ? [
            {
              name: "Spectral",
              data: spectralBold,
              style: "normal",
              weight: 800,
            },
          ]
        : undefined,
    },
  );
}
