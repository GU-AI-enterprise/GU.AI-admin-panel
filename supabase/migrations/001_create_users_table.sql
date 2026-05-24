-- Tạo bảng public.users để lưu thông tin user
create table if not exists public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tạo trigger tự động sync user từ auth.users sang public.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger cũ nếu có (để tránh lỗi)
drop trigger if exists on_auth_user_created on auth.users;

-- Tạo trigger mới
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Cập nhật trigger khi user metadata thay đổi
create or replace function public.handle_user_update()
returns trigger as $$
begin
  update public.users
  set 
    email = new.email,
    full_name = new.raw_user_meta_data->>'full_name',
    avatar_url = new.raw_user_meta_data->>'avatar_url',
    role = coalesce(new.raw_user_meta_data->>'role', 'user'),
    updated_at = timezone('utc'::text, now())
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_updated on auth.users;

create trigger on_auth_user_updated
  after update on auth.users
  for each row execute procedure public.handle_user_update();

-- Enable RLS
alter table public.users enable row level security;

-- Policy cho phép user xem chính mình
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

-- Policy cho phép service role full access (cho admin panel)
create policy "Service role can manage users"
  on public.users for all
  using (auth.role() = 'service_role');
