<?php

use App\Http\Controllers\AtkRequestController;
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

Route::get('/', [AtkRequestController::class, 'index'])->name('requests.index');
Route::post('/requests', [AtkRequestController::class, 'store'])->name('requests.store');
Route::post('/requests/{atkRequest}/approve', [AtkRequestController::class, 'approve'])->name('requests.approve');
Route::post('/requests/{atkRequest}/reject', [AtkRequestController::class, 'reject'])->name('requests.reject');
Route::post('/requests/{atkRequest}/complete', [AtkRequestController::class, 'complete'])->name('requests.complete');
Route::post('/requests/{atkRequest}/delete', [AtkRequestController::class, 'destroy'])->name('requests.delete');
Route::post('/requests/{atkRequest}/admin-action', [AtkRequestController::class, 'adminAction'])->name('requests.admin-action');
Route::get('/requests/{atkRequest}/word', [AtkRequestController::class, 'downloadWord'])->name('requests.word');
Route::get('/requests/export/excel', [AtkRequestController::class, 'exportExcel'])->name('requests.export');

Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
Route::post('/reports/login', [ReportController::class, 'login'])->name('reports.login');
Route::post('/reports/logout', [ReportController::class, 'logout'])->name('reports.logout');