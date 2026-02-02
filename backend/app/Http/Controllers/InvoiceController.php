<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Product;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    public function index()
    {
        return response()->json(Invoice::with('customer', 'user')->withCount('items')->latest()->paginate(500));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'nullable|numeric|min:0',
            'discount' => 'numeric|min:0',
            'tax' => 'numeric|min:0',
            'amount_paid' => 'nullable|numeric|min:0',
            'payment_method' => 'string'
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $subtotal = 0;
            $itemsData = [];

            // Calculate totals and prepare items
            foreach ($validated['items'] as $item) {
                $product = Product::lockForUpdate()->find($item['product_id']);
                
                if ($product->stock_quantity < $item['quantity']) {
                    throw new \Exception("Insufficient stock for product: {$product->brand} {$product->model_code}");
                }

                $price = $item['price'] ?? $product->price;
                $lineTotal = $price * $item['quantity'];
                $subtotal += $lineTotal;

                $itemsData[] = [
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'price' => $price,
                    'subtotal' => $lineTotal
                ];

                // Deduct stock
                $product->decrement('stock_quantity', $item['quantity']);
            }

            $discount = $validated['discount'] ?? 0;
            $tax = $validated['tax'] ?? 0;
            $total = $subtotal - $discount + $tax;
            
            // If amount_paid is not provided, assume full payment
            $amountPaid = $request->has('amount_paid') ? $validated['amount_paid'] : $total;

            $invoice = Invoice::create([
                'customer_id' => $validated['customer_id'] ?? null,
                'user_id' => $request->user()->id,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $tax,
                'total' => $total,
                'amount_paid' => $amountPaid,
                'payment_method' => $validated['payment_method'] ?? 'cash'
            ]);

            foreach ($itemsData as $data) {
                $invoice->items()->create($data);
            }

            // Record initial payment if any
            if ($amountPaid > 0) {
                $invoice->payments()->create([
                    'type' => 'initial',
                    'amount' => $amountPaid,
                    'payment_method' => $invoice->payment_method,
                    'notes' => 'Initial payment at checkout'
                ]);
            }

            return response()->json($invoice->load('items'), 201);
        });
    }

    public function addPayment(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01'
        ]);

        if ($invoice->amount_paid + $validated['amount'] > $invoice->total) {
            return response()->json(['message' => 'Payment exceeds remaining balance'], 422);
        }

        $invoice->increment('amount_paid', $validated['amount']);

        // Record the transaction
        $invoice->payments()->create([
            'type' => 'debt_payment',
            'amount' => $validated['amount'],
            'payment_method' => $invoice->payment_method, // Using current method or could be in request
            'notes' => 'Debt installment payment'
        ]);

        return response()->json([
            'message' => 'Payment recorded successfully',
            'invoice' => $invoice->fresh(['customer', 'items.product', 'payments'])
        ]);
    }

    public function show(Invoice $invoice)
    {
        return response()->json($invoice->load('items.product', 'customer', 'user', 'payments'));
    }
}
