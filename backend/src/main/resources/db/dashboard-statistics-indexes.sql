-- Database indexes for optimal dashboard statistics performance


-- Index for orders by company and status (client role queries)
CREATE INDEX IF NOT EXISTS idx_orders_company_status 
ON "order".orders (company_id, status);

-- Index for orders by provider and status (provider role queries)  
CREATE INDEX IF NOT EXISTS idx_orders_provider_status 
ON "order".orders (provider_id, status);

-- Index for orders by company and published date (response time calculations)
CREATE INDEX IF NOT EXISTS idx_orders_company_published 
ON "order".orders (company_id, published_at);

-- Index for orders by provider and accepted date (provider activity chart)
CREATE INDEX IF NOT EXISTS idx_orders_provider_accepted_date 
ON "order".orders (provider_id, accepted_at);

-- Index for order matches by order and interested status (application counting)
CREATE INDEX IF NOT EXISTS idx_order_matches_order_interested 
ON "order".order_matches (order_id, interested);

-- Index for order matches by provider, interested status, and creation date (response time calculations)
CREATE INDEX IF NOT EXISTS idx_order_matches_provider_interested 
ON "order".order_matches (provider_id, interested, created_at);

-- Index for order matches by order and creation date (first application tracking)
CREATE INDEX IF NOT EXISTS idx_order_matches_order_created 
ON "order".order_matches (order_id, created_at);

-- Composite index for orders by ID and published date (response time joins)
CREATE INDEX IF NOT EXISTS idx_orders_id_published 
ON "order".orders (id, published_at);

-- TODOS later
-- partitioning of tables by date if significant growth
-- update table statistics with ANALYZE
-- query performance monitoring with EXPLAIN ANALYZE
-- materialized views later for freq. accessed aggregated data