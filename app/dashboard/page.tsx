"use client";
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '../../utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setStatus('idle');
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const selectedFile = e.dataTransfer.files[0];
            if (selectedFile.type.startsWith('image/')) {
                setFile(selectedFile);
                setPreview(URL.createObjectURL(selectedFile));
                setStatus('idle');
            }
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleGenerate = async () => {
        if (!file) return;
        setStatus('processing');
        
        try {
            const { getSignedUploadUrl } = await import('../actions/s3');
            const { success, url, key, error } = await getSignedUploadUrl(file.name, file.type);
            
            if (!success || !url) {
                throw new Error(error || "Failed to get presigned URL.");
            }
            
            // Upload file directly to S3
            const uploadResponse = await fetch(url, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type },
            });
            
            if (!uploadResponse.ok) {
                throw new Error("S3 upload failed");
            }
            
            // Upload successful, mark as done
            setStatus('done');
        } catch (err) {
            console.error("Upload error:", err);
            alert("Upload failed! Check console for errors.");
            setStatus('idle');
        }
    };

    const resolutions = [
        { label: 'Original', desc: 'Full Quality', size: '100%', ratio: 'auto' },
        { label: '1080p (FHD)', desc: '1920x1080', size: '1920x1080', ratio: '16/9' },
        { label: '720p (HD)', desc: '1280x720', size: '1280x720', ratio: '16/9' },
        { label: 'Social Square', desc: '1080x1080', size: '1080x1080', ratio: '1/1' },
        { label: 'Thumbnail', desc: '480x360', size: '480x360', ratio: '4/3' },
        { label: 'Avatar', desc: '256x256', size: '256x256', ratio: '1/1' },
    ];

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col relative overflow-hidden">
            {/* Background glowing effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none fixed">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/20 blur-[120px] mix-blend-screen" />
            </div>

            {/* Navbar */}
            <nav className="relative z-10 backdrop-blur-md bg-gray-900/50 border-b border-gray-800/80 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className="font-bold text-lg tracking-tight">SnapFrame</span>
                </div>
                <div className="flex items-center gap-6">
                    <button
                        onClick={handleLogout}
                        className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
                    >
                        <span>Sign out</span>
                        <svg className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity group-hover:translate-x-0.5 duration-300 transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                    <div className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700 overflow-hidden p-[2px]">
                        <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-500 to-fuchsia-500 flex items-center justify-center text-sm font-bold shadow-inner">
                            US
                        </div>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 flex-1 container mx-auto px-4 py-8 lg:py-12 flex flex-col items-center">
                <div className="text-center mb-10 max-w-2xl">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                        Generate Multi-Res Thumbnails
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Upload a high-quality image and instantly generate perfectly resized thumbnails for every platform.
                    </p>
                </div>

                {/* Upload State */}
                {(!file || status === 'idle') && (
                    <div
                        className="w-full max-w-4xl backdrop-blur-xl bg-gray-900/60 border border-gray-800/80 rounded-3xl p-8 lg:p-12 shadow-2xl transition-all duration-300"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                    >
                        {!file ? (
                            <div
                                className="border-2 border-dashed border-gray-700/80 rounded-3xl p-16 flex flex-col items-center justify-center group hover:border-indigo-500/50 hover:bg-gray-800/30 transition-all duration-300 cursor-pointer text-center relative overflow-hidden"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-900/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-500/20 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-500 relative z-10">
                                    <svg className="w-10 h-10 text-gray-400 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-semibold mb-3 text-gray-200 relative z-10">Click or drag image here</h3>
                                <p className="text-gray-500 mb-8 max-w-sm relative z-10">
                                    Supported formats: JPG, PNG, WEBP. Maximum file size 20MB.
                                </p>
                                <span className="px-8 py-3 rounded-xl bg-gray-800 border border-gray-700 group-hover:bg-gray-700 group-hover:text-white text-gray-300 font-medium transition-colors relative z-10 shadow-lg">
                                    Browse Files
                                </span>
                            </div>
                        ) : (
                            <div className="flex flex-col md:flex-row gap-10 items-center">
                                <div className="relative w-full md:w-1/2 aspect-[4/3] bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl group">
                                    {/* Checkerboard background pattern for transparency visualization */}
                                    <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiAvPgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIiAvPgo8L3N2Zz4=')]"></div>

                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={preview!} alt="Preview" className="w-full h-full object-contain relative z-10 transition-transform duration-700 group-hover:scale-105" />

                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm z-20">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                                            className="px-5 py-2.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl font-medium transition-all duration-300 border border-red-500/30 flex items-center gap-2 transform hover:scale-105"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Remove Image
                                        </button>
                                    </div>
                                </div>

                                <div className="w-full md:w-1/2 flex flex-col justify-center items-start text-left">
                                    <div className="mb-8 w-full border-b border-gray-800/80 pb-6">
                                        <h3 className="text-2xl font-bold mb-3 break-all text-white line-clamp-2" title={file.name}>{file.name}</h3>
                                        <div className="flex gap-3 text-sm">
                                            <span className="px-3 py-1 bg-gray-800 rounded-lg text-gray-300 font-medium font-mono border border-gray-700">
                                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                                            </span>
                                            <span className="px-3 py-1 bg-gray-800 rounded-lg text-gray-300 font-medium font-mono border border-gray-700">
                                                {file.type.split('/')[1].toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 w-full mb-8">
                                        <div className="flex items-center gap-4 text-sm text-gray-300 bg-gray-800/40 px-5 py-4 rounded-2xl border border-gray-700/80 shadow-inner">
                                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                                                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white">6 optimized resolutions</p>
                                                <p className="text-gray-400">Ready to automatically crop and resize</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleGenerate}
                                        className="w-full py-4 px-6 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden group/btn relative"
                                    >
                                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover/btn:translate-x-[150%] transition-transform duration-1000 ease-in-out"></div>
                                        <svg className="w-6 h-6 opacity-90 group-hover/btn:rotate-12 transition-transform duration-300 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                        </svg>
                                        <span className="relative z-10">Generate Thumbnails</span>
                                    </button>
                                </div>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handleFileChange}
                        />
                    </div>
                )}

                {/* Processing State */}
                {status === 'processing' && (
                    <div className="w-full max-w-lg flex flex-col items-center justify-center py-32 animate-fade-in-up">
                        <div className="relative w-32 h-32 mb-10">
                            <div className="absolute inset-0 border-4 border-gray-800/80 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent border-l-transparent animate-spin"></div>
                            <div className="absolute inset-2 border-4 border-purple-500/80 rounded-full border-b-transparent border-r-transparent animate-spin-slow"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center shadow-inner">
                                    <svg className="w-6 h-6 text-indigo-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-4 animate-pulse">Processing Magic</h3>
                        <p className="text-gray-400 text-center text-lg max-w-sm">
                            Applying intelligent cropping and generating optimized resolutions...
                        </p>
                        <div className="w-64 h-2 bg-gray-800 rounded-full mt-10 overflow-hidden relative">
                            <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-[loading-bar_2.5s_ease-in-out_forwards] origin-left scale-x-0"></div>
                        </div>
                    </div>
                )}

                {/* Results State */}
                {status === 'done' && preview && (
                    <div className="w-full max-w-6xl animate-fade-in-up">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 pb-8 border-b border-gray-800/80 gap-6">
                            <div>
                                <h2 className="text-3xl font-extrabold text-white mb-2">Generated successfully</h2>
                                <p className="text-gray-400 text-lg">6 perfectly optimized variations of <span className="text-gray-200 font-medium">{file?.name}</span></p>
                            </div>
                            <button
                                onClick={() => { setFile(null); setPreview(null); setStatus('idle'); }}
                                className="px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold transition-colors border border-gray-700 shadow-lg flex items-center gap-2 transform hover:-translate-y-0.5"
                            >
                                <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Upload New Image
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {resolutions.map((res, i) => (
                                <div key={i} className="group backdrop-blur-md bg-gray-900/40 border border-gray-800 rounded-3xl overflow-hidden hover:bg-gray-800/80 hover:border-gray-600 transition-all duration-300 flex flex-col shadow-xl hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                                    <div className="relative w-full aspect-video bg-gray-950 overflow-hidden flex items-center justify-center p-4">
                                        {/* Checkerboard background inside the image container */}
                                        <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiAvPgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIiAvPgo8L3N2Zz4=')]"></div>

                                        <div
                                            className="relative z-10 w-full h-full flex items-center justify-center"
                                            style={{ aspectRatio: res.ratio !== 'auto' ? res.ratio : undefined }}
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={preview}
                                                alt={res.label}
                                                className="max-h-full max-w-full object-cover rounded-md shadow-2xl group-hover:scale-105 transition-transform duration-700"
                                                style={{ aspectRatio: res.ratio !== 'auto' ? res.ratio : undefined }}
                                            />
                                        </div>

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5 z-20">
                                            <button className="w-full py-3 bg-white hover:bg-gray-100 rounded-xl text-sm font-bold text-gray-900 flex items-center justify-center gap-2 transition-transform transform hover:scale-102">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                Download {res.size}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col bg-gradient-to-b from-gray-900/50 to-transparent">
                                        <div className="flex justify-between items-start mb-3 gap-2">
                                            <h4 className="text-xl font-bold text-gray-100 line-clamp-1">{res.label}</h4>
                                            <span className="text-xs font-mono font-bold bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-lg border border-indigo-500/20 whitespace-nowrap">
                                                {res.size}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">{res.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-16 text-center border-t border-gray-800/80 pt-12 pb-8">
                            <button className="py-4 px-10 rounded-2xl bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white font-bold transition-all duration-300 border border-gray-600 shadow-xl flex items-center gap-3 mx-auto group">
                                <svg className="w-6 h-6 text-indigo-400 group-hover:text-indigo-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download All Pack (.zip)
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Required for fading effect map */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes loading-bar {
          0% { transform: scaleX(0); }
          20% { transform: scaleX(0.2); }
          50% { transform: scaleX(0.4); }
          80% { transform: scaleX(0.8); }
          100% { transform: scaleX(1); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
      `}} />
        </div>
    );
}
