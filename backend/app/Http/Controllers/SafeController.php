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
        $payments = Payment::with(['invoice.customer'])
            ->latest()
            ->get();

        return response()->json([
            'data' => $payments,
            'total_in_safe' => $payments->sum('amount')
        ]);
    }

    /**
     * Remove the specified payment and reverse the invoice balance.
     */
    public function destroy(Payment $payment)
    {
        return DB::transaction(function () use ($payment) {
            $invoice = $payment->invoice;

            // Decrement the amount_paid from the invoice
            $invoice->decrement('amount_paid', $payment->amount);

            // Delete the payment record
            $payment->delete();

            return response()->json([
                'message' => 'Payment entry deleted and balance reversed successfully.',
                'invoice_id' => $invoice->id,
                'new_balance' => $invoice->total - $invoice->amount_paid
            ]);
        });
    }
}
