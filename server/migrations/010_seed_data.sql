-- Default admin (password: Admin@123 hashed with bcrypt cost 10)
INSERT IGNORE INTO users (name, email, password, role, status) VALUES
('Super Admin', 'admin@insurance.com', '$2b$10$KaahEq3J0D70NVnM7.xnVe/qC9/8upfyc5QwS4M0hrvrVltga2EyC', 'admin', 'active');

-- Lookup categories
INSERT IGNORE INTO lookup_categories (name, slug) VALUES
('Plan Code',        'plan_code'),
('Payment Mode',     'payment_mode'),
('Payment Method',   'payment_method'),
('Client Status',    'client_status'),
('Document Type',    'document_type'),
('Appointment Type', 'appointment_type'),
('Gender',           'gender'),
('Relationship',     'relationship');

-- Plan Code values
INSERT IGNORE INTO lookup_values (category_id, value, sort_order) VALUES
((SELECT id FROM lookup_categories WHERE slug='plan_code'), 'Life Basic',      1),
((SELECT id FROM lookup_categories WHERE slug='plan_code'), 'Life Plus',       2),
((SELECT id FROM lookup_categories WHERE slug='plan_code'), 'Health Shield',   3),
((SELECT id FROM lookup_categories WHERE slug='plan_code'), 'Education Plan',  4);

-- Payment Mode values
INSERT IGNORE INTO lookup_values (category_id, value, sort_order) VALUES
((SELECT id FROM lookup_categories WHERE slug='payment_mode'), 'Monthly',      1),
((SELECT id FROM lookup_categories WHERE slug='payment_mode'), 'Quarterly',    2),
((SELECT id FROM lookup_categories WHERE slug='payment_mode'), 'Semi-Annual',  3),
((SELECT id FROM lookup_categories WHERE slug='payment_mode'), 'Annual',       4);

-- Payment Method values
INSERT IGNORE INTO lookup_values (category_id, value, sort_order) VALUES
((SELECT id FROM lookup_categories WHERE slug='payment_method'), 'Cash',           1),
((SELECT id FROM lookup_categories WHERE slug='payment_method'), 'Bank Transfer',  2),
((SELECT id FROM lookup_categories WHERE slug='payment_method'), 'Auto-Debit',     3),
((SELECT id FROM lookup_categories WHERE slug='payment_method'), 'Cheque',         4);

-- Client Status values
INSERT IGNORE INTO lookup_values (category_id, value, sort_order) VALUES
((SELECT id FROM lookup_categories WHERE slug='client_status'), 'Active',   1),
((SELECT id FROM lookup_categories WHERE slug='client_status'), 'Inactive', 2),
((SELECT id FROM lookup_categories WHERE slug='client_status'), 'Lapsed',   3),
((SELECT id FROM lookup_categories WHERE slug='client_status'), 'Pending',  4);

-- Document Type values
INSERT IGNORE INTO lookup_values (category_id, value, sort_order) VALUES
((SELECT id FROM lookup_categories WHERE slug='document_type'), 'IC Copy',           1),
((SELECT id FROM lookup_categories WHERE slug='document_type'), 'Birth Certificate', 2),
((SELECT id FROM lookup_categories WHERE slug='document_type'), 'Medical Report',    3),
((SELECT id FROM lookup_categories WHERE slug='document_type'), 'Policy Document',   4),
((SELECT id FROM lookup_categories WHERE slug='document_type'), 'Other',             5);

-- Appointment Type values
INSERT IGNORE INTO lookup_values (category_id, value, sort_order) VALUES
((SELECT id FROM lookup_categories WHERE slug='appointment_type'), 'First Meeting',    1),
((SELECT id FROM lookup_categories WHERE slug='appointment_type'), 'Follow-Up',        2),
((SELECT id FROM lookup_categories WHERE slug='appointment_type'), 'Renewal',          3),
((SELECT id FROM lookup_categories WHERE slug='appointment_type'), 'Claim Discussion', 4);

-- Gender values
INSERT IGNORE INTO lookup_values (category_id, value, sort_order) VALUES
((SELECT id FROM lookup_categories WHERE slug='gender'), 'Male',   1),
((SELECT id FROM lookup_categories WHERE slug='gender'), 'Female', 2);

-- Relationship values
INSERT IGNORE INTO lookup_values (category_id, value, sort_order) VALUES
((SELECT id FROM lookup_categories WHERE slug='relationship'), 'Self',   1),
((SELECT id FROM lookup_categories WHERE slug='relationship'), 'Spouse', 2),
((SELECT id FROM lookup_categories WHERE slug='relationship'), 'Child',  3),
((SELECT id FROM lookup_categories WHERE slug='relationship'), 'Parent', 4);
