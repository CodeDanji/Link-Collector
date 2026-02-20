'use client';

import Script from 'next/script';
import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

interface AdUnitProps {
    slotId: string;
    format?: 'auto' | 'fluid' | 'rectangle';
    className?: string;
}

export function AdSenseScript({ clientIds }: { clientIds: string }) {
    return (
        <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientIds}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
        />
    );
}

export function AdUnit({ slotId, format = 'auto', className }: AdUnitProps) {
    const adLoaded = useRef(false);

    useEffect(() => {
        if (!adLoaded.current) {
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                adLoaded.current = true;
            } catch (e) {
                console.error("AdSense Error", e);
            }
        }
    }, []);

    return (
        <div className={className}>
            <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
                data-ad-slot={slotId}
                data-ad-format={format}
                data-full-width-responsive="true"
            />
        </div>
    );
}
