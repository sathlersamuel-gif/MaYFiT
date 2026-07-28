# Configuração final do MaYFiT

A estrutura do aplicativo já está preparada. Para ativar login, banco de dados e publicação:

## 1. Supabase
1. Crie um projeto no Supabase.
2. Abra o SQL Editor.
3. Execute o arquivo `supabase/schema.sql` deste repositório.
4. Em Project Settings > API, copie:
   - Project URL
   - anon public key

## 2. Variáveis de ambiente
Configure estas duas variáveis na Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Nunca coloque a chave `service_role` no aplicativo.

## 3. Primeiro administrador
1. Faça um cadastro normal pelo aplicativo.
2. No Supabase, abra a tabela `profiles`.
3. Localize seu usuário.
4. Altere `role` para `admin` e `status` para `active`.

## 4. Publicação
1. Importe o repositório privado `sathlersamuel-gif/MaYFiT` na Vercel.
2. Framework Preset: Vite.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Adicione as variáveis e publique.

Depois disso, o cadastro, login, aprovação de alunos e acesso ao painel funcionarão online.
