import axios from "axios";

type Speaker = 'en_us_ghostface' | 'en_us_chewbacca' | 'en_us_c3po' | 'en_us_stitch' |
  'en_us_stormtrooper' | 'en_us_rocket' | 'en_au_001' | 'en_au_002' |
  'br_ghostface' | 'en_uk_001' | 'en_uk_003' | 'en_us_001' | 'en_us_002' |
  'en_us_006' | 'en_us_007' | 'en_us_009' | 'en_us_010' |
  'fr_001' | 'fr_002' | 'de_001' | 'de_002' | 'es_002' |
  'es_mx_002' | 'br_001' | 'br_003' | 'br_004' |
  'br_005' | 'id_001' | 'jp_001' | 'jp_003' |
  'jp_005' | 'jp_006' | 'kr_002' | 'kr_003' |
  'kr_004' | 'en_female_f08_salut_damour' | 'en_male_m03_lobby' | 'en_female_f08_warmy_breeze' |
  'en_male_m03_sunshine_soon' | 'en_male_narration' | 'en_male_funny' | 'en_female_emotional';

type SpeechData = {
  success: boolean
  data: string
  error: string | null
}

export async function textToSpeech({ speaker, text }: { text: string, speaker: Speaker }) {
  text = _formatString(text)

  if (text.toLowerCase().includes('reth')) {
    text = text.replace(/reth/gi, 'Rétch')
  }

  const endPoint = `https://tiktok-tts.weilnet.workers.dev/api/generation`

  const speechData: SpeechData = await axios(endPoint, {
    method: 'POST',
    data: {
      text,
      voice: speaker
    },
    responseEncoding: 'utf-8'
  }).then(response => response.data)

  return {
    audio: speechData.data
  }
}

function _formatString(string: string) {
  return string.replace(/[^a-zA-Z0-9\s]/g, '').trim()
}

