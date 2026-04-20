
import { supabase } from '../lib/supabase';

const MENU_DATA = [
    {
        "categoryName": "Destaques",
        "items": [
            {
                "name": "NAMORADINHOS TRADICIONAL",
                "description": "1 x bacon, 1 x cheddar, 1 batata 300g, refri 1L ou jarra de suco",
                "price": "R$ 50,00",
                "imageUrl": "https://pedido.anota.ai/assets/item_no_image-DJEgmuUL.png"
            },
            {
                "name": "NAMORADINHOS ARTESANAL",
                "description": "",
                "price": "R$ 55,00",
                "imageUrl": "https://pedido.anota.ai/assets/item_no_image-DJEgmuUL.png"
            },
            {
                "name": "DUETO TRADICIONAL",
                "description": "2 x burgueres tradicionais um refri 1L ou suco 700ml",
                "price": "R$ 36,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1765558571464blob"
            },
            {
                "name": "DUETO ARTESANAL",
                "description": "2 x burguer Artesanal, um refri de 1L, ou um suco de laranja 700ml",
                "price": "R$ 42,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1765558586891blob"
            },
            {
                "name": "X TUDÃO TRADICIONAL",
                "description": "Pão, hambúrguer, queijo, presunto, ovo, calabresa, bacon, frango, cheddar cremoso, cebola, tomate, molho da casa",
                "price": "R$ 21,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737566181957blob"
            },
            {
                "name": "X TUDÃO ARTESANAL",
                "description": "Pão, hambúrguer 120g, queijo, presunto, ovo, cabresa, bacon, frango, cheddar cremoso, cebola, tomate, molho da casa",
                "price": "R$ 25,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737495796628blob"
            }
        ]
    },
    {
        "categoryName": "ESPECIAIS DA CASA",
        "items": [
            {
                "name": "COSTELLA BURGUER",
                "description": "ACOMPANHA PÃO, CEBOLA CHAPEADA ACOMPANHADO DE UM BLEND DE 180G, MUITA MUSSARELA E BASTANTE COSTELA DESFIADA.",
                "price": "R$ 33,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1746126305927blob"
            },
            {
                "name": "BURGUER COM QUEIJO COALHO",
                "description": "ACOMPANHA PÃO, CEBOLA CHAPEADA ACOMPANHADO DE UM BLEND DE 180G, BASTANTE QUEIJO COALHO E NOSSO MOLHO DA CASA",
                "price": "R$ 21,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1746126322606blob"
            },
            {
                "name": "FAROFA DE BACON COM CREME DE CHEDDAR",
                "description": "ACOMPANHA PÃO, CEBOLA CHAPEADA ACOMPANHADO DE UM BLEND DE 180G, MUITO CREME DE CHEDDAR E FAROFA DE BACON.",
                "price": "R$ 26,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1746126340029blob"
            }
        ]
    },
    {
        "categoryName": "CACHORRO QUENTE",
        "items": [
            {
                "name": "cachorro quente bovino",
                "description": "pão 15cm, 1 salcicha, carne bovina, milho, ervilha, tomate, cebola, batata palha, ketchup, mostarda, maionese da casa",
                "price": "R$ 15,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1731537746511blob"
            },
            {
                "name": "cachorro quente frango",
                "description": "pão 15cm, 1 salcicha, frango desfiado, milho, ervilha, tomate, cebola, batata palha, ketchup, mostarda, maionese da casa",
                "price": "R$ 15,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1731537817869blob"
            },
            {
                "name": "cachorro quente MISTO",
                "description": "pão 15cm, 1 salcicha, carne bovina, frango desfiado, milho, ervilha, tomate, cebola, batata palha, ketchup, mostarda, maionese da casa",
                "price": "R$ 15,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1731537840030blob"
            }
        ]
    },
    {
        "categoryName": "TRADICIONAIS",
        "items": [
            {
                "name": "X BURGUER TRADICIONAL",
                "description": "(Pão, hambúrguer, queijo, presunto, ovo, cebola, tomate, molho da casa)",
                "price": "R$ 15,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737565811105blob"
            },
            {
                "name": "X FRANGO TRADICIONAL",
                "description": "Pão, hambúrguer, queijo, presunto, frango desfiado, cebola, tomate, molho da casa",
                "price": "R$ 18,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737566338801blob"
            },
            {
                "name": "X- CALABRESA TRADICIONAL",
                "description": "Pão, hambúrguer, queijo, calabresa, ovo, tomate, cebola, molho da casa",
                "price": "R$ 18,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737566013453blob"
            },
            {
                "name": "X- BACON TRADICIONAL",
                "description": "Pão, hambúrguer, queijo, presunto, ovo, bacon, cebola, tomate, molho da casa",
                "price": "R$ 18,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737566033152blob"
            },
            {
                "name": "X CHEDDAR TRADICIONAL",
                "description": "Pão, hambúrguer, presunto, ovo, cheddar cremoso, cebola, tomate, molho da casa",
                "price": "R$ 17,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737566049552blob"
            },
            {
                "name": "CHEBACON TRADICIONAL",
                "description": "Pão, hambúrguer, presunto, ovo,cheddar cremoso, bacon, tomate, cebola, molho da casa",
                "price": "R$ 21,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737566080237blob"
            },
            {
                "name": "CALABACON TRADICIONAL",
                "description": "Pão, hambúrguer, queijo, presunto, ovo, cababresa, bacon, cebola, tomate, molho da casa",
                "price": "R$ 21,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737566094261blob"
            },
            {
                "name": "FRANBACON TRADICIONAL",
                "description": "Pão, hambúrguer, queijo, presunto, cebola, frango, bacon, tomate, molho da casa",
                "price": "R$ 21,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737566110029blob"
            }
        ]
    },
    {
        "categoryName": "ARTESANAIS",
        "items": [
            {
                "name": "X BURGUER ARTESANAL",
                "description": "Pão, hambúrguer 120g, queijo, presunto, ovo, cebola, tomate, molho da casa",
                "price": "R$ 18,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1733868459395blob"
            },
            {
                "name": "X FRANGO ARTESANAL",
                "description": "Pão, hambúrguer 120g, queijo, presunto, frango desfiado, cebola, tomate, molho da casa",
                "price": "R$ 21,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1733868649688blob"
            },
            {
                "name": "X CALABRESA ARTESANAL",
                "description": "Pão, hambúrguer 120g, queijo, presunto, calabresa, ovo, cebola, tomate, molho da casa",
                "price": "R$ 21,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1733868970242blob"
            },
            {
                "name": "X BACON ARTESANAL",
                "description": "Pão, hambúrguer 120g, queijo, presunto, bacon, ovo, cebola, tomate, molho da casa",
                "price": "R$ 21,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737496337766blob"
            },
            {
                "name": "X CHEDDAR ARTESANAL",
                "description": "Pão, hambúrguer 120g, presunto, cheddar cremoso, ovo, cebola, tomate, molho da casa",
                "price": "R$ 21,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737496002216blob"
            },
            {
                "name": "SUPER BURGUER ARTESANAL",
                "description": "Pão, 2 hambúrguer 120g, queijo, presunto, ovo, cebola, tomate, molho da casa",
                "price": "R$ 21,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737496116917blob"
            },
            {
                "name": "CHEBACON ARTESANAL",
                "description": "Pão, hambúrguer 120g, presunto, ovo, cebola, cheddar cremoso, bacon, tomate, molho da casa",
                "price": "R$ 25,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1733869308476blob"
            },
            {
                "name": "CALABACON DO FUTURO ARTESANAL",
                "description": "Pão, hambúrguer 120g, queijo, presunto, ovo, cababresa, bacon, cebola, tomate, molho da casa",
                "price": "R$ 25,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737496236269blob"
            },
            {
                "name": "FRANBACON ARTESANAL",
                "description": "Pão, hambúrguer 120g, queijo, presunto, cebola, frango, bacon, tomate, molho da casa",
                "price": "R$ 25,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737495867843blob"
            },
            {
                "name": "DEMOLIBURGUER ARTESANAL",
                "description": "Pão, 2 hambúrguer 120g, 2 queijo, 2 presunto, bacon, frango, cheddar cremoso ovo, cebola, tomate, molho da casa",
                "price": "R$ 31,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1733869267568blob"
            }
        ]
    },
    {
        "categoryName": "COMBOS",
        "items": [
            {
                "name": "COMBO HARRY BURGUER TRADICIONAL",
                "description": "HARRY BURGUER TRADICIONAL + BATATA 300G, REFRI / SUCO 300ML",
                "price": "R$ 29,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737565209954blob"
            },
            {
                "name": "COMBO HARRY BURGUER ARTESANAL",
                "description": "HARRY BURGUER ART + BATATA 300G, REFRI / SUCO 300ML",
                "price": "R$ 31,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737565223063blob"
            },
            {
                "name": "COMBO PODEROSO CHEDÃO TRAD",
                "description": "CHEDDAR TRAD + BATATA 300G, REFRI / SUCO 300ML",
                "price": "R$ 31,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737565237356blob"
            },
            {
                "name": "COMBO PODEROSO CHEDÃO ART",
                "description": "CHEDDAR ART + BATATA 300G, REFRI / SUCO 300ML",
                "price": "R$ 35,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737565251970blob"
            },
            {
                "name": "COMBO CODIGO CALEBRESA TRAD",
                "description": "CALABRESA TRAD + BATATA 300G, REFRI / SUCO 300ML",
                "price": "R$ 32,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737565264668blob"
            },
            {
                "name": "COMBO CODIGO CALABRESA ART",
                "description": "CALBRESA + BATATA 300G, REFRI / SUCO 300ML",
                "price": "R$ 35,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737565285055blob"
            },
            {
                "name": "COMBO LOS POLLOS TRAD",
                "description": "X FRANGO + BATATA 300G, REFRI / SUCO 300ML",
                "price": "R$ 32,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737565299148blob"
            },
            {
                "name": "COMBO LOS POLLOS ART",
                "description": "X FRANGO ART + BATATA 300G, REFRI / SUCO 300ML",
                "price": "R$ 35,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737565321532blob"
            },
            {
                "name": "COMBO SUPER BURGUER",
                "description": "SUPER BURGUER + BATATA 300G, REFRI / SUCO 300ML",
                "price": "R$ 35,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737565492277blob"
            },
            {
                "name": "COMBO HOMEM DE BACON TRAD",
                "description": "BACON TRAD + BATATA 300G, REFRI / SUCO 300ML",
                "price": "R$ 32,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737565447523blob"
            },
            {
                "name": "COMBO HOMEM DE BACON ART",
                "description": "BACON ART + BATATA 300G, REFRI / SUCO 300ML",
                "price": "R$ 35,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737565478194blob"
            },
            {
                "name": "COMBO CALABACON TRAD",
                "description": "CALABACON + BATATA 300G, REFRI / SUCO 300ML",
                "price": "R$ 35,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737565334534blob"
            },
            {
                "name": "COMBO CALABACON ART",
                "description": "CALABACON ART + BATATA 300G, REFRI / SUCO 300ML",
                "price": "R$ 38,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737565348864blob"
            },
            {
                "name": "COMBO GAME OF FOMES TRAD",
                "description": "TUDÃO TRAD + BATATA 300G, REFRI / SUCO 300ML",
                "price": "R$ 37,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737565418086blob"
            },
            {
                "name": "COMBO GAME OF FOMES ART",
                "description": "TUDÃO ART+ BATATA 300G, REFRI / SUCO 300ML",
                "price": "R$ 40,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737565432598blob"
            },
            {
                "name": "COMBO FRANGO ANATOMY TRAD",
                "description": "FRANBACON TRAD + BATATA 300G, REFRI / SUCO 300ML",
                "price": "R$ 35,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737565389974blob"
            },
            {
                "name": "COMBO FRANGO ANATOMY ART",
                "description": "FRANBACON ART + BATATA 300G, REFRI / SUCO 300ML",
                "price": "R$ 38,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737565405475blob"
            },
            {
                "name": "COMBO DEMOLIBURGUER",
                "description": "DEMOLIBURGUER + BATATA 300G, REFRI / SUCO 300ML",
                "price": "R$ 43,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737565505935blob"
            },
            {
                "name": "COMBO CHEBACON TRAD",
                "description": "CHEBACON + BATATA 300G, REFRI / SUCO 300ML",
                "price": "R$ 35,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737565362183blob"
            },
            {
                "name": "COMBO CHEBACON ART",
                "description": "CHEBACON ART + BATATA 300G, REFRI / SUCO 300ML",
                "price": "R$ 38,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737565375340blob"
            }
        ]
    },
    {
        "categoryName": "COMBOS ESPECIAIS",
        "items": [
            {
                "name": "COMBO FAMILIA TRADICIONAL",
                "description": "",
                "price": "R$ 66,00",
                "imageUrl": "https://pedido.anota.ai/assets/item_no_image-DJEgmuUL.png"
            },
            {
                "name": "COMBO FAMILIA ARTESANAL",
                "description": "",
                "price": "R$ 73,00",
                "imageUrl": "https://pedido.anota.ai/assets/item_no_image-DJEgmuUL.png"
            }
        ]
    },
    {
        "categoryName": "BEBIDAS",
        "items": [
            {
                "name": "suco de laranja 300ml",
                "description": "'",
                "price": "R$ 7,00",
                "imageUrl": "https://anotaai.s3.us-west-2.amazonaws.com/produtos/suco%20de%20lanja%20300ml1666203672381blob"
            },
            {
                "name": "suco de laranja 500ml",
                "description": "'",
                "price": "R$ 10,00",
                "imageUrl": "https://anotaai.s3.us-west-2.amazonaws.com/produtos/suco%20de%20lanja%20500ml1666203809646blob"
            },
            {
                "name": "coca cola lata",
                "description": "'",
                "price": "R$ 6,00",
                "imageUrl": "https://anotaai.s3.us-west-2.amazonaws.com/produtos/coca%20cola%20lata1666203356491blob"
            },
            {
                "name": "COCA ZERO lata",
                "description": "",
                "price": "R$ 6,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1732655627784blob"
            },
            {
                "name": "guarana antartica lata",
                "description": "'",
                "price": "R$ 6,00",
                "imageUrl": "https://anotaai.s3.us-west-2.amazonaws.com/produtos/guarana%20antartica%20lata1666203404171blob"
            },
            {
                "name": "fanta lata",
                "description": "'",
                "price": "R$ 6,00",
                "imageUrl": "https://anotaai.s3.us-west-2.amazonaws.com/produtos/fanta%20lata1666203434941blob"
            },
            {
                "name": "soda lata",
                "description": "'",
                "price": "R$ 6,00",
                "imageUrl": "https://anotaai.s3.us-west-2.amazonaws.com/produtos/soda%20lata1666204001085blob"
            },
            {
                "name": "coca cola 1L",
                "description": "'",
                "price": "R$ 11,00",
                "imageUrl": "https://anotaai.s3.us-west-2.amazonaws.com/produtos/coca%20cola%201L1666203863277blob"
            },
            {
                "name": "COCA COLA 1L ZERO",
                "description": "",
                "price": "R$ 11,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1741988034285blob"
            },
            {
                "name": "guarana 1L",
                "description": "'",
                "price": "R$ 10,00",
                "imageUrl": "https://anotaai.s3.us-west-2.amazonaws.com/produtos/guarana%201L1666203886914blob"
            },
            {
                "name": "agua sem gas",
                "description": "'",
                "price": "R$ 3,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1731537422662blob"
            },
            {
                "name": "agua com gás",
                "description": "'",
                "price": "R$ 4,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1731537440137blob"
            },
            {
                "name": "jarra de suco laranja",
                "description": "700 ML",
                "price": "R$ 12,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1731537526210blob"
            },
            {
                "name": "HEINEKEN LONG",
                "description": "",
                "price": "R$ 10,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1741988411115blob"
            },
            {
                "name": "cerveja amstel lata",
                "description": "'",
                "price": "R$ 6,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1731537507211blob"
            },
            {
                "name": "schin lata",
                "description": "'",
                "price": "R$ 5,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1731537669445blob"
            },
            {
                "name": "DEVASSA LATA",
                "description": "",
                "price": "R$ 5,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1741988016830blob"
            },
            {
                "name": "HENEKEN 00 ALCOOL",
                "description": "",
                "price": "R$ 10,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1741988390476blob"
            },
            {
                "name": "skol",
                "description": "",
                "price": "R$ 6,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1763244557398blob"
            },
            {
                "name": "RED BULL lata",
                "description": "",
                "price": "R$ 14,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1763243623727blob"
            },
            {
                "name": "H2O LIMONETO 1,5L",
                "description": "",
                "price": "R$ 18,00",
                "imageUrl": "https://pedido.anota.ai/assets/item_no_image-DJEgmuUL.png"
            },
            {
                "name": "velho chico artesanal",
                "description": "",
                "price": "R$ 25,00",
                "imageUrl": "https://pedido.anota.ai/assets/item_no_image-DJEgmuUL.png"
            },
            {
                "name": "mandacaru atomico",
                "description": "",
                "price": "R$ 28,00",
                "imageUrl": "https://pedido.anota.ai/assets/item_no_image-DJEgmuUL.png"
            },
            {
                "name": "skinka",
                "description": "",
                "price": "R$ 6,00",
                "imageUrl": "https://pedido.anota.ai/assets/item_no_image-DJEgmuUL.png"
            },
            {
                "name": "Eisenbahn pilsen",
                "description": "",
                "price": "R$ 8,00",
                "imageUrl": "https://pedido.anota.ai/assets/item_no_image-DJEgmuUL.png"
            }
        ]
    },
    {
        "categoryName": "FRITURAS",
        "items": [
            {
                "name": "batata frita 300g",
                "description": ".",
                "price": "R$ 11,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737566464784blob"
            },
            {
                "name": "batata frita 500g",
                "description": "'",
                "price": "R$ 15,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737566477039blob"
            },
            {
                "name": "nugget 250g",
                "description": "'",
                "price": "R$ 14,00",
                "imageUrl": "https://client-assets.anota.ai/produtos/635033883a386400125d4bb2/-1737566564894blob"
            }
        ]
    },
    {
        "categoryName": "Sobremesas",
        "items": [
            {
                "name": "Brownie de beijinho",
                "description": "",
                "price": "R$ 8,00",
                "imageUrl": "https://pedido.anota.ai/assets/item_no_image-DJEgmuUL.png"
            },
            {
                "name": "Brownie de ninho",
                "description": "",
                "price": "R$ 8,00",
                "imageUrl": "https://pedido.anota.ai/assets/item_no_image-DJEgmuUL.png"
            }
        ]
    }
];

