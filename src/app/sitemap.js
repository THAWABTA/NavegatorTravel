export default function sitemap() {
  return [
    {
      url: 'https://yourdomain.com', // TODO: set real production domain
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: 'https://yourdomain.com/destinations', // TODO: set real production domain
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}
