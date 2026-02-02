<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AtkRequestItem extends Model
{
    protected $fillable = [
        'atk_request_id',
        'item_name',
        'quantity',
        'unit',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(AtkRequest::class, 'atk_request_id');
    }
}
