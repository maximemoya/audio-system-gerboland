# Audio System

Application React + Vite pour piloter et previsualiser un systeme audio ambiant. L'interface actuelle expose un dashboard unique pour lancer le moteur, changer le terrain, ajuster l'intensite et regler le volume.

## TASTE IT

goûte moi ça ici : https://maximemoya.github.io/audio-system-gerboland/

## Demarrage

Prerequis: `pnpm` et une version recente de Node.js.

```bash
pnpm install
pnpm dev
```

Le serveur de developpement Vite est ensuite accessible en local pour travailler sur l'interface et le moteur audio.

## Scripts utiles

- `pnpm dev`: lance l'application en mode developpement
- `pnpm build`: verifie TypeScript puis genere le build de production dans `docs/`
- `pnpm preview`: rebuild puis sert localement le build de production
- `pnpm lint`: execute ESLint sur le projet

## Structure du projet

- `src/main.tsx`: point d'entree React
- `src/app/App.tsx`: shell principal de l'application
- `src/app/components/audioSystem/`: dashboard, hooks, runtime, presets et moteur audio
- `src/index.css` et `src/app/App.css`: styles globaux et styles applicatifs
- `public/`: assets statiques servis tels quels
- `docs/`: sortie de build utilisee pour GitHub Pages

## Deploiement GitHub Pages

Le projet est configure pour un deploiement GitHub Pages de type project site:

- `base` Vite: `/audio-system-gerboland/`
- dossier de sortie: `docs/`

Flux recommande:

```bash
pnpm build
pnpm preview
```

`pnpm preview` sert le meme build que celui destine a GitHub Pages, ce qui permet de verifier localement le comportement de production avant publication.

## Etat actuel

- l'entree applicative affiche `AmbientDashboard`
- le dashboard pilote le moteur ambiant via les presets definis dans `audioSystem`
- les principaux controles exposes sont le transport, l'intensite, le terrain et le volume
