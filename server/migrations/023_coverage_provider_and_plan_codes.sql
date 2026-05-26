-- Add coverage_provider lookup category
INSERT INTO lookup_categories (name, slug)
VALUES ('Coverage Provider', 'coverage_provider');

-- Seed 11 plan code values
INSERT INTO lookup_values (category_id, value, sort_order, is_active)
SELECT id, 'GI – Home Insurance', 1, 1 FROM lookup_categories WHERE slug = 'plan_code';

INSERT INTO lookup_values (category_id, value, sort_order, is_active)
SELECT id, 'GI – Home Content', 2, 1 FROM lookup_categories WHERE slug = 'plan_code';

INSERT INTO lookup_values (category_id, value, sort_order, is_active)
SELECT id, 'GI – Fire Insurance', 3, 1 FROM lookup_categories WHERE slug = 'plan_code';

INSERT INTO lookup_values (category_id, value, sort_order, is_active)
SELECT id, 'GI – Burglary Insurance', 4, 1 FROM lookup_categories WHERE slug = 'plan_code';

INSERT INTO lookup_values (category_id, value, sort_order, is_active)
SELECT id, 'GI – Motor Insurance', 5, 1 FROM lookup_categories WHERE slug = 'plan_code';

INSERT INTO lookup_values (category_id, value, sort_order, is_active)
SELECT id, 'GI – Travel Insurance', 6, 1 FROM lookup_categories WHERE slug = 'plan_code';

INSERT INTO lookup_values (category_id, value, sort_order, is_active)
SELECT id, 'GI – Personal Accident Insurance', 7, 1 FROM lookup_categories WHERE slug = 'plan_code';

INSERT INTO lookup_values (category_id, value, sort_order, is_active)
SELECT id, 'GI – Critical Insurance', 8, 1 FROM lookup_categories WHERE slug = 'plan_code';

INSERT INTO lookup_values (category_id, value, sort_order, is_active)
SELECT id, 'IHM – Medihealth (Pacific Medical Card)', 9, 1 FROM lookup_categories WHERE slug = 'plan_code';

INSERT INTO lookup_values (category_id, value, sort_order, is_active)
SELECT id, 'IHM – Berjaya Sompo (Medical Card)', 10, 1 FROM lookup_categories WHERE slug = 'plan_code';

INSERT INTO lookup_values (category_id, value, sort_order, is_active)
SELECT id, 'IHM – Mutiara Plus (Etiqa Critical Illness)', 11, 1 FROM lookup_categories WHERE slug = 'plan_code';
