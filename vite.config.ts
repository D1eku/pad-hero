import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';

const SONGS_DIR = path.resolve(process.cwd(), 'public/songs');
const SONGS_URL = '/songs/index.json';

function prettifyName(file: string): string {
  return file
    .replace(/\.midi?$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim();
}

function readSongs(): { name: string; file: string }[] {
  if (!fs.existsSync(SONGS_DIR)) return [];
  return fs
    .readdirSync(SONGS_DIR)
    .filter((f) => /\.midi?$/i.test(f))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => ({ name: prettifyName(file), file }));
}

function songsIndexPlugin(): Plugin {
  return {
    name: 'pad-hero:songs-index',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathOnly = (req.url ?? '').split('?')[0];
        if (pathOnly === SONGS_URL) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end(JSON.stringify(readSongs()));
          return;
        }
        next();
      });
    },
    closeBundle() {
      const outPath = path.resolve(process.cwd(), 'dist/songs/index.json');
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, JSON.stringify(readSongs()));
    },
  };
}

export default defineConfig({
  plugins: [songsIndexPlugin()],
});
