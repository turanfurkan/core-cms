<?php

namespace TuranFurkan\CoreCms\Domains\Page\Actions;

use TuranFurkan\CoreCms\Domains\Page\Models\Page;

class DeletePageAction
{
    public function execute(Page $page): bool
    {
        if ($page->is_system) {
            throw new \RuntimeException('Sistem sayfaları silinemez.');
        }

        return $page->delete();
    }
}
