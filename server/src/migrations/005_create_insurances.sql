CREATE TABLE IF NOT EXISTS insurances (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  client_id     INT            NOT NULL,
  policy_no     VARCHAR(100)   NOT NULL,
  plan_code_id  INT            NULL,
  issued_date   DATE           NULL,
  maturity_date DATE           NULL,
  premium       DECIMAL(12,2)  NULL,
  status_id     INT            NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);
