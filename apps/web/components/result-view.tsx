'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Copy, Download } from "lucide-react";
import { useState } from 'react';

interface ResultViewProps {
    data: any; // Ideally typed structure
    onReset: () => void;
}

export default function ResultView({ data, onReset }: ResultViewProps) {
    const [copied, setCopied] = useState(false);

    // Check if data is nested under data.data (from backend structure) or direct
    const content = data.data || data;

    const generateMarkdown = () => {
        return `---
title: "${content.title || 'Untitled'}"
source: "${data.original_url || 'Unknown'}"
tags: [${(content.tags || []).join(', ')}]
status: To Read
priority: ${content.priority || 'Medium'}
processed_at: ${data.processed_at || new Date().toISOString()}
---

## 📝 Summary
${content.summary || ''}

## 💡 Key Insights
${(content.key_insights || []).map((i: string) => `- ${i}`).join('\n')}

## ✅ Action Items
${(content.action_items || []).map((i: string) => `- [ ] ${i}`).join('\n')}
`;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generateMarkdown());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([generateMarkdown()], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `link-collector-${data.job_id || 'result'}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-[728px] mx-auto space-y-6"
        >
            <div className="flex justify-between items-center">
                <Button variant="ghost" onClick={onReset} className="text-muted-foreground hover:text-foreground">
                    &larr; Process another
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                        {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copied ? "Copied MD" : "Copy MD"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                        <Download className="w-4 h-4 mr-2" />
                        Download .md
                    </Button>
                </div>
            </div>

            <Card className="bg-card border-muted shadow-lg overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-muted/50 pb-4">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold leading-tight">
                                {content.title || "Processed Result"}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${content.priority === 'High' ? 'bg-red-500/10 text-red-500' :
                                        content.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' :
                                            'bg-blue-500/10 text-blue-500'
                                    }`}>
                                    {content.priority || 'Medium'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {(content.tags || []).join(' • ')}
                                </span>
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <section>
                        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                            📝 Summary
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {content.summary}
                        </p>
                    </section>

                    {content.key_insights && (
                        <section>
                            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                💡 Key Insights
                            </h3>
                            <ul className="space-y-2">
                                {content.key_insights.map((insight: string, i: number) => (
                                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        {insight}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {content.action_items && (
                        <section className="bg-muted/30 p-4 rounded-lg border border-dashed border-muted">
                            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                ✅ Action Items
                            </h3>
                            <ul className="space-y-2">
                                {content.action_items.map((item: string, i: number) => (
                                    <li key={i} className="text-sm flex items-start gap-3">
                                        <div className="mt-0.5 w-4 h-4 rounded border border-muted-foreground/40" />
                                        <span className="text-muted-foreground">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
