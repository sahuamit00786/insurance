ALTER TABLE insurances ADD COLUMN buying_for_id INT NULL;

INSERT IGNORE INTO lookup_categories (name, slug) VALUES ('Relationship', 'relationship');

INSERT IGNORE INTO lookup_values (category_id, value, sort_order, is_active)
SELECT id, 'Self',    1, 1 FROM lookup_categories WHERE slug = 'relationship';
INSERT IGNORE INTO lookup_values (category_id, value, sort_order, is_active)
SELECT id, 'Spouse',  2, 1 FROM lookup_categories WHERE slug = 'relationship';
INSERT IGNORE INTO lookup_values (category_id, value, sort_order, is_active)
SELECT id, 'Child',   3, 1 FROM lookup_categories WHERE slug = 'relationship';
INSERT IGNORE INTO lookup_values (category_id, value, sort_order, is_active)
SELECT id, 'Parent',  4, 1 FROM lookup_categories WHERE slug = 'relationship';
INSERT IGNORE INTO lookup_values (category_id, value, sort_order, is_active)
SELECT id, 'Sibling', 5, 1 FROM lookup_categories WHERE slug = 'relationship';
