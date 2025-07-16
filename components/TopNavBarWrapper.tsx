"use client";

import dynamic from 'next/dynamic';

// Dynamically import TopNavBar with ssr disabled to prevent double rendering
const TopNavBar = dynamic(() => import('./TopNavBar'), { 
  ssr: false,
  loading: () => null
});

export default function TopNavBarWrapper() {
  return <TopNavBar />;
} 