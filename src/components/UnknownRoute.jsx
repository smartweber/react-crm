import React from 'react'

const POETRY = `
Once upon a midnight dreary,
While I pondered, weak and weary,
Over many a quaint and curious
Volume of forgotten lore—
While I nodded, nearly napping,
Suddenly there came a tapping,
As of some one gently rapping,
Rapping at my chamber door.
"Tis some visitor," I muttered,
"Tapping at my chamber door—"
"Only this and nothing more."
Page not found: 404
`.trim()
const ELEMENT = (
  <main className='container'>
    <pre style={{
      margin: '10% auto',
      width: '300px'
    }}>{POETRY}</pre>
  </main>
)

export default function UnknownRoute() {
  return ELEMENT
}
