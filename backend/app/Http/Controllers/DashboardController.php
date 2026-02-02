<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Product;
use App\Models\Customer;
use App\Models\InvoiceItem;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats()
    {
        $today = Carbon::today();
        $startOfWeek = Carbon::now()->subDays(6)->startOfDay();

        // 1. Basic Sales Stats
        $dailySales = Invoice::whereDate('created_at', $today)->sum('total');
        $monthlySales = Invoice::whereMonth('created_at', $today->month)
            ->whereYear('created_at', $today->year)
            ->sum('total');

        // 2. Profit Calculation (Revenue - Cost)
        // Note: Using current wholesale_price as a proxy for cost at time of sale
        $totalProfit = DB::table('invoice_items')
            ->join('products', 'invoice_items.product_id', '=', 'products.id')
            ->select(DB::raw('SUM(invoice_items.subtotal - (COALESCE(products.wholesale_price, 0) * invoice_items.quantity)) as profit'))
            ->value('profit') ?? 0;

        $todayProfit = DB::table('invoice_items')
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->join('products', 'invoice_items.product_id', '=', 'products.id')
            ->whereDate('invoices.created_at', $today)
            ->select(DB::raw('SUM(invoice_items.subtotal - (COALESCE(products.wholesale_price, 0) * invoice_items.quantity)) as profit'))
            ->value('profit') ?? 0;

        // 3. 7-Day Trend (Revenue & Profit)
        $trendData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $dayRevenue = Invoice::whereDate('created_at', $date)->sum('total');
            $dayProfit = DB::table('invoice_items')
                ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
                ->join('products', 'invoice_items.product_id', '=', 'products.id')
                ->whereDate('invoices.created_at', $date)
                ->select(DB::raw('SUM(invoice_items.subtotal - (COALESCE(products.wholesale_price, 0) * invoice_items.quantity)) as profit'))
                ->value('profit') ?? 0;

            $trendData[] = [
                'date' => $date->format('D, M d'),
                'revenue' => (float)$dayRevenue,
                'profit' => (float)$dayProfit
            ];
        }

        // 4. Category Breakdown
        $categorySales = DB::table('invoice_items')
            ->join('products', 'invoice_items.product_id', '=', 'products.id')
            ->select(DB::raw('COALESCE(products.type, "other") as type'), DB::raw('SUM(invoice_items.subtotal) as total'))
            ->groupBy('products.type')
            ->get();

        // 5. Recent Activity
        $recentInvoices = Invoice::with('customer')
            ->latest()
            ->take(5)
            ->get();

        // 6. Low Stock, Top Products & Outstanding Invoices
        $lowStockProducts = Product::whereColumn('stock_quantity', '<=', 'alert_quantity')->get();
        $topProducts = Product::withCount('invoiceItems')
            ->orderBy('invoice_items_count', 'desc')
            ->take(5)
            ->get();
            
        $outstandingInvoices = Invoice::with('customer')
            ->whereRaw('amount_paid < total')
            ->latest()
            ->get();

        return response()->json([
            'metrics' => [
                'daily_sales' => (float)$dailySales,
                'monthly_sales' => (float)$monthlySales,
                'today_profit' => (float)$todayProfit,
                'total_profit' => (float)$totalProfit,
                'customers_count' => Customer::count(),
                'low_stock_count' => $lowStockProducts->count(),
                'outstanding_count' => $outstandingInvoices->count(),
                'outstanding_total_balance' => (float)$outstandingInvoices->sum(fn($i) => $i->total - $i->amount_paid),
            ],
            'charts' => [
                'trend' => $trendData,
                'categories' => $categorySales
            ],
            'recent_invoices' => $recentInvoices,
            'top_products' => $topProducts,
            'low_stock_items' => $lowStockProducts,
            'outstanding_invoices' => $outstandingInvoices
        ]);
    }
}
