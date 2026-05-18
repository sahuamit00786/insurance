ALTER TABLE appointments
  MODIFY COLUMN client_id INT NULL,
  ADD COLUMN guest_name VARCHAR(255) NULL;
