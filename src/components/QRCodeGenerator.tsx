import { useState, useRef, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Upload, Palette, Square, Circle, RectangleHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

type QRStyle = 'squares' | 'dots' | 'rounded';

interface QRSettings {
  content: string;
  fgColor: string;
  bgColor: string;
  style: QRStyle;
  logo: string | null;
  logoSize: number;
}

const StyleButton = ({ 
  active, 
  onClick, 
  children, 
  icon: Icon 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200",
      active 
        ? "bg-primary text-primary-foreground border-primary shadow-lg" 
        : "bg-secondary/50 text-secondary-foreground border-border hover:bg-secondary hover:border-primary/30"
    )}
  >
    <Icon className="w-4 h-4" />
    <span className="text-sm font-medium">{children}</span>
  </button>
);

const ColorPicker = ({ 
  label, 
  value, 
  onChange 
}: { 
  label: string; 
  value: string; 
  onChange: (color: string) => void;
}) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
    <div className="flex items-center gap-3">
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-12 rounded-lg cursor-pointer border-2 border-border hover:border-primary/50 transition-colors"
          style={{ padding: 0 }}
        />
      </div>
      <Input
        value={value.toUpperCase()}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono text-sm uppercase w-28"
        maxLength={7}
      />
    </div>
  </div>
);

export const QRCodeGenerator = () => {
  const [settings, setSettings] = useState<QRSettings>({
    content: 'https://lovable.dev',
    fgColor: '#0D9488',
    bgColor: '#FFFFFF',
    style: 'squares',
    logo: null,
    logoSize: 50,
  });

  const qrRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateSetting = <K extends keyof QRSettings>(key: K, value: QRSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateSetting('logo', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const removeLogo = () => {
    updateSetting('logo', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadQR = useCallback(() => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'qr-code.png';
      link.href = url;
      link.click();
    }
  }, []);

  const getQRRenderProps = () => {
    const baseProps = {
      value: settings.content || 'https://lovable.dev',
      size: 280,
      fgColor: settings.fgColor,
      bgColor: settings.bgColor,
      level: 'H' as const,
      includeMargin: true,
      imageSettings: settings.logo ? {
        src: settings.logo,
        height: settings.logoSize,
        width: settings.logoSize,
        excavate: true,
      } : undefined,
    };

    return baseProps;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="gradient-text">QR Code</span> Generator
          </h1>
          <p className="text-muted-foreground text-lg">
            Create beautiful, customized QR codes in seconds
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Controls Panel */}
          <div className="glass-card rounded-2xl p-6 md:p-8 space-y-6 animate-slide-up order-2 lg:order-1">
            {/* Content Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Content</Label>
              <Input
                value={settings.content}
                onChange={(e) => updateSetting('content', e.target.value)}
                placeholder="Enter URL or text..."
                className="h-12 text-base"
              />
            </div>

            {/* Color Pickers */}
            <div className="grid grid-cols-2 gap-6">
              <ColorPicker
                label="Foreground"
                value={settings.fgColor}
                onChange={(color) => updateSetting('fgColor', color)}
              />
              <ColorPicker
                label="Background"
                value={settings.bgColor}
                onChange={(color) => updateSetting('bgColor', color)}
              />
            </div>

            {/* Style Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-muted-foreground">Style</Label>
              <div className="flex flex-wrap gap-2">
                <StyleButton
                  active={settings.style === 'squares'}
                  onClick={() => updateSetting('style', 'squares')}
                  icon={Square}
                >
                  Squares
                </StyleButton>
                <StyleButton
                  active={settings.style === 'dots'}
                  onClick={() => updateSetting('style', 'dots')}
                  icon={Circle}
                >
                  Dots
                </StyleButton>
                <StyleButton
                  active={settings.style === 'rounded'}
                  onClick={() => updateSetting('style', 'rounded')}
                  icon={RectangleHorizontal}
                >
                  Rounded
                </StyleButton>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-muted-foreground">Logo / Image</Label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Logo
                </Button>
                {settings.logo && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeLogo}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              {settings.logo && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Logo Size</span>
                    <span className="text-sm font-mono text-foreground">{settings.logoSize}px</span>
                  </div>
                  <Slider
                    value={[settings.logoSize]}
                    onValueChange={([value]) => updateSetting('logoSize', value)}
                    min={30}
                    max={80}
                    step={1}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Download Button */}
            <Button
              onClick={downloadQR}
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 transition-all duration-200 glow-effect"
            >
              <Download className="w-5 h-5 mr-2" />
              Download QR Code
            </Button>
          </div>

          {/* Preview Panel */}
          <div className="glass-card rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center animate-slide-up order-1 lg:order-2" style={{ animationDelay: '0.1s' }}>
            <div className="mb-4 flex items-center gap-2 text-muted-foreground">
              <Palette className="w-4 h-4" />
              <span className="text-sm font-medium">Live Preview</span>
            </div>
            
            <div 
              ref={qrRef}
              className="relative p-6 rounded-2xl bg-card shadow-inner border border-border/50"
              style={{ backgroundColor: settings.bgColor }}
            >
              <QRCodeCanvas {...getQRRenderProps()} />
            </div>

            <p className="mt-6 text-sm text-muted-foreground text-center max-w-xs">
              Scan with any QR reader to test your code
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-10 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          Made with <span className="text-primary">♥</span> using Lovable
        </p>
      </div>
    </div>
  );
};
