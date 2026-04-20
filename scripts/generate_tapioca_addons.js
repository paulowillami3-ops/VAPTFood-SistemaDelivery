
import fs from 'fs';

const csvData = `Sabor / Recheio,Preço
Charque com Cheddar,"R$ 18,00"
Carne de Sol com Catupiry,"R$ 16,00"
Carne de Sol com Queijo Coalho,"R$ 20,00"
Frango com Catupiry,"R$ 16,00"
Calabresa e Bacon com Manteiga,"R$ 18,00"
Queijo Coalho e Manteiga,"R$ 8,00"
Manteiga e Ovos,"R$ 6,00"
Charque com Catupiry,"R$ 16,00"
Charque com Queijo Coalho,"R$ 15,00"
Carne de Sol com Cheddar,"R$ 19,00"
Frango com Queijo Coalho,"R$ 14,00"
Frango com Cheddar,"R$ 18,00"`;

function parsePrice(priceStr) {
    if (!priceStr) return 0;
    const clean = priceStr.replace('R$', '').trim().replace(',', '.');
    return parseFloat(clean) || 0;
}

function run() {
    console.log('Generating Addons SQL...');
    const establishmentId = 2; // Tapiocaria
    const productName = 'Tapioca Salgada';
    const groupName = 'Sabor / Recheio';

    let sql = `-- Configure Addons for ${productName}\n\n`;
    sql += `DO $$\nDECLARE\n    v_est_id bigint := ${establishmentId};\n    v_product_id bigint;\n    v_group_id bigint;\n    v_template_group_id bigint;\n    v_template_item_id bigint;\nBEGIN\n`;

    // 1. Find Product
    sql += `    -- Find Product\n`;
    sql += `    SELECT id INTO v_product_id FROM products WHERE establishment_id = v_est_id AND name = '${productName}';\n`;
    sql += `    IF v_product_id IS NULL THEN RAISE EXCEPTION 'Product not found'; END IF;\n\n`;

    // 2. Update base price to 0
    sql += `    -- Update base price to 0 since flavor determines price\n`;
    sql += `    UPDATE products SET price = 0 WHERE id = v_product_id;\n\n`;

    // 3. Create Template Addon Group (For the Manager Modal)
    sql += `    -- Create Template Addon Group\n`;
    sql += `    INSERT INTO addon_groups (establishment_id, name, description, min_quantity, max_quantity, is_required)\n`;
    sql += `    VALUES (v_est_id, '${groupName}', 'Opções de sabores para tapioca', 1, 1, true)\n`;
    sql += `    RETURNING id INTO v_template_group_id;\n\n`;

    // 4. Create Product Addon Group (Linked to template)
    sql += `    -- Create Product Addon Group\n`;
    sql += `    INSERT INTO product_addon_groups (product_id, name, min_quantity, max_quantity, is_required, original_group_id)\n`;
    sql += `    VALUES (v_product_id, '${groupName}', 1, 1, true, v_template_group_id)\n`;
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

    fs.writeFileSync('tapioca_addons.sql', sql);
    console.log('SQL generated: tapioca_addons.sql');
}

run();
