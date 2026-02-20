'use client';

import { motion } from 'framer-motion';
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from 'react';

const steps = [
    "Analyzing URL structure...",
    "Running scraping waterfall...",
    "Extracting content...",
    "Evaluating key insights...",
    "Generating action items...",
    "Finalizing knowledge block..."
];

export default function ProcessingState() {
    const [progress, setProgress] = useState(0);
    const [stepIndex, setStepIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((oldProgress) => {
                if (oldProgress >= 100) {
                    clearInterval(timer);
                    return 100;
                }
                return Math.min(oldProgress + 1, 100);
            });
        }, 100);

        const stepTimer = setInterval(() => {
            setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 2000);

        return () => {
            clearInterval(timer);
            clearInterval(stepTimer);
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md mx-auto text-center space-y-6 p-8"
        >
            <div className="space-y-2">
                <h3 className="text-xl font-medium tracking-tight">Processing Knowledge</h3>
                <p className="text-sm text-muted-foreground h-5 transition-all duration-300">
                    {steps[stepIndex]}
                </p>
            </div>

            <Progress value={progress} className="h-1" />

            <div className="grid grid-cols-3 gap-2 mt-8 opacity-50">
                <div className="h-12 bg-muted rounded-lg w-full animate-pulse" />
                <div className="h-12 bg-muted rounded-lg w-full animate-pulse delay-75" />
                <div className="h-12 bg-muted rounded-lg w-full animate-pulse delay-150" />
            </div>
        </motion.div>
    );
}
