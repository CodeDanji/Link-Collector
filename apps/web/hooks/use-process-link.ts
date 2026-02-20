import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

// Note: Replace with actual backend API response type
export interface ProcessResponse {
    title: string;
    summary: string;
    key_insights: string[];
    action_items: string[];
    tags: string[];
    priority: string;
    category: string;
}

export const useProcessLink = () => {
    const { getToken } = useAuth();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    return useMutation({
        mutationFn: async (urlToProcess: string): Promise<ProcessResponse> => {
            const token = await getToken();
            const headers = {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {})
            };

            // 1. Queue the processing job
            const startResponse = await fetch(`${apiUrl}/process`, {
                method: "POST",
                headers,
                body: JSON.stringify({ url: urlToProcess, user_id: "demo_user", language: "Auto" }),
            });

            if (!startResponse.ok) {
                const errorData = await startResponse.json().catch(() => null);
                const msg = errorData?.detail ? JSON.stringify(errorData.detail) : `API Error: ${startResponse.status}`;
                throw new Error(msg);
            }

            const { job_id } = await startResponse.json();

            // 2. Poll for completion
            while (true) {
                await new Promise((resolve) => setTimeout(resolve, 2000)); // Poll every 2s

                const statusRes = await fetch(`${apiUrl}/status/${job_id}`, { headers });
                if (!statusRes.ok) throw new Error("Failed to fetch job status");

                const jobData = await statusRes.json();

                if (jobData.status === "completed") {
                    return jobData.result.data as ProcessResponse;
                } else if (jobData.status === "failed") {
                    throw new Error(jobData.error || "Extraction failed on server.");
                }
                // If "processing" or "queued", continue loop
            }
        },
    });
};
