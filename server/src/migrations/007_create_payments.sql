CREATE TABLE IF NOT EXISTS payments (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  client_id         INT            NOT NULL,
  payment_date      DATE           NOT NULL,
  amount            DECIMAL(12,2)  NOT NULL,
  receipt_no        VARCHAR(100)   NULL,
  payment_mode_id   INT            NULL,
  payment_method_id INT            NULL,
  remarks           TEXT           NULL,
  created_by        INT            NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id)  REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)   ON DELETE SET NULL
);
