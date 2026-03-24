INSERT INTO payment_plans (id, name, description, billing_cycle, price, currency, max_students, features, is_active, is_popular, created_at, updated_at) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Test Plan ₹1', 'Plan for testing Razorpay live payment', 'monthly', 1.00, 'INR', 10, '{}'::jsonb, true, false, now(), now()) 
ON CONFLICT (name) DO UPDATE SET price = 1.00;
