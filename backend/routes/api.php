<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\DashboardController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    
    Route::apiResource('products', ProductController::class);
    Route::apiResource('customers', CustomerController::class);
    Route::apiResource('invoices', InvoiceController::class);
    Route::post('/invoices/{invoice}/payment', [InvoiceController::class, 'addPayment']);
    
    Route::get('/safe', [\App\Http\Controllers\SafeController::class, 'index']);
    Route::delete('/safe/{payment}', [\App\Http\Controllers\SafeController::class, 'destroy']);
    
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    
    Route::put('/profile', [\App\Http\Controllers\ProfileController::class, 'update']);
    Route::put('/profile/password', [\App\Http\Controllers\ProfileController::class, 'updatePassword']);
});
