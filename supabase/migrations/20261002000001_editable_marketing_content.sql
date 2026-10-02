-- Editable marketing / content fields for the storefront
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS announcement text NOT NULL DEFAULT 'Refined Skincare • Carefully Curated Korean Essentials',
  ADD COLUMN IF NOT EXISTS homepage_eyebrow text NOT NULL DEFAULT 'The Korean skincare edit',
  ADD COLUMN IF NOT EXISTS homepage_headline text NOT NULL DEFAULT 'Refined Skincare. Real Results.',
  ADD COLUMN IF NOT EXISTS homepage_subcopy text NOT NULL DEFAULT 'Discover carefully curated Korean skincare essentials for clear, healthy and glowing skin.',
  ADD COLUMN IF NOT EXISTS about_eyebrow text NOT NULL DEFAULT 'Our story',
  ADD COLUMN IF NOT EXISTS about_title text NOT NULL DEFAULT 'Beauty, considered.',
  ADD COLUMN IF NOT EXISTS about_intro text NOT NULL DEFAULT 'RELVAN LUMINA is a beauty and personal-care brand dedicated to bringing carefully selected Korean skincare essentials to customers seeking simple, effective and refined skincare.',
  ADD COLUMN IF NOT EXISTS about_quote text NOT NULL DEFAULT 'We believe the best routine is the one you understand, enjoy and return to.',
  ADD COLUMN IF NOT EXISTS about_body text NOT NULL DEFAULT 'Our edit brings together thoughtful formulas, beautiful textures and trusted Korean skincare innovations—without the noise of endless choice.

Every selection is considered for how it feels, how it fits into a real routine, and how it can support clear, healthy and glowing skin over time.',
  ADD COLUMN IF NOT EXISTS value_props jsonb NOT NULL DEFAULT '[
    {"title":"Curated Korean Essentials","text":"A focused edit, never endless choice."},
    {"title":"Quality-Focused Selection","text":"Every formula is selected with care."},
    {"title":"Skincare Made Simple","text":"Clear guidance for confident routines."},
    {"title":"Customer-Centred Service","text":"Thoughtful support at every step."}
  ]'::jsonb,
  ADD COLUMN IF NOT EXISTS routine_eyebrow text NOT NULL DEFAULT 'Your daily ritual',
  ADD COLUMN IF NOT EXISTS routine_title text NOT NULL DEFAULT 'Five steps to luminous skin.',
  ADD COLUMN IF NOT EXISTS routine_intro text NOT NULL DEFAULT 'A consistent routine does not need to be complicated. Start with the essentials, then listen to your skin.',
  ADD COLUMN IF NOT EXISTS routine_steps jsonb NOT NULL DEFAULT '[
    {"number":"01","title":"Cleanse","text":"Remove sunscreen, makeup and daily buildup without disrupting your skin."},
    {"number":"02","title":"Tone","text":"Replenish hydration and prepare skin for the steps that follow."},
    {"number":"03","title":"Treat","text":"Choose a serum or ampoule for your most important concern."},
    {"number":"04","title":"Moisturize","text":"Support the barrier and seal in comfort."},
    {"number":"05","title":"Protect","text":"Finish every morning with broad-spectrum sunscreen."}
  ]'::jsonb;
