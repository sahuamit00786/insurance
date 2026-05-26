-- Move insurance-level columns from clients to insurances
-- and collapse duplicate clients (same name) into one record.

-- Step 1: Add new columns to insurances
ALTER TABLE insurances
  ADD COLUMN identification_no  VARCHAR(50)   NULL AFTER client_id,
  ADD COLUMN payment_mode_id    INT           NULL,
  ADD COLUMN payment_method_id  INT           NULL,
  ADD COLUMN premium_due_date   DATE          NULL;

-- Step 2: Copy existing data from clients into their linked insurances
UPDATE insurances i
JOIN clients c ON i.client_id = c.id
SET
  i.identification_no = c.identification_no,
  i.payment_mode_id   = c.payment_mode_id,
  i.payment_method_id = c.payment_method_id,
  i.premium_due_date  = c.premium_due_date;

-- Step 3: Drop insurance-specific columns from clients
ALTER TABLE clients
  DROP COLUMN policy_no,
  DROP COLUMN plan_code_id,
  DROP COLUMN issued_date,
  DROP COLUMN maturity_date,
  DROP COLUMN payment_mode_id,
  DROP COLUMN payment_method_id,
  DROP COLUMN premium_due_date,
  DROP COLUMN status_id,
  DROP COLUMN total_premium;

-- Step 4: Make identification_no optional on clients (real IC data is absent)
ALTER TABLE clients DROP INDEX identification_no;
ALTER TABLE clients MODIFY COLUMN identification_no VARCHAR(50) NULL;
