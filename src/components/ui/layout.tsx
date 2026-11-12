import React from 'react'

export const Container: React.FC<{children: React.ReactNode}> = ({children}) => {
  return (
    <div className="max-w-[1400px] mx-auto px-4 pb-6">
      {children}
    </div>
  )
}