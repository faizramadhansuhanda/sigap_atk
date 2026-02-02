export default function PinModal({
    isOpen,
    title,
    description,
    pin,
    onPinChange,
    onClose,
    onConfirm,
    error,
    isProcessing,
}) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                        {description && (
                            <p className="mt-1 text-sm text-slate-600">{description}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-500"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                <div className="mt-4 space-y-2">
                    <label className="text-sm font-medium text-slate-700">Sandi Admin</label>
                    <input
                        type="password"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        value={pin}
                        onChange={(event) => onPinChange(event.target.value)}
                        placeholder="Masukkan sandi admin"
                    />
                    {error && <p className="text-sm text-red-600">{error}</p>}
                </div>

                <div className="mt-6 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
                        onClick={onClose}
                        disabled={isProcessing}
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                        onClick={onConfirm}
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Memproses...' : 'Konfirmasi'}
                    </button>
                </div>
            </div>
        </div>
    );
}
