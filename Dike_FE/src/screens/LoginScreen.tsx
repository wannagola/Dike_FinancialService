import { useState } from 'react';
import { useAuth } from '../store/auth';
import { register, unlockAccount } from '../api';

export default function LoginScreen() {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'unlock'>('login');
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [unlockDone, setUnlockDone] = useState(false);

  const submit = async () => {
    if (!id || !pw) return;
    setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        await login(id, pw);
      } else if (mode === 'register') {
        if (!name) { setError('이름을 입력해주세요.'); setLoading(false); return; }
        await register(id, pw, name);
        await login(id, pw);
      } else if (mode === 'unlock') {
        await unlockAccount(id, pw);
        setUnlockDone(true);
      }
    } catch (e: unknown) {
      const code = (e as { code?: string }).code;
      if (code === 'AUTH_001') setError('아이디 또는 비밀번호가 틀렸습니다.');
      else if (code === 'AUTH_005' || code === 'AUTH_006') {
        setError('계정이 잠겨 있습니다.');
        // 잠금 해제 안내 표시 — 별도 버튼으로 이동 가능하게
      }
      else if (code === 'AUTH_010') setError('이미 사용 중인 아이디입니다.');
      else setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-deep flex items-center justify-center px-6">
      <div className="w-full" style={{ maxWidth: 390 }}>
        {/* 로고 */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-blue-bright/20 flex items-center justify-center mb-3">
            <span className="text-[32px] font-bold text-blue-bright">D</span>
          </div>
          <span className="text-[26px] font-bold text-on tracking-widest">DIKE</span>
          <span className="text-[13px] text-sub mt-1">접근성 중심 금융 서비스</span>
        </div>

        {/* 탭 */}
        <div className="flex rounded-xl overflow-hidden border border-soft mb-6">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setUnlockDone(false); }}
              className="flex-1 py-3 text-[14px] font-semibold transition-all"
              style={{
                background: mode === m ? '#3b82f6' : 'transparent',
                color: mode === m ? 'white' : 'rgba(255,255,255,0.5)',
              }}
            >
              {m === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        {/* 잠금 해제 모드 */}
        {mode === 'unlock' && (
          <div className="mb-4 px-4 py-3 rounded-xl border text-[13px]"
            style={{ background: 'rgba(251,191,36,0.08)', borderColor: 'rgba(251,191,36,0.3)', color: '#fbbf24' }}>
            계정 잠금 해제 모드입니다. 아이디와 비밀번호를 입력하세요.
          </div>
        )}

        {unlockDone ? (
          <div className="flex flex-col gap-4">
            <div className="px-4 py-4 rounded-xl border text-[14px] text-center"
              style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.3)', color: '#6ee7b7' }}>
              잠금이 해제되었습니다. 다시 로그인해 주세요.
            </div>
            <button
              onClick={() => { setMode('login'); setUnlockDone(false); setError(''); }}
              className="w-full py-4 rounded-xl font-semibold text-[16px]"
              style={{ background: '#3b82f6', color: 'white' }}
            >
              로그인하기
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {mode === 'register' && (
              <input
                type="text"
                placeholder="이름"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-4 rounded-xl text-[15px] text-on bg-white/[0.07] border border-white/15 outline-none focus:border-blue-bright/60 placeholder:text-white/30"
              />
            )}
            <input
              type="text"
              placeholder="아이디"
              value={id}
              onChange={e => setId(e.target.value)}
              autoCapitalize="none"
              className="w-full px-4 py-4 rounded-xl text-[15px] text-on bg-white/[0.07] border border-white/15 outline-none focus:border-blue-bright/60 placeholder:text-white/30"
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={pw}
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              className="w-full px-4 py-4 rounded-xl text-[15px] text-on bg-white/[0.07] border border-white/15 outline-none focus:border-blue-bright/60 placeholder:text-white/30"
            />

            {error && (
              <div className="flex flex-col gap-2">
                <div className="px-4 py-3 rounded-xl border text-[13px]"
                  style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                  {error}
                </div>
                {(error.includes('잠겨')) && mode !== 'unlock' && (
                  <button
                    onClick={() => { setMode('unlock'); setError(''); }}
                    className="text-[13px] text-center py-2 rounded-xl border"
                    style={{ borderColor: 'rgba(251,191,36,0.4)', color: '#fbbf24', background: 'rgba(251,191,36,0.06)' }}
                  >
                    계정 잠금 해제하기
                  </button>
                )}
              </div>
            )}

            <button
              onClick={submit}
              disabled={loading}
              className="w-full py-4 rounded-xl font-semibold text-[16px] mt-2 transition-all"
              style={{
                background: loading ? 'rgba(59,130,246,0.4)' : '#3b82f6',
                color: 'white',
              }}
            >
              {loading ? '처리 중...' : mode === 'login' ? '로그인' : mode === 'unlock' ? '잠금 해제' : '회원가입'}
            </button>

            {mode === 'login' && (
              <button
                onClick={() => { setMode('unlock'); setError(''); }}
                className="text-[12px] text-mute text-center py-1"
              >
                계정이 잠겼나요? 잠금 해제
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
