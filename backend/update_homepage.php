<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$page = App\Domains\Page\Models\Page::find(2);
$content = $page->content;

// Remove any existing duplicate block-cat-7 reference to keep it clean
$content = array_filter($content, function($block) {
    return ($block['id'] ?? '') !== 'block-cat-7';
});

$content[] = [
    'id' => 'block-cat-7',
    'type' => 'global_block_ref',
    'status' => 'active',
    'styles' => [],
    'content' => ['global_block_id' => 7],
    'responsive' => ['hideMobile' => false, 'hideTablet' => false, 'hideDesktop' => false]
];

$page->content = array_values($content);
$page->save();

echo "Homepage layout updated successfully!\n";
