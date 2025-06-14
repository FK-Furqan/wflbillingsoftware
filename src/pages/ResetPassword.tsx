import { useState } from 'react';
import { supabase } from '@/supabaseClient';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Extract access_token from URL hash
  const accessToken = (() => {
    if (typeof window === 'undefined') return '';
    const hash = window.location.hash;
    const match = hash.match(/access_token=([^&]+)/);
    return match ? match[1] : '';
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setMsg('Passwords do not match.');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      // Set the access token for the current session
      await supabase.auth.setSession({ access_token: accessToken, refresh_token: '' });
      const { error } = await supabase.auth.updateUser({ password });
      setLoading(false);
      if (error) {
        setMsg('Failed to reset password. The link may have expired.');
        return;
      }
      setMsg('Password has been reset! You can now log in with your new password.');
    } catch (err) {
      setLoading(false);
      setMsg('Network error.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          required
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-logistics-primary text-white py-2 rounded font-semibold"
          disabled={loading}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
        {msg && <div className="text-center mt-2 text-sm">{msg}</div>}
      </form>
    </div>
  );
} 