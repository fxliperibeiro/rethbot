import axios from 'axios'

export const tenor = axios.create({
  baseURL: 'https://tenor.googleapis.com/v2',
})

tenor.interceptors.request.use((config) => {
  config.params = { ...config.params, key: process.env.TENOR_API_KEY as string }

  return config
})
