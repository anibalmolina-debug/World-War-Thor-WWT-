import { Auth } from '../lib/auth.js';

export default async (req, context) => {
  const cookies = req.headers.get('cookie') || '';
  const token = cookies.split('; ').find(c => c.startsWith('session='))?.split('=')[1];
  
  if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  
  const session = await Auth.verifySession(token);
  if (!session) return new Response(JSON.stringify({ error: 'Session expired' }), { status: 401 });
  
  return new Response(JSON.stringify(session), { status: 200, headers: { 'Content-Type': 'application/json' } });
};