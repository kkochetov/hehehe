# TIS-100 React Playground

A small React + TypeScript single page application inspired by the game **TIS-100**. The page renders one programmable chip with three inputs and three outputs. The simple assembler supports two instructions:

- `IN n`  – load a value from input `n` (1-3)
- `OUT n` – write the most recently loaded value to output `n`

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy to GitHub Pages

```bash
npm run deploy
```

A GitHub Actions workflow also builds and publishes the site automatically when changes are pushed to the `main` branch.

