<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'type',
        'brand',
        'model_code',
        'price',
        'stock_quantity',
        'alert_quantity',
        'barcode',
        'material',
        'customer_notes',
        'image_path',
        'wholesale_price'
    ];

    public function invoiceItems()
    {
        return $this->hasMany(InvoiceItem::class);
    }
}
