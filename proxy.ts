import { auth } from "@/lib/auth";

export default auth;

export const config = {
  // Protect everything except the login page, auth routes, and static files
  matcher: ["/((?!login|api/auth|api/register|_next|favicon.ico).*)"],
};
