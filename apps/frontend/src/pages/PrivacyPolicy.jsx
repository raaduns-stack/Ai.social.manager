import React from 'react';
import privacyPolicyMd from '../content/privacy-policy.md?raw';

function renderTextWithLinks(text) {
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
  const urlRegex = /(https?:\/\/[^\s]+|raasocial\.io)/gi;

  if (!emailRegex.test(text) && !urlRegex.test(text)) {
    return text;
  }

  const words = text.split(/(\s+)/);
  return words.map((word, idx) => {
    // Reset regex index state
    emailRegex.lastIndex = 0;
    urlRegex.lastIndex = 0;

    if (emailRegex.test(word)) {
      const email = word.replace(/[.,:;()]$/, '');
      const punctuation = word.slice(email.length);
      return (
        <React.Fragment key={idx}>
          <a href={`mailto:${email}`} className="text-[#FF6600] font-semibold hover:underline transition-colors">
            {email}
          </a>
          {punctuation}
        </React.Fragment>
      );
    }

    if (urlRegex.test(word)) {
      const url = word.replace(/[.,:;()]$/, '');
      const punctuation = word.slice(url.length);
      const href = url.startsWith('http') ? url : `https://${url}`;
      return (
        <React.Fragment key={idx}>
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#FF6600] font-semibold hover:underline transition-colors">
            {url}
          </a>
          {punctuation}
        </React.Fragment>
      );
    }

    return word;
  });
}

function parseContent(text) {
  const lines = text.split('\n');
  const elements = [];
  let listItems = [];
  let listType = null; // 'bullet' or 'numbered'

  const flushList = (key) => {
    if (listItems.length > 0) {
      if (listType === 'numbered') {
        elements.push(
          <ol key={`list-${key}`} className="list-decimal pl-6 mb-6 space-y-2.5 text-base text-[#666666] leading-relaxed font-sans">
            {listItems.map((item, idx) => <li key={idx}>{renderTextWithLinks(item)}</li>)}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`list-${key}`} className="list-disc pl-6 mb-6 space-y-2.5 text-base text-[#666666] leading-relaxed font-sans">
            {listItems.map((item, idx) => <li key={idx}>{renderTextWithLinks(item)}</li>)}
          </ul>
        );
      }
      listItems = [];
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      flushList(i);
      continue;
    }

    // Determine H1/H2/H3/Paragraph based on standard compliance page styling
    if (i === 0 || line === 'RaaSocial Privacy Policy') {
      flushList(i);
      elements.push(
        <h1 key={i} className="text-4xl md:text-5xl font-extrabold font-['Plus_Jakarta_Sans'] text-[#111111] tracking-tight mb-8 border-b border-gray-100 pb-6">
          {line}
        </h1>
      );
    } else if (/^\d+\.\s+/.test(line)) {
      // e.g. "1. Information We Collect" or "10. Subscriptions and Billing"
      flushList(i);
      elements.push(
        <h2 key={i} className="text-2xl md:text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[#111111] tracking-tight mt-12 mb-5">
          {line}
        </h2>
      );
    } else if (/^\d+\.\d+\s+/.test(line)) {
      // e.g. "1.1 Account and Personal Information"
      flushList(i);
      elements.push(
        <h3 key={i} className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-[#111111] tracking-tight mt-8 mb-4">
          {line}
        </h3>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      listType = 'bullet';
      listItems.push(line.replace(/^[-*]\s+/, ''));
    } else if (/^\d+\.\s+/.test(line)) {
      listType = 'numbered';
      listItems.push(line.replace(/^\d+\.\s+/, ''));
    } else {
      flushList(i);
      elements.push(
        <p key={i} className="text-base text-[#666666] leading-relaxed mb-6 font-sans">
          {renderTextWithLinks(line)}
        </p>
      );
    }
  }

  flushList(lines.length);
  return elements;
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#FDFCFB] py-16 px-6 md:py-24">
      {/* Max-width reading container for long-form content */}
      <div className="max-w-3xl mx-auto bg-white rounded-card shadow-soft border border-[#E5E7EB] p-8 md:p-16">
        <div className="prose max-w-none">
          {parseContent(privacyPolicyMd)}
        </div>
      </div>
    </div>
  );
}
