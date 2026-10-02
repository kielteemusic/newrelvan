INSERT INTO public.products (name, slug, brand, description, short_description, price, compare_at_price, category_id, sku, stock_quantity, size, skin_type, skin_concerns, benefits, ingredients, how_to_use, featured, best_seller, new_arrival)
VALUES
 ('Heartleaf Calm Serum','heartleaf-calm-serum','ANUA','A soothing serum that visibly calms redness while supporting a resilient, balanced barrier. Layers beautifully within a simple routine.','A soothing serum for visibly calmer, balanced skin.',28500,32000,(SELECT id FROM public.categories WHERE slug='serums'),'RL-SER-001',24,'30 ml',ARRAY['Sensitive','Combination'],ARRAY['Redness','Acne & Breakouts'],ARRAY['Calms visible redness','Supports the skin barrier','Lightweight hydration'],ARRAY['Heartleaf extract','Panthenol','Hyaluronic acid'],'Apply 2-3 drops to clean skin morning and evening, then follow with moisturiser.',true,true,false),
 ('Birch Juice Moisturizing Cream','birch-juice-moisturizing-cream','ROUND LAB','Silky barrier care with long-lasting, weightless hydration for comfortable skin all day.','Silky barrier care with weightless hydration.',34000,NULL,(SELECT id FROM public.categories WHERE slug='moisturisers'),'RL-MOI-001',18,'80 ml',ARRAY['Dry','Normal','Sensitive'],ARRAY['Dryness','Dull Skin'],ARRAY['Deep hydration','Strengthens barrier','Soft dewy finish'],ARRAY['Birch sap','Jojoba esters','Panthenol'],'Smooth over face and neck as the final step of your routine.',true,true,false),
 ('Low pH Gentle Cleanser','low-ph-gentle-cleanser','COSRX','A soft daily cleanse that respects the skin''s natural balance and leaves no tightness behind.','A gentle daily cleanse that never strips.',18900,NULL,(SELECT id FROM public.categories WHERE slug='cleansers'),'RL-CLE-001',40,'150 ml',ARRAY['All skin types'],ARRAY['Oil Control','Sensitive Skin'],ARRAY['Cleans without stripping','Balances excess oil','Fresh finish'],ARRAY['Betaine salicylate','Tea tree leaf','Allantoin'],'Massage onto damp skin, then rinse thoroughly with lukewarm water.',true,true,false),
 ('Rice Relief Sun Cream SPF50+','rice-relief-sun-cream','BEAUTY OF JOSEON','Invisible daily UV protection with a soft, comfortable finish and no white cast.','Invisible daily UV protection, beautifully light.',22500,25000,(SELECT id FROM public.categories WHERE slug='sunscreen'),'RL-SUN-001',4,'50 ml',ARRAY['All skin types'],ARRAY['Dark Spots','Fine Lines'],ARRAY['Broad spectrum protection','No white cast','Hydrating finish'],ARRAY['Rice extract','Probiotics','Niacinamide'],'Apply generously as the last step every morning and reapply through the day.',true,true,true),
 ('Propolis Glow Toner','propolis-glow-toner','SOME BY MI','A replenishing toner that restores luminosity and prepares skin for the steps that follow.','A replenishing toner for luminous skin.',24000,NULL,(SELECT id FROM public.categories WHERE slug='toners'),'RL-TON-001',22,'150 ml',ARRAY['Dry','Combination'],ARRAY['Dull Skin','Uneven Texture'],ARRAY['Restores glow','Softens texture','Prepares skin'],ARRAY['Propolis','Honey extract','Beta-glucan'],'Sweep over clean skin with hands or a cotton pad after cleansing.',false,false,true),
 ('Centella Recovery Ampoule','centella-recovery-ampoule','SKIN1004','Minimalist centella care for stressed, sensitive complexions that need quiet recovery.','Minimalist centella care for stressed skin.',26500,NULL,(SELECT id FROM public.categories WHERE slug='treatments'),'RL-TRE-001',15,'55 ml',ARRAY['Sensitive','Oily'],ARRAY['Acne & Breakouts','Sensitive Skin'],ARRAY['Soothes stressed skin','Supports recovery','Non-sticky finish'],ARRAY['Madagascar centella asiatica'],'Pat a thin layer onto clean skin before moisturiser.',false,true,false),
 ('Overnight Rice Mask','overnight-rice-mask','I''M FROM','A nourishing overnight veil for smoother, brighter-looking skin by morning.','A nourishing overnight veil for brighter skin.',29500,NULL,(SELECT id FROM public.categories WHERE slug='masks'),'RL-MAS-001',12,'60 g',ARRAY['Normal','Dry'],ARRAY['Dull Skin','Dark Spots'],ARRAY['Brightens appearance','Overnight nourishment','Refines texture'],ARRAY['Rice extract','Niacinamide','Shea butter'],'Apply a generous layer as the final evening step and rinse in the morning.',false,false,true),
 ('Barrier Ritual Set','barrier-ritual-set','RELVAN EDIT','Three thoughtful essentials for a resilient, hydrated barrier — cleanse, treat and protect.','Three essentials for a resilient barrier.',72000,81000,(SELECT id FROM public.categories WHERE slug='sets-bundles'),'RL-SET-001',0,'3 pieces',ARRAY['All skin types'],ARRAY['Dryness','Sensitive Skin'],ARRAY['Complete routine','Barrier support','Better value'],ARRAY['Ceramides','Panthenol','Centella'],'Use each step in order, morning and evening.',true,false,false);

INSERT INTO public.product_images (product_id, url, alt, sort_order)
SELECT p.id,
  CASE
    WHEN p.slug IN ('birch-juice-moisturizing-cream','overnight-rice-mask','barrier-ritual-set') THEN '/products/cream.jpg'
    WHEN p.slug IN ('low-ph-gentle-cleanser','rice-relief-sun-cream') THEN '/products/cleanser.jpg'
    ELSE '/products/serum.jpg'
  END,
  p.name, 0
FROM public.products p;

INSERT INTO public.product_images (product_id, url, alt, sort_order)
SELECT p.id, '/products/serum.jpg', p.name || ' detail', 1 FROM public.products p;

UPDATE public.categories SET image_url = '/products/cleanser.jpg' WHERE slug IN ('cleansers','sunscreen');
UPDATE public.categories SET image_url = '/products/serum.jpg' WHERE slug IN ('toners','serums','treatments');
UPDATE public.categories SET image_url = '/products/cream.jpg' WHERE slug IN ('moisturisers','masks','sets-bundles');

INSERT INTO public.reviews (product_id, customer_name, rating, review, verified, approved)
SELECT p.id, v.name, v.rating, v.body, true, true
FROM public.products p
JOIN (VALUES
  ('Amaka O.', 5, 'My skin has never looked calmer. Three weeks in and the redness around my nose has settled completely.'),
  ('Tolu A.', 5, 'Beautifully packaged and genuinely effective. The texture is light and never pills under sunscreen.'),
  ('Ngozi E.', 4, 'Lovely product and quick delivery. I would happily reorder once I finish this bottle.')
) AS v(name, rating, body) ON true;

INSERT INTO public.discount_codes (code, discount_type, value, min_order, active, usage_limit)
VALUES ('LUMINA10','percentage',10,20000,true,100), ('WELCOME5000','fixed',5000,50000,true,50);
