INSERT INTO configs (name, node, position) VALUES
  ('Singapore SG1', 'vless://abc123@sg1.example.com:443?security=tls&sni=sg1.example.com&type=ws&path=%2Fws#SG1', 0),
  ('Japan JP1', 'vless://def456@jp1.example.com:443?security=tls&sni=jp1.example.com&type=ws&path=%2Fws#JP1', 1),
  ('US West LA1', 'vless://ghi789@la1.example.com:443?security=tls&sni=la1.example.com&type=ws&path=%2Fws#LA1', 2);

INSERT INTO links (id, remark, custom_parameters, combined_configs)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Main subscription link',
  'profile-title: My VPN
profile-web-page-url: https://example.com
support-url: https://t.me/support',
  'vless://abc123@sg1.example.com:443?security=tls&sni=sg1.example.com&type=ws&path=%2Fws#SG1
vless://def456@jp1.example.com:443?security=tls&sni=jp1.example.com&type=ws&path=%2Fws#JP1'
);

INSERT INTO events (id, name, event_type, remark, link_id, allowed_user, user_type, allowed_os, start_date, end_date, event_code, is_promo, allow_days)
VALUES (
  'f1e2d3c4-b5a6-7890-abcd-ef1234567890',
  'Free Trial',
  'limited',
  '30-day free trial',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  100,
  'free',
  'all',
  datetime('now'),
  datetime('now', '+90 days'),
  'a1b2c3d4e5f6',
  0,
  30
);

INSERT INTO proxies (name, url, is_active) VALUES
  ('Vercel Mirror', 'https://vpn-proxy.vercel.app', 1),
  ('Netlify Mirror', 'https://vpn-proxy.netlify.app', 0);

INSERT INTO announcements (key, target_event_id, message) VALUES
  ('normal', 'global', 'Your subscription is active'),
  ('expire', 'global', 'Your subscription expires in %time%'),
  ('renew', 'global', 'Please renew your subscription'),
  ('limit_device', 'global', 'Device limit reached'),
  ('limit_os', 'global', 'OS not supported for this event'),
  ('wrong_hwid', 'global', 'Device not authorized'),
  ('miss_hwid', 'global', 'Missing device information'),
  ('no_more_free', 'global', 'Free tier limit reached'),
  ('promo_used', 'global', 'Promo already claimed');
