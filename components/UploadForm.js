// components/UploadForm.js
import { useState } from 'react'

export default function UploadForm({ onSuccess }) {
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setMessage('Please select a PDF file.')
      return
    }

    const formData = new FormData()
    formData.append('pdf', file)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    setMessage(data.message)
    if (res.status === 200) {
      onSuccess(data)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button type="submit">Upload PDF</button>
      <p>{message}</p>
    </form>
  )
}
