-- ============================================================
-- Correção: erro "record 'new' has no field 'register_id'"
-- ao abrir o caixa (INSERT em public.cash_registers).
--
-- Causa: a função de auditoria audit_cash_event() referenciava
-- new.register_id diretamente dentro de um CASE. O PL/pgSQL resolve
-- os campos citados contra a estrutura do registro NEW em tempo de
-- execução; como cash_registers não possui a coluna register_id,
-- o trigger falhava nessa tabela.
--
-- Correção: extrair o register_id a partir do JSON do registro
-- (to_jsonb(new)->>'register_id'), evitando a resolução estática
-- do campo. Idempotente (CREATE OR REPLACE).
-- ============================================================

create or replace function public.audit_cash_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor text;
  v_reg uuid;
  v_row jsonb;
begin
  select coalesce(full_name, email) into v_actor
  from public.admin_profiles where id = auth.uid();

  v_row := to_jsonb(new);

  if tg_table_name = 'cash_registers' then
    v_reg := (v_row->>'id')::uuid;
  else
    v_reg := (v_row->>'register_id')::uuid;
  end if;

  insert into public.cash_audit_log
    (register_id, action, entity, entity_id, actor_id, actor_name, snapshot)
  values
    (v_reg, tg_op, tg_table_name, (v_row->>'id')::uuid, auth.uid(), v_actor, v_row);

  return new;
end;
$$;
