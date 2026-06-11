-- 038_customers_phone.sql
-- Add contact phone number to customer (billing account) info.

alter table customers add column if not exists phone text;
