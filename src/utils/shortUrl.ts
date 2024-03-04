import { dub } from '../lib/dub'

type DubCreateLinkProps = {
  domain?: string
  key?: string
  url: string
  archived?: boolean
  expiresAt?: Date
  password?: string
  proxy?: boolean
  title?: string
  description?: string
  image?: string
  rewrite?: boolean
  ios?: string
  android?: string
  geo?: Record<string, string>
  publicStats?: boolean
  tagId?: string
  comments?: string
}

type DubResponseLinkProps = {
  url: string
  key?: string
  android?: string
  archived?: boolean
  clicks?: number
  description?: string
  domain?: string
  expirestAt?: string
  geo?: Record<string, string>
  image?: string
  ios?: string
  password?: string
  proxy?: boolean
  rewrite?: boolean
  tagId?: string
  title?: string
  userId?: string
}
export async function shortUrl(
  linkProps: DubCreateLinkProps,
): Promise<DubResponseLinkProps> {
  return dub
    .post('https://api.dub.co/links?projectSlug=reth', {
      ...linkProps,
      domain: 'link.rethbot.website',
    })
    .then((response) => response.data)
}
