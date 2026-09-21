import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: "लॉगआउट सफल!"
    });

    response.cookies.set("np_portal_admin_session", "", {
      path: "/",
      maxAge: 0
    });

    return response;
  } catch (err) {
    console.error("Logout API error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
