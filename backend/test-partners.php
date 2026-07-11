<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $request = \Illuminate\Http\Request::create('/api/admin/partners', 'GET');
    $controller = new \App\Domains\Partner\Http\Controllers\Admin\PartnerController();
    $res = $controller->index($request);
    echo "SUCCESS\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n";
}
