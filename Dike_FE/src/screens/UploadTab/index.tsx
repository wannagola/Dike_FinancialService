import { useState } from 'react';
import Icon from '../../components/Icon';
import ScanFlow from './ScanFlow';
import OcrConfirm from './OcrConfirm';
import DirectInput from './DirectInput';

type Step = 'home' | 'scan' | 'ocr' | 'direct' | 'done';

interface UploadTabProps {
  onAnnounce: (text: string) => void;
}

export default function UploadTab({ onAnnounce }: UploadTabProps) {
  const [step, setStep] = useState<Step>('home');

  if (step === 'scan')   return <ScanFlow onDone={() => setStep('ocr')} onBack={() => setStep('home')} />;
  if (step === 'ocr')    return <OcrConfirm onBack={() => setStep('scan')} onDone={() => setStep('done')} />;
  if (step === 'direct') return <DirectInput onBack={() => setStep('home')} onDone={() => setStep('done')} />;

  if (step === 'done') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 animate-fade-in px-8">
        <div className="w-20 h-20 rounded-full bg-green/20 flex items-center justify-center">
          <Icon name="check" size={36} color="#10b981" />
        </div>
        <div className="text-center">
          <div className="text-[20px] font-bold text-on mb-1">저장 완료!</div>
          <div className="text-[13px] text-sub">서류함에서 확인하세요.</div>
        </div>
        <button
          onClick={() => setStep('home')}
          className="px-8 py-3 rounded-2xl bg-blue-main text-white font-semibold text-[15px]"
        >
          다른 문서 등록
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-5 py-4 animate-slide-in">
      <div>
        <h2 className="text-[20px] font-bold text-on">문서 등록</h2>
        <p className="text-[13px] text-sub mt-1">어떻게 등록할까요?</p>
      </div>

      {/* 카메라 촬영 */}
      <button
        onClick={() => { setStep('scan'); onAnnounce('카메라를 시작합니다.'); }}
        className="glass-elev rounded-2xl p-5 flex items-center gap-4 border border-soft text-left"
      >
        <div className="w-14 h-14 rounded-2xl bg-blue-bright/15 flex items-center justify-center shrink-0">
          <Icon name="camera" size={28} color="#60a5fa" />
        </div>
        <div>
          <div className="text-[16px] font-bold text-on">카메라 촬영</div>
          <div className="text-[12px] text-sub mt-0.5">AI가 자동으로 내용을 인식해요</div>
        </div>
      </button>

      {/* 직접 입력 */}
      <button
        onClick={() => { setStep('direct'); onAnnounce('직접 입력 화면으로 이동합니다.'); }}
        className="glass-elev rounded-2xl p-5 flex items-center gap-4 border border-soft text-left"
      >
        <div className="w-14 h-14 rounded-2xl bg-blue-bright/15 flex items-center justify-center shrink-0">
          <Icon name="pen" size={28} color="#60a5fa" />
        </div>
        <div>
          <div className="text-[16px] font-bold text-on">직접 입력</div>
          <div className="text-[12px] text-sub mt-0.5">키보드 · 음성 · 손글씨 중 선택</div>
        </div>
      </button>
    </div>
  );
}
