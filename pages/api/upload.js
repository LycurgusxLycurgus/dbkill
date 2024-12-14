// pages/api/upload.js
import fs from 'fs'
import { supabase } from '../../lib/supabaseClient'
import pdfParse from 'pdf-parse'
import { formidable } from 'formidable'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  console.log('Upload endpoint hit')
  if (!supabase) {
    console.error('No Supabase connection')
    return res.status(500).json({ message: 'Database connection not initialized' })
  }

  if (req.method !== 'POST') {
    console.error('Wrong method:', req.method)
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const form = formidable()
  form.parse(req, async (err, fields, files) => {
    console.log('Form parsing result:', { err, files: files ? Object.keys(files) : null })
    if (err) {
      console.error('Form parsing error:', err)
      return res.status(500).json({ message: 'Error parsing the files' })
    }

    if (!files.pdf) {
      console.error('No PDF file found in request')
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const file = files.pdf[0]
    console.log('File details:', { 
      name: file.originalFilename,
      size: file.size,
      path: file.filepath
    })

    try {
      const dataBuffer = await fs.promises.readFile(file.filepath)
      console.log('File read successful, size:', dataBuffer.length)
      
      const pdfData = await pdfParse(dataBuffer)
      console.log('PDF parsed, text length:', pdfData.text.length)

      // Insert into Supabase
      const { data: pdfRecord, error: uploadError } = await supabase
        .from('pdfs')
        .insert([{ 
          filename: file.originalFilename, 
          content: pdfData.text 
        }])
        .select()

      if (uploadError) {
        console.error('Supabase insert error:', uploadError)
        return res.status(500).json({ message: 'Error saving PDF to database' })
      }

      console.log('PDF saved to database:', pdfRecord[0].id)

      // Trigger processing
      try {
        const processResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pdfId: pdfRecord[0].id }),
        })

        if (!processResponse.ok) {
          throw new Error('Processing failed')
        }

        const processResult = await processResponse.json()
        console.log('Processing completed:', processResult)

        res.status(200).json({ 
          message: 'PDF uploaded and processed',
          data: pdfRecord[0],
          processing: processResult
        })
      } catch (processError) {
        console.error('Processing error:', processError)
        // Still return success for upload, but include processing error
        res.status(200).json({ 
          message: 'PDF uploaded but processing failed',
          data: pdfRecord[0],
          processingError: processError.message
        })
      }
    } catch (error) {
      console.error('Processing error:', error)
      res.status(500).json({ message: 'Error processing PDF' })
    }
  })
}
