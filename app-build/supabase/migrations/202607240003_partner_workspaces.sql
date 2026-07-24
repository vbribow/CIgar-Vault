alter table public.partners add column if not exists collaboration_locked boolean not null default false;
alter table public.partners add column if not exists collaboration_lock_reason text;

update public.partners
set collaboration_locked=true,
    collaboration_lock_reason='Founder directive: no Fox invitations, workspace access, collaboration activity, trials, or tests without specific approval.',
    updated_at=now()
where slug='fox-cigars';

alter table public.partner_memberships add column if not exists display_name text;
alter table public.partner_memberships add column if not exists invited_by text;
alter table public.partner_memberships add column if not exists invitation_token_hash text;
alter table public.partner_memberships add column if not exists invitation_expires_at timestamptz;
alter table public.partner_memberships add column if not exists last_accessed_at timestamptz;

create unique index if not exists partner_memberships_invitation_token_idx
on public.partner_memberships(invitation_token_hash)
where invitation_token_hash is not null and status='invited';

create index if not exists partner_memberships_user_status_idx
on public.partner_memberships(user_id,status);

-- Membership records remain service-side only. The workspace API enforces role,
-- organization, invitation-email, expiration, and collaboration-lock checks.
