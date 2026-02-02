<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AtkRequest extends Model
{
    protected $fillable = [
        'requester_name',
        'requester_division',
        'request_date',
        'notes',
        'status',
    ];

    protected $casts = [
        'request_date' => 'date',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(AtkRequestItem::class);
    }
}
