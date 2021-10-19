# Sync-env
A CLI tool to easily define environment variables based on a template file (`.env.template` or `.env.example`).

- When running **locally** it will ask for the values of missing variables
- When running **on CI**, it will break the process if some variable is missing

## Use it
```
npx sync-env
```
