import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.EXTERNAL_API_BASE_URL,
  headers: {
    Authorization: process.env.RETH_API_KEY,
  },
})
