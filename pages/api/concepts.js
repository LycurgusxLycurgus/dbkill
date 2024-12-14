import { supabase } from '../../lib/supabaseClient'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { data: concepts, error } = await supabase
      .from('concepts')
      .select('id, name')
      .order('name')

    if (error) throw error

    res.status(200).json(concepts)
  } catch (error) {
    console.error('Error fetching concepts:', error)
    res.status(500).json({ message: 'Error fetching concepts' })
  }
} 