<?php

namespace App\Http\Controllers;

use App\Models\AtkRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AtkRequestController extends Controller
{
    public function index()
    {
        $requests = AtkRequest::with('items')->latest()->get();
        $mappedRequests = $requests->map(fn (AtkRequest $request) => [
            'id' => $request->id,
            'requester_name' => $request->requester_name,
            'requester_division' => $request->requester_division,
            'request_date' => $request->request_date?->format('Y-m-d'),
            'notes' => $request->notes,
            'rejection_note' => $request->rejection_note,
            'status' => $request->status,
            'status_label' => $this->getStatusLabel($request->status),
            'status_group' => $this->getStatusGroup($request->status),
            'items' => $request->items->map(fn ($item) => [
                'id' => $item->id,
                'item_name' => $item->item_name,
                'quantity' => $item->quantity,
                'unit' => $item->unit,
            ]),
        ]);

        $requestsByStatus = array_replace(
            ['menunggu' => [], 'disetujui' => [], 'ditolak' => [], 'selesai' => []],
            $mappedRequests
                ->groupBy('status_group')
                ->map(fn ($group) => $group->values()->all())
                ->all()
        );

        $statusCounts = [
            'total' => $requests->count(),
            'menunggu' => $requests->where('status', 'menunggu')->count(),
            'disetujui' => $requests->whereIn('status', ['disetujui', 'selesai'])->count(),
            'selesai' => $requests->whereIn('status', ['selesai', 'selesai_ditolak'])->count(),
            'ditolak' => $requests->whereIn('status', ['ditolak', 'selesai_ditolak'])->count(),
        ];

        return Inertia::render('Requests/Index', [
            'requestsByStatus' => $requestsByStatus,
            'items' => Config::get('atk.items'),
            'units' => Config::get('atk.units'),
            'statusCounts' => $statusCounts,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'requester_name' => ['required', 'string', 'max:255'],
            'requester_division' => ['required', 'string', 'max:255'],
            'request_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_name' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit' => ['required', 'string', 'max:50'],
        ]);

        $atkRequest = AtkRequest::create([
            'requester_name' => $validated['requester_name'],
            'requester_division' => $validated['requester_division'],
            'request_date' => $validated['request_date'],
            'notes' => $validated['notes'] ?? null,
            'status' => 'menunggu',
        ]);

        $atkRequest->items()->createMany($validated['items']);

        return redirect()->route('requests.index')->with('success', 'Permintaan berhasil disimpan.');
    }

    public function approve(Request $request, AtkRequest $atkRequest)
    {
        if (! $this->checkAdminPassword($request)) {
            return back()->with('error', 'Sandi admin tidak sesuai.');
        }

        if ($atkRequest->status !== 'menunggu') {
            return back()->with('error', 'Permintaan hanya dapat disetujui saat status menunggu.');
        }

        $atkRequest->update([
            'status' => 'disetujui',
            'rejection_note' => null,
        ]);

        return back()->with('success', 'Permintaan berhasil disetujui.');
    }

    public function complete(Request $request, AtkRequest $atkRequest)
    {
        if (! $this->checkAdminPassword($request)) {
            return back()->with('error', 'Sandi admin tidak sesuai.');
        }

        if (! in_array($atkRequest->status, ['disetujui', 'ditolak'], true)) {
            return back()->with('error', 'Permintaan hanya dapat diselesaikan setelah disetujui atau ditolak.');
        }

        $atkRequest->update([
            'status' => $atkRequest->status === 'ditolak' ? 'selesai_ditolak' : 'selesai',
        ]);

        return back()->with('success', 'Permintaan berhasil diselesaikan.');
    }

    public function reject(Request $request, AtkRequest $atkRequest)
    {
        if (! $this->checkAdminPassword($request)) {
            return back()->with('error', 'Sandi admin tidak sesuai.');
        }

        $request->validate([
            'rejection_note' => ['required', 'string', 'max:1000'],
        ]);

        if (! in_array($atkRequest->status, ['menunggu', 'disetujui'], true)) {
            return back()->with('error', 'Permintaan hanya dapat ditolak saat status menunggu atau disetujui.');
        }

        $atkRequest->update([
            'status' => 'ditolak',
            'rejection_note' => $request->input('rejection_note'),
        ]);

        return back()->with('success', 'Permintaan berhasil ditolak.');
    }

    public function destroy(Request $request, AtkRequest $atkRequest)
    {
        if (! $this->checkAdminPassword($request)) {
            return back()->with('error', 'Sandi admin tidak sesuai.');
        }

        $atkRequest->delete();

        return back()->with('success', 'Permintaan berhasil dihapus.');
    }

    public function adminAction(Request $request, AtkRequest $atkRequest)
    {
        $validated = $request->validate([
            'admin_password' => ['required', 'string'],
            'action' => ['required', 'string', 'in:approve,reject,complete,delete'],
            'rejection_note' => ['nullable', 'string', 'max:1000'],
        ]);

        if (! $this->checkAdminPassword($request)) {
            return response()->json(['message' => 'Sandi admin tidak sesuai.'], 422);
        }

        if ($validated['action'] === 'reject' && empty(trim((string) ($validated['rejection_note'] ?? '')))) {
            return response()->json(['message' => 'Alasan penolakan wajib diisi.'], 422);
        }

        return match ($validated['action']) {
            'approve' => $this->handleApprove($atkRequest),
            'reject' => $this->handleReject($atkRequest, $validated['rejection_note'] ?? null),
            'complete' => $this->handleComplete($atkRequest),
            'delete' => $this->handleDelete($atkRequest),
        };
    }

    public function downloadWord(AtkRequest $atkRequest)
    {
        $request = $atkRequest->load('items');
        $rows = $request->items
            ->map(fn ($item) => sprintf(
                '<tr><td>%s</td><td>%s</td><td>%s</td></tr>',
                e($item->item_name),
                e($item->quantity),
                e($item->unit),
            ))
            ->implode('');

        $html = sprintf(
            '<!DOCTYPE html><html lang=\"id\"><head><meta charset=\"UTF-8\"><title>Permintaan ATK</title><style>body{font-family:Arial,sans-serif;font-size:14px;}table{width:100%%;border-collapse:collapse;margin-top:12px;}th,td{border:1px solid #333;padding:6px;text-align:left;}</style></head><body><h2>Permintaan ATK</h2><p><strong>Nama Pemohon:</strong> %s</p><p><strong>Bagian/Divisi:</strong> %s</p><p><strong>Tanggal Permintaan:</strong> %s</p><p><strong>Status:</strong> %s</p><table><thead><tr><th>Barang</th><th>Jumlah</th><th>Satuan</th></tr></thead><tbody>%s</tbody></table>%s</body></html>',
            e($request->requester_name),
            e($request->requester_division),
            e($request->request_date?->format('d M Y')),
            e(ucfirst($request->status)),
            $rows,
            $request->notes ? '<p><strong>Catatan:</strong> ' . e($request->notes) . '</p>' : ''
        );
        $filename = 'permintaan-atk-' . Str::slug($atkRequest->requester_name) . '-' . $atkRequest->id . '.doc';

        return response($html)
            ->header('Content-Type', 'application/msword')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    public function exportExcel()
    {
        $requests = AtkRequest::with('items')->latest()->get();
        $rows = [
            ['Nama Pemohon', 'Bagian/Divisi', 'Tanggal', 'Status', 'Barang', 'Catatan'],
        ];

        foreach ($requests as $request) {
            $formattedDate = $request->request_date
                ? Carbon::parse($request->request_date)->locale('id')->translatedFormat('l, j F Y')
                : '-';
            $statusLabel = $this->getStatusLabel($request->status);
            $notes = $request->notes;

            if ($request->rejection_note) {
                $notesLines = [];
                if ($notes) {
                    $notesLines[] = e($notes);
                }
                $notesLines[] = '<span style="color:#dc2626;">Alasan penolakan: '
                    . e($request->rejection_note)
                    . '</span>';
                $notes = ['value' => implode('<br />', $notesLines), 'raw' => true];
            }

            if ($request->items->isEmpty()) {
                $rows[] = [
                    $request->requester_name,
                    $request->requester_division,
                    $formattedDate,
                    $statusLabel,
                    '-',
                    $notes,
                ];
                continue;
            }

            $itemsList = $request->items
                ->map(fn ($item) => sprintf('%s (%s %s)', $item->item_name, $item->quantity, $item->unit))
                ->implode(', ');

            $rows[] = [
                $request->requester_name,
                $request->requester_division,
                $formattedDate,
                $statusLabel,
                $itemsList !== '' ? $itemsList : '-',
                $notes,
            ];
        }

        $headerRow = $this->buildExcelHeaderRow($rows[0]);
        $bodyRows = collect($rows)
            ->skip(1)
            ->map(fn ($row) => $this->buildExcelBodyRow($row))
            ->implode('');
        $output = $this->buildExcelTable($headerRow, $bodyRows);

        return response($output)
            ->header('Content-Type', 'application/vnd.ms-excel')
            ->header('Content-Disposition', 'attachment; filename="permintaan-atk.xls"');
    }

    private function buildExcelHeaderRow(array $row): string
    {
        $cells = collect($row)
            ->map(fn ($value) => '<th style="border:1px solid #94a3b8;padding:6px;font-weight:bold;background:#f1f5f9;">' . e($value) . '</th>')
            ->implode('');

        return '<tr>' . $cells . '</tr>';
    }

    private function buildExcelBodyRow(array $row): string
    {
        $cells = collect($row)
            ->map(function ($value) {
                $isRaw = is_array($value) && ($value['raw'] ?? false);
                $cellValue = $isRaw ? (string) ($value['value'] ?? '') : e((string) $value);

                return '<td style="border:1px solid #94a3b8;padding:6px;vertical-align:top;white-space:pre-line;">'
                    . $cellValue
                    . '</td>';
            })
            ->implode('');

        return '<tr>' . $cells . '</tr>';
    }

    private function buildExcelTable(string $headerRow, string $bodyRows): string
    {
        return '<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"></head><body>'
            . '<table style="border-collapse:collapse;width:100%;table-layout:auto;">'
            . '<thead>' . $headerRow . '</thead>'
            . '<tbody>' . $bodyRows . '</tbody>'
            . '</table></body></html>';
    }

    private function getStatusLabel(string $status): string
    {
        return match ($status) {
            'menunggu' => 'Menunggu',
            'disetujui' => 'Disetujui',
            'selesai' => 'Selesai',
            'ditolak' => 'Ditolak',
            'selesai_ditolak' => 'Selesai (Ditolak)',
            default => ucfirst($status),
        };
    }

    private function getStatusGroup(string $status): string
    {
        return match ($status) {
            'menunggu' => 'menunggu',
            'ditolak' => 'ditolak',
            'disetujui' => 'disetujui',
            'selesai', 'selesai_ditolak' => 'selesai',
            default => 'menunggu',
        };
    }

    private function checkAdminPassword(Request $request): bool
    {
        $password = (string) $request->input('admin_password');

        return $password !== '' && hash_equals(Config::get('atk.admin_password'), $password);
    }

    private function handleApprove(AtkRequest $atkRequest)
    {
        if ($atkRequest->status !== 'menunggu') {
            return response()->json(['message' => 'Permintaan hanya dapat disetujui saat status menunggu.'], 422);
        }

        $atkRequest->update([
            'status' => 'disetujui',
            'rejection_note' => null,
        ]);

        return response()->json(['message' => 'Permintaan berhasil disetujui.']);
    }

    private function handleReject(AtkRequest $atkRequest, ?string $rejectionNote)
    {
        if (! in_array($atkRequest->status, ['menunggu', 'disetujui'], true)) {
            return response()->json(['message' => 'Permintaan hanya dapat ditolak saat status menunggu atau disetujui.'], 422);
        }

        if ($rejectionNote === null || trim($rejectionNote) === '') {
            return response()->json(['message' => 'Alasan penolakan wajib diisi.'], 422);
        }

        $atkRequest->update([
            'status' => 'ditolak',
            'rejection_note' => $rejectionNote,
        ]);

        return response()->json(['message' => 'Permintaan berhasil ditolak.']);
    }

    private function handleComplete(AtkRequest $atkRequest)
    {
        if (! in_array($atkRequest->status, ['disetujui', 'ditolak'], true)) {
            return response()->json(['message' => 'Permintaan hanya dapat diselesaikan setelah disetujui atau ditolak.'], 422);
        }

        $atkRequest->update([
            'status' => $atkRequest->status === 'ditolak' ? 'selesai_ditolak' : 'selesai',
        ]);

        return response()->json(['message' => 'Permintaan berhasil diselesaikan.']);
    }

    private function handleDelete(AtkRequest $atkRequest)
    {
        $atkRequest->delete();

        return response()->json(['message' => 'Permintaan berhasil dihapus.']);
    }
}
