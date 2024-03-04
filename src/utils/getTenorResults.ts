import { tenor } from '../lib/tenor'

type SearchTenorParams = {
  query: string
  country?: string
  locale?: string
  media_filter: string
  random?: boolean
  limit?: number
}

type TenorResults = {
  id: string
  title: string
  media_formats: Record<
    string,
    {
      url: string
      duration: number
      preview: string
      dims: [number, number]
      size: number
    }
  >
  created: number
  content_description: string
  itemurl: string
  url: string
  tags: string[]
  flags: []
  hasaudio: boolean
}[]

export async function getTenorResults({
  query,
  limit,
  locale,
  media_filter,
  country,
  random,
}: SearchTenorParams) {
  if (!limit) limit = 10
  if (!locale) locale = 'en_US'
  if (!country) country = 'US'
  if (!media_filter) media_filter = ''
  if (!random) random = false

  return await tenor
    .get(
      `/search?q=${query}&limit=${limit}&locale=${locale}&country=${country}&media_filter=${media_filter}&random=${random}`,
    )
    .then((response) => response.data.results as TenorResults)
    .catch(() => undefined)
}
