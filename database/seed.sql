-- =====================================================================
-- Demo seed data (SQL alternative to `npm run db:seed`).
-- Run AFTER database/schema.sql:
--   mysql -u root -p store_rating < database/seed.sql
--
-- Passwords (bcrypt-hashed below):
--   admin@example.com / Admin@1234   (ADMIN)
--   owner@example.com / Admin@1234   (OWNER)  - also owner2@, owner3@
--   user@example.com  / User@1234    (USER)   - also amit@, sneha@, vikram@, neha@
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM ratings;
DELETE FROM stores;
DELETE FROM users;
ALTER TABLE ratings AUTO_INCREMENT = 1;
ALTER TABLE stores AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO users (id, name, email, password, address, role) VALUES
  (1, 'System Administrator Main', 'admin@example.com', '$2a$10$d9o/oHvvbdDRIar52So1k.vCjKYl8PZkoleFJYNFF2oGTywf7hq1K', 'Head Office, 1 MG Road, Pune, Maharashtra 411001', 'ADMIN'),
  (2, 'Rajesh Kumar Store Owner', 'owner@example.com', '$2a$10$d9o/oHvvbdDRIar52So1k.vCjKYl8PZkoleFJYNFF2oGTywf7hq1K', '12 FC Road, Shivajinagar, Pune, Maharashtra 411005', 'OWNER'),
  (3, 'Priya Deshmukh Store Owner', 'owner2@example.com', '$2a$10$d9o/oHvvbdDRIar52So1k.vCjKYl8PZkoleFJYNFF2oGTywf7hq1K', '45 Linking Road, Bandra West, Mumbai, Maharashtra 400050', 'OWNER'),
  (4, 'Anil Mehta Bakery Store Owner', 'owner3@example.com', '$2a$10$d9o/oHvvbdDRIar52So1k.vCjKYl8PZkoleFJYNFF2oGTywf7hq1K', '78 Brigade Road, Bengaluru, Karnataka 560001', 'OWNER'),
  (5, 'Rahul Sharma Demo Customer', 'user@example.com', '$2a$10$klJcUDv2D7kU5NqDvBg8WeCs0dyJnFOfV5FR06UWW9LH2AqqxevI.', '221 Baner Road, Pune, Maharashtra 411045', 'USER'),
  (6, 'Amit Patil Regular Customer', 'amit@example.com', '$2a$10$klJcUDv2D7kU5NqDvBg8WeCs0dyJnFOfV5FR06UWW9LH2AqqxevI.', '9 Kothrud Depot Road, Pune, Maharashtra 411038', 'USER'),
  (7, 'Sneha Kulkarni Frequent Shopper', 'sneha@example.com', '$2a$10$klJcUDv2D7kU5NqDvBg8WeCs0dyJnFOfV5FR06UWW9LH2AqqxevI.', '17 Andheri East, Mumbai, Maharashtra 400069', 'USER'),
  (8, 'Vikram Singh Rathore Customer', 'vikram@example.com', '$2a$10$klJcUDv2D7kU5NqDvBg8WeCs0dyJnFOfV5FR06UWW9LH2AqqxevI.', '5 Civil Lines, Jaipur, Rajasthan 302006', 'USER'),
  (9, 'Neha Gupta Weekend Shopper Account', 'neha@example.com', '$2a$10$klJcUDv2D7kU5NqDvBg8WeCs0dyJnFOfV5FR06UWW9LH2AqqxevI.', '33 Indiranagar 100ft Road, Bengaluru, Karnataka 560038', 'USER');

INSERT INTO stores (id, name, email, address, owner_id) VALUES
  (1, 'Sunrise Fresh Mart', 'contact@sunrisemart.example.com', '14 FC Road, Shivajinagar, Pune, Maharashtra 411005', 2),
  (2, 'Sunrise Electronics Hub', 'hello@sunriseelectronics.example.com', '88 JM Road, Deccan Gymkhana, Pune, Maharashtra 411004', 2),
  (3, 'Green Leaf Organics', 'care@greenleaf.example.com', '47 Linking Road, Bandra West, Mumbai, Maharashtra 400050', 3),
  (4, 'Golden Crust Bakery', 'orders@goldencrust.example.com', '80 Brigade Road, Bengaluru, Karnataka 560001', 4),
  (5, 'City Book Corner', 'info@citybookcorner.example.com', '2 Connaught Place, New Delhi, Delhi 110001', 4);

INSERT INTO ratings (user_id, store_id, rating) VALUES
  (5, 1, 5),
  (6, 1, 4),
  (7, 1, 4),
  (8, 1, 3),
  (5, 2, 4),
  (9, 2, 5),
  (7, 3, 5),
  (6, 3, 3),
  (9, 3, 4),
  (5, 4, 3),
  (8, 4, 2);