export const seedMenuData = async () => {
    console.log('Starting Menu Seed...', MENU_DATA.length, 'categories found.');

    for (const category of MENU_DATA) {
        try {
            // 1. Find or Create Category
            let categoryId;

            const { data: existingCat } = await supabase
                .from('categories')
                .select('id')
                .ilike('name', category.categoryName)
                .single();

            if (existingCat) {
                categoryId = existingCat.id;
                console.log(`Category exists: ${category.categoryName} (${categoryId})`);
            } else {
                const { data: newCat, error: catError } = await supabase
                    .from('categories')
                    .insert({
                        name: category.categoryName,
                        is_active: true
                    })
                    .select()
                    .single();

                if (catError) {
                    console.error(`Error creating category ${category.categoryName}:`, catError);
                    continue;
                }
                categoryId = newCat.id;
                console.log(`Category created: ${category.categoryName} (${categoryId})`);
            }

            // 2. Insert Items
            for (const item of category.items) {
                // Clean Price: "R$ 50,00" -> 50.00
                const priceClean = item.price.replace('R$', '').trim().replace('.', '').replace(',', '.');
                const priceValue = parseFloat(priceClean) || 0;

                // Clean Image: remove "blob" suffix if present (it breaks some viewers)
                // Actually Anota AI uses "blob" at end of S3 key probably?
                // Let's keep it as is, looks like it worked in browser.
                let imageUrl = item.imageUrl;

                // Check if product exists in this category
                const { data: existingProd } = await supabase
                    .from('products')
                    .select('id')
                    .eq('category_id', categoryId)
                    .ilike('name', item.name)
                    .single();

                if (existingProd) {
                    console.log(`Skipping existing product: ${item.name}`);
                    continue;
                }

                const { error: prodError } = await supabase
                    .from('products')
                    .insert({
                        category_id: categoryId,
                        name: item.name,
                        description: item.description,
                        price: priceValue,
                        image_url: imageUrl,
                        is_available: true,
                        availability_mode: 'always'
                    });

                if (prodError) {
                    console.error(`Error creating product ${item.name}:`, prodError);
                } else {
                    console.log(`Product created: ${item.name}`);
                }
            }

        } catch (err) {
            console.error('Error processing category:', category.categoryName, err);
        }
    }

    alert('Importação do Cardápio Concluída! Verifique o console para detalhes.');
};
