<?php

namespace App\Domains\Billing\Actions;

use App\Domains\Billing\Models\Order;
use App\Domains\Billing\Models\PaymentTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessPaytrCallbackAction
{
    /**
     * Process PayTR callback and update order status.
     *
     * @param array $params Incoming POST data from PayTR
     * @return string Response string for PayTR API ('OK' or error message)
     */
    public function execute(array $params): string
    {
        // 1. Signature Verification
        $merchantOid = $params['merchant_oid'] ?? '';
        $status = $params['status'] ?? '';
        $totalAmount = $params['total_amount'] ?? '';
        $incomingHash = $params['hash'] ?? '';

        // Get credentials from environment / config
        $merchantKey = config('services.paytr.merchant_key') ?? env('PAYTR_MERCHANT_KEY', 'TEST_KEY');
        $merchantSalt = config('services.paytr.merchant_salt') ?? env('PAYTR_MERCHANT_SALT', 'TEST_SALT');

        $hashStr = $merchantOid . $merchantSalt . $status . $totalAmount;
        $calculatedHash = base64_encode(hash_hmac('sha256', $hashStr, $merchantKey, true));

        if ($calculatedHash !== $incomingHash) {
            Log::warning('PayTR Callback: Invalid Hash signature', [
                'merchant_oid' => $merchantOid,
                'incoming_hash' => $incomingHash,
                'calculated_hash' => $calculatedHash,
            ]);
            return 'PAYTR signature invalid';
        }

        // 2. Extract Order ID
        // Extract order ID assuming merchant_oid was generated as: $order->id (or prefix like "order_ID")
        $orderId = (int) str_replace('order_', '', $merchantOid);
        $order = Order::with('items.orderable')->find($orderId);

        if (!$order) {
            Log::error('PayTR Callback: Order not found', ['merchant_oid' => $merchantOid]);
            return 'Order not found';
        }

        // 3. Process Transaction in DB transaction
        return DB::transaction(function () use ($order, $status, $params, $merchantOid) {
            // Create transaction history record
            $transaction = PaymentTransaction::create([
                'order_id' => $order->id,
                'gateway' => 'paytr',
                'transaction_id' => $merchantOid,
                'amount' => $params['total_amount'] / 100, // PayTR total_amount is in cents/kr
                'status' => $status === 'success' ? 'success' : 'failed',
                'payload' => $params,
                'error_message' => $status !== 'success' ? ($params['failed_reason_msg'] ?? 'Payment failed') : null,
            ]);

            if ($status === 'success') {
                // Update parent order
                $order->update([
                    'status' => 'paid',
                    'gateway' => 'paytr',
                    'transaction_id' => $merchantOid,
                ]);

                // Update status of all orderable items (e.g., registrations)
                foreach ($order->items as $item) {
                    $orderable = $item->orderable;
                    if ($orderable) {
                        // If it's a Race Registration, mark it as 'paid'
                        if (method_exists($orderable, 'update') || isset($orderable->status)) {
                            $orderable->update([
                                'status' => 'paid',
                                'payment_id' => $merchantOid, // link back payment ref
                            ]);
                        }
                    }
                }

                Log::info('PayTR Callback: Order successfully paid', ['order_id' => $order->id]);
            } else {
                // Update parent order
                $order->update(['status' => 'failed']);

                Log::warning('PayTR Callback: Payment failed for order', [
                    'order_id' => $order->id,
                    'reason' => $params['failed_reason_msg'] ?? 'Unknown error',
                ]);
            }

            return 'OK'; // PayTR expects 'OK' on success receipt acknowledgement
        });
    }
}
