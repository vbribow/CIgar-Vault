alter table public.beta_feedback
  add column if not exists mode text not null default 'Issue report',
  add column if not exists device text,
  add column if not exists task_outcome text,
  add column if not exists experience_score smallint,
  add column if not exists trust_score smallint,
  add column if not exists learning_depth_score smallint,
  add column if not exists recommendation_score smallint,
  add column if not exists expected_result text,
  add column if not exists observed_result text,
  add column if not exists language_context text,
  add column if not exists regional_perspective text,
  add column if not exists heard_pronunciation text,
  add column if not exists spelling_from_audio text,
  add column if not exists name_associations text,
  add column if not exists cultural_fit text;

alter table public.beta_feedback
  drop constraint if exists beta_feedback_mode_check,
  add constraint beta_feedback_mode_check
    check (mode in ('Issue report','Session review','Name and culture')),
  drop constraint if exists beta_feedback_device_check,
  add constraint beta_feedback_device_check
    check (device is null or device in ('Desktop','Mobile','Tablet','Other')),
  drop constraint if exists beta_feedback_task_outcome_check,
  add constraint beta_feedback_task_outcome_check
    check (task_outcome is null or task_outcome in ('Completed independently','Completed with help','Could not complete','Not applicable')),
  drop constraint if exists beta_feedback_experience_score_check,
  add constraint beta_feedback_experience_score_check
    check (experience_score is null or experience_score between 1 and 5),
  drop constraint if exists beta_feedback_trust_score_check,
  add constraint beta_feedback_trust_score_check
    check (trust_score is null or trust_score between 1 and 5),
  drop constraint if exists beta_feedback_learning_depth_score_check,
  add constraint beta_feedback_learning_depth_score_check
    check (learning_depth_score is null or learning_depth_score between 1 and 5),
  drop constraint if exists beta_feedback_recommendation_score_check,
  add constraint beta_feedback_recommendation_score_check
    check (recommendation_score is null or recommendation_score between 0 and 10),
  drop constraint if exists beta_feedback_cultural_fit_check,
  add constraint beta_feedback_cultural_fit_check
    check (cultural_fit is null or cultural_fit in ('Credible','Mostly credible','Uncertain','Forced','Concerning'));

create index if not exists beta_feedback_mode_created_idx
  on public.beta_feedback(mode, created_at desc);
