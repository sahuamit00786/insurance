-- Trim to first 5 clients only.
-- All related rows (insurances, documents, payments, notes, appointments)
-- are removed automatically via ON DELETE CASCADE.

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM clients
WHERE id NOT IN (
  SELECT id FROM (
    SELECT id FROM clients ORDER BY id ASC LIMIT 5
  ) AS keep
);

SET FOREIGN_KEY_CHECKS = 1;

-- Verify
SELECT 'clients'      AS tbl, COUNT(*) AS remaining FROM clients
UNION ALL
SELECT 'insurances',   COUNT(*) FROM insurances
UNION ALL
SELECT 'documents',    COUNT(*) FROM documents
UNION ALL
SELECT 'payments',     COUNT(*) FROM payments
UNION ALL
SELECT 'notes',        COUNT(*) FROM notes
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments;
