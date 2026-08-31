"use client";

import Script from "next/script";

export default function BotpressChat() {
  const scriptUrl = process.env.NEXT_PUBLIC_BOTPRESS_SCRIPT_URL;
  if (!scriptUrl) return null;

  return (
    <>
      <Script
        src="https://cdn.botpress.cloud/webchat/v2.5/inject.js"
        strategy="afterInteractive"
      />
      <Script src={scriptUrl} strategy="afterInteractive" />
    </>
  );
}
