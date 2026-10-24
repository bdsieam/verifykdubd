import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAF7] p-6 text-[#25352C]">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#DCE6DF] p-6 shadow-sm text-center space-y-4">
            <h1 className="text-lg font-bold text-[#006A3D]">
              পেজটি রিলোড করুন
            </h1>
            <p className="text-sm text-[#5A6B60]">
              ব্রাউজারের পুরনো ক্যাশ বা ডেটার কারণে সমস্যা হয়েছে। নিচের বাটনে ক্লিক করে পেজটি রিসেট করুন।
            </p>
            <button
              onClick={() => {
                try {
                  localStorage.clear();
                } catch {
                  // ignore
                }
                window.location.reload();
              }}
              className="px-5 py-2.5 rounded-xl bg-[#006A3D] text-white text-sm font-semibold hover:bg-[#005530] transition"
            >
              রিসেট ও রিলোড করুন
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
