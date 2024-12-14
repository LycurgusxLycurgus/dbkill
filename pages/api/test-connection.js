import { supabase } from '../../lib/supabaseClient'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // First test the connection
    const { data, error } = await supabase
      .from('pdfs')
      .select('count')
      .limit(1)
    
    if (error) throw error

    // Return success response
    return res.status(200).json({
      status: 'success',
      message: 'Supabase connection successful',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      connected: true
    })

  } catch (error) {
    console.error('Connection test error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to connect to Supabase',
      error: error.message,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'URL not found in env'
    })
  }
} 