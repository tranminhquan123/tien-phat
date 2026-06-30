// src/components/PublicLayout.tsx
import { lazy, Suspense, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ZaloButton } from './ZaloButton';

const ChatWidget = lazy(() =>
  import('./chat/ChatWidget').then((module) => ({ default: module.ChatWidget }))
);

export function PublicLayout() {
  const [showChatWidget, setShowChatWidget] = useState(false);

  useEffect(() => {
    // Chat không chặn nội dung chính và chỉ tải sau khi trang đầu tiên đã ổn định.
    const timer = window.setTimeout(() => setShowChatWidget(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ZaloButton />
      {showChatWidget && (
        <Suspense fallback={null}>
          <ChatWidget />
        </Suspense>
      )}
    </div>
  );
}
