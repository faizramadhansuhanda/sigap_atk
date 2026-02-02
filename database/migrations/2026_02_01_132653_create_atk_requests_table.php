<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('atk_requests', function (Blueprint $table) {
            $table->id();
            $table->string('requester_name');
            $table->string('requester_division');
            $table->date('request_date');
            $table->text('notes')->nullable();
            $table->string('status')->default('menunggu');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('atk_requests');
    }
};
