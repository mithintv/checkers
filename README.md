# Checkers

This a web-based implementation of Checkers created on React + Typescript linked to a NodeJS/Typescript Fastify webserver.

## Features
- Register/Login users
- Single Player Mode
- Live Multiplayer mode
- Leaderboard for highscores
- Save/Load games

## Structure

### Frontend
Frontend is located in the `client` directory. The frontend follows a pages structure where individual Pages are stored in the `pages` directory and smaller components are stored in the `components` directory. Pages are routed through React Router which stores the main navigation tree in `main.tsx`. The UI has been primarily created using shadcn components which are stored in `components/ui` along with TailwindCSS for additional styling. The frontend uses React Context for the following:
- Auth (logging users in and out)
- WebSocket Connection (for multiplayer)
- Theme (dark mode/light mode)

### Backend
Backend is located in the `server`. The backend follows a route based structure where logic can be followed from `index.ts` to `routes` and then to associated functions in `services` or `lib`. The backend uses MongoDB as the main data store to fetch games, users and their computed data.

### Shared (Types/Interfaces)
Shared Typescript interfaces are located in `shared`. This allows for a shared type defiinition across the frontend and backend.

## Local Development
The backend server can be spun up in one command through Docker from the root directory. Note that you must have environment variables provided in the `.env.Example` file in the `server` directory
```sh
docker compose up --build
```

The frontend can be spun up using the following commands. Note that you must have environment variables provided in the `.env.Example` file in the `client` directory
```sh
cd client
npm i
npm run dev
```
