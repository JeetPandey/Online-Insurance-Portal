import React from 'react'

const App = () => {
  return (
    <>
    <div className='bg-red-600'>
      tailwind css
    </div>

    <div className="p-6 space-y-4">
      <button className="btn btn-primary">Primary Button</button>
      <button className="btn btn-secondary">Secondary Button</button>
      <input
        type="text"
        placeholder="Type here"
        className="input input-bordered w-full max-w-xs"
      />
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">DaisyUI Card</h2>
          <p>If you see styled buttons and this card, DaisyUI is working!</p>
        </div>
      </div>
    </div>
    </>
  )
}

export default App
