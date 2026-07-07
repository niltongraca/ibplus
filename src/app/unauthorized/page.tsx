import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-ib-surface flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ib-danger/10 mb-6">
          <svg className="w-8 h-8 text-ib-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-ib-primary mb-2">Acesso não autorizado</h1>
        <p className="text-ib-muted mb-8">
          Não tem permissão para aceder a esta página.
        </p>
        <Link
          href="/gestao/dashboard"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-ib-accent hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar ao painel
        </Link>
      </div>
    </div>
  );
}
