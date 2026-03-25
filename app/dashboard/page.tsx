"use client";
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface DbFile {
    id: string;
    key: string;
    created_at?: string;
}
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
    const [dbFiles, setDbFiles] = useState<DbFile[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [uploadedKey, setUploadedKey] = useState<string | null>(null);

    const fetchFiles = async () => {
        setIsLoadingFiles(true);
        try {
            const { data, error } = await supabase
                .from('files')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setDbFiles(data as DbFile[]);
        } catch (error) {
            console.error("Error fetching files:", error);
        } finally {
            setIsLoadingFiles(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

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

        setStatus("processing");

        try {
            // 1️⃣ Get Supabase session token
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session?.access_token) {
                throw new Error("User not authenticated");
            }

            const accessToken = session.access_token;

            // 2️⃣ Request signed URL from Lambda via API Gateway
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/generate-upload-url`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        fileName: file.name,
                        fileType: file.type,
                    }),
                }
            );

            // 3️⃣ Check API Gateway response
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Failed to get signed URL: ${text}`);
            }

            const { uploadUrl, key } = await response.json();
            console.log('uploadUrl :>> ', uploadUrl);
            console.log('key :>> ', key);

            if (!uploadUrl || !key) {
                throw new Error("Invalid signed URL response");
            }

            // 4️⃣ Upload directly to S3
            const uploadResponse = await fetch(uploadUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": file.type,
                },
                body: file,
            });

            if (!uploadResponse.ok) {
                const text = await uploadResponse.text();
                throw new Error(`S3 upload failed: ${text}`);
            }

            // ✅ Upload success
            console.log("Uploaded key:", key);
            setUploadedKey(key);
            
            // ⏳ Processing delay: Give AWS Lambda time to generate the 3 thumbnails 
            // before we transition to the 'done' state and try to load them from S3.
            setTimeout(() => {
                setStatus("done");
                fetchFiles();
            }, 3500);

        } catch (err: any) {
            console.error("Upload error:", err);
            alert(err.message || "Upload failed");
            setStatus("idle");
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
                                <p className="text-gray-400 text-lg">3 perfectly optimized variations of <span className="text-gray-200 font-medium">{file?.name}</span></p>
                            </div>
                            <button
                                onClick={() => { setFile(null); setPreview(null); setUploadedKey(null); setStatus('idle'); }}
                                className="px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold transition-colors border border-gray-700 shadow-lg flex items-center gap-2 transform hover:-translate-y-0.5"
                            >
                                <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Upload New Image
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                            {[
                                { name: 'large', label: 'Large (800px)', color: 'from-blue-500/10 to-transparent border-blue-500/20' },
                                { name: 'medium', label: 'Medium (400px)', color: 'from-purple-500/10 to-transparent border-purple-500/20' },
                                { name: 'small', label: 'Small (150px)', color: 'from-pink-500/10 to-transparent border-pink-500/20' }
                            ].map((size) => {
                                const baseUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;
                                
                                const getThumbUrl = () => {
                                    if (!uploadedKey) return '';
                                    let thumbKey = uploadedKey;
                                    if (thumbKey.startsWith('uploads/')) {
                                        thumbKey = thumbKey.replace('uploads/', `thumbnails/${size.name}/`);
                                    } else {
                                        thumbKey = `thumbnails/${size.name}/${thumbKey}`;
                                    }
                                    thumbKey = thumbKey.replace(/\.[^/.]+$/, ".webp");
                                    return `${baseUrl}/${thumbKey}`;
                                };

                                return (
                                    <div key={size.name} className={`flex flex-col p-6 rounded-3xl bg-gradient-to-b ${size.color} border border-gray-800/50 shadow-xl group`}>
                                        <div 
                                            className="relative w-full aspect-square bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 shadow-inner cursor-pointer"
                                            onClick={() => setSelectedImage(getThumbUrl())}
                                        >
                                            <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiAvPgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIiAvPgo8L3N2Zz4=')]"></div>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={getThumbUrl()}
                                                alt={`${size.label} thumbnail`}
                                                className="w-full h-full object-contain relative z-10 group-hover:scale-105 transition-transform duration-500"
                                                loading="lazy"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    e.currentTarget.parentElement?.classList.add('flex', 'flex-col', 'items-center', 'justify-center', 'animate-pulse', 'pointer-events-none');
                                                    if (e.currentTarget.parentElement && e.currentTarget.parentElement.childElementCount < 3) {
                                                        const span = document.createElement('span');
                                                        span.className = 'text-indigo-400/80 text-sm font-medium z-10 mt-4';
                                                        span.innerText = 'Processing thumbnail...';

                                                        const icon = document.createElement('div');
                                                        icon.innerHTML = '<svg class="w-10 h-10 text-indigo-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>';
                                                        icon.className = 'z-10 animate-bounce';

                                                        e.currentTarget.parentElement.appendChild(icon);
                                                        e.currentTarget.parentElement.appendChild(span);
                                                    }
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center">
                                                <svg className="w-10 h-10 text-white opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="mt-6 flex flex-col items-center justify-center">
                                            <p className="text-lg font-bold text-gray-200">{size.label}</p>
                                            <div className="flex gap-2 mt-2">
                                                <span className="px-2 py-1 text-xs font-mono font-bold bg-white/5 rounded-md border border-white/10 uppercase tracking-wider text-gray-400">.WEBP</span>
                                            </div>
                                        </div>
                                        <div className="mt-6">
                                            <a 
                                                href={getThumbUrl()}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-colors border border-white/5"
                                                onClick={(e) => {
                                                    // Prevent opening modal if clicking download
                                                    e.stopPropagation();
                                                }}
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                Download image
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
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

                {/* Gallery Section */}
                <div className="w-full max-w-6xl mt-16 pt-16 border-t border-gray-800/80">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                        <div>
                            <h2 className="text-3xl font-extrabold text-white mb-2">Upload Gallery</h2>
                            <p className="text-gray-400">All your original images and generated thumbnails</p>
                        </div>
                        <button
                            onClick={fetchFiles}
                            className="p-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white transition-colors border border-gray-700 shadow-lg flex items-center justify-center group shrink-0"
                            title="Refresh Gallery"
                        >
                            <svg className={`w-5 h-5 ${isLoadingFiles ? 'animate-spin text-indigo-400' : 'opacity-80 group-hover:text-indigo-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>

                    {isLoadingFiles && dbFiles.length === 0 ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-2 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                        </div>
                    ) : dbFiles.length === 0 ? (
                        <div className="text-center py-16 bg-gray-900/40 rounded-3xl border border-gray-800/50">
                            <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-gray-400 text-lg">No images found. Upload your first image above!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-12">
                            {dbFiles.map((dbFile) => {
                                const baseUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;

                                const originalUrl = `${baseUrl}/${dbFile.key}`;

                                // Generate thumbnail keys based on the lambda logic
                                // Lambda: key.replace("uploads/", `thumbnails/${size.name}/`).replace(/\.[^/.]+$/, ".webp")
                                const getThumbUrl = (size: string) => {
                                    if (!dbFile.key) return '';
                                    let thumbKey = dbFile.key;
                                    if (thumbKey.startsWith('uploads/')) {
                                        thumbKey = thumbKey.replace('uploads/', `thumbnails/${size}/`);
                                    } else {
                                        thumbKey = `thumbnails/${size}/${thumbKey}`;
                                    }
                                    thumbKey = thumbKey.replace(/\.[^/.]+$/, ".webp");
                                    return `${baseUrl}/${thumbKey}`;
                                };

                                return (
                                    <div key={dbFile.id} className="backdrop-blur-md bg-gray-900/40 border border-gray-800 rounded-3xl p-6 md:p-8 shadow-xl hover:shadow-[0_0_40px_rgba(0,0,0,0.3)] hover:border-gray-700 transition-all duration-300">
                                        <div className="flex flex-col lg:flex-row gap-8">
                                            {/* Original Image */}
                                            <div className="w-full lg:w-1/3 flex flex-col">
                                                <h4 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"></span>
                                                    Original Image
                                                </h4>
                                                <div 
                                                    className="relative aspect-square bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 group shadow-inner cursor-pointer"
                                                    onClick={() => setSelectedImage(originalUrl)}
                                                >
                                                    <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiAvPgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIiAvPgo8L3N2Zz4=')]"></div>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={originalUrl} alt="Original" className="w-full h-full object-contain relative z-10 group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center">
                                                        <svg className="w-8 h-8 text-white opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="mt-4 p-3 bg-gray-950/50 rounded-xl border border-gray-800/80">
                                                    <p className="text-xs font-mono text-gray-400 break-all leading-relaxed" title={dbFile.key}>
                                                        {dbFile.key}
                                                    </p>
                                                    {dbFile.created_at && (
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            {new Date(dbFile.created_at).toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Thumbnails */}
                                            <div className="w-full lg:w-2/3 flex flex-col">
                                                <h4 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.8)]"></span>
                                                    Generated Thumbnails (.webp)
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 h-full">
                                                    {[
                                                        { name: 'large', label: 'Large (800px)', color: 'from-blue-500/10 to-transparent border-blue-500/20' },
                                                        { name: 'medium', label: 'Medium (400px)', color: 'from-purple-500/10 to-transparent border-purple-500/20' },
                                                        { name: 'small', label: 'Small (150px)', color: 'from-pink-500/10 to-transparent border-pink-500/20' }
                                                    ].map((size) => (
                                                        <div key={size.name} className={`flex flex-col p-4 rounded-2xl bg-gradient-to-b ${size.color} border border-gray-800/50`}>
                                                            <div 
                                                                className="relative w-full aspect-square bg-gray-950 rounded-xl overflow-hidden border border-gray-800 shadow-inner group cursor-pointer"
                                                                onClick={() => setSelectedImage(getThumbUrl(size.name))}
                                                            >
                                                                <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiAvPgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIiAvPgo8L3N2Zz4=')]"></div>
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img
                                                                    src={getThumbUrl(size.name)}
                                                                    alt={`${size.label} thumbnail`}
                                                                    className="w-full h-full object-contain relative z-10 group-hover:scale-105 transition-transform duration-500"
                                                                    loading="lazy"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                        e.currentTarget.parentElement?.classList.add('flex', 'flex-col', 'items-center', 'justify-center', 'animate-pulse', 'pointer-events-none');
                                                                        if (e.currentTarget.parentElement && e.currentTarget.parentElement.childElementCount < 3) {
                                                                            const span = document.createElement('span');
                                                                            span.className = 'text-indigo-400/80 text-sm font-medium z-10 mt-2';
                                                                            span.innerText = 'Processing...';

                                                                            const icon = document.createElement('div');
                                                                            icon.innerHTML = '<svg class="w-8 h-8 text-indigo-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>';
                                                                            icon.className = 'z-10 animate-bounce';

                                                                            e.currentTarget.parentElement.appendChild(icon);
                                                                            e.currentTarget.parentElement.appendChild(span);
                                                                        }
                                                                    }}
                                                                />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center">
                                                                    <svg className="w-8 h-8 text-white opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            <div className="mt-4 text-center">
                                                                <p className="text-sm font-bold text-gray-300">{size.label}</p>
                                                                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-mono">.WEBP</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* Lightbox Modal */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-12 animate-fade-in"
                    onClick={() => setSelectedImage(null)}
                >
                    <button 
                        className="absolute top-6 right-6 p-2 rounded-full bg-gray-800/80 text-white hover:bg-gray-700 transition flex items-center justify-center z-50 hover:scale-110 active:scale-95"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(null);
                        }}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div 
                        className="relative w-full h-full max-w-7xl max-h-full flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                            src={selectedImage as string} 
                            alt="View enlarged" 
                            className="max-w-full max-h-full object-contain drop-shadow-[0_0_40px_rgba(0,0,0,0.8)] rounded-xl"
                        />
                    </div>
                </div>
            )}

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
