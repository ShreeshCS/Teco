import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="auth-wrapper">
      {/* 1. Header / Branding */}
      <header className="auth-header">
        <h1 className="retro-logo">TECO</h1>
        <p className="auth-tagline">Realtime Direct Messaging</p>
      </header>

      {/* 2. Centered Card Container */}
      <main className="auth-card">
        {/* React Router mounts LoginPage or RegisterPage here */}
        <Outlet />
      </main>

      {/* 3. Common Footer */}
      <footer className="auth-footer">
        <p>&copy; {new Date().getFullYear()} Teco. All rights reserved.</p>
      </footer>
    </div>
  );
}