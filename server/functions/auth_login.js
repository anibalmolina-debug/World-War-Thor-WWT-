import { Auth } from '../lib/auth.js';
import { db } from '../lib/db.js';

export default async (req, context) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  
  try {
    const { codeword } = await req.json();
    const normalized = Auth.normalizeCodeword(codeword);
    
    const res = await db.query('SELECT * FROM nations WHERE key =  AND playable = true', [normalized]);
    if (res.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid codeword' }), { status: 401 });
    }
    
    const nation = res.rows[0];
    const token = await Auth.createSession('student', nation.id);
    
    return new Response(JSON.stringify({ token, nation: { name: nation.name, id: nation.id } }), { 
      status: 200,
      headers: { 'Set-Cookie': session=; HttpOnly; Secure; SameSite=Lax; Path=/, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};