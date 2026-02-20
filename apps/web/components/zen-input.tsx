'use client';

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, Link as LinkIcon, Loader2, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ZenInputProps {
    onSubmit: (data: { url: string; language: string }) => void;
    isLoading: boolean;
}

export default function ZenInput({ onSubmit, isLoading }: ZenInputProps) {
    const [url, setUrl] = useState('');
    const [language, setLanguage] = useState('Auto');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            onSubmit({ url, language });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl mx-auto p-4"
        >
            <form onSubmit={handleSubmit} className="relative flex flex-col gap-4">
                <div className="relative flex items-center">
                    <div className="absolute left-4 text-muted-foreground">
                        <LinkIcon className="w-5 h-5" />
                    </div>
                    <Input
                        type="url"
                        placeholder="Paste URL here..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="pl-12 pr-4 h-14 text-lg bg-card border-none shadow-lg rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/20 transition-all font-light"
                        disabled={isLoading}
                    />
                </div>

                <div className="flex justify-between items-center px-2">
                    <Select value={language} onValueChange={setLanguage} disabled={isLoading}>
                        <SelectTrigger className="w-[140px] h-10 border-none bg-transparent hover:bg-muted/50 rounded-lg focus:ring-0">
                            <Globe className="w-4 h-4 mr-2 opacity-50" />
                            <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Auto">Auto Detect</SelectItem>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Korean">Korean (한국어)</SelectItem>
                            <SelectItem value="Japanese">Japanese (日本語)</SelectItem>
                            <SelectItem value="Chinese">Chinese (中文)</SelectItem>
                            <SelectItem value="Spanish">Spanish</SelectItem>
                            <SelectItem value="French">French</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        size="lg"
                        type="submit"
                        disabled={!url || isLoading}
                        className="rounded-xl px-8 shadow-md"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Processing
                            </>
                        ) : (
                            <>
                                Summarize
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </>
                        )}
                    </Button>
                </div>
            </form>
            <p className="text-center text-xs text-muted-foreground mt-8 font-mono opacity-50">
                Link-Collector v2.0 &bull; Knowledge ETL Pipeline
            </p>
        </motion.div>
    );
}
