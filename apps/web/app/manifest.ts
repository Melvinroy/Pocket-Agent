import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Codex Remote',
    short_name: 'Codex Remote',
    description: 'Phone-first remote coding for a local Codex host.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f2efe8',
    theme_color: '#0f766e',
    icons: [],
  };
}
