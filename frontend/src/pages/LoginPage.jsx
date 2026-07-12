import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ScanBarcode, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { login, signup, user } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('admin@assetflow.com');
  const [password, setPassword] = useState('Admin@123');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await signup({ email, password, firstName, lastName, employeeCode, phone });
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F5F6F4]">
      {/* Brand panel (Left Side) */}
      <div className="hidden w-1/2 bg-[#12151B] lg:flex lg:flex-col lg:justify-between lg:p-16 text-white border-r border-[#E1E1DC]">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Asset<span className="text-[#3D6FE0]">Flow</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
            Enterprise Resource ERP
          </p>
        </div>

        {/* Scan Tag Illustration container */}
        <div className="my-auto flex flex-col items-center justify-center space-y-6">
          <div className="relative p-8 border border-slate-800 rounded-md bg-slate-900/50">
            <ScanBarcode className="h-28 w-28 text-[#E3A72E]" />
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-red-600 animate-pulse"></div>
          </div>
          <div className="text-center max-w-sm space-y-2">
            <h3 className="text-xl font-bold">Physical Tag Scan</h3>
            <p className="text-xs text-slate-400 font-medium">
              Simplify hardware inventory tracking by scanning active QR tag barcodes directly into the system.
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          © {new Date().getFullYear()} AssetFlow Corp. All rights reserved.
        </div>
      </div>

      {/* Form panel (Right Side) */}
      <div className="flex flex-1 items-center justify-center px-8 py-16 bg-[#F5F6F4]">
        <form onSubmit={handleSubmit} className="w-full max-w-md bg-white border border-[#E1E1DC] rounded-md p-8 shadow-sm space-y-5">
          <div>
            <h2 className="text-2xl font-bold text-[#14171C]">
              {isSignUp ? 'Register Employee Profile' : 'Sign in'}
            </h2>
            <p className="mt-1 text-xs text-[#5B6470] font-medium">
              {isSignUp ? 'Enter details to start workspace membership' : 'Access your active workspace session'}
            </p>
          </div>

          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {isSignUp && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded border border-[#E1E1DC] px-3 py-2 text-sm focus:border-[#3D6FE0] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded border border-[#E1E1DC] px-3 py-2 text-sm focus:border-[#3D6FE0] focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          {isSignUp && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Employee Code</label>
                <input
                  type="text"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  placeholder="e.g. EMP-101"
                  className="w-full rounded border border-[#E1E1DC] px-3 py-2 text-sm focus:border-[#3D6FE0] focus:outline-none mono-text"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded border border-[#E1E1DC] px-3 py-2 text-sm focus:border-[#3D6FE0] focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-[#E1E1DC] px-3 py-2.5 text-sm focus:border-[#3D6FE0] focus:outline-none"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-[#5B6470] uppercase">Password</label>
              {!isSignUp && (
                <a href="#" className="text-xs text-[#3D6FE0] hover:underline font-semibold">
                  Forgot password?
                </a>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-[#E1E1DC] px-3 py-2.5 text-sm focus:border-[#3D6FE0] focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-[#3D6FE0] py-2.5 font-bold text-white hover:bg-[#305cb8] active:bg-[#254a99] transition disabled:opacity-60 cursor-pointer"
          >
            {loading ? 'Processing...' : isSignUp ? 'Create Employee Account' : 'Sign In to Dashboard'}
          </button>

          <div className="text-center text-xs border-t border-[#E1E1DC]/60 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-[#3D6FE0] font-bold hover:underline"
            >
              {isSignUp ? 'Already registered? Sign in' : 'Register as a new Employee'}
            </button>
          </div>

          {!isSignUp && (
            <div className="rounded bg-[#F5F6F4] p-4 text-[10px] text-slate-500 border border-[#E1E1DC]">
              <p className="font-bold text-[#14171C] mb-1.5 uppercase tracking-wider">Demo Access Profiles (password: Admin@123)</p>
              <p>🟢 admin@assetflow.com — Super Admin</p>
              <p>🔵 manager@assetflow.com — Asset Manager</p>
              <p>🟡 employee@assetflow.com — Workspace Employee</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
