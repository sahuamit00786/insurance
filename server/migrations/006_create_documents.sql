CREATE TABLE IF NOT EXISTS documents (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  client_id        INT          NOT NULL,
  filename         VARCHAR(255) NOT NULL,
  original_name    VARCHAR(255) NOT NULL,
  file_type        VARCHAR(50)  NOT NULL,
  file_size        INT          NOT NULL,
  document_type_id INT          NULL,
  uploaded_by      INT          NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id)   REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)   ON DELETE SET NULL
);
