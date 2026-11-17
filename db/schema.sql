CREATE TABLE IF NOT EXISTS munchy_orders (
  order_code VARCHAR(16) PRIMARY KEY,
  customer_name VARCHAR(80) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  delivery_address VARCHAR(240) NOT NULL,
  location_url VARCHAR(300) NULL,
  items_json JSON NOT NULL,
  fulfillment_method ENUM('delivery', 'pickup') NOT NULL DEFAULT 'delivery',
  payment_method ENUM('cash_on_delivery') NOT NULL DEFAULT 'cash_on_delivery',
  change_for ENUM('exact', '100', '200') NOT NULL DEFAULT 'exact',
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status ENUM('received', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled') NOT NULL DEFAULT 'received',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_munchy_orders_created (created_at),
  INDEX idx_munchy_orders_phone (customer_phone)
);

CREATE TABLE IF NOT EXISTS munchy_catering_leads (
  lead_id VARCHAR(40) PRIMARY KEY,
  customer_name VARCHAR(80) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(160) NOT NULL DEFAULT '',
  event_type VARCHAR(80) NOT NULL,
  event_date DATE NULL,
  guest_count SMALLINT UNSIGNED NOT NULL,
  note VARCHAR(1000) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_catering_created (created_at)
);
