<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::query();
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $categories = $query->get()->map(function ($category) {
            $topSeller = Product::where('category_id', $category->id)
                ->withCount(['invoiceItems as total_sold' => function ($query) {
                    $query->select(DB::raw('sum(quantity)'));
                }])
                ->orderBy('total_sold', 'desc')
                ->first();

            $category->top_seller = $topSeller;
            return $category;
        });

        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:frames,sunglasses,lenses,others',
            'alert_quantity' => 'integer|min:0',
        ]);

        $category = Category::create($validated);
        return response()->json($category, 201);
    }

    public function show(Category $category)
    {
        return response()->json($category);
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'type' => 'string|in:frames,sunglasses,lenses,others',
            'alert_quantity' => 'integer|min:0',
        ]);

        $category->update($validated);
        return response()->json($category);
    }

    public function destroy(Category $category)
    {
        if ($category->products()->count() > 0) {
            return response()->json(['message' => 'Cannot delete category with products'], 422);
        }
        $category->delete();
        return response()->json(null, 204);
    }
}
