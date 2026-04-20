-- Configure Addons for Cuscuz Recheado

DO $$
DECLARE
    v_est_id bigint := 2;
    v_product_id bigint;
    v_group_id bigint;
    v_template_group_id bigint;
    v_template_item_id bigint;
BEGIN
    -- Find Product
    SELECT id INTO v_product_id FROM products WHERE establishment_id = v_est_id AND name = 'Cuscuz Recheado';
    IF v_product_id IS NULL THEN RAISE EXCEPTION 'Product not found'; END IF;

    -- Update base price to 0 and enable addons
    UPDATE products SET price = 0, has_addons = true WHERE id = v_product_id;

    -- Cleanup existing addons to avoid duplicates
    DELETE FROM product_addon_groups WHERE product_id = v_product_id;

    -- Create Template Addon Group
    INSERT INTO addon_groups (establishment_id, name, description, min_quantity, max_quantity, is_required, selection_mode)
    VALUES (v_est_id, 'Recheio', 'Selecione o recheio', 1, 1, true, 'BOX')
    RETURNING id INTO v_template_group_id;

    -- Create Product Addon Group
    INSERT INTO product_addon_groups (product_id, name, min_quantity, max_quantity, is_required, original_group_id, selection_mode)
    VALUES (v_product_id, 'Recheio', 1, 1, true, v_template_group_id, 'BOX')
    RETURNING id INTO v_group_id;

    INSERT INTO addon_items (group_id, name, price, is_max) VALUES (v_template_group_id, 'Carne de Sol, Catupiry, Ovo, Queijo', 26, true) RETURNING id INTO v_template_item_id;
    INSERT INTO product_addons (group_id, name, price, max_quantity, is_available, original_item_id) VALUES (v_group_id, 'Carne de Sol, Catupiry, Ovo, Queijo', 26, 1, true, v_template_item_id);
    INSERT INTO addon_items (group_id, name, price, is_max) VALUES (v_template_group_id, 'Frango, Cheddar, Queijo e Ovos', 26, true) RETURNING id INTO v_template_item_id;
    INSERT INTO product_addons (group_id, name, price, max_quantity, is_available, original_item_id) VALUES (v_group_id, 'Frango, Cheddar, Queijo e Ovos', 26, 1, true, v_template_item_id);
    INSERT INTO addon_items (group_id, name, price, is_max) VALUES (v_template_group_id, 'Calab. Bacon, Ovos, Queijo, Cheddar', 28, true) RETURNING id INTO v_template_item_id;
    INSERT INTO product_addons (group_id, name, price, max_quantity, is_available, original_item_id) VALUES (v_group_id, 'Calab. Bacon, Ovos, Queijo, Cheddar', 28, 1, true, v_template_item_id);

END $$;
