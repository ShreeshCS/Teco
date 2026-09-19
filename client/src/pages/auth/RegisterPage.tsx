// src/pages/auth/RegisterPage.tsx
import { Link } from 'react-router-dom';
import RegisterForm from '../../components/forms/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="auth-view">
      <div className="auth-view-header">
        <h2>Create Account</h2>
        <p>Get started with your free account</p>
      </div>

      <RegisterForm />

      <p className="auth-switch-prompt">
        Already have an account? <Link to="/login">Sign In</Link>
      </p>
    </div>
  );
}