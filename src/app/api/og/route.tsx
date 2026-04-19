import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "Le Relief";
  const category = searchParams.get("category") || "";
  const author = searchParams.get("author") || "";

  const fontSize = title.length > 80 ? 42 : title.length > 55 ? 52 : 64;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#FFFFFF",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div style={{ backgroundColor: "#B11226", height: "8px", width: "100%", display: "flex" }} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "48px 64px",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <span
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "26px",
                fontWeight: 900,
                letterSpacing: "-0.5px",
                color: "#111111",
              }}
            >
              LE RELIEF
            </span>
            {category ? (
              <>
                <span style={{ color: "#D8D8D8", fontSize: "18px", display: "flex" }}>—</span>
                <span
                  style={{
                    fontSize: "13px",
                    fontFamily: "Helvetica, Arial, sans-serif",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    color: "#B11226",
                    display: "flex",
                  }}
                >
                  {category}
                </span>
              </>
            ) : null}
          </div>

          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              paddingTop: "24px",
              paddingBottom: "24px",
            }}
          >
            <h1
              style={{
                fontFamily: "Georgia, serif",
                fontSize: `${fontSize}px`,
                fontWeight: 900,
                color: "#111111",
                lineHeight: 1.1,
                margin: 0,
                letterSpacing: "-1px",
              }}
            >
              {title}
            </h1>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "2px solid #111111",
              paddingTop: "20px",
            }}
          >
            <span
              style={{
                fontSize: "15px",
                fontFamily: "Helvetica, Arial, sans-serif",
                fontWeight: 700,
                color: "#5F5F5F",
                display: "flex",
              }}
            >
              {author ? `Par ${author}` : "Le Relief Haïti"}
            </span>
            <span
              style={{
                fontSize: "13px",
                fontFamily: "Helvetica, Arial, sans-serif",
                color: "#5F5F5F",
                display: "flex",
              }}
            >
              le-relief.vercel.app
            </span>
          </div>
        </div>

        <div style={{ backgroundColor: "#B11226", height: "4px", width: "100%", display: "flex" }} />
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
