import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type FrameStyle = 'none' | 'simple' | 'rounded' | 'badge' | 'ticket';
export type CTAOption = 'none' | 'scan-me' | 'scan-to-visit' | 'scan-for-more' | 'custom';

interface QRFrameWrapperProps {
  frameStyle: FrameStyle;
  frameColor: string;
  ctaOption: CTAOption;
  customCTA: string;
  ctaColor: string;
  children: React.ReactNode;
  bgColor: string;
}

const getCTAText = (option: CTAOption, customText: string): string => {
  switch (option) {
    case 'scan-me':
      return 'SCAN ME';
    case 'scan-to-visit':
      return 'SCAN TO VISIT';
    case 'scan-for-more':
      return 'SCAN FOR MORE';
    case 'custom':
      return customText || 'SCAN ME';
    default:
      return '';
  }
};

export const QRFrameWrapper = forwardRef<HTMLDivElement, QRFrameWrapperProps>(
  ({ frameStyle, frameColor, ctaOption, customCTA, ctaColor, children, bgColor }, ref) => {
    const ctaText = getCTAText(ctaOption, customCTA);
    const showCTA = ctaOption !== 'none' && ctaText;
    const hasFrame = frameStyle !== 'none';

    const frameStyles: Record<FrameStyle, string> = {
      none: '',
      simple: 'border-4',
      rounded: 'border-4 rounded-2xl',
      badge: 'border-4 rounded-2xl',
      ticket: 'border-4 rounded-lg',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex flex-col items-center',
          hasFrame && frameStyles[frameStyle]
        )}
        style={{ 
          borderColor: hasFrame ? frameColor : 'transparent',
          backgroundColor: bgColor,
        }}
      >
        {/* Top CTA for ticket style */}
        {frameStyle === 'ticket' && showCTA && (
          <div 
            className="w-full py-2 px-4 text-center font-bold text-sm tracking-wider"
            style={{ backgroundColor: frameColor, color: ctaColor }}
          >
            {ctaText}
          </div>
        )}
        
        <div className={cn(
          'flex items-center justify-center',
          hasFrame ? 'p-3' : '',
          frameStyle === 'ticket' ? 'pt-2 pb-2' : ''
        )}>
          {children}
        </div>
        
        {/* Bottom CTA for badge style or default */}
        {showCTA && frameStyle !== 'ticket' && (
          <div 
            className={cn(
              'w-full py-2.5 px-4 text-center font-bold text-sm tracking-wider',
              frameStyle === 'badge' ? 'rounded-b-xl' : ''
            )}
            style={{ 
              backgroundColor: hasFrame ? frameColor : 'transparent',
              color: ctaColor,
            }}
          >
            {ctaText}
          </div>
        )}
      </div>
    );
  }
);

QRFrameWrapper.displayName = 'QRFrameWrapper';

export const CTA_OPTIONS: { value: CTAOption; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'scan-me', label: 'Scan Me' },
  { value: 'scan-to-visit', label: 'Scan to Visit' },
  { value: 'scan-for-more', label: 'Scan for More' },
  { value: 'custom', label: 'Custom...' },
];

export const FRAME_OPTIONS: { value: FrameStyle; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'simple', label: 'Simple' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'badge', label: 'Badge' },
  { value: 'ticket', label: 'Ticket' },
];
