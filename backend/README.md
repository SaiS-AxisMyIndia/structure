# Backend

Express.js backend API service.

## Structure

```
src/
├── config/          # env config, DB, logger, routes, entities, validators, middlewares, utils, constants, jobs
├── core/            # feature modules (auth, user, payment) — controller / service / repo / dto per feature
├── app.js           # express app + global middleware
└── server.js        # entry point
```

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev
```

## Testing

```bash
npm test
```

## Docker

```bash
docker-compose up --build
```
