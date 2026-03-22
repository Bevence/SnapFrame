"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '../../utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        router.push('/dashboard');
        router.refresh(); // Refresh to catch new auth state
    };
    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-950">
            {/* Background glowing abstract shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/30 blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/30 blur-[120px] mix-blend-screen" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-pink-600/20 blur-[100px] mix-blend-screen" />
            </div>

            <div className="relative w-full max-w-md mx-auto p-4 sm:p-8 z-10">
                {/* Glassmorphism Card */}
                <div className="backdrop-blur-xl bg-gray-900/60 border border-gray-800/80 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300">
                    <div className="p-8 sm:p-10">
                        <div className="flex items-center justify-center mb-8">
                            {/* Logo / Icon */}
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 transform hover:scale-105 hover:rotate-3 transition-transform duration-300">
                                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold text-center text-white mb-2 tracking-tight">
                            Welcome back
                        </h2>
                        <p className="text-center text-gray-400 mb-8 text-sm font-medium">
                            Enter your details to access your account
                        </p>

                        <form className="space-y-6" onSubmit={handleLogin}>
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm font-medium">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-5">
                                <div className="group">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5 transition-colors group-focus-within:text-indigo-400">
                                        Email address
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="block w-full pl-11 pr-4 py-3 border border-gray-700/60 rounded-xl bg-gray-800/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 sm:text-sm"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="group">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 transition-colors group-focus-within:text-indigo-400">
                                            Password
                                        </label>
                                        <div className="text-sm">
                                            <Link href="#" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                                                Forgot password?
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            autoComplete="current-password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full pl-11 pr-4 py-3 border border-gray-700/60 rounded-xl bg-gray-800/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 sm:text-sm"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-indigo-500 focus:ring-indigo-500/50 border-gray-600 rounded bg-gray-800 checked:border-indigo-500 checked:bg-indigo-500 transition-colors cursor-pointer appearance-none checked:bg-[url('data:image/svg+xml;utf8,%3Csvg%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22white%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M12.207%204.793a1%201%200%20010%201.414l-5%205a1%201%200%2001-1.414%200l-2-2a1%201%200%20011.414-1.414L6.5%209.086l4.293-4.293a1%201%200%20011.414%200z%22%2F%3E%3C%2Fsvg%3E')]"
                                />
                                <label htmlFor="remember-me" className="ml-2.5 block text-sm text-gray-400 cursor-pointer select-none hover:text-gray-300 transition-colors">
                                    Remember me for 30 days
                                </label>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.45)] transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    <span className="absolute left-0 inset-y-0 flex items-center pl-4">
                                        {loading ? (
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5 text-indigo-300 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                            </svg>
                                        )}
                                    </span>
                                    {loading ? 'Signing in...' : 'Sign in to account'}
                                </button>
                            </div>
                        </form>

                        {/* <div className="mt-8">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-700/80" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 py-1 rounded-full bg-gray-800/80 border border-gray-700 text-gray-400 text-xs uppercase tracking-wider font-semibold backdrop-blur-sm">
                                        Or continue with
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-700/80 rounded-xl bg-gray-800/50 text-sm font-medium text-gray-300 hover:bg-gray-700/80 hover:text-white hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 transform hover:-translate-y-0.5"
                                >
                                    <span className="sr-only">Sign in with Google</span>
                                    <svg className="w-5 h-5 mr-0 sm:mr-2" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    <span className="hidden sm:inline">Google</span>
                                </button>
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-700/80 rounded-xl bg-gray-800/50 text-sm font-medium text-gray-300 hover:bg-gray-700/80 hover:text-white hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 transform hover:-translate-y-0.5 group"
                                >
                                    <span className="sr-only">Sign in with GitHub</span>
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-white mr-0 sm:mr-2 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                    </svg>
                                    <span className="hidden sm:inline">GitHub</span>
                                </button>
                            </div>
                        </div> */}
                    </div>

                    {/* <div className="px-8 py-6 bg-gray-900/40 border-t border-gray-800/80 text-center backdrop-blur-md flex flex-col sm:flex-row justify-center items-center gap-2">
                        <p className="text-sm text-gray-400">
                            Don&apos;t have an account?
                        </p>
                        <Link href="#" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center group">
                            Sign up for free
                            <svg className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div> */}
                </div>

                {/* Helper footer text
                <p className="text-center text-gray-500 text-xs mt-8 font-medium">
                    &copy; {new Date().getFullYear()} Your Company Name. All rights reserved.
                </p> */}
            </div>
        </div>
    );
}
