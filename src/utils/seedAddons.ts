
import { supabase } from '../lib/supabase';

const ADDON_GROUPS_DATA = [
    {
        "groupName": "Turbine seu lanche",
        "description": "Adicione mais sabor ao seu lanche",
        "isRequired": false,
        "maxQuantity": 40,
        "items": [
            { "name": "molho de alho", "price": "1.50" },
            { "name": "frango desfiado", "price": "4.00" },
            { "name": "calabresa", "price": "4.00" },
            { "name": "cheddar cremoso 5", "price": "6.00" },
            { "name": "Bacon", "price": "5.00" },
            { "name": "cheddar comum", "price": "4.00" },
            { "name": "ovo", "price": "1.00" },
            { "name": "picles", "price": "3.00" },
            { "name": "carne tradicional", "price": "4.00" },
            { "name": "carne artesanal", "price": "7.00" },
            { "name": "CATUPIRY", "price": "6.00" }
        ]
    },
    {
        "groupName": "Adicionais Hot Dog",
        "description": "Para seu cachorro quente",
        "isRequired": false,
        "maxQuantity": 5,
        "items": [
            { "name": "salcicha", "price": "1.50" },
            { "name": "cheddar", "price": "2.00" },
            { "name": "requeijão cremoso", "price": "2.00" },
            { "name": "bacon", "price": "3.00" },
            { "name": "cheddar cremoso", "price": "4.00" }
        ]
    },
    {
        "groupName": "Adicionais - Frituras",
        "is_required": false,
        "min_quantity": 0,
        "max_quantity": 10,
        "items": [
            { "name": "Batata Frita 300g", "price": "11.00" },
            { "name": "Batata Frita 500g", "price": "15.00" },
            { "name": "Nugget 250g", "price": "14.00" }
        ]
    },
    {
        "groupName": "Escolha sua Bebida (Combo)",
        "description": "Opções para combos",
        "isRequired": true,
        "maxQuantity": 1,
        "items": [
            { "name": "Coca 1L", "price": "0.00" },
            { "name": "Guarana 1L", "price": "0.00" },
            { "name": "Suco de laranja", "price": "0.00" },
            { "name": "COCA LATA", "price": "0.00" },
            { "name": "GUARANA LATA", "price": "0.00" },
            { "name": "FANTA LATA", "price": "0.00" },
            { "name": "SODA LATA", "price": "0.00" }
        ]
    }
];

export const seedAddonsData = async () => {
    console.log('Starting Addons Seed...', ADDON_GROUPS_DATA.length, 'groups found.');

    for (const group of ADDON_GROUPS_DATA) {
        try {
            // 1. Find or Create Group
            let groupId;

            const { data: existingGroup } = await supabase
                .from('addon_groups')
                .select('id')
                .ilike('name', group.groupName)
                .single();

            if (existingGroup) {
                groupId = existingGroup.id;
                console.log(`Addon Group exists: ${group.groupName} (${groupId})`);
            } else {
                const { data: newGroup, error: groupError } = await supabase
                    .from('addon_groups')
                    .insert({
                        name: group.groupName,
                        description: group.description,
                        is_required: group.isRequired,
                        min_quantity: group.isRequired ? 1 : 0,
                        max_quantity: group.maxQuantity
                    })
                    .select()
                    .single();

                if (groupError) {
                    console.error(`Error creating group ${group.groupName}:`, groupError);
                    continue;
                }
                groupId = newGroup.id;
                console.log(`Addon Group created: ${group.groupName} (${groupId})`);
            }

            // 2. Insert Items
            // We delete existing items for this group to ensure sync (or we could strictly upsert)
            // For simplicity/safety in seed, let's just insert missing ones or skip if name match.

            for (const item of group.items) {
                const { data: existingItem } = await supabase
                    .from('addon_items')
                    .select('id')
                    .eq('group_id', groupId)
                    .ilike('name', item.name)
                    .single();

                if (existingItem) {
                    console.log(`Skipping existing addon item: ${item.name}`);
                    continue;
                }

                const { error: itemError } = await supabase
                    .from('addon_items')
                    .insert({
                        group_id: groupId,
                        name: item.name,
                        price: parseFloat(item.price)
                    });

                if (itemError) {
                    console.error(`Error creating addon item ${item.name}:`, itemError);
                } else {
                    console.log(`Addon item created: ${item.name}`);
                }
            }

        } catch (err) {
            console.error('Error processing addon group:', group.groupName, err);
        }
    }

    alert('Importação de Adicionais Concluída! Verifique o console para detalhes.');
};
