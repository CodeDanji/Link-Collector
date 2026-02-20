'use client';

import { useState } from 'react';
import ZenInput from '@/components/zen-input';
import ProcessingState from '@/components/processing-state';
import ResultView from '@/components/result-view';
import { AdUnit } from '@/components/ad-sense';
import api from '@/lib/api';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';

type AppState = 'IDLE' | 'PROCESSING' | 'COMPLETED';

export default function Home() {
  const [state, setState] = useState<AppState>('IDLE');
  const [result, setResult] = useState<any>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  // Polling Query
  const { data: jobStatus } = useQuery({
    queryKey: ['jobStatus', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const response = await api.get(`/status/${jobId}`);
      return response.data;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'completed' || status === 'failed' ? false : 1000;
    },
  });

  // Watch for completion
  if (jobStatus?.status === 'completed' && state !== 'COMPLETED') {
    setResult(jobStatus.result);
    setState('COMPLETED');
    setJobId(null); // Stop polling
  } else if (jobStatus?.status === 'failed' && state !== 'IDLE') {
    alert(`Job failed: ${jobStatus.error}`);
    setState('IDLE');
    setJobId(null);
  }

  const processMutation = useMutation({
    mutationFn: async (data: { url: string; language: string }) => {
      const response = await api.post('/process', {
        url: data.url,
        language: data.language,
        user_id: 'demo_user'
      });
      return response.data;
    },
    onSuccess: (data) => {
      setJobId(data.job_id);
    },
    onError: (error) => {
      console.error(error);
      setState('IDLE');
      alert("Failed to process URL");
    }
  });

  const handleSubmit = (data: { url: string; language: string }) => {
    setState('PROCESSING');
    processMutation.mutate(data);
  };

  const handleReset = () => {
    setState('IDLE');
    setResult(null);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-background/95 overflow-hidden">
      <div className="w-full max-w-[728px] mx-auto mb-8">
        <AdUnit slotId="1234567890" />
      </div>

      <AnimatePresence mode="wait">
        {state === 'IDLE' && (
          <motion.div
            key="idle"
            exit={{ opacity: 0, y: -20 }}
            className="w-full"
          >
            <div className="text-center mb-12 space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60"
              >
                Link-Collector
              </motion.h1>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground text-lg max-w-md mx-auto"
              >
                Transform chaos into order. Your second brain starts here.
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex justify-center gap-3 pt-4"
              >
                <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                  🚀 Incoming: Notion & Obsidian Sync
                </span>
              </motion.div>
            </div>
            <ZenInput onSubmit={handleSubmit} isLoading={false} />
          </motion.div>
        )}

        {state === 'PROCESSING' && (
          <motion.div key="processing" className="w-full">
            <ProcessingState />
          </motion.div>
        )}

        {state === 'COMPLETED' && result && (
          <motion.div key="completed" className="w-full">
            <ResultView data={result} onReset={handleReset} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
