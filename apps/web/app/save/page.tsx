"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useProcessLink } from "@/hooks/use-process-link";
import { motion } from "framer-motion";
import ResultView from "@/components/result-view";

function SaveContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isSignedIn, isLoaded } = useAuth();
    const { mutate: processLink, isPending, isSuccess, isError, error, data } = useProcessLink();

    const url = searchParams.get("url");
    const [domain, setDomain] = useState<string>("Unknown Source");
    const [currentStepText, setCurrentStepText] = useState("Initializing pipeline...");

    // Extract domain for UI beautifully
    useEffect(() => {
        if (url) {
            try {
                const parsed = new URL(url);
                setDomain(parsed.hostname.replace("www.", ""));
            } catch (err) {
                // Ignore parsing invalid URLs; fallback applies.
                setDomain("Website");
            }
        }
    }, [url]);

    // Handle Processing
    useEffect(() => {
        // Only fire if loaded, signed in, and we have a URL
        if (isLoaded && isSignedIn && url && !isPending && !isSuccess && !isError) {
            processLink(url);
        }
    }, [isLoaded, isSignedIn, url, isPending, isSuccess, isError, processLink]);

    // Loading text cycler (Fake progress perception)
    useEffect(() => {
        if (isPending) {
            const steps = [
                "Connecting to Source...",
                "Bypassing Anti-Bot Defenses...",
                "Extracting Raw Text...",
                "Sending to LLM...",
                `Structuring Insights from ${domain}...`
            ];
            let i = 0;
            const interval = setInterval(() => {
                i = (i + 1) % steps.length;
                setCurrentStepText(steps[i]!);
            }, 3500); // Change text every 3.5s (Assuming a 15-20s total wait)

            return () => clearInterval(interval);
        }
    }, [isPending, domain]);


    // Error / Invalid States
    if (!url) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
                <h1 className="text-2xl font-bold mb-2">No URL Provided</h1>
                <p className="text-muted-foreground mb-6">Please use the Link-Collector Extension to save a link.</p>
                <button onClick={() => router.push("/")} className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Go Home</button>
            </div>
        );
    }

    if (isLoaded && !isSignedIn) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-2xl font-bold mb-2">Almost there!</h1>
                    <p className="text-muted-foreground mb-6">Sign in to save this link to your Second Brain.</p>
                    {/* The SignIn button automatically redirects back here because of Next.js path keeping, 
                but we can force it via forceRedirectUrl if needed */}
                    <SignInButton mode="modal" forceRedirectUrl={`/save?url=${encodeURIComponent(url)}`}>
                        <button className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition-colors">
                            Sign in with Clerk
                        </button>
                    </SignInButton>
                </motion.div>
            </div>
        );
    }

    if (isError) {
        const isQuotaError = error?.message?.toLowerCase().includes("upgrade to pro");

        if (isQuotaError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md bg-card border-2 border-primary/20 rounded-xl p-8 shadow-xl">
                        <div className="text-4xl mb-4">💎</div>
                        <h1 className="text-2xl font-bold mb-2">Free Limit Reached</h1>
                        <p className="text-muted-foreground mb-6">You have exhausted your free summary credits for this month. Upgrade to Pro for unlimited summaries, Gemini 1.5 Pro video processing, and priority queuing.</p>

                        <div className="flex flex-col gap-3">
                            <button className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition-all shadow-md">
                                Upgrade to Pro - $4.99/mo
                            </button>
                            <button onClick={() => router.push("/")} className="w-full px-4 py-2 bg-transparent text-muted-foreground hover:text-foreground text-sm">
                                Maybe Later (Go to Dashboard)
                            </button>
                        </div>
                    </motion.div>
                </div>
            )
        }

        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
                <h1 className="text-2xl font-bold text-red-500 mb-2">Extraction Failed</h1>
                <p className="text-muted-foreground max-w-md mb-6">{error?.message || "Something went wrong while processing the link."}</p>
                <div className="flex gap-4">
                    <button onClick={() => processLink(url)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md">Try Again</button>
                    <button onClick={() => router.push("/")} className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Dashboard</button>
                </div>
            </div>
        )
    }

    if (isSuccess && data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 py-8 w-full">
                <ResultView data={{ data: data, original_url: url }} onReset={() => router.push("/")} />
            </div>
        )
    }

    // Loading State (The core UX)
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center max-w-sm w-full"
            >
                {/* Pulsing Core Animation */}
                <div className="relative flex items-center justify-center w-24 h-24 mb-8">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="absolute inset-0 bg-blue-500 rounded-full blur-xl"
                    />
                    <div className="relative bg-background border-2 border-primary/20 p-4 rounded-xl z-10 shadow-lg">
                        <svg className="w-8 h-8 text-primary animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                    </div>
                </div>

                <h2 className="text-2xl font-bold mb-2">Processing Link</h2>
                <p className="text-muted-foreground font-mono text-sm break-all mb-8 opacity-80">{url}</p>

                {/* Dynamic Status Text */}
                <div className="h-6 overflow-hidden relative w-full">
                    <motion.p
                        key={currentStepText}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="text-sm font-medium text-primary absolute w-full"
                    >
                        {currentStepText}
                    </motion.p>
                </div>

                {/* Minimal Progress Bar Fake */}
                <div className="w-full bg-secondary h-1.5 rounded-full mt-4 overflow-hidden">
                    <motion.div
                        initial={{ width: "5%" }}
                        animate={{ width: "95%" }}
                        transition={{ duration: 15, ease: "linear" }}
                        className="h-full bg-primary"
                    />
                </div>

            </motion.div>
        </div>
    );
}

// Wrap in Suspense because we are using useSearchParams()
export default function SavePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <SaveContent />
        </Suspense>
    );
}
