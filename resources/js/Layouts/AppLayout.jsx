import { Link, usePage } from '@inertiajs/react';

export default function AppLayout({ children, title }) {
    const { flash } = usePage().props;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100">
            <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800">
                <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-amber-400">SIGAP</p>
                        <h1 className="text-xl font-semibold">Sistem Monitoring Pengendalian ATK UP Pekanbaru</h1>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/"
                            className="px-4 py-2 rounded-full bg-slate-800 text-sm hover:bg-slate-700"
                        >
                            Input Permintaan
                        </Link>
                        <Link
                            href="/reports"
                            className="px-4 py-2 rounded-full bg-amber-400 text-slate-900 text-sm font-semibold hover:bg-amber-300"
                        >
                            Laporan
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-10">
                {title && (
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-semibold text-white">{title}</h2>
                        <p className="text-sm text-slate-400">Formulir pengajuan permintaan ATK Pengelolaan</p>
                    </div>
                )}

                {flash?.success && (
                    <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-emerald-200">
                        {flash.success}
                    </div>
                )}

                {flash?.error && (
                    <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-200">
                        {flash.error}
                    </div>
                )}

                {children}
            </main>
        </div>
    );
}
