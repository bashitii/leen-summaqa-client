import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../lib/adminApi';
import { btn, input } from './ui';
export default function AdminLogin() {
  const nav = useNavigate(); const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState('');
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setErr(''); try { await adminLogin(email, pw); nav('/admin'); } catch (x) { setErr((x as Error).message); } };
  return <div className="grid min-h-screen place-items-center px-5 normal-case tracking-normal">
    <form onSubmit={submit} className="w-full max-w-sm space-y-4"><h1 className="font-serif text-4xl">Admin sign in</h1>
      <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input className={input} type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} required />
      {err && <p className="text-hot">{err}</p>}<button className={`${btn} w-full`}>Sign in</button></form></div>;
}
