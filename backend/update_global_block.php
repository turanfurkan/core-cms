<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$block = App\Domains\GlobalBlock\Models\GlobalBlock::find(7);
if ($block) {
    $block->type = 'glassmorphic_grid';
    $styles = $block->styles;
    $styles['layout'] = 'grid'; // Set default layout
    $block->styles = $styles;
    $block->save();
    echo "Global Block 7 updated to glassmorphic_grid successfully!\n";
} else {
    echo "Global Block 7 not found!\n";
}
