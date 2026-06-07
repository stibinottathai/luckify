import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.luckundo.xyz'

  const routes = [
    '',
    '/astro-vibes',
    '/fortune-teller',
    '/gift-hunt',
    '/leaderboard',
    '/lucky-envelope',
    '/magic-8-ball',
    '/message-in-bottle',
    '/pendulum',
    '/picker',
    '/sandtimer',
    '/scratch-card',
    '/slot-machine',
    '/time-capsule',
    '/wheel',
    '/wishing-star',
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.8,
  }))
}
