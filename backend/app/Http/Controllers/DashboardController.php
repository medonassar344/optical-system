<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Product;
use App\Models\Category;
use App\Models\Customer;
use App\Models\InvoiceItem;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $period = $request->query('period', 'this_month');
        $now = Carbon::now();

        // 1. Determine Date Range
        switch ($period) {
            case 'today':
                $start = $now->copy()->startOfDay();
                $end = $now->copy()->endOfDay();
                $prevStart = $now->copy()->subDay()->startOfDay();
                $prevEnd = $now->copy()->subDay()->endOfDay();
                break;
            case 'this_month':
                $start = $now->copy()->startOfMonth();
                $end = $now->copy()->endOfMonth();
                $prevStart = $now->copy()->subMonth()->startOfMonth();
                $prevEnd = $now->copy()->subMonth()->endOfMonth();
                break;
            case 'last_month':
                $start = $now->copy()->subMonth()->startOfMonth();
                $end = $now->copy()->subMonth()->endOfMonth();
                $prevStart = $now->copy()->subMonths(2)->startOfMonth();
                $prevEnd = $now->copy()->subMonths(2)->endOfMonth();
                break;
            case 'this_year':
                $start = $now->copy()->startOfYear();
                $end = $now->copy()->endOfYear();
                $prevStart = $now->copy()->subYear()->startOfYear();
                $prevEnd = $now->copy()->subYear()->endOfYear();
                break;
            case 'last_year':
                $start = $now->copy()->subYear()->startOfYear();
                $end = $now->copy()->subYear()->endOfYear();
                $prevStart = $now->copy()->subYears(2)->startOfYear();
                $prevEnd = $now->copy()->subYears(2)->endOfYear();
                break;
            default: // Default to 7 days
                $start = $now->copy()->subDays(6)->startOfDay();
                $end = $now->copy()->endOfDay();
                $prevStart = $now->copy()->subDays(13)->startOfDay();
                $prevEnd = $now->copy()->subDays(7)->endOfDay();
                break;
        }

        // 2. Metrics Calculation
        $revenue = Invoice::whereBetween('created_at', [$start, $end])->sum('total');
        $prevRevenue = Invoice::whereBetween('created_at', [$prevStart, $prevEnd])->sum('total');

        $cogs = DB::table('invoice_items')
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->join('products', 'invoice_items.product_id', '=', 'products.id')
            ->whereBetween('invoices.created_at', [$start, $end])
            ->select(DB::raw('SUM(COALESCE(products.wholesale_price, 0) * invoice_items.quantity) as cost'))
            ->value('cost') ?? 0;

        $profit = $revenue - $cogs;

        // 3. Category Distribution
        $categorySales = DB::table('invoice_items')
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->join('products', 'invoice_items.product_id', '=', 'products.id')
            ->whereBetween('invoices.created_at', [$start, $end])
            ->select('products.type', DB::raw('SUM(invoice_items.subtotal) as total'))
            ->groupBy('products.type')
            ->get();

        // 4. Trend Data (Daily or Monthly depending on period)
        $trendData = [];
        if (in_array($period, ['this_year', 'last_year'])) {
            // Monthly trend for year view
            for ($i = 0; $i < 12; $i++) {
                $monthStart = $start->copy()->addMonths($i)->startOfMonth();
                $monthEnd = $monthStart->copy()->endOfMonth();
                if ($monthStart->isAfter($now)) break;

                $rev = Invoice::whereBetween('created_at', [$monthStart, $monthEnd])->sum('total');
                $trendData[] = [
                    'date' => $monthStart->format('M Y'),
                    'revenue' => (float)$rev
                ];
            }
        } else {
            // Daily trend
            $diff = $start->diffInDays($end);
            for ($i = 0; $i <= $diff; $i++) {
                $day = $start->copy()->addDays($i);
                if ($day->isAfter($now)) break;

                $rev = Invoice::whereDate('created_at', $day)->sum('total');
                $trendData[] = [
                    'date' => $day->format('M d'),
                    'revenue' => (float)$rev
                ];
            }
        }

        // 5. Advanced Stats per Product Type
        $topFrames = Product::where('type', 'frames')
            ->withCount(['invoiceItems' => function($q) use ($start, $end) {
                $q->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
                  ->whereBetween('invoices.created_at', [$start, $end]);
            }])
            ->orderBy('invoice_items_count', 'desc')
            ->take(3)
            ->get();

        $topLenses = Product::where('type', 'lenses')
            ->withCount(['invoiceItems' => function($q) use ($start, $end) {
                $q->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
                  ->whereBetween('invoices.created_at', [$start, $end]);
            }])
            ->orderBy('invoice_items_count', 'desc')
            ->take(3)
            ->get();

        // 6. Existing Recent/Low Stock
        $recentInvoices = Invoice::with('customer')->latest()->take(5)->get();
        
        $lowStockProducts = Product::with('category')
            ->where(function($q) {
                $q->whereHas('category', function($cq) {
                    $cq->whereColumn('products.stock_quantity', '<=', 'categories.alert_quantity');
                })->orWhere(function($sq) {
                    $sq->whereNull('category_id')
                       ->whereColumn('stock_quantity', '<=', 'alert_quantity');
                });
            })->get();

        return response()->json([
            'metrics' => [
                'revenue' => (float)$revenue,
                'prev_revenue' => (float)$prevRevenue,
                'profit' => (float)$profit,
                'cogs' => (float)$cogs,
                'customers_count' => Customer::count(),
                'low_stock_count' => $lowStockProducts->count(),
                'growth' => $prevRevenue > 0 ? (($revenue - $prevRevenue) / $prevRevenue) * 100 : 0
            ],
            'charts' => [
                'trend' => $trendData,
                'categories' => $categorySales
            ],
            'top_products' => [
                'frames' => $topFrames,
                'lenses' => $topLenses,
                'all' => Product::withCount(['invoiceItems as total_sold' => function($q) use ($start, $end) {
                        $q->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
                          ->whereBetween('invoices.created_at', [$start, $end])
                          ->select(DB::raw('SUM(quantity)'));
                    }])
                    ->orderBy('total_sold', 'desc')
                    ->take(5)
                    ->get()
            ],
            'category_champions' => Category::all()->map(function ($category) use ($start, $end) {
                $topProducts = Product::where('category_id', $category->id)
                    ->withCount(['invoiceItems as total_sold' => function($q) use ($start, $end) {
                        $q->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
                          ->whereBetween('invoices.created_at', [$start, $end])
                          ->select(DB::raw('SUM(quantity)'));
                    }])
                    ->orderBy('total_sold', 'desc')
                    ->take(3)
                    ->get();

                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'type' => $category->type,
                    'top_items' => $topProducts->filter(fn($p) => $p->total_sold > 0)->map(function($p) {
                        return [
                            'brand' => $p->brand,
                            'model_code' => $p->model_code,
                            'total_sold' => (int)$p->total_sold,
                            'price' => $p->price
                        ];
                    })
                ];
            })->filter(fn($c) => count($c['top_items']) > 0)->values(),
            'recent_invoices' => $recentInvoices,
            'low_stock_items' => $lowStockProducts,
            'outstanding_invoices' => Invoice::with('customer')->whereRaw('amount_paid < total')->latest()->get()
        ]);
    }
}
