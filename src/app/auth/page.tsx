import { redirect } from "next/navigation";

/**
 * Registration and sign-in now live in the application itself, behind the
 * session gate that guards DEMO and REAL account access.
 *
 * This page previously hosted a second, Supabase-backed sign-up form. It could
 * not complete: email confirmation is disabled, and its fallback posted
 * credentials to the API without storing the returned access token, so the
 * session was never actually established and the user landed back on a locked
 * terminal. Two competing registration surfaces was worse than one.
 *
 * Old links to /auth are preserved by redirecting to the working flow rather
 * than returning a 404.
 */
export default function AuthPage() {
  redirect("/");
}