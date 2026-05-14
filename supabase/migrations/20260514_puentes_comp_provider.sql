-- Allow 'comp' (complimentary / superadmin gift) as a Argo Puentes provider.
-- Used by the "Invitar free a Puentes" admin button and by future free trial
-- phases where the team manually grants Argo Puentes access without payment.

alter table public.puentes_purchases drop constraint if exists puentes_purchases_provider_check;
alter table public.puentes_purchases add constraint puentes_purchases_provider_check
    check (provider in ('stripe', 'mercadopago', 'comp'));
