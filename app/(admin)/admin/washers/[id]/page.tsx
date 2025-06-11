// app/(admin)/admin/washers/[id]/page.tsx

import React from 'react'

// Using a UNIQUE name to avoid all conflicts from other files.
type SingleWasherPageProps = {
  params: {
    id: string
  }
}

// The component uses the new UNIQUE type name.
export default function WasherPage({ params }: SingleWasherPageProps) {
  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', color: 'black' }}>
      <h1>Washer Details: Final Fix Attempt</h1>
      <p>
        The ID for this washer is: <strong>{params.id}</strong>
      </p>
    </div>
  )
}
