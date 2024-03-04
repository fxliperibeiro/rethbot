import axios from 'axios'

export const dub = axios.create({
  baseURL: 'https://api.dub.co',
  headers: {
    Authorization: `Bearer ${process.env.DUB_API_KEY}`,
  },
})
