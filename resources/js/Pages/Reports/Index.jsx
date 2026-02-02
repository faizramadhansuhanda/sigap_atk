import { useMemo, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { usePage } from '@inertiajs/react';

const statusStyles = {
    menunggu: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    disetujui: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    selesai: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    ditolak: 'bg-red-100 text-red-800 border-red-200',
    selesai_ditolak: 'bg-red-100 text-red-800 border-red-200',
};

export default function Index({ authorized, dateRange, startDate, endDate, requests }) {
    const { csrfToken } = usePage().props;
    const [sortKey, setSortKey] = useState('tanggal');
    const [sortDirection, setSortDirection] = useState('desc');

    const sortedRequests = useMemo(() => {
        const direction = sortDirection === 'asc' ? 1 : -1;
        const sorted = [...requests].sort((a, b) => {
            switch (sortKey) {
                case 'tanggal': {
                    const aDate = a.request_date_raw || '';
                    const bDate = b.request_date_raw || '';
                    return aDate.localeCompare(bDate) * direction;
                }
                case 'divisi':
                    return a.requester_division.localeCompare(b.requester_division) * direction;
                case 'nama':
                    return a.requester_name.localeCompare(b.requester_name) * direction;
                case 'barang': {
                    const aItems = (a.items || []).map((item) => item.item_name).join(', ');
                    const bItems = (b.items || []).map((item) => item.item_name).join(', ');
                    return aItems.localeCompare(bItems) * direction;
                }
                case 'status':
                    return a.status_label.localeCompare(b.status_label) * direction;
                default:
                    return 0;
            }
        });

        return sorted;
    }, [requests, sortDirection, sortKey]);

    return (
        <AppLayout title="Laporan Permintaan ATK">
            <div className="rounded-2xl bg-white text-slate-900 p-6 shadow-xl">
                {!authorized ? (
                    <div className="max-w-md space-y-4">
                        <p className="text-sm text-slate-600">Masukkan sandi admin untuk melihat laporan.</p>
                        <form method="POST" action="/reports/login" className="space-y-3">
                            <input type="hidden" name="_token" value={csrfToken} />
                            <div>
                                <label className="text-sm font-medium">Sandi Admin</label>
                                <input
                                    type="password"
                                    name="admin_password"
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="rounded-lg bg-blue-600 px-4 py-2 text-white"
                            >
                                Masuk
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="text-lg font-semibold">Ringkasan Laporan Permintaan</h3>
                            <div className="flex flex-wrap items-center gap-2">
                                <a
                                    href="/requests/export/excel"
                                    className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                                >
                                    Export Excel
                                </a>
                                <form method="POST" action="/reports/logout">
                            <input type="hidden" name="_token" value={csrfToken} />
                            <button
                                type="submit"
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                Keluar dari laporan
                            </button>
                                </form>
                            </div>
                        </div>
                        {dateRange?.start && dateRange?.end && (
                            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                                Rentang tanggal laporan: <span className="font-semibold">{dateRange.start}</span> sampai{' '}
                                <span className="font-semibold">{dateRange.end}</span>
                            </div>
                        )}
                        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <form method="GET" action="/reports" className="flex flex-wrap items-end gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600">Tanggal awal</label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        defaultValue={startDate ?? ''}
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600">Tanggal akhir</label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        defaultValue={endDate ?? ''}
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                                >
                                    Terapkan
                                </button>
                            </form>
                            <div>
                                <label className="text-xs font-semibold text-slate-600">Urutkan berdasarkan</label>
                                <select
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                    value={sortKey}
                                    onChange={(event) => setSortKey(event.target.value)}
                                >
                                    <option value="tanggal">Tanggal</option>
                                    <option value="divisi">Divisi</option>
                                    <option value="nama">Nama Pemohon</option>
                                    <option value="barang">Barang</option>
                                    <option value="status">Status</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600">Arah urutan</label>
                                <select
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                    value={sortDirection}
                                    onChange={(event) => setSortDirection(event.target.value)}
                                >
                                    <option value="desc">Terbaru</option>
                                    <option value="asc">Terlama</option>
                                </select>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-slate-50 text-left text-slate-600">
                                        <th className="py-3 px-3 font-semibold">Nama Pemohon</th>
                                        <th className="py-3 px-3 font-semibold">Bagian/Divisi</th>
                                        <th className="py-3 px-3 font-semibold">Tanggal</th>
                                        <th className="py-3 px-3 font-semibold">Status</th>
                                        <th className="py-3 px-3 font-semibold">Barang</th>
                                        <th className="py-3 px-3 font-semibold">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedRequests.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="py-4 text-center text-slate-500">
                                                Belum ada data laporan.
                                            </td>
                                        </tr>
                                    )}
                                    {sortedRequests.map((request) => (
                                        <tr key={request.id} className="border-b align-top">
                                            <td className="py-3 px-3 font-medium text-slate-900">{request.requester_name}</td>
                                            <td className="py-3 px-3 text-slate-700">{request.requester_division}</td>
                                            <td className="py-3 px-3 text-slate-700">{request.request_date}</td>
                                            <td className="py-3 px-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                                                        statusStyles[request.status] || 'bg-slate-100 text-slate-600'
                                                    }`}
                                                >
                                                    {request.status_label}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <ul className="list-disc space-y-1 pl-4 text-slate-700">
                                                    {request.items.map((item) => (
                                                        <li key={item.id}>
                                                            {item.item_name} - {item.quantity} {item.unit}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </td>
                                            <td className="py-3 px-3 text-slate-700">{request.notes}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
