-- =========================================================
-- SUPABASE-SCHEMA.SQL
-- Esquema completo do banco + exemplos de inserção
-- =========================================================

-- Extensões necessárias
create extension if not exists "uuid-ossp";
create extension if not exists "citext";

-- Função utilitária para atualizar automaticamente a coluna updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

-- =========================================================
-- Tabela: usuarios
-- Perfil dos usuários autenticados (admin, membros, visitantes)
-- =========================================================
create table if not exists public.usuarios (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  nome text not null,
  sobrenome text,
  email citext not null unique,
  telefone text,
  tipo text not null default 'visitante'
    check (tipo in ('visitante','membro','lideranca','administracao')),
  status text not null default 'ativo'
    check (status in ('ativo','pendente','suspenso')),
  avatar_url text,
  permissoes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_usuarios_set_updated
before update on public.usuarios
for each row execute function public.set_updated_at();

insert into public.usuarios (nome, sobrenome, email, tipo, status, permissoes)
values (
  'Admin',
  'Sistema',
  'admin@ipbvida.com.br',
  'administracao',
  'ativo',
  '["usuarios:read","usuarios:write","devocionais:write"]'::jsonb
);

-- =========================================================
-- Tabela: devocionais
-- Devocional diário exibido na home
-- =========================================================
create table if not exists public.devocionais (
  id uuid primary key default uuid_generate_v4(),
  titulo text not null,
  texto text not null,
  imagem_url text,
  data_publicacao date not null default current_date,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_devocionais_set_updated
before update on public.devocionais
for each row execute function public.set_updated_at();

insert into public.devocionais (titulo, texto, imagem_url)
values (
  'Deus é o nosso refúgio',
  'Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia. (Sl 46.1)',
  'https://.../devocionais/refugio.jpg'
);

-- =========================================================
-- Tabela: videos
-- Catálogo de vídeos exibido no grid + sincronização do YouTube
-- =========================================================
create table if not exists public.videos (
  id uuid primary key default uuid_generate_v4(),
  video_id text not null unique,
  titulo text not null,
  descricao text,
  thumbnail_url text,
  url text not null,
  data_publicacao timestamptz default timezone('utc', now()),
  duracao text,
  visualizacoes integer not null default 0,
  destaque boolean not null default false,
  ordem integer not null default 0,
  origem text not null default 'youtube',
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_videos_set_updated
before update on public.videos
for each row execute function public.set_updated_at();

insert into public.videos (video_id, titulo, descricao, thumbnail_url, url, destaque)
values (
  'dQw4w9WgXcQ',
  'Culto IPB Vida - Domingo 19h',
  'Culto completo com louvor e mensagem expositiva.',
  'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  true
);

-- =========================================================
-- Tabela: programacao
-- Programação semanal/mensal exibida na home
-- =========================================================
create table if not exists public.programacao (
  id uuid primary key default uuid_generate_v4(),
  titulo text not null,
  descricao text,
  dia smallint not null check (dia between 1 and 31),
  mes text not null,
  ano smallint not null,
  horario text not null,
  local text not null,
  categoria text,
  cor_categoria text,
  cor1 text,
  cor2 text,
  imagem_url text,
  link text,
  ordem integer not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_programacao_set_updated
before update on public.programacao
for each row execute function public.set_updated_at();

insert into public.programacao (titulo, descricao, dia, mes, ano, horario, local, categoria)
values (
  'Culto de Celebração',
  'Culto dominical com louvor e palavra expositiva.',
  15,
  'dez',
  2025,
  '19h00',
  'Templo principal',
  'Culto Dominical'
);

-- =========================================================
-- Tabela: eventos
-- Eventos especiais com data específica
-- =========================================================
create table if not exists public.eventos (
  id uuid primary key default uuid_generate_v4(),
  titulo text not null,
  descricao text,
  data date not null,
  horario text,
  local text,
  imagem_url text,
  link text,
  ativo boolean not null default true,
  destaque boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_eventos_set_updated
before update on public.eventos
for each row execute function public.set_updated_at();

insert into public.eventos (titulo, descricao, data, horario, local, destaque)
values (
  'Cantata de Natal',
  'Apresentação com o coral da Igreja Presbiteriana Vida.',
  '2025-12-20',
  '20h00',
  'Templo principal',
  true
);

-- =========================================================
-- Tabela: visitantes
-- Leads capturados pelo formulário "Quero visitar"
-- =========================================================
create table if not exists public.visitantes (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  email text,
  telefone text,
  mensagem text,
  data_visita date,
  status text not null default 'confirmado'
    check (status in ('confirmado','pendente','cancelado')),
  origem text default 'site',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_visitantes_set_updated
before update on public.visitantes
for each row execute function public.set_updated_at();

insert into public.visitantes (nome, email, telefone, mensagem, data_visita)
values (
  'João Almeida',
  'joao@example.com',
  '(19) 99999-0000',
  'Gostaria de visitar no culto de domingo.',
  current_date + interval '3 day'
);

-- =========================================================
-- Tabela: dados_igreja
-- Dados institucionais usados nas seções "Localização" e "Sobre"
-- =========================================================
create table if not exists public.dados_igreja (
  id uuid primary key default uuid_generate_v4(),
  nome_igreja text not null default 'Igreja Presbiteriana Vida',
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  cep text,
  telefone text,
  whatsapp text,
  email text,
  email_secretaria text,
  google_maps_url text,
  google_maps_embed text,
  waze_url text,
  uber_url text,
  culto_domingo_horario text,
  culto_sexta_horario text,
  secretaria_dias text,
  secretaria_horario text,
  atendimento_pastoral text,
  atendimento_pastoral_telefone text,
  pastor text,
  sobre text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_dados_igreja_set_updated
before update on public.dados_igreja
for each row execute function public.set_updated_at();

insert into public.dados_igreja (
  nome_igreja,
  logradouro,
  numero,
  bairro,
  cidade,
  estado,
  cep,
  telefone,
  google_maps_url,
  culto_domingo_horario,
  culto_sexta_horario,
  pastor
) values (
  'Igreja Presbiteriana Vida',
  'Rua das Flores',
  '123',
  'Centro',
  'Campinas',
  'SP',
  '13000-000',
  '(19) 3333-0000',
  'https://maps.app.goo.gl/US9Bi921RVv1r4pr7',
  'Domingo • 19h00',
  'Sexta • 20h00',
  'Pr. Fulano de Tal'
);

-- =========================================================
-- Tabela: dados_bancarios
-- Informações da área "Contribuições"
-- =========================================================
create table if not exists public.dados_bancarios (
  id uuid primary key default uuid_generate_v4(),
  favorecido text not null,
  cnpj text,
  banco_nome text not null,
  banco_codigo text,
  agencia text,
  conta text,
  pix_tipo text,
  pix_chave text,
  qrcode_url text,
  qrcode_instrucoes text,
  informacoes_mensagem text,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_dados_bancarios_set_updated
before update on public.dados_bancarios
for each row execute function public.set_updated_at();

insert into public.dados_bancarios (favorecido, cnpj, banco_nome, banco_codigo, agencia, conta, pix_tipo, pix_chave, informacoes_mensagem)
values (
  'Igreja Presbiteriana Vida',
  '12.345.678/0001-90',
  'Banco do Brasil',
  '001',
  '1234-5',
  '67890-1',
  'CNPJ',
  '12345678000190',
  'Contribua com alegria e ajude nossos projetos sociais.'
);

-- =========================================================
-- Tabela: redes_sociais
-- Links e ícones exibidos no rodapé e formulário
-- =========================================================
create table if not exists public.redes_sociais (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  url text not null,
  icone text,
  ordem integer not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_redes_sociais_set_updated
before update on public.redes_sociais
for each row execute function public.set_updated_at();

insert into public.redes_sociais (nome, url, icone, ordem)
values
  ('YouTube', 'https://youtube.com/@ipbvida', 'bi bi-youtube', 1),
  ('Instagram', 'https://instagram.com/ipbvida', 'bi bi-instagram', 2);

-- =========================================================
-- Política recomendada: permitir SELECT público e exigir RLS
-- (Exemplo – adaptar às necessidades de segurança)
-- =========================================================
-- alter table public.usuarios enable row level security;
-- create policy "Usuarios podem ver o próprio perfil"
--   on public.usuarios
--   for select
--   using (auth.uid() = auth_user_id);


