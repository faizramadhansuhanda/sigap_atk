<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('atk_request_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('atk_request_id')->constrained('atk_requests')->cascadeOnDelete();
            $table->string('item_name');
            $table->unsignedInteger('quantity');
            $table->string('unit');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('atk_request_items');
    }
};
