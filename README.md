# SocialHub

Мини-социальная сеть на **React + Express + SQLite** с:

- регистрацией по username/email/password;
- входом через Google (Google Identity Services + проверка ID token на сервере);
- публикацией постов;
- лайками постов;
- локальным SQLite-хранилищем.

## Запуск

1. Установите зависимости:
   ```bash
   npm install
   ```
2. Создайте `.env` на основе `.env.example`.
3. Укажите `GOOGLE_CLIENT_ID` и `VITE_GOOGLE_CLIENT_ID` (если нужен Google вход).
4. Запустите сервер и фронтенд одной командой:
   ```bash
   npm run dev
   ```
5. Откройте:
   ```
   http://localhost:3000
   ```

## Основные API endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/posts?userId=<id>`
- `POST /api/posts`
- `POST /api/posts/like`
- `GET /api/health`
