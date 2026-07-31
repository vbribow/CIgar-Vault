# Smartsheet smoking journal migration

The private-vault/Supabase record payload needs no database migration: optional
`construction` and `burn` values remain inside the existing smoke record JSON.

For legacy Smartsheet mode, add one **Text/Number** column named exactly:

- `Burn`

The existing `Construction` column stores the new **Construction Quality**
choice. Existing blank and historical values remain readable and are not
rewritten. A smoke can still be saved without either optional rating. When a
collector chooses a Burn value, Hojavía (pronounced oh-ha-VEE-ah) fails clearly if the `Burn` column has
not yet been added instead of silently dropping the rating.
