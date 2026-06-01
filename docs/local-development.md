# Local Development

## Start MySQL

```sh
docker compose up -d mysql
```

Adminer is available on `http://localhost:8080` if started with the default compose file.

## Install Dependencies

```sh
pnpm install
```

## Database

```sh
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

Seeded demo login:

```txt
Email: demo@smoketracker.local
Password: Password123!
```

## Run Apps

```sh
pnpm dev
```

- API: `http://localhost:4000`
- Web: `http://localhost:5173`

## Useful Commands

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```
