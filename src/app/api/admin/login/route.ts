import { NextRequest, NextResponse } from "next/server";

// SECURE BACKEND CREDENTIALS VERIFICATION
const VALID_ADMIN_USERS = [
  "djnitish97@gmail.com",
  "nitishkhobragade89@gmail.com",
  "admin",
  "8982324497"
];

const VALID_ADMIN_PASSWORDS = [
  "admin@nk",
  "Admin@nk",
  "8982324497"
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawId = (body.adminId || body.email || "").toString().trim();
    const rawPass = (body.password || "").toString().trim();

    const cleanId = rawId.toLowerCase();
    const cleanPass = rawPass;

    // Check credentials on secure backend
    const isUserValid = VALID_ADMIN_USERS.includes(cleanId);
    const isPassValid = VALID_ADMIN_PASSWORDS.includes(cleanPass);

    if (isUserValid && isPassValid) {
      const response = NextResponse.json({
        success: true,
        message: "लॉगिन सफल! एडमिन डैशबोर्ड लोड हो रहा है...",
        user: cleanId,
        token: "authenticated_djnitish"
      });

      // Set cookie for session persistence across page reloads
      response.cookies.set("np_portal_admin_session", "authenticated_djnitish", {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 14 // 14 days
      });

      return response;
    }

    return NextResponse.json(
      {
        success: false,
        message: "अमान्य क्रेडेंशियल्स! कृपया सही यूजर आईडी (djnitish97@gmail.com) एवं सुरक्षा पासवर्ड दर्ज करें।"
      },
      { status: 401 }
    );
  } catch (error) {
    console.error("Backend Admin Login API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "सर्वर प्रमाणीकरण में त्रुटि हुई। कृपया पुनः प्रयास करें।"
      },
      { status: 500 }
    );
  }
}
