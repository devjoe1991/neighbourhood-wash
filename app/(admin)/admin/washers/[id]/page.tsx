import React from 'react'

// This is the known-good, correct type definition for this page.
type WasherPageProps = {
  params: {
    id: string
  }
}

// The component uses the correct type.
export default function WasherPage({ params }: WasherPageProps) {
  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Washer Details Page</h1>
      <p>This is a temporary, known-good component to break the build loop.</p>
      <p>
        The ID for this washer is: <strong>{params.id}</strong>
      </p>
    </div>
  )
}
