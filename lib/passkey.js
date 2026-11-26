import { startAuthentication, startRegistration, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { supabase, SUPABASE_URL, SUPABASE_KEY } from "./supabase";

const FLAG = "ledger.faceid";

export const passkeySupported = () => typeof window !== "undefined" && browserSupportsWebAuthn();
export const hasPasskeyHere = () => { try { return localStorage.getItem(FLAG) === "1"; } catch { return false; } };
const markPasskey = (on) => { try { on ? localStorage.setItem(FLAG, "1") : localStorage.removeItem(FLAG); } catch {} };

async function call(action, body = {}, token) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/passkey`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ action, ...body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Face ID is unavailable right now");
  return data;
}

function deviceName() {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Android/.test(ua)) return "Android";
  if (/Windows/.test(ua)) return "Windows PC";
  return "This device";
}

export async function registerPasskey() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sign in first");
  const { options, challengeId } = await call("register-options", {}, token);
  const response = await startRegistration({ optionsJSON: options });
  await call("register-verify", { challengeId, response, device: deviceName() }, token);
  markPasskey(true);
}

export async function signInWithPasskey() {
  const { options, challengeId } = await call("login-options");
  const response = await startAuthentication({ optionsJSON: options });
  const { token_hash } = await call("login-verify", { challengeId, response });
  const { error } = await supabase.auth.verifyOtp({ token_hash, type: "email" });
  if (error) throw new Error("Could not sign you in. Try your password.");
  markPasskey(true);
}

export const forgetPasskeyHere = () => markPasskey(false);

export function friendlyWebAuthnError(e) {
  if (e?.name === "NotAllowedError") return "Face ID was cancelled.";
  if (e?.name === "InvalidStateError") return "Face ID is already set up on this device.";
  return e?.message || "Face ID didn't work. Try again.";
}
