"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { FamilyLoginResponse } from "../../lib/family/auth-contracts";

const REMEMBER_EMAIL_KEY = "hf_auth_remember_email";

function ProfileGlyph() {
  return (
    <svg aria-hidden fill="none" height="28" viewBox="0 0 24 24" width="28">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <circle cx="17" cy="9" r="2.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M21 20v-0.5a3.5 3.5 0 0 0-3.5-3.5h-1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");
  const nextPath =
    nextRaw !== null && nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (stored !== null && stored.trim() !== "") {
        setEmail(stored);
        setRemember(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setPending(true);

    void (async () => {
      const res = await fetch("/api/family/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password } satisfies { email: string; password: string })
      });

      const data = (await res.json()) as FamilyLoginResponse;

      if (!res.ok || data.ok === false) {
        if (data.ok === false && data.error === "invalid_credentials") {
          setError("Correo o contraseña incorrectos.");
        } else {
          setError("No se pudo iniciar sesión. Revisa la configuración del servidor.");
        }
        setPending(false);
        return;
      }

      if (data.user.role !== "admin") {
        await fetch("/api/family/auth/logout", { method: "POST", credentials: "include" });
        setError("Esta entrada es solo para cuentas administradoras.");
        setPending(false);
        return;
      }

      try {
        if (remember) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      } catch {
        /* ignore */
      }

      setPending(false);

      if (data.profiles.length === 0) {
        router.push("/auth/no-profiles");
        return;
      }

      if (data.mustSelectProfile) {
        router.push(`/auth/select-profile?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      router.push(nextPath);
    })();
  };

  return (
    <div className="hf-bo-form-inner">
      <div aria-hidden className="hf-bo-profile-ring">
        <ProfileGlyph />
      </div>

      <form className="hf-bo-form" onSubmit={onSubmit}>
        <div className="hf-bo-field">
          <label className="hf-login-sr-only" htmlFor="hf-bo-email">
            Correo (usuario)
          </label>
          <input
            autoComplete="username"
            className="hf-bo-input"
            id="hf-bo-email"
            name="email"
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            placeholder="Username"
            required
            type="email"
            value={email}
          />
        </div>
        <div className="hf-bo-field">
          <label className="hf-login-sr-only" htmlFor="hf-bo-password">
            Contraseña
          </label>
          <input
            autoComplete="current-password"
            className="hf-bo-input"
            id="hf-bo-password"
            name="password"
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            placeholder="Password"
            required
            type="password"
            value={password}
          />
        </div>

        {error !== null ? (
          <p className="hf-bo-error" role="alert">
            {error}
          </p>
        ) : null}

        <button className="hf-bo-submit" disabled={pending} type="submit">
          {pending ? "…" : "Log in"}
        </button>

        <div className="hf-bo-row">
          <label className="hf-bo-remember">
            <input
              checked={remember}
              className="hf-bo-checkbox"
              onChange={(e) => {
                setRemember(e.target.checked);
              }}
              type="checkbox"
            />
            <span>Remember me</span>
          </label>
        </div>
      </form>

      <p className="hf-bo-footnote">
        ¿Solo quieres ver contenido?{" "}
        <Link href={`/auth/login?next=${encodeURIComponent("/")}`}>Acceso familiar</Link>
      </p>
    </div>
  );
}
