-- Configure Addons for Tapioca Salgada

DO $$
DECLARE
    v_est_id bigint := 2;
    v_product_id bigint;
    v_group_id bigint;
    v_template_group_id bigint;
    v_template_item_id bigint;
BEGIN
    -- Find Product
    SELECT id INTO v_product_id FROM products WHERE establishment_id = v_est_id AND name = 'Tapioca Salgada';
    IF v_product_id IS NULL THEN RAISE EXCEPTION 'Product not found'; END IF;

    -- Update base price to 0 since flavor determines price
    UPDATE products SET price = 0 WHERE id = v_product_id;

    -- Create Template Addon Group
    INSERT INTO addon_groups (establishment_id, name, description, min_quantity, max_quantity, is_required)
    VALUES (v_est_id, 'Sabor / Recheio', 'Opções de sabores para tapioca', 1, 1, true)
    RETURNING id INTO v_template_group_id;

    -- Create Product Addon Group
    INSERT INTO product_addon_groups (product_id, name, min_quantity, max_quantity, is_required, original_group_id)
    VALUES (v_product_id, 'Sabor / Recheio', 1, 1, true, v_template_group_id)
    RETURNING id INTO v_group_id;

    INSERT INTO addon_items (group_id, name, price, is_max) VALUES (v_template_group_id, 'Charque com Cheddar', 18, true) RETURNING id INTO v_template_item_id;
    INSERT INTO product_addons (group_id, name, price, max_quantity, is_available, original_item_id) VALUES (v_group_id, 'Charque com Cheddar', 18, 1, true, v_template_item_id);
    INSERT INTO addon_items (group_id, name, price, is_max) VALUES (v_template_group_id, 'Carne de Sol com Catupiry', 16, true) RETURNING id INTO v_template_item_id;
    INSERT INTO product_addons (group_id, name, price, max_quantity, is_available, original_item_id) VALUES (v_group_id, 'Carne de Sol com Catupiry', 16, 1, true, v_template_item_id);
    INSERT INTO addon_items (group_id, name, price, is_max) VALUES (v_template_group_id, 'Carne de Sol com Queijo Coalho', 20, true) RETURNING id INTO v_template_item_id;
    INSERT INTO product_addons (group_id, name, price, max_quantity, is_available, original_item_id) VALUES (v_group_id, 'Carne de Sol com Queijo Coalho', 20, 1, true, v_template_item_id);
    INSERT INTO addon_items (group_id, name, price, is_max) VALUES (v_template_group_id, 'Frango com Catupiry', 16, true) RETURNING id INTO v_template_item_id;
    INSERT INTO product_addons (group_id, name, price, max_quantity, is_available, original_item_id) VALUES (v_group_id, 'Frango com Catupiry', 16, 1, true, v_template_item_id);
    INSERT INTO addon_items (group_id, name, price, is_max) VALUES (v_template_group_id, 'Calabresa e Bacon com Manteiga', 18, true) RETURNING id INTO v_template_item_id;
    INSERT INTO product_addons (group_id, name, price, max_quantity, is_available, original_item_id) VALUES (v_group_id, 'Calabresa e Bacon com Manteiga', 18, 1, true, v_template_item_id);
    INSERT INTO addon_items (group_id, name, price, is_max) VALUES (v_template_group_id, 'Queijo Coalho e Manteiga', 8, true) RETURNING id INTO v_template_item_id;
    INSERT INTO product_addons (group_id, name, price, max_quantity, is_available, original_item_id) VALUES (v_group_id, 'Queijo Coalho e Manteiga', 8, 1, true, v_template_item_id);
    INSERT INTO addon_items (group_id, name, price, is_max) VALUES (v_template_group_id, 'Manteiga e Ovos', 6, true) RETURNING id INTO v_template_item_id;
    INSERT INTO product_addons (group_id, name, price, max_quantity, is_available, original_item_id) VALUES (v_group_id, 'Manteiga e Ovos', 6, 1, true, v_template_item_id);
    INSERT INTO addon_items (group_id, name, price, is_max) VALUES (v_template_group_id, 'Charque com Catupiry', 16, true) RETURNING id INTO v_template_item_id;
    INSERT INTO product_addons (group_id, name, price, max_quantity, is_available, original_item_id) VALUES (v_group_id, 'Charque com Catupiry', 16, 1, true, v_template_item_id);
    INSERT INTO addon_items (group_id, name, price, is_max) VALUES (v_template_group_id, 'Charque com Queijo Coalho', 15, true) RETURNING id INTO v_template_item_id;
    INSERT INTO product_addons (group_id, name, price, max_quantity, is_available, original_item_id) VALUES (v_group_id, 'Charque com Queijo Coalho', 15, 1, true, v_template_item_id);
    INSERT INTO addon_items (group_id, name, price, is_max) VALUES (v_template_group_id, 'Carne de Sol com Cheddar', 19, true) RETURNING id INTO v_template_item_id;
    INSERT INTO product_addons (group_id, name, price, max_quantity, is_available, original_item_id) VALUES (v_group_id, 'Carne de Sol com Cheddar', 19, 1, true, v_template_item_id);
    INSERT INTO addon_items (group_id, name, price, is_max) VALUES (v_template_group_id, 'Frango com Queijo Coalho', 14, true) RETURNING id INTO v_template_item_id;
    INSERT INTO product_addons (group_id, name, price, max_quantity, is_available, original_item_id) VALUES (v_group_id, 'Frango com Queijo Coalho', 14, 1, true, v_template_item_id);
    INSERT INTO addon_items (group_id, name, price, is_max) VALUES (v_template_group_id, 'Frango com Cheddar', 18, true) RETURNING id INTO v_template_item_id;
    INSERT INTO product_addons (group_id, name, price, max_quantity, is_available, original_item_id) VALUES (v_group_id, 'Frango com Cheddar', 18, 1, true, v_template_item_id);

END $$;
