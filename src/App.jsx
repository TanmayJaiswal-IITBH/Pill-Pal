import { useEffect, useState } from 'react'
import LanguagePicker from './screens/LanguagePicker.jsx'
import Home from './screens/Home.jsx'
import Scanning from './screens/Scanning.jsx'
import Result from './screens/Result.jsx'
import Retake from './screens/Retake.jsx'
import ErrorScreen from './screens/ErrorScreen.jsx'
import WrongMedicine from './screens/WrongMedicine.jsx'
import { DEFAULT_LANGUAGE, getLanguage } from './lib/languages.js'
import { downscaleImage } from './lib/image.js'
import { needsRetake, scanPhoto } from './lib/scan.js'
import { unlockSpeech } from './lib/speech.js'

const LANG_KEY = 'pillpal.lang'

function loadLanguage() {
  try {
    return localStorage.getItem(LANG_KEY)
  } catch {
    return null
  }
}

export default function App() {
  const [lang, setLang] = useState(() => loadLanguage())
  const [screen, setScreen] = useState(() => (lang ? 'home' : 'language'))
  const [result, setResult] = useState(null)
  // Kept in memory only, so "Try again" can resend it after a network or AI failure
  const [photo, setPhoto] = useState(null)

  useEffect(() => {
    const { code, dir } = getLanguage(lang ?? DEFAULT_LANGUAGE)
    document.documentElement.lang = code
    document.documentElement.dir = dir
  }, [lang])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen])

  function pickLanguage(code) {
    try {
      localStorage.setItem(LANG_KEY, code)
    } catch {
      // Private mode: the choice just won't be remembered
    }
    setLang(code)
    setScreen('home')
  }

  async function send(image) {
    setScreen('scanning')
    const response = await scanPhoto(image, lang)
    if (response.ok) {
      setPhoto(null)
      setResult(response.data)
      setScreen('result')
    } else if (needsRetake(response.error)) {
      setPhoto(null)
      setScreen('retake')
    } else {
      setScreen('error')
    }
  }

  async function handlePhoto(file) {
    setScreen('scanning')
    let image
    try {
      image = await downscaleImage(file)
    } catch {
      setScreen('retake')
      return
    }
    setPhoto(image)
    await send(image)
  }

  function retry() {
    unlockSpeech()
    if (photo) send(photo)
    else setScreen('home')
  }

  function goHome() {
    setPhoto(null)
    setResult(null)
    setScreen('home')
  }

  const current = lang ?? DEFAULT_LANGUAGE
  switch (screen) {
    case 'language':
      return <LanguagePicker current={current} onPick={pickLanguage} />
    case 'scanning':
      return <Scanning lang={current} />
    case 'result':
      return (
        <Result
          lang={current}
          data={result}
          onScanAnother={goHome}
          onWrongMedicine={() => setScreen('wrong-medicine')}
        />
      )
    case 'wrong-medicine':
      return <WrongMedicine lang={current} onBack={() => setScreen(result ? 'result' : 'home')} />
    case 'retake':
      return <Retake lang={current} onPhoto={handlePhoto} onBack={goHome} />
    case 'error':
      return <ErrorScreen lang={current} onRetry={retry} onBack={goHome} />
    default:
      return <Home lang={current} onPhoto={handlePhoto} onChangeLanguage={() => setScreen('language')} />
  }
}
