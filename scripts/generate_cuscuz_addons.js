
import fs from 'fs';

const csvData = `Opção,Preço
"Carne de Sol, Catupiry, Ovo, Queijo","R$ 26,00"
"Frango, Cheddar, Queijo e Ovos","R$ 26,00"
"Calab. Bacon, Ovos, Queijo, Cheddar","R$ 28,00"`;

function parsePrice(priceStr) {
    if (!priceStr) return 0;
    const clean = priceStr.replace('R$', '').trim().replace(',', '.');
    return parseFloat(clean) || 0;
}

function run() {
    console.log('Generating Addons SQL...');
    const establishmentId = 2; // Tapiocaria
    const productName = 'Cuscuz Recheado';
    const groupName = 'Recheio';

    let sql = `-- Configure Addons for ${productName}\n\n`;
    sql += `DO $$\nDECLARE\n    v_est_id bigint := ${establishmentId};\n    v_product_id bigint;\n    v_group_id bigint;\n    v_template_group_id bigint;\n    v_template_item_id bigint;\nBEGIN\n`;

    // 1. Find Product
    sql += `    -- Find Product\n`;
    sql += `    SELECT id INTO v_product_id FROM products WHERE establishment_id = v_est_id AND name = '${productName}';\n`;
    sql += `    IF v_product_id IS NULL THEN RAISE EXCEPTION 'Product not found'; END IF;\n\n`;

    // 2. Update base price to 0 and ensure has_addons is true
    sql += `    -- Update base price to 0 and enable addons\n`;
    sql += `    UPDATE products SET price = 0, has_addons = true WHERE id = v_product_id;\n\n`;

    // 2.1 Cleanup existing addons for this product
    sql += `    -- Cleanup existing addons to avoid duplicates\n`;
    sql += `    DELETE FROM product_addon_groups WHERE product_id = v_product_id;\n\n`;

    // 3. Create Template Addon Group (BOX mode)
    sql += `    -- Create Template Addon Group\n`;
    sql += `    INSERT INTO addon_groups (establishment_id, name, description, min_quantity, max_quantity, is_required, selection_mode)\n`;
    sql += `    VALUES (v_est_id, '${groupName}', 'Selecione o recheio', 1, 1, true, 'BOX')\n`;
    sql += `    RETURNING id INTO v_template_group_id;\n\n`;

    // 4. Create Product Addon Group (Linked to template)
    sql += `    -- Create Product Addon Group\n`;
    sql += `    INSERT INTO product_addon_groups (product_id, name, min_quantity, max_quantity, is_required, original_group_id, selection_mode)\n`;
    sql += `    VALUES (v_product_id, '${groupName}', 1, 1, true, v_template_group_id, 'BOX')\n`;
    sql += `    RETURNING id INTO v_group_id;\n\n`;

    // 5. Insert Addons
    const lines = csvData.split('\n');
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const row = [];
        let inQuote = false;
        let buffer = '';
        for (const char of line) {
            if (char === '"') inQuote = !inQuote;
            else if (char === ',' && !inQuote) { row.push(buffer.trim()); buffer = ''; }
            else buffer += char;
        }
        row.push(buffer.trim());

        const name = row[0];
        const priceStr = row[1] ? row[1].replace(/"/g, '') : '0';
        const price = parsePrice(priceStr);

        if (name) {
            // Insert Template Item
            sql += `    INSERT INTO addon_items (group_id, name, price, is_max) VALUES (v_template_group_id, '${name}', ${price}, true) RETURNING id INTO v_template_item_id;\n`;
            // Insert Product Specific Item
            sql += `    INSERT INTO product_addons (group_id, name, price, max_quantity, is_available, original_item_id) VALUES (v_group_id, '${name}', ${price}, 1, true, v_template_item_id);\n`;
        }
    }

    sql += `\nEND $$;\n`;

    fs.writeFileSync('cuscuz_addons.sql', sql);
    console.log('SQL generated: cuscuz_addons.sql');
}

run();
