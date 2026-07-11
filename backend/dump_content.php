<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$blocks = DB::table('global_blocks')->select('id', 'name', 'type', 'content')->get();
foreach ($blocks as $b) {
    echo "ID: {$b->id} | Name: {$b->name} | Type: {$b->type} | Content: {$b->content}\n";
}
