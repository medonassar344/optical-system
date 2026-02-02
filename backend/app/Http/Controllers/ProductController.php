<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query();
        
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('brand', 'like', "%{$search}%")
                  ->orWhere('model_code', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate(10));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string',
            'brand' => 'required|string',
            'model_code' => 'nullable|string',
            'price' => 'required|numeric',
            'stock_quantity' => 'required|integer',
            'alert_quantity' => 'integer',
            'barcode' => 'nullable|string|unique:products',
            'material' => 'nullable|string',
            'epd' => 'nullable|string',
            'customer_notes' => 'nullable|string',
            'image' => 'nullable|image|max:2048',
            'wholesale_price' => 'nullable|numeric'
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $validated['image_path'] = '/storage/' . $path;
        }

        $product = Product::create($validated);
        return response()->json($product, 201);
    }

    public function show(Product $product)
    {
        return response()->json($product);
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'type' => 'string',
            'brand' => 'string',
            'model_code' => 'nullable|string',
            'price' => 'numeric',
            'stock_quantity' => 'integer',
            'alert_quantity' => 'integer',
            'barcode' => 'nullable|string|unique:products,barcode,' . $product->id,
            'material' => 'nullable|string',
            'epd' => 'nullable|string',
            'customer_notes' => 'nullable|string',
            'image' => 'nullable|image|max:2048',
            'wholesale_price' => 'nullable|numeric'
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $validated['image_path'] = '/storage/' . $path;
        }

        $product->update($validated);
        return response()->json($product);
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json(null, 204);
    }
}
