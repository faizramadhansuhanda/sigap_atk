<?php

namespace App\Http\Controllers;

use App\Models\AtkRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $authorized = $request->session()->get('atk_admin_verified', false);
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $requests = collect();

        if ($authorized) {
            $query = AtkRequest::with('items')->latest();

            if ($startDate) {
                $query->whereDate('request_date', '>=', $startDate);
            }

            if ($endDate) {
                $query->whereDate('request_date', '<=', $endDate);
            }

            $requests = $query->get();
        }
        $dateRange = null;

        if ($authorized && $requests->isNotEmpty()) {
            $minDate = $requests->min('request_date');
            $maxDate = $requests->max('request_date');

            $dateRange = [
                'start' => $minDate
                    ? Carbon::parse($minDate)->locale('id')->translatedFormat('l, j F Y')
                    : null,
                'end' => $maxDate
                    ? Carbon::parse($maxDate)->locale('id')->translatedFormat('l, j F Y')
                    : null,
            ];
        }

        return Inertia::render('Reports/Index', [
            'authorized' => $authorized,
            'dateRange' => $dateRange,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'requests' => $requests->map(fn (AtkRequest $request) => [
                'id' => $request->id,
                'requester_name' => $request->requester_name,
                'requester_division' => $request->requester_division,
                'request_date' => $request->request_date
                    ? Carbon::parse($request->request_date)->locale('id')->translatedFormat('l, j F Y')
                    : '-',
                'request_date_raw' => $request->request_date?->format('Y-m-d'),
                'notes' => $request->notes,
                'rejection_note' => $request->rejection_note,
                'status' => $request->status,
                'status_label' => $this->getStatusLabel($request->status),
                'items' => $request->items->map(fn ($item) => [
                    'id' => $item->id,
                    'item_name' => $item->item_name,
                    'quantity' => $item->quantity,
                    'unit' => $item->unit,
                ]),
            ]),
        ]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'admin_password' => ['required', 'string'],
        ]);

        $password = (string) $request->input('admin_password');

        if (hash_equals(Config::get('atk.admin_password'), $password)) {
            $request->session()->put('atk_admin_verified', true);

            return redirect()->route('reports.index')->with('success', 'Akses laporan diterima.');
        }

        return back()->with('error', 'Sandi admin tidak sesuai.');
    }

    public function logout(Request $request)
    {
        $request->session()->forget('atk_admin_verified');

        return redirect()->route('reports.index');
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
}
