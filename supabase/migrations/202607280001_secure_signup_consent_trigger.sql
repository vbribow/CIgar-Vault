-- This function is invoked only by the auth.users trigger. It must not be
-- callable through the exposed API by anonymous or signed-in clients.
revoke all on function public.record_cedriva_signup_consent() from public;
revoke execute on function public.record_cedriva_signup_consent() from anon;
revoke execute on function public.record_cedriva_signup_consent() from authenticated;
