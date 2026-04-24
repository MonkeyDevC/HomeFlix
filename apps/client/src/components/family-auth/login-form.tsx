"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { FamilyLoginResponse } from "../../lib/family/auth-contracts";

const REMEMBER_EMAIL_KEY = "hf_auth_remember_email";

export function FamilyLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");
  const nextPath =
    nextRaw !== null && nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/";

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
      // ignore
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

      try {
        if (remember) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      } catch {
        // ignore
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
    <div className="hf-login-card hf-login-glass">
      <div className="hf-login-card-head">
        <h1 className="hf-login-title">Iniciar sesión</h1>
        <p className="hf-login-subtitle">Películas, series y clips para toda la familia.</p>
      </div>

      <form className="hf-login-form" onSubmit={onSubmit}>
        <div className="hf-login-field">
          <label className="hf-login-sr-only" htmlFor="hf-login-email">
            Correo electrónico
          </label>
          <input
            autoComplete="email"
            className="hf-login-input"
            id="hf-login-email"
            name="email"
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            placeholder="Correo electrónico"
            required
            type="email"
            value={email}
          />
        </div>
        <div className="hf-login-field">
          <label className="hf-login-sr-only" htmlFor="hf-login-password">
            Contraseña
          </label>
          <input
            autoComplete="current-password"
            className="hf-login-input"
            id="hf-login-password"
            name="password"
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            placeholder="Contraseña"
            required
            type="password"
            value={password}
          />
        </div>

        {error !== null ? (
          <p className="hf-login-error" role="alert">
            {error}
          </p>
        ) : null}

        <button className="hf-login-submit" disabled={pending} type="submit">
          {pending ? "Entrando…" : "Iniciar sesión"}
        </button>

        <div className="hf-login-row">
          <label className="hf-login-remember">
            <input
              checked={remember}
              className="hf-login-checkbox"
              onChange={(e) => {
                setRemember(e.target.checked);
              }}
              type="checkbox"
            />
            <span>Recordarme</span>
          </label>
          <a className="hf-login-help-link" href="#ayuda">
            ¿Necesitas ayuda?
          </a>
        </div>
      </form>

      <div className="hf-login-extra">
        <p className="hf-login-new">
          <span className="hf-login-new-muted">¿Nuevo en HomeFlix?</span>{" "}
          <span className="hf-login-new-strong">Pide acceso al administrador de tu hogar.</span>
        </p>
        <p className="hf-login-recaptcha">
          Esta página puede estar protegida por medidas anti-abuso en el servidor.{" "}
          <span className="hf-login-recaptcha-faux">Más información</span>
        </p>
      </div>
    </div>
  );
}
