-- Import Menu for Tapiocaria Nordestina (ID: 2)

DO $$
DECLARE
    v_establishment_id bigint := 2;
    v_category_id bigint;
BEGIN

    -- Category: Tapiocas
    SELECT id INTO v_category_id FROM categories WHERE establishment_id = v_establishment_id AND name = 'Tapiocas';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (establishment_id, name) VALUES (v_establishment_id, 'Tapiocas') RETURNING id INTO v_category_id;
    END IF;

    -- Category: Salgados
    SELECT id INTO v_category_id FROM categories WHERE establishment_id = v_establishment_id AND name = 'Salgados';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (establishment_id, name) VALUES (v_establishment_id, 'Salgados') RETURNING id INTO v_category_id;
    END IF;

    -- Category: Cuscuz
    SELECT id INTO v_category_id FROM categories WHERE establishment_id = v_establishment_id AND name = 'Cuscuz';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (establishment_id, name) VALUES (v_establishment_id, 'Cuscuz') RETURNING id INTO v_category_id;
    END IF;

    -- Category: Lasanha
    SELECT id INTO v_category_id FROM categories WHERE establishment_id = v_establishment_id AND name = 'Lasanha';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (establishment_id, name) VALUES (v_establishment_id, 'Lasanha') RETURNING id INTO v_category_id;
    END IF;

    -- Category: Batata Arretada
    SELECT id INTO v_category_id FROM categories WHERE establishment_id = v_establishment_id AND name = 'Batata Arretada';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (establishment_id, name) VALUES (v_establishment_id, 'Batata Arretada') RETURNING id INTO v_category_id;
    END IF;

    -- Category: Caldinhos
    SELECT id INTO v_category_id FROM categories WHERE establishment_id = v_establishment_id AND name = 'Caldinhos';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (establishment_id, name) VALUES (v_establishment_id, 'Caldinhos') RETURNING id INTO v_category_id;
    END IF;

    -- Category: Bebidas Quentes
    SELECT id INTO v_category_id FROM categories WHERE establishment_id = v_establishment_id AND name = 'Bebidas Quentes';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (establishment_id, name) VALUES (v_establishment_id, 'Bebidas Quentes') RETURNING id INTO v_category_id;
    END IF;

    -- Category: Bebidas
    SELECT id INTO v_category_id FROM categories WHERE establishment_id = v_establishment_id AND name = 'Bebidas';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (establishment_id, name) VALUES (v_establishment_id, 'Bebidas') RETURNING id INTO v_category_id;
    END IF;

    -- Category: Sobremesa
    SELECT id INTO v_category_id FROM categories WHERE establishment_id = v_establishment_id AND name = 'Sobremesa';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (establishment_id, name) VALUES (v_establishment_id, 'Sobremesa') RETURNING id INTO v_category_id;
    END IF;

    -- Category: Pipocas
    SELECT id INTO v_category_id FROM categories WHERE establishment_id = v_establishment_id AND name = 'Pipocas';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (establishment_id, name) VALUES (v_establishment_id, 'Pipocas') RETURNING id INTO v_category_id;
    END IF;

    -- Category: Balas
    SELECT id INTO v_category_id FROM categories WHERE establishment_id = v_establishment_id AND name = 'Balas';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (establishment_id, name) VALUES (v_establishment_id, 'Balas') RETURNING id INTO v_category_id;
    END IF;

    -- Insert Products

    -- Switch to Category: Tapiocas
    SELECT id INTO v_category_id FROM categories WHERE establishment_id = v_establishment_id AND name = 'Tapiocas';
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Tapioca Salgada', 18, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Tapioca Doce', 18, true);

    -- Switch to Category: Salgados
    SELECT id INTO v_category_id FROM categories WHERE establishment_id = v_establishment_id AND name = 'Salgados';
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Porção de Coxinha', 15, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Porção de Bolinho de Queijo', 15, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Porção de Pastel', 15, true);

    -- Switch to Category: Cuscuz
    SELECT id INTO v_category_id FROM categories WHERE establishment_id = v_establishment_id AND name = 'Cuscuz';
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Cuscuz Recheado', 26, true);

    -- Switch to Category: Lasanha
    SELECT id INTO v_category_id FROM categories WHERE establishment_id = v_establishment_id AND name = 'Lasanha';
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Lasanha Frango', 18, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Lasanha Carne', 18, true);

    -- Switch to Category: Batata Arretada
    SELECT id INTO v_category_id FROM categories WHERE establishment_id = v_establishment_id AND name = 'Batata Arretada';
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Porção de 250g', 15, false);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Porção de 500g', 25, false);

    -- Switch to Category: Caldinhos
    SELECT id INTO v_category_id FROM categories WHERE establishment_id = v_establishment_id AND name = 'Caldinhos';
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Caldinho de Feijão', 10, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Caldinho de Camarão', 15, true);

    -- Switch to Category: Bebidas Quentes
    SELECT id INTO v_category_id FROM categories WHERE establishment_id = v_establishment_id AND name = 'Bebidas Quentes';
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Chocolate no Bule', 25, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Chocolate na Xícara', 10, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Chocolate na Garrafa 350ml', 15, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Café Forte', 5, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Café com Leite', 6, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Café com Leite e Canela', 6, true);

    -- Switch to Category: Bebidas
    SELECT id INTO v_category_id FROM categories WHERE establishment_id = v_establishment_id AND name = 'Bebidas';
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Suco Natural de Laranja (Copo)', 7, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Suco da Polpa', 6, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Água Mineral sem Gás', 3, false);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Água Mineral com Gás', 4, false);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Refrigerantes 1L', 10, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Refrigerante Lata', 6, false);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Limonada Suíça', 7, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Cerveja Amstel', 6, false);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Skol Latão', 7, false);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Ice Limão', 10, false);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Smirnoff', 10, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Dreher', 5, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Whisky Black White', 10, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Lemon Fresh', 4, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Água de Coco', 5, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Cerveja Schin', 4, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Cerveja Heineken', 10, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Pérgola', 25, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Quinta do Morgado', 20, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Taça Pérgola', 10, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Taça Quinta do Morgado', 0, true);

    -- Switch to Category: Sobremesa
    SELECT id INTO v_category_id FROM categories WHERE establishment_id = v_establishment_id AND name = 'Sobremesa';
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Pudim Sertanejo', 8, false);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Tortelete', 4, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Bolo de Chocolate (Fatia)', 5, true);

    -- Switch to Category: Pipocas
    SELECT id INTO v_category_id FROM categories WHERE establishment_id = v_establishment_id AND name = 'Pipocas';
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Fandangos', 3, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Cebolitos', 3, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Batatinha', 3, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Cheetos', 3, true);

    -- Switch to Category: Balas
    SELECT id INTO v_category_id FROM categories WHERE establishment_id = v_establishment_id AND name = 'Balas';
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Trident', 5, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Bombom', 2, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Fini', 3, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Halls', 3, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Paçoca', 0.7, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Freegels', 3, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Pirulito', 0.75, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Bala', 0.25, true);
    INSERT INTO products (establishment_id, category_id, name, price, is_available) VALUES (v_establishment_id, v_category_id, 'Bolinho', 3, true);

END $$;
