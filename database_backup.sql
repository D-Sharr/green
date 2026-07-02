PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    node TEXT NOT NULL
);
INSERT INTO "configs" ("id","name","node") VALUES(6,'Sg-AWS','vless://4858f7e6-b422-41c3-85d7-24c4f13a1287@cdn.htethtut.site:443?type=ws&encryption=none&path=%2Feasymode&host=cdn.htethtut.site&security=tls&fp=chrome&alpn=&sni=cdn.htethtut.site#🇸🇬Singapore-VIP-1?serverDescription=Outline');
INSERT INTO "configs" ("id","name","node") VALUES(7,'SG-him','vless://144eb9fd-8db0-4d52-92f8-e11564b8e92a@cleansg.htethtut.site:443?path=%2F%3Fed%3D2048&security=tls&alpn=h3%2Ch2%2Chttp%2F1.1&encryption=none&insecure=0&fp=chrome&type=ws&allowInsecure=0&sni=him.arakan.info#🇸🇬Singapore-VIP-2?serverDescription=VLESS');
INSERT INTO "configs" ("id","name","node") VALUES(8,'SG-sweet','vless://2fe9bd7b-d19b-473c-9fd1-2761f58acb7b@cleansg.htethtut.site:443?path=%2F%3Fed%3D2048&security=tls&alpn=h3%2Ch2%2Chttp%2F1.1&encryption=none&insecure=0&fp=chrome&type=ws&allowInsecure=0&sni=sweet.devh2.tech#🇸🇬Singapore-Backup?serverDescription=VLESS,Websocket');
INSERT INTO "configs" ("id","name","node") VALUES(9,'JP-aws','vless://76ddfedc-a978-4e5e-8e8a-512a23b7969b@jp.htethtut.site:8443?type=ws&encryption=none&path=%2Fh2mode&host=jp.htethtut.site&security=tls&fp=chrome&alpn=h2%2Chttp%2F1.1&sni=jp.htethtut.site#🇯🇵Japan-VIP-1?serverDescription=Outline');
INSERT INTO "configs" ("id","name","node") VALUES(10,'JP-h2v2','vless://af59e3cb-63e2-4981-93fc-03373010f017@cleanjp.htethtut.site:443?path=%2F%3Fed%3D2048&security=tls&alpn=h3%2Ch2%2Chttp%2F1.1&encryption=none&insecure=0&fp=chrome&type=ws&allowInsecure=0&sni=h2v2.htethtut.site#🇯🇵Japan-VIP-2?serverDescription=VLESS');
INSERT INTO "configs" ("id","name","node") VALUES(11,'TH-real','vless://e91320a4-5741-4026-8976-7e3408665883@th.arakan.info:443?type=tcp&encryption=none&security=reality&pbk=LeWZvEjkwnw90CQuupwS-R9--lc1mvoiHUVt2GIGAWs&fp=chrome&sni=github.com&sid=a302135c6e&spx=%2F#🇹🇭Thailand-VIP-1?serverDescription=Outline');
INSERT INTO "configs" ("id","name","node") VALUES(12,'TH-warp','vless://43d791bc-c200-4ec0-8630-087876bfda2f@th.arakan.info:8443?type=tcp&encryption=none&security=reality&pbk=OEnnlctAjObALGCtY04cvGUB_5SWCjkmAXATVn9EOQg&fp=chrome&sni=m.youtube.com&sid=2e411ea9&spx=%2F#🇹🇭Thailand-VIP-2?serverDescription=WIREGUARD');
INSERT INTO "configs" ("id","name","node") VALUES(13,'US-one','vless://b37f5835-45fe-410c-89e6-b4c8bf1747b4@cleanus.htethtut.site:443?path=%2F%3Fed%3D2048&security=tls&alpn=h3%2Ch2%2Chttp%2F1.1&encryption=none&insecure=0&fp=chrome&type=ws&allowInsecure=0&sni=theone.devh2.tech#🇺🇸UnitedState?serverDescription=VLESS,TCP');
CREATE TABLE links (
    id TEXT PRIMARY KEY, -- UUID
    remark TEXT,
    custom_parameters TEXT,
    combined_configs TEXT
);
INSERT INTO "links" ("id","remark","custom_parameters","combined_configs") VALUES('222ca748-e2ca-485f-9f12-aef0251f55dc','H2 Tunnel Free Donate',replace('#profile-web-page-url: https://h2tunnel.htethtut.site\n#support-url: https://t.me/H2Tunnel\n#announce-url: https://t.me/HtetHtut\n#subscription-auto-update-enable: 1\n#subscription-expand-now: 1\n#subscription-always-hwid-enable: 1\n#hide-settings: 1\n#ping-type: tcp\n#sniffing-enable: 1','\n',char(10)),replace('vless://4858f7e6-b422-41c3-85d7-24c4f13a1287@cdn.htethtut.site:443?type=ws&encryption=none&path=%2Feasymode&host=cdn.htethtut.site&security=tls&fp=chrome&alpn=&sni=cdn.htethtut.site#🇸🇬Singapore-VIP-1?serverDescription=Outline\nvless://144eb9fd-8db0-4d52-92f8-e11564b8e92a@cleansg.htethtut.site:443?path=%2F%3Fed%3D2048&security=tls&alpn=h3%2Ch2%2Chttp%2F1.1&encryption=none&insecure=0&fp=chrome&type=ws&allowInsecure=0&sni=him.arakan.info#🇸🇬Singapore-VIP-2?serverDescription=VLESS\nvless://2fe9bd7b-d19b-473c-9fd1-2761f58acb7b@cleansg.htethtut.site:443?path=%2F%3Fed%3D2048&security=tls&alpn=h3%2Ch2%2Chttp%2F1.1&encryption=none&insecure=0&fp=chrome&type=ws&allowInsecure=0&sni=sweet.devh2.tech#🇸🇬Singapore-Backup?serverDescription=VLESS,Websocket\nvless://76ddfedc-a978-4e5e-8e8a-512a23b7969b@jp.htethtut.site:8443?type=ws&encryption=none&path=%2Fh2mode&host=jp.htethtut.site&security=tls&fp=chrome&alpn=h2%2Chttp%2F1.1&sni=jp.htethtut.site#🇯🇵Japan-VIP-1?serverDescription=Outline\nvless://af59e3cb-63e2-4981-93fc-03373010f017@cleanjp.htethtut.site:443?path=%2F%3Fed%3D2048&security=tls&alpn=h3%2Ch2%2Chttp%2F1.1&encryption=none&insecure=0&fp=chrome&type=ws&allowInsecure=0&sni=h2v2.htethtut.site#🇯🇵Japan-VIP-2?serverDescription=VLESS\nvless://e91320a4-5741-4026-8976-7e3408665883@th.arakan.info:443?type=tcp&encryption=none&security=reality&pbk=LeWZvEjkwnw90CQuupwS-R9--lc1mvoiHUVt2GIGAWs&fp=chrome&sni=github.com&sid=a302135c6e&spx=%2F#🇹🇭Thailand-VIP-1?serverDescription=Outline\nvless://43d791bc-c200-4ec0-8630-087876bfda2f@th.arakan.info:8443?type=tcp&encryption=none&security=reality&pbk=OEnnlctAjObALGCtY04cvGUB_5SWCjkmAXATVn9EOQg&fp=chrome&sni=m.youtube.com&sid=2e411ea9&spx=%2F#🇹🇭Thailand-VIP-2?serverDescription=WIREGUARD\nvless://b37f5835-45fe-410c-89e6-b4c8bf1747b4@cleanus.htethtut.site:443?path=%2F%3Fed%3D2048&security=tls&alpn=h3%2Ch2%2Chttp%2F1.1&encryption=none&insecure=0&fp=chrome&type=ws&allowInsecure=0&sni=theone.devh2.tech#🇺🇸UnitedState?serverDescription=VLESS,TCP','\n',char(10)));
CREATE TABLE events (
    id TEXT PRIMARY KEY, -- UUID
    name TEXT NOT NULL,
    event_type TEXT CHECK(event_type IN ('limited', 'hwid')) NOT NULL,
    remark TEXT,
    link_id TEXT NOT NULL,
    allowed_user INTEGER DEFAULT 0,
    user_type TEXT CHECK(user_type IN ('free', 'paid', 'promo')) NOT NULL,
    allowed_os TEXT CHECK(allowed_os IN ('all', 'Android', 'iOS', 'Mac', 'Windows')) NOT NULL,
    start_date DATETIME,
    end_date DATETIME,
    event_code TEXT NOT NULL, joined_users INTEGER DEFAULT 0, happ_link TEXT,
    FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
);
INSERT INTO "events" ("id","name","event_type","remark","link_id","allowed_user","user_type","allowed_os","start_date","end_date","event_code","joined_users","happ_link") VALUES('40f957ca-01e2-4f93-acf2-75ec4892b92b','H2 Tunnel 💦 NewYear','limited','Free Donate','222ca748-e2ca-485f-9f12-aef0251f55dc',100,'free','all','2026-04-12T15:48','2026-05-14T00:00','2f5e9e9e8b20',4,'happ://crypt5/hfqaNPBlnGtwELc56o17l8/VjejGVbI9baaG+cas6wM5Jt08/GhjEmumx433h2qSYS8mXNTxKELS5e5QTOGio3IsJdxgmpJrYegiD+CNq8xVm6S/ALp8eAO1muUgAmrXxcsFSuVf9uVJZHc6OKmZHoonYoaiRX5qDzDRLFx5z7ljzCm0YsaAwqUunedxF2Pv00K43gBTsptplgfCVwgDvcJYOFeK79/H0dOVNuKxeAhxoR3pvjwi3kv+tEZttPM0R3JF5SamGMFGe+BeR3gonlSb35FLh6vzo/KgsPnZC+T3vVf3Yki05U1qGo3sw3Q34jESbzE93wfiRYGS3TulFR0P1EX6LvBUpnDnUqveZ3Qq37kdIDuhhAQqKVwAvfPHKl8O9V80eoJCIa3UVimLdIBrpbx+bNK/Hs1z37WT+3QgRexXJhjiuCi4bcEUObXz44vof+uaCFDC+rcLVI6XkrhV8KtBtzyosi612tCSj+4GjDSwaKFoG0MT03N3gKbbzTMkk2MID/o0lvkkSNqAA0f4qJZCxaOhnI7sSwmnJoQpXGGVOBsJ9rWnCl7XNiVGIVAUdv/0Q/Kb+FyUi7cy4Eak4v7OdrzwkyfANI/we5uIaR1O3kNdmnYRmdITmpfOdJfBJY1veBx6O8Zd+K5b7pWTd1BRqTn/DCFFmG+KLsD+8NU4jAW4Hb/sjrIQjDjovBj9RdfSTkmZtHyeT24MkbSDVAAO6cIlwj7g8FpXvg/yvJMPQVPZmGNLJTy76Joa8Pq2zQiRGXmeUUCcO6dMckGqotaX5TNY0rOWLxedz+Fn5MKRGcyDM/n7+yDzV94P6lrAA3BrSI20upAK1tHBSHRhY6iLpsNkJc4HMLKBg1pnc=P4xctr');
CREATE TABLE announcements (
    key TEXT PRIMARY KEY CHECK(key IN ('normal', 'expire', 'renew', 'limit_device', 'limit_os', 'wrong_hwid', 'miss_hwid', 'no_more_free')),
    message TEXT NOT NULL
);
INSERT INTO "announcements" ("key","message") VALUES('normal','H2 Tunnel - Team မှ အခမဲ့ ဖြန့်ဝေသည်။');
INSERT INTO "announcements" ("key","message") VALUES('expire','%time% တွင်သက်တမ်းကုန်ဆုံးပါမည်။ ဆက်လက်အသုံးပြုနိုင်ရန်');
INSERT INTO "announcements" ("key","message") VALUES('renew','သက်တမ်းကုန်ဆုံးသွားပါပြီ။ Renew Now!');
INSERT INTO "announcements" ("key","message") VALUES('limit_device','Device Limit Reached 😔');
INSERT INTO "announcements" ("key","message") VALUES('limit_os','');
INSERT INTO "announcements" ("key","message") VALUES('wrong_hwid','သင်၏ device သည် ယခု key အတွက်အသုံးပြု၍မရနိုင်ပါ။ Admin ထံဆက်သွယ်ဝယ်ယူပါ။');
INSERT INTO "announcements" ("key","message") VALUES('miss_hwid','Happ ကို အသုံးပြုရန်လိုအပ်ပါသည်။ အခက်အခဲရှိပါက Admin ကို ဆက်သွယ်ပါ။');
INSERT INTO "announcements" ("key","message") VALUES('no_more_free','Free ထပ်မံမရရှိနိုင်တော့ပါ။');
CREATE TABLE IF NOT EXISTS "devices" (
    hwid TEXT PRIMARY KEY,
    device_info_os TEXT,
    link_id TEXT,
    event_id TEXT,
    current_event_id TEXT,
    first_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    expire_date DATETIME,
    user_type TEXT CHECK(user_type IN ('free', 'paid', 'promo', 'reg', 'Reg')) NOT NULL,
    FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
    FOREIGN KEY (current_event_id) REFERENCES events(id) ON DELETE SET NULL
);
INSERT INTO "devices" ("hwid","device_info_os","link_id","event_id","current_event_id","first_date","expire_date","user_type") VALUES('46F8D10F9AE9FB36','Android','222ca748-e2ca-485f-9f12-aef0251f55dc','40f957ca-01e2-4f93-acf2-75ec4892b92b','40f957ca-01e2-4f93-acf2-75ec4892b92b','2026-04-12 09:30:30','2026-05-11T23:30:00.000Z','free');
INSERT INTO "devices" ("hwid","device_info_os","link_id","event_id","current_event_id","first_date","expire_date","user_type") VALUES('9cwmfgykaw875yy4','macOS','222ca748-e2ca-485f-9f12-aef0251f55dc','40f957ca-01e2-4f93-acf2-75ec4892b92b','40f957ca-01e2-4f93-acf2-75ec4892b92b','2026-04-12 10:30:19','2026-04-14T10:30:00.000Z','free');
INSERT INTO "devices" ("hwid","device_info_os","link_id","event_id","current_event_id","first_date","expire_date","user_type") VALUES('292f7d4b13412a86','Android','222ca748-e2ca-485f-9f12-aef0251f55dc','40f957ca-01e2-4f93-acf2-75ec4892b92b','40f957ca-01e2-4f93-acf2-75ec4892b92b','2026-04-14 07:21:05','2026-04-16T06:27:00.000Z','free');
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('configs',13);
