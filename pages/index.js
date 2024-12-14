// pages/index.js
import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Upload() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('')
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return

    const formData = new FormData()
    formData.append('pdf', file)

    try {
      setStatus('Uploading PDF...')
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Upload failed')
      
      const data = await res.json()
      
      if (data.processingError) {
        setStatus('PDF uploaded but processing failed. Please try processing again.')
      } else {
        setStatus('PDF uploaded\n\nDocument processed successfully')
        // Add a slight delay before redirecting
        setTimeout(() => {
          router.push('/visualize')
        }, 2000)
      }

    } catch (err) {
      console.error('Upload error:', err)
      setStatus('Error uploading document')
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Upload PDFs</h1>
      
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button 
          type="submit"
          className="ml-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Upload PDF
        </button>
      </form>

      {status && (
        <div className="mt-4 whitespace-pre-line">
          {status}
          {status.includes('successfully') && (
            <div className="mt-2">
              Redirecting to visualization...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
