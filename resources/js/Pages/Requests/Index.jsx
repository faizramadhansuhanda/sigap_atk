import { useMemo, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import PinModal from '../../Components/PinModal';
import { router, usePage } from '@inertiajs/react';

const statusStyles = {
    menunggu: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    disetujui: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    selesai: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    ditolak: 'bg-red-100 text-red-800 border-red-200',
    selesai_ditolak: 'bg-red-100 text-red-800 border-red-200',
};

const statusIcons = {
    menunggu: '⏳',
    disetujui: '✅',
    selesai: '🏁',
    ditolak: '❌',
    selesai_ditolak: '⚠️',
};

const statusTabs = [
    { key: 'menunggu', label: 'Menunggu' },
    { key: 'disetujui', label: 'Disetujui' },
    { key: 'selesai', label: 'Selesai' },
    { key: 'ditolak', label: 'Ditolak' },
];

const actionLabels = {
    approve: 'Setujui',
    reject: 'Tolak',
    complete: 'Selesai',
    delete: 'Hapus',
};

const actionStyles = {
    approve: 'bg-emerald-600 hover:bg-emerald-700',
    reject: 'bg-amber-500 hover:bg-amber-600',
    complete: 'bg-blue-600 hover:bg-blue-700',
    delete: 'bg-red-600 hover:bg-red-700',
};

export default function Index({ requestsByStatus, items, units, statusCounts }) {
    const { csrfToken } = usePage().props;
    const [formItems, setFormItems] = useState([
        { item_name: '', quantity: 1, unit: '' },
    ]);
    const [activeTab, setActiveTab] = useState('menunggu');
    const [modalState, setModalState] = useState({
        isOpen: false,
        request: null,
        action: null,
    });
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const totals = useMemo(
        () => ({
            total: statusCounts.total ?? 0,
            menunggu: statusCounts.menunggu ?? 0,
            disetujui: statusCounts.disetujui ?? 0,
            selesai: statusCounts.selesai ?? 0,
            ditolak: statusCounts.ditolak ?? 0,
        }),
        [statusCounts]
    );
    const itemOptions = useMemo(() => {
        return items.map((item) => {
            if (typeof item === 'string') {
                return { value: item, label: item };
            }

            const category = item.category || 'ATK';
            return {
                value: item.name,
                label: `${category} ${item.name}`,
            };
        });
    }, [items]);
    const groupedRequests = useMemo(
        () => ({
            menunggu: requestsByStatus?.menunggu ?? [],
            disetujui: requestsByStatus?.disetujui ?? [],
            selesai: requestsByStatus?.selesai ?? [],
            ditolak: requestsByStatus?.ditolak ?? [],
        }),
        [requestsByStatus]
    );

    const updateItem = (index, field, value) => {
        setFormItems((prev) =>
            prev.map((item, idx) =>
                idx === index ? { ...item, [field]: value } : item
            )
        );
    };

    const addItem = () => {
        setFormItems((prev) => [...prev, { item_name: '', quantity: 1, unit: '' }]);
    };

    const removeItem = (index) => {
        setFormItems((prev) => prev.filter((_, idx) => idx !== index));
    };

    const openPinModal = (action, request) => {
        setModalState({ isOpen: true, action, request });
        setPin('');
        setPinError('');
    };

    const closePinModal = () => {
        setModalState({ isOpen: false, action: null, request: null });
        setPin('');
        setPinError('');
        setIsProcessing(false);
    };

    const handleConfirmPin = async () => {
        if (!pin.trim()) {
            setPinError('Sandi admin wajib diisi.');
            return;
        }

        setIsProcessing(true);
        setPinError('');

        try {
            await window.axios.post(
                `/requests/${modalState.request.id}/admin-action`,
                {
                    admin_password: pin,
                    action: modalState.action,
                },
                {
                    headers: {
                        'X-CSRF-TOKEN': csrfToken,
                    },
                }
            );
            closePinModal();
            router.reload({ preserveScroll: true });
        } catch (error) {
            const message =
                error?.response?.data?.message || 'Sandi admin tidak sesuai.';
            setPinError(message);
            setIsProcessing(false);
        }
    };

    return (
        <AppLayout title="Permintaan Alat Tulis Kantor UP Pekanbaru">
            <div className="grid gap-6 md:grid-cols-5">
                {[
                    { label: 'Total Permintaan', value: totals.total, icon: '📋' },
                    { label: 'Menunggu', value: totals.menunggu, icon: '⏳' },
                    { label: 'Disetujui', value: totals.disetujui, icon: '✅' },
                    { label: 'Selesai', value: totals.selesai, icon: '🏁' },
                    { label: 'Ditolak', value: totals.ditolak, icon: '❌' },
                ].map((card) => (
                    <div
                        key={card.label}
                        className="rounded-2xl bg-slate-800/70 border border-slate-700 px-4 py-5 text-center"
                    >
                        <div className="text-xl">{card.icon}</div>
                        <div className="text-2xl font-semibold text-white">{card.value}</div>
                        <p className="text-xs text-slate-400 mt-1">{card.label}</p>
                    </div>
                ))}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl bg-white text-slate-900 p-6 shadow-xl">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="rounded-full bg-blue-100 text-blue-600 px-3 py-1 text-xs font-semibold">Form Permintaan Baru</span>
                    </div>
                    <form method="POST" action="/requests" className="space-y-4">
                        <input type="hidden" name="_token" value={csrfToken} />
                        <div>
                            <label className="text-sm font-medium">Nama Pemohon</label>
                            <input
                                name="requester_name"
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                                placeholder="Masukkan nama lengkap"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Bagian/Divisi Pemohon</label>
                            <select
                                name="requester_division"
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                                required
                            >
                                <option value="">Pilih Bagian</option>
                                <option value="Fungsional Ahli">Fungsional Ahli</option>
                                <option value="Business Support">Business Support</option>
                                <option value="Operasi dan Pemeliharaan">Operasi dan Pemeliharaan</option>
                                <option value="Engineering">Engineering</option>
                                <option value="K3 dan Keamanan">K3 dan Keamanan</option>
                                <option value="Lingkungan">Lingkungan</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Tanggal Permintaan</label>
                            <input
                                type="date"
                                name="request_date"
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                                required
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Daftar Barang ATK</label>
                                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                                    {formItems.length} Item
                                </span>
                            </div>
                            <div className="mt-3 space-y-4">
                                {formItems.map((item, index) => (
                                    <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold text-slate-700">Barang #{index + 1}</p>
                                            {formItems.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="text-red-500 hover:text-red-600"
                                                    onClick={() => removeItem(index)}
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                        <div className="mt-3 grid gap-3">
                                            <select
                                                name={`items[${index}][item_name]`}
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                                                value={item.item_name}
                                                onChange={(event) => updateItem(index, 'item_name', event.target.value)}
                                                required
                                            >
                                                <option value="">Pilih Barang</option>
                                                {itemOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="grid gap-3 md:grid-cols-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    name={`items[${index}][quantity]`}
                                                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                                                    value={item.quantity}
                                                    onChange={(event) => updateItem(index, 'quantity', event.target.value)}
                                                    placeholder="Jumlah"
                                                    required
                                                />
                                                <select
                                                    name={`items[${index}][unit]`}
                                                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                                                    value={item.unit}
                                                    onChange={(event) => updateItem(index, 'unit', event.target.value)}
                                                    required
                                                >
                                                    <option value="">Satuan</option>
                                                    {units.map((unit) => (
                                                        <option key={unit} value={unit}>
                                                            {unit}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-100 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-200"
                                onClick={addItem}
                            >
                                <span className="text-lg">＋</span>
                                Tambah Barang
                            </button>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Catatan (Opsional)</label>
                            <textarea
                                name="notes"
                                rows="3"
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                                placeholder="Tambahkan catatan jika diperlukan"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-lg bg-blue-600 py-2 text-white font-semibold"
                        >
                            Ajukan Permintaan
                        </button>
                    </form>
                </div>

                <div className="rounded-2xl bg-white text-slate-900 p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Daftar Permintaan</h3>
                        <a
                            href="/requests/export/excel"
                            className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white"
                        >
                            Export Excel
                        </a>
                    </div>
                    <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                                    activeTab === tab.key
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-slate-100 text-slate-600'
                                }`}
                            >
                                {tab.label} ({totals[tab.key] ?? 0})
                            </button>
                        ))}
                    </div>
                    <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2">
                        {groupedRequests[activeTab].length === 0 && (
                            <p className="text-sm text-slate-500">Belum ada permintaan masuk.</p>
                        )}
                        {groupedRequests[activeTab].map((request) => (
                            <div key={request.id} className="rounded-xl border border-slate-200 p-4">
                                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <p className="font-semibold">{request.requester_name}</p>
                                        <p className="text-xs text-slate-500">{request.requester_division} • {request.request_date}</p>
                                        <p
                                            className={`mt-2 text-xs inline-flex items-center gap-1 rounded-full border px-2 py-1 font-semibold uppercase tracking-wide ${
                                                statusStyles[request.status] || 'bg-slate-100 text-slate-600'
                                            }`}
                                        >
                                            <span>{statusIcons[request.status] || 'ℹ️'}</span>
                                            {request.status_label}
                                        </p>
                                        {request.notes && (
                                            <p className="mt-2 text-sm text-slate-600">Catatan: {request.notes}</p>
                                        )}
                                        <div className="mt-3">
                                            <p className="text-sm font-medium">Barang ATK:</p>
                                            <ul className="list-disc pl-4 text-sm text-slate-600">
                                                {request.items.map((item) => (
                                                    <li key={item.id}>
                                                        {item.item_name} - {item.quantity} {item.unit}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <a
                                            href={`/requests/${request.id}/word`}
                                            className="block rounded-lg border border-slate-200 px-3 py-2 text-center text-xs"
                                        >
                                            Unduh Word
                                        </a>
                                        {['approve', 'complete', 'reject', 'delete']
                                            .filter((action) => {
                                                if (action === 'approve') {
                                                    return !['disetujui', 'selesai', 'selesai_ditolak'].includes(request.status);
                                                }

                                                if (action === 'complete') {
                                                    return !['selesai', 'selesai_ditolak'].includes(request.status);
                                                }

                                                if (action === 'reject') {
                                                    return !['ditolak', 'selesai_ditolak'].includes(request.status);
                                                }

                                                return true;
                                            })
                                            .map((action) => (
                                            <button
                                                key={action}
                                                type="button"
                                                onClick={() => openPinModal(action, request)}
                                                className={`w-full rounded-lg py-2 text-xs text-white ${actionStyles[action]}`}
                                            >
                                                {actionLabels[action]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <PinModal
                isOpen={modalState.isOpen}
                title={`Konfirmasi ${actionLabels[modalState.action] ?? ''}`}
                description="Masukkan sandi admin untuk melanjutkan tindakan ini."
                pin={pin}
                onPinChange={setPin}
                onClose={closePinModal}
                onConfirm={handleConfirmPin}
                error={pinError}
                isProcessing={isProcessing}
            />
        </AppLayout>
    );
}
