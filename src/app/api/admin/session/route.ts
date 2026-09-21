import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const cookieToken = req.cookies.get("np_portal_admin_session")?.value;
    const authHeader = req.headers.get("authorization");

    const isAuthenticated =
      cookieToken === "authenticated_djnitish" ||
      authHeader === "Bearer authenticated_djnitish";

    if (isAuthenticated) {
      return NextResponse.json({
        authenticated: true,
        user: "djnitish97@gmail.com"
      });
    }

    return NextResponse.json({
      authenticated: false
    });
  } catch (err) {
    console.error("Session check error:", err);
    return NextResponse.json({ authenticated: false });
  }
}
