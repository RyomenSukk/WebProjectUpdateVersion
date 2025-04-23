import { useRouter } from 'next/router';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function handleLogin(event) {
    event.preventDefault();

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      if (response.ok) {
        alert('Login successful');
        // Navigate to the add-song page after login success
        router.push('/add-song');
      } else {
        const error = await response.json();
        alert(`Login failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
      alert('An error occurred while trying to log in. Please try again.');
    }
  }

  return (
    <form onSubmit={handleLogin} className="login-form">
      <h2>Login</h2>
      <input
        name="username"
        placeholder="Username"
        required
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
    </form>
  );
}