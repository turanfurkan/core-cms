<?php
try {
    $p_old = new PDO('mysql:host=127.0.0.1;dbname=sporfest_db;charset=utf8mb4', 'root', '');
    $p_new = new PDO('mysql:host=127.0.0.1;dbname=core_cms_db;charset=utf8mb4', 'root', '');
    
    echo "=== ROLES IN SPORFEST_DB ===\n";
    $stmt = $p_old->query("SELECT * FROM roles");
    $old_roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($old_roles as $r) {
        echo "  ID: {$r['id']} | Name: {$r['name']} | Guard: {$r['guard_name']}\n";
    }
    
    echo "\n=== ROLES IN CORE_CMS_DB ===\n";
    $stmt = $p_new->query("SELECT * FROM roles");
    $new_roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($new_roles as $r) {
        echo "  ID: {$r['id']} | Name: {$r['name']} | Guard: {$r['guard_name']} | Protected: {$r['is_protected']} | Default: {$r['is_default']}\n";
    }

    echo "\n=== COUNT OF PERMISSIONS ===\n";
    $old_perm_count = $p_old->query("SELECT COUNT(*) FROM permissions")->fetchColumn();
    $new_perm_count = $p_new->query("SELECT COUNT(*) FROM permissions")->fetchColumn();
    echo "  Old: $old_perm_count | New: $new_perm_count\n";

    echo "\n=== SAMPLE OF OLD PERMISSIONS ===\n";
    $stmt = $p_old->query("SELECT * FROM permissions LIMIT 10");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "  ID: {$row['id']} | Name: {$row['name']} | Guard: {$row['guard_name']}\n";
    }

    echo "\n=== SAMPLE OF NEW PERMISSIONS ===\n";
    $stmt = $p_new->query("SELECT * FROM permissions LIMIT 10");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "  ID: {$row['id']} | Name: {$row['name']} | Guard: {$row['guard_name']} | Desc: {$row['description']}\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
