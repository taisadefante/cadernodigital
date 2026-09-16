"use client";

import { FormEvent, useEffect, useState } from "react";
import { FirebaseError } from "firebase/app";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

function msg(e: unknown) {
  if (!(e instanceof FirebaseError)) {
    return "Não foi possível concluir.";
  }

  return (
    {
      "auth/invalid-credential": "E-mail ou senha incorretos.",
      "auth/invalid-email": "Informe um e-mail válido.",
      "auth/too-many-requests":
        "Muitas tentativas. Aguarde um pouco e tente novamente.",
      "auth/user-disabled": "Este usuário está desativado.",
    } as Record<string, string>
  )[e.code] || "Não foi possível concluir. Verifique os dados.";
}

export default function Login() {
  const router = useRouter();

  const {
    user,
    loading,
    login,
    resetPassword,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.replace("/caderno");
    }
  }, [loading, user, router]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setInfo("");

    try {
      setBusy(true);

      await login(
        email.trim(),
        password
      );

      router.replace("/caderno");
    } catch (error) {
      setError(msg(error));
    } finally {
      setBusy(false);
    }
  }

  async function recuperarSenha() {
    setError("");
    setInfo("");

    if (!email.trim()) {
      setError(
        "Informe seu e-mail primeiro."
      );
      return;
    }

    try {
      await resetPassword(
        email.trim()
      );

      setInfo(
        "Enviamos o link de recuperação para seu e-mail."
      );
    } catch (error) {
      setError(msg(error));
    }
  }

  return (
    <main
      className="container-fluid"
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left,#dbeafe 0,transparent 38%),linear-gradient(135deg,#f8fafc,#eef2ff)",
      }}
    >
      <div className="row min-vh-100">
        {/* LADO ESQUERDO */}
        <section className="col-lg-6 d-none d-lg-flex align-items-center justify-content-center p-5">
          <div
            style={{
              maxWidth: 560,
            }}
          >
            <div
              className="d-inline-flex align-items-center justify-content-center mb-4"
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                background: "#2563eb",
                color: "white",
                fontSize: 30,
                boxShadow:
                  "0 14px 40px rgba(37,99,235,.22)",
              }}
            >
              <i className="bi bi-journal-richtext" />
            </div>

            <h1
              className="fw-bold mb-3"
              style={{
                fontSize: 48,
                lineHeight: 1.05,
              }}
            >
              Seu caderno,
              <br />
              agora organizado.
            </h1>

            <p className="text-secondary fs-5 mb-4">
              Anotações, agenda, checklist,
              pesquisa, lembretes e impressão
              em um único lugar.
            </p>

            <div className="d-grid gap-3">
              <div className="d-flex align-items-center gap-3">
                <span
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: "#fff",
                    color: "#2563eb",
                  }}
                >
                  <i className="bi bi-search" />
                </span>

                <span className="fw-semibold">
                  Encontre qualquer anotação rapidamente
                </span>
              </div>

              <div className="d-flex align-items-center gap-3">
                <span
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: "#fff",
                    color: "#2563eb",
                  }}
                >
                  <i className="bi bi-calendar-check" />
                </span>

                <span className="fw-semibold">
                  Organize compromissos e lembretes
                </span>
              </div>

              <div className="d-flex align-items-center gap-3">
                <span
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: "#fff",
                    color: "#2563eb",
                  }}
                >
                  <i className="bi bi-shield-lock" />
                </span>

                <span className="fw-semibold">
                  Seus dados ficam separados por usuário
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* LOGIN */}
        <section className="col-12 col-lg-6 d-flex align-items-center justify-content-center p-3 p-md-5">
          <div
            className="bg-white w-100 p-4 p-md-5"
            style={{
              maxWidth: 520,
              borderRadius: 24,
              boxShadow:
                "0 20px 60px rgba(15,23,42,.12)",
            }}
          >
            <div className="d-lg-none d-flex align-items-center gap-2 mb-4">
              <span
                className="d-flex align-items-center justify-content-center"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 13,
                  background: "#2563eb",
                  color: "#fff",
                }}
              >
                <i className="bi bi-journal-richtext" />
              </span>

              <strong>
                Meu Caderno
              </strong>
            </div>

            <h2 className="fw-bold mb-2">
              Bem-vindo de volta
            </h2>

            <p className="text-secondary mb-4">
              Entre para acessar seu caderno.
            </p>

            {error && (
              <div className="alert alert-danger">
                <i className="bi bi-exclamation-triangle me-2" />
                {error}
              </div>
            )}

            {info && (
              <div className="alert alert-success">
                <i className="bi bi-check-circle me-2" />
                {info}
              </div>
            )}

            <form onSubmit={submit}>
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  E-mail
                </label>

                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <i className="bi bi-envelope" />
                  </span>

                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) =>
                      setEmail(
                        e.target.value
                      )
                    }
                    placeholder="seu@email.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="mb-2">
                <label className="form-label fw-semibold">
                  Senha
                </label>

                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <i className="bi bi-lock" />
                  </span>

                  <input
                    type={
                      show
                        ? "text"
                        : "password"
                    }
                    className="form-control"
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    minLength={6}
                    required
                    autoComplete="current-password"
                  />

                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() =>
                      setShow(
                        !show
                      )
                    }
                    title={
                      show
                        ? "Ocultar senha"
                        : "Mostrar senha"
                    }
                  >
                    <i
                      className={`bi ${
                        show
                          ? "bi-eye-slash"
                          : "bi-eye"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="text-end mb-4">
                <button
                  type="button"
                  className="btn btn-link btn-sm text-decoration-none p-0"
                  onClick={() =>
                    void recuperarSenha()
                  }
                >
                  Esqueci minha senha
                </button>
              </div>

              <button
                className="btn btn-primary w-100 py-2 fw-semibold"
                disabled={busy}
                style={{
                  borderRadius: 12,
                }}
              >
                {busy ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2" />
                    Entrar
                  </>
                )}
              </button>
            </form>

            {/* 
              IMPORTANTE:
              NÃO EXISTE CADASTRO NESTA TELA.
              Também não existe link para /login1.
            */}
          </div>
        </section>
      </div>
    </main>
  );
}