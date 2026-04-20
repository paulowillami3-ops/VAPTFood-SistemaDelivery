
import fs from 'fs';

// Hardcoded data from user request
const csvData = `Categoria,Item,Preço,Observação
Tapiocas,Tapioca Salgada,"R$18,00",
,Tapioca Doce,"R$18,00",
Salgados,Porção de Coxinha,"R$15,00",
,Porção de Bolinho de Queijo,"R$15,00",
,Porção de Pastel,"R$15,00",
Cuscuz,Cuscuz Recheado,"R$26,00",
Lasanha,Lasanha Frango,"R$18,00",
,Lasanha Carne,"R$18,00",
Batata Arretada,Porção de 250g,"R$15,00",Esgotado
,Porção de 500g,"R$25,00",Esgotado
Caldinhos,Caldinho de Feijão,"R$10,00",
,Caldinho de Camarão,"R$15,00",
Bebidas Quentes,Chocolate no Bule,"R$25,00",
,Chocolate na Xícara,"R$10,00",
,Chocolate na Garrafa 350ml,"R$15,00",
,Café Forte,"R$5,00",
,Café com Leite,"R$6,00",
,Café com Leite e Canela,"R$6,00",
Bebidas,Suco Natural de Laranja (Copo),"R$7,00",
,Suco da Polpa,"R$6,00",
,Água Mineral sem Gás,"R$3,00",Esgotado
,Água Mineral com Gás,"R$4,00",Esgotado
,Refrigerantes 1L,"R$10,00",
,Refrigerante Lata,"R$6,00",Esgotado
,Limonada Suíça,"R$7,00",
,Cerveja Amstel,"R$6,00",Esgotado
,Skol Latão,"R$7,00",Esgotado
,Ice Limão,"R$10,00",Esgotado
,Smirnoff,"R$10,00",
,Dreher,"R$5,00",
,Whisky Black White,"R$10,00",
,Lemon Fresh,"R$4,00",
,Água de Coco,"R$5,00",
,Cerveja Schin,"R$4,00",
,Cerveja Heineken,"R$10,00",
,Pérgola,"R$25,00",
,Quinta do Morgado,"R$20,00",
,Taça Pérgola,"R$10,00",
,Taça Quinta do Morgado,-,Preço não listado
Sobremesa,Pudim Sertanejo,"R$8,00",Esgotado
,Tortelete,"R$4,00",
,Bolo de Chocolate (Fatia),"R$5,00",
Pipocas,Fandangos,"R$3,00",
,Cebolitos,"R$3,00",
,Batatinha,"R$3,00",
,Cheetos,"R$3,00",
Balas,Trident,"R$5,00",
,Bombom,"R$2,00",
,Fini,"R$3,00",
,Halls,"R$3,00",
,Paçoca,"R$0,70",
,Freegels,"R$3,00",
,Pirulito,"R$0,75",
,Bala,"R$0,25",
,Bolinho,"R$3,00",`;

function parsePrice(priceStr) {
    if (!priceStr || priceStr === '-') return 0;
    const clean = priceStr.replace('R$', '').trim().replace(',', '.');
    return parseFloat(clean) || 0;
}

function run() {
    console.log('Generating SQL...');

    // Known ID for Tapiocaria Nordestina
    const establishmentId = 2;
    console.log('Using establishment ID:', establishmentId);

    const lines = csvData.split('\n');
    let currentCategory = null;
    let categoriesMap = new Map(); // name -> boolean (just to track seen for unique list)
    let sqlOutput = `-- Import Menu for Tapiocaria Nordestina (ID: ${establishmentId})\n\n`;

    sqlOutput += `DO $$\nDECLARE\n    v_establishment_id bigint := ${establishmentId};\n    v_category_id bigint;\nBEGIN\n`;

    // 1. Process Categories
    // We iterate to find unique categories and generate INSERT logic
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse CSV line
        const row = [];
        let inQuote = false;
        let buffer = '';
        for (const char of line) {
            if (char === '"') inQuote = !inQuote;
            else if (char === ',' && !inQuote) { row.push(buffer.trim()); buffer = ''; }
            else buffer += char;
        }
        row.push(buffer.trim());

        let categoryName = row[0];

        // Handle repeated category logic (from CSV structure)
        if (categoryName) currentCategory = categoryName;
        else categoryName = currentCategory;

        if (!categoryName) continue;

        if (!categoriesMap.has(categoryName)) {
            categoriesMap.set(categoryName, true);
            // UPSERT Category Logic in SQL Block
            sqlOutput += `\n    -- Category: ${categoryName}\n`;
            sqlOutput += `    SELECT id INTO v_category_id FROM categories WHERE establishment_id = v_establishment_id AND name = '${categoryName}';\n`;
            sqlOutput += `    IF v_category_id IS NULL THEN\n`;
            sqlOutput += `        INSERT INTO categories (establishment_id, name) VALUES (v_establishment_id, '${categoryName}') RETURNING id INTO v_category_id;\n`;
            sqlOutput += `    END IF;\n`;
        }
    }

    sqlOutput += `\n    -- Insert Products\n`;

    // 2. Process Products
    currentCategory = null; // Reset for second pass
    let lastCategory = null;

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

        let categoryName = row[0];
        const productName = row[1];
        let priceStr = row[2] ? row[2].replace(/"/g, '') : '0';
        const obs = row[3];

        if (categoryName) currentCategory = categoryName;
        else categoryName = currentCategory;

        if (!productName) continue;

        // Context Switch in SQL for variable reuse
        if (categoryName !== lastCategory) {
            sqlOutput += `\n    -- Switch to Category: ${categoryName}\n`;
            sqlOutput += `    SELECT id INTO v_category_id FROM categories WHERE establishment_id = v_establishment_id AND name = '${categoryName}';\n`;
            lastCategory = categoryName;
        }

        const price = parsePrice(priceStr);
        const isAvailable = !(obs && obs.includes('Esgotado'));
        // Escape single quotes in product name
        const safeProductName = productName.replace(/'/g, "''");

        sqlOutput += `    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, '${safeProductName}', ${price}, ${isAvailable});\n`;
    }

    sqlOutput += `\nEND $$;\n`;

    fs.writeFileSync('menu_import.sql', sqlOutput);
    console.log('SQL generated: menu_import.sql');
}

run();
