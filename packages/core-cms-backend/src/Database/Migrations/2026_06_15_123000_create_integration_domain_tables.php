<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integrations_webhooks', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('url');
            $table->json('events'); // ["user.registered", "form.submitted", "content.published"]
            $table->string('secret')->nullable(); // HMAC key
            $table->json('headers')->nullable(); // custom key-value headers
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('integrations_webhook_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('webhook_id')->constrained('integrations_webhooks')->cascadeOnDelete();
            $table->string('event');
            $table->json('payload');
            $table->integer('response_status')->nullable();
            $table->text('response_body')->nullable();
            $table->integer('duration_ms');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integrations_webhook_logs');
        Schema::dropIfExists('integrations_webhooks');
    }
};
