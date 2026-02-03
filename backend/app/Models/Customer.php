<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'name',
        'phone',
        'medical_info'
    ];

    protected $casts = [
        'medical_info' => 'array',
    ];

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }
}
