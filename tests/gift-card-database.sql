begin;
insert into public.users(id,email,name,role) values
('gift_test_a','gift-a@example.invalid','Gift test A','user'),
('gift_test_b','gift-b@example.invalid','Gift test B','user'),
('gift_test_admin','gift-admin@example.invalid','Gift test admin','admin');
insert into public.transactions(id,user_id,type,amount,currency,status) values('gift_test_crypto','gift_test_a','deposit',5,'USDT','pending');
select set_config('request.jwt.claims','{"sub":"gift_test_a","role":"authenticated"}',true);
set local role authenticated;
insert into storage.objects(bucket_id,name) values ('gift-card-proofs','gift_test_a/test.png');
insert into public.transactions(id,user_id,type,amount,currency,status,payment_method,gift_card_details,gift_card_image_paths)
values ('gift_test_approve','gift_test_a','deposit',90,'USD','pending','gift_card','{"brand":"Amazon","faceValue":100,"currency":"USD"}',array['gift_test_a/test.png']),
('gift_test_reject','gift_test_a','deposit',20,'USD','pending','gift_card','{"brand":"Steam","faceValue":25,"currency":"USD"}',array['gift_test_a/test.png']);
do $$ begin
 assert (select balance=0 from public.users where id='gift_test_a'), 'Pending deposit changed balance';
 begin
  perform public.approve_deposit_transaction('gift_test_approve','forbidden');
  raise exception 'SECURITY TEST FAILED: ordinary user approved deposit';
 exception when others then
  if sqlerrm like 'SECURITY TEST FAILED%' then raise; end if;
 end;
 begin
  insert into public.transactions(id,user_id,type,amount,currency,status,payment_method,gift_card_details,gift_card_image_paths)
  values('gift_missing','gift_test_a','deposit',10,'USD','pending','gift_card','{"brand":"Amazon","faceValue":100,"currency":"USD"}',array['gift_test_a/missing.png']);
  raise exception 'SECURITY TEST FAILED: nonexistent evidence accepted';
 exception when others then
  if sqlerrm not like '%existing upload%' then raise; end if;
 end;
 begin
  insert into public.transactions(id,user_id,type,amount,currency,status,payment_method,gift_card_details,gift_card_image_paths)
  values('gift_negative','gift_test_a','deposit',-10,'USD','pending','gift_card','{"brand":"Amazon","faceValue":100,"currency":"USD"}',array['gift_test_a/test.png']);
  raise exception 'SECURITY TEST FAILED: negative amount accepted';
 exception when others then
  if sqlerrm not like '%positive USD%' then raise; end if;
 end;
 begin
  insert into storage.objects(bucket_id,name) values('gift-card-proofs','gift_test_b/forged.png');
  raise exception 'SECURITY TEST FAILED: foreign upload accepted';
 exception when insufficient_privilege then null;
 end;
 update storage.objects set name='gift_test_a/replaced.png' where bucket_id='gift-card-proofs' and name='gift_test_a/test.png';
 assert not found, 'Evidence was overwritten';
 delete from storage.objects where bucket_id='gift-card-proofs' and name='gift_test_a/test.png';
 assert not found, 'Evidence was deleted';
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"gift_test_b","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 assert not exists(select 1 from public.transactions where id='gift_test_approve'), 'Other user read deposit';
 assert not exists(select 1 from storage.objects where bucket_id='gift-card-proofs' and name='gift_test_a/test.png'), 'Other user read evidence';
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"gift_test_admin","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 assert exists(select 1 from storage.objects where bucket_id='gift-card-proofs' and name='gift_test_a/test.png'), 'Admin cannot read evidence';
end $$;
select public.approve_deposit_transaction('gift_test_approve','Test approval');
select public.approve_deposit_transaction('gift_test_approve','Duplicate approval');
select public.reject_deposit_transaction('gift_test_reject','Card could not be verified');
reset role;
do $$ begin
 assert (select balance=90 from public.users where id='gift_test_a'), 'Approval must credit once and rejection must not credit';
 assert (select status='completed' from public.transactions where id='gift_test_approve'), 'Approval not saved';
 assert (select status='rejected' from public.transactions where id='gift_test_reject'), 'Rejection not saved';
 assert (select payment_method='crypto' and status='pending' from public.transactions where id='gift_test_crypto'), 'Crypto record changed';
 assert (select not public from storage.buckets where id='gift-card-proofs'), 'Bucket is public';
end $$;
rollback;
select 'PASS: pending balance, admin-only credit, duplicate approval, rejection, private evidence, missing/foreign uploads, invalid amount, immutable uploads and crypto preservation. Test rows rolled back.';
