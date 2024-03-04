import translate from "@iamtraction/google-translate"
import axios from "axios"


type UselessFact = {
  id: string
  text: string
  source: string
  source_url: string
  language: string
  permalink: string
}

export async function randomUselessFact(language?: string) {
  const endpointURL = 'https://uselessfacts.jsph.pl/api/v2/facts/random'

  const uselessFact = await axios.get(endpointURL).then(response => response.data as UselessFact)

  if (language) {
    return translateUselessFact(uselessFact.text, language)
  }

  return uselessFact.text
}

async function translateUselessFact(fact: string, language: string) {
  return translate(fact, { to: language }).then(res => res.text)
} 
