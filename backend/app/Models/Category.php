<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = ['name', 'type', 'alert_quantity'];

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
