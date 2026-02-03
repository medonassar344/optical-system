<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SafeController extends Controller
{
    /**
     * Display a listing of all payments (The Safe).
     */
    public function index()
    {
        $payments = Payment::with(['invoice.customer', 'invoice.items.product'])
            ->latest()
            ->get();

        return response()->json([
            'data' => $payments,
            'total_in_safe' => $payments->sum('amount')
        ]);
    }

    /**
     * Store a manual payment entry.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric',
            'payment_method' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $payment = Payment::create([
            'amount' => $validated['amount'],
            'payment_method' => $validated['payment_method'],
            'notes' => $validated['notes'],
            'type' => 'manual',
            'invoice_id' => null,
        ]);

        return response()->json([
            'message' => 'Manual entry added successfully',
            'data' => $payment
        ], 201);
    }

    /**
     * Remove the specified payment and reverse the invoice balance.
     */
    public function destroy(Payment $payment)
    {
        return DB::transaction(function () use ($payment) {
            $invoice = $payment->invoice;

            // Only decrement the amount_paid if there is an invoice linked
            if ($invoice) {
                $invoice->decrement('amount_paid', $payment->amount);
            }

            // Delete the payment record
            $payment->delete();

            return response()->json([
                'message' => 'Entry deleted successfully.',
                'invoice_id' => $invoice ? $invoice->id : null,
                'new_balance' => $invoice ? ($invoice->total - $invoice->amount_paid) : null
            ]);
        });
    }
}
