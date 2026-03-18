import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://esntools.app'
  
  // On fixe la date d'aujourd'hui pour toutes les pages
  const lastModified = new Date()

  return [
    // La page d'accueil (Priorité max)
    { url: baseUrl, lastModified, changeFrequency: 'monthly', priority: 1 },
    
    // Les 7 outils (Priorité haute)
    { url: `${baseUrl}/rentabilite`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/cjm`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/banc`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/comparateur`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/licenciement`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/tace`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/split-contract`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
  ]
}