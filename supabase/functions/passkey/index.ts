// Face ID / passkey sign-in for the Betting Ledger.
// Actions: register-options, register-verify (need a signed-in user), login-options, login-verify (public).
import { createClient } from "npm:@supabase/supabase-js@2.119.2";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "npm:@simplewebauthn/server@14.1.0";

const ALLOWED_ORIGINS = ["https://aman-ledger.vercel.app", "http://localhost:3000"];
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const b64url = {
  encode(bytes: Uint8Array) {
    let s = "";
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  },
  decode(str: string) {
    const s = atob(str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4));
    return Uint8Array.from(s, (c) => c.charCodeAt(0));
  },
};

function cors(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

async function saveChallenge(challenge: string, kind: "register" | "login", userId: string | null) {
  await admin.from("webauthn_challenges").delete().lt("created_at", new Date(Date.now() - CHALLENGE_TTL_MS).toISOString());
  const { data, error } = await admin.from("webauthn_challenges").insert({ challenge, kind, user_id: userId }).select("id").single();
  if (error) throw new Error("Could not start Face ID");
  return data.id as string;
}

async function takeChallenge(id: string, kind: "register" | "login") {
  const { data } = await admin.from("webauthn_challenges").delete().eq("id", id).eq("kind", kind).select().maybeSingle();
  if (!data || Date.now() - new Date(data.created_at).getTime() > CHALLENGE_TTL_MS) throw new Error("Face ID request expired, try again");
  return data as { challenge: string; user_id: string | null };
}

async function requireUser(req: Request) {
  const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const { data, error } = await admin.auth.getUser(jwt);
  if (error || !data.user) throw new Error("Sign in first");
  return data.user;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  if (!ALLOWED_ORIGINS.includes(origin)) return new Response("Forbidden", { status: 403 });
  const headers = { ...cors(origin), "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });

  const rpID = new URL(origin).hostname;
  try {
    const body = await req.json();
    const action = body?.action;

    if (action === "register-options") {
      const user = await requireUser(req);
      const { data: existing } = await admin.from("passkeys").select("id, transports").eq("user_id", user.id);
      const options = await generateRegistrationOptions({
        rpName: "Betting Ledger",
        rpID,
        userName: user.email ?? "ledger",
        userID: new TextEncoder().encode(user.id),
        attestationType: "none",
        excludeCredentials: (existing ?? []).map((k) => ({ id: k.id, transports: k.transports ?? undefined })),
        authenticatorSelection: { residentKey: "required", userVerification: "required" },
      });
      const challengeId = await saveChallenge(options.challenge, "register", user.id);
      return new Response(JSON.stringify({ options, challengeId }), { headers });
    }

    if (action === "register-verify") {
      const user = await requireUser(req);
      const ch = await takeChallenge(String(body.challengeId), "register");
      if (ch.user_id !== user.id) throw new Error("Face ID request does not match");
      const result = await verifyRegistrationResponse({
        response: body.response,
        expectedChallenge: ch.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: true,
      });
      if (!result.verified) throw new Error("Face ID could not be verified");
      const c = result.registrationInfo.credential;
      const { error } = await admin.from("passkeys").insert({
        id: c.id,
        user_id: user.id,
        public_key: b64url.encode(c.publicKey),
        counter: c.counter,
        transports: c.transports ?? null,
        device: String(body.device || "").slice(0, 60) || null,
      });
      if (error) throw new Error("Could not save Face ID");
      return new Response(JSON.stringify({ ok: true }), { headers });
    }

    if (action === "login-options") {
      const options = await generateAuthenticationOptions({ rpID, userVerification: "required" });
      const challengeId = await saveChallenge(options.challenge, "login", null);
      return new Response(JSON.stringify({ options, challengeId }), { headers });
    }

    if (action === "login-verify") {
      const ch = await takeChallenge(String(body.challengeId), "login");
      const credId = String(body.response?.id || "");
      const { data: key } = await admin.from("passkeys").select("*").eq("id", credId).maybeSingle();
      if (!key) throw new Error("This Face ID isn't set up for the ledger. Sign in with your password.");
      const result = await verifyAuthenticationResponse({
        response: body.response,
        expectedChallenge: ch.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: { id: key.id, publicKey: b64url.decode(key.public_key), counter: Number(key.counter), transports: key.transports ?? undefined },
        requireUserVerification: true,
      });
      if (!result.verified) throw new Error("Face ID could not be verified");
      await admin.from("passkeys").update({ counter: result.authenticationInfo.newCounter, last_used_at: new Date().toISOString() }).eq("id", key.id);
      const { data: u } = await admin.auth.admin.getUserById(key.user_id);
      if (!u?.user?.email) throw new Error("Account not found");
      const { data: link, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: u.user.email });
      if (error || !link?.properties?.hashed_token) throw new Error("Could not sign you in");
      return new Response(JSON.stringify({ token_hash: link.properties.hashed_token }), { headers });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message || "Something went wrong" }), { status: 400, headers });
  }
});
