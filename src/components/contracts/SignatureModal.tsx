'use client';

import { useTranslations } from 'next-intl';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ShieldCheck, X, PenLine, Check, Loader2, AlertTriangle, Globe, Cpu, Key } from 'lucide-react';
import canvasConfetti from 'canvas-confetti';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  contractTitle: string;
  contractContent: string;
  onSignedSuccess?: () => void;
}

export default function SignatureModal({
  isOpen,
  onClose,
  contractId,
  contractTitle,
  onSignedSuccess
}: SignatureModalProps) {
  const [signing, setSigning] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [signMethod, setSignMethod] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const t = useTranslations('signature_modal');

  // Canvas Drawing State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Initialize Canvas
  useEffect(() => {
    if (!isOpen || signMethod !== 'draw') return;

    // Small delay to ensure the DOM has completed rendering
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const parent = canvas.parentElement;
      if (!parent) return;
      
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width || 450;
      canvas.height = 200;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0f172a'; // Slate 900
      ctxRef.current = ctx;
    }, 150);

    return () => clearTimeout(timer);
  }, [isOpen, signMethod]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top
    };
  };

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDrawing.current = true;
    const pos = getPos(e);
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const pos = getPos(e);
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasDrawn(true);
  }, []);

  const stopDrawing = useCallback(() => {
    isDrawing.current = false;
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSign = async () => {
    if (signMethod === 'draw' && !hasDrawn) {
      setError(t('error_draw'));
      return;
    }
    if (signMethod === 'type' && !typedName.trim()) {
      setError(t('error_type'));
      return;
    }
    if (!acceptedTerms) {
      setError(t('error_terms'));
      return;
    }

    setSigning(true);
    setError('');

    try {
      // Direct call to signing endpoint
      const res = await fetch('/api/modules/e-signature/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, signerRole: 'tenant' }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al registrar firma');

      // Trigger Confetti!
      canvasConfetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });

      setSuccess(true);
      if (onSignedSuccess) {
        onSignedSuccess();
      }

      setTimeout(() => {
        onClose();
        setSuccess(false);
        setAcceptedTerms(false);
        setTypedName('');
        setHasDrawn(false);
      }, 3000);

    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : t('error_unexpected'));
    } finally {
      setSigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-card border border-border w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-foreground text-base">{t('title')}</h3>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">{t('audit_trail')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-muted rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {success ? (
            <div className="py-8 text-center space-y-4 animate-scale-up">
              <div className="w-16 h-16 bg-success/15 border border-success/30 text-success rounded-full flex items-center justify-center mx-auto shadow-md">
                <Check className="w-8 h-8 animate-bounce" />
              </div>
              <h4 className="text-xl font-extrabold text-foreground">{t('success_title')}</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                {t('success_desc')}
              </p>
              <div className="p-3 bg-muted border border-border rounded-2xl inline-flex items-center gap-2 text-[10px] font-bold text-ink-muted">
                <Key className="w-3.5 h-3.5 text-primary" /> {t('hash_label')}
              </div>
            </div>
          ) : (
            <>
              {/* Active info card */}
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <PenLine className="w-3.5 h-3.5" />
                  {t('document_label', { title: contractTitle })}
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {t('info_desc')}
                </p>
              </div>

              {/* Method Selector */}
              <div className="flex bg-muted p-1 rounded-2xl gap-1">
                <button
                  type="button"
                  onClick={() => setSignMethod('draw')}
                  className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    signMethod === 'draw'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('draw_signature')}
                </button>
                <button
                  type="button"
                  onClick={() => setSignMethod('type')}
                  className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    signMethod === 'type'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('type_name')}
                </button>
              </div>

              {/* Signature Board */}
              {signMethod === 'draw' ? (
                <div className="space-y-2">
                  <div className="relative border border-border bg-white rounded-2xl overflow-hidden shadow-inner flex items-center justify-center min-h-[200px] touch-none">
                    <canvas
                      ref={canvasRef}
                      className="w-full h-full cursor-crosshair"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                    {!hasDrawn && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/45 pointer-events-none select-none">
                        <PenLine className="w-6 h-6 mb-1 animate-pulse" />
                        <span className="text-[11px] font-semibold">{t('draw_here')}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="text-[10px] text-muted-foreground hover:text-destructive font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {t('clear_board')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder={t('name_placeholder')}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <p className="text-[10px] text-muted-foreground">{t('name_helper')}</p>
                </div>
              )}

              {/* Terms Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group p-1">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer shrink-0"
                />
                <span className="text-[11px] leading-relaxed text-muted-foreground font-semibold group-hover:text-foreground transition-colors">
                  {t('terms_text')}
                </span>
              </label>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Security and Metadatos Checklist */}
              <div className="border border-border rounded-2xl p-4 bg-muted/30 grid grid-cols-3 gap-3 text-[10px] font-semibold text-ink-muted">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-primary" /> {t('ip_address')}
                </div>
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-primary" /> {t('user_agent')}
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" /> {t('hash_sha256')}
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSign}
                disabled={signing}
                className="w-full py-3.5 bg-primary text-primary-foreground text-xs font-extrabold rounded-2xl hover:bg-primary/95 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-none"
              >
                {signing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('signing_blockchain')}
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    {t('sign_and_register')}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
