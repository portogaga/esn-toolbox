import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*', // S'applique à tous les robots (Google, Bing, etc.)
      allow: '/',     // Autorise l'indexation de tout le site
      disallow: '/private/', // Exemple : interdit d'indexer un dossier privé si tu en crées un plus tard
    },
    sitemap: 'https://esntools.app/sitemap.xml', // L'adresse de ton sitemap
  }
}