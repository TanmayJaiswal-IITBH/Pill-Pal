import { useRef } from 'react'
import BigButton from './BigButton.jsx'
import { unlockSpeech } from '../lib/speech.js'

// A big button that opens the camera (camera) or the photo gallery (no camera).
export default function PhotoButton({ children, onPhoto, camera = false, variant = 'primary' }) {
  const input = useRef(null)

  function open() {
    // This tap is our chance to let iOS speak the result later
    unlockSpeech()
    input.current.click()
  }

  function handleChange(event) {
    const file = event.target.files?.[0]
    // Clear it so picking the same photo again still fires a change
    event.target.value = ''
    if (file) onPhoto(file)
  }

  return (
    <>
      <BigButton onClick={open} variant={variant}>
        {children}
      </BigButton>
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture={camera ? 'environment' : undefined}
        onChange={handleChange}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />
    </>
  )
}
