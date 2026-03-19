import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pocket Agent',
    short_name: 'Pocket Agent',
    description: 'Phone-first remote coding for a local Codex host.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f4efe7',
    theme_color: '#142b28',
    icons: [],
  };
}
