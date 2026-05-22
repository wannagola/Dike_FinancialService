import { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import { getMe, getAccounts, createAccount, setPrimaryAccount, deleteAccount, updateBalance, updateMe, deleteMe, BANK_NAME, BANK_CODE } from '../api';
import { useAuth } from '../store/auth';
import type { ApiAccount, IconName } from '../types';

const MENUS: { icon: IconName; label: string; desc: string }[] = [
  { icon: 'settings', label: '접근성 설정', desc: '글자 크기, 음성 속도' },
  { icon: 'shield',   label: '보안 설정',   desc: '생체인증, PIN 변경' },
  { icon: 'bell',     label: '알림 설정',   desc: '푸시, SMS 알림' },
  { icon: 'settings', label: '앱 설정',     desc: '언어, 테마' },
];

const BANKS = Object.keys(BANK_CODE);

function AddAccountModal({ onClose, onAdded }: { onClose: () => void; onAdded: (acc: ApiAccount) => void }) {
  const [step, setStep] = useState<'bank' | 'number' | 'done'>('bank');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!accountNumber.trim()) return;
    setLoading(true);
    setError('');
    try {
      const acc = await createAccount(BANK_CODE[bankName], accountNumber.trim());
      onAdded(acc);
      setStep('done');
    } catch {
      setError('계좌 등록에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-t-3xl p-6 flex flex-col gap-5 animate-slide-in"
        style={{ background: '#111827' }}
        onClick={e => e.stopPropagation()}
      >
        {step === 'bank' && (
          <>
            <div className="text-[18px] font-bold text-on text-center">은행 선택</div>
            <div className="grid grid-cols-3 gap-2">
              {BANKS.map(b => (
                <button
                  key={b}
                  onClick={() => { setBankName(b); setStep('number'); }}
                  className="py-3 rounded-xl border text-[13px] font-medium transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                >
                  {b}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="text-[13px] text-mute text-center py-1">취소</button>
          </>
        )}

        {step === 'number' && (
          <>
            <button onClick={() => setStep('bank')} className="text-[13px] text-sub self-start">← 은행 변경</button>
            <div className="text-[18px] font-bold text-on text-center">{bankName} 계좌번호</div>
            <input
              type="tel"
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="계좌번호 입력 (숫자만)"
              className="w-full px-4 py-4 rounded-2xl text-[18px] font-semibold text-on bg-white/[0.07] border border-white/15 outline-none focus:border-blue-bright/60 placeholder:text-white/25"
              autoFocus
            />
            {error && <div className="text-[12px] text-red-400 text-center">{error}</div>}
            <button
              onClick={submit}
              disabled={!accountNumber || loading}
              className="w-full py-4 rounded-2xl font-semibold text-[16px] transition-all"
              style={{
                background: accountNumber && !loading ? '#3b82f6' : 'rgba(255,255,255,0.06)',
                color: accountNumber && !loading ? 'white' : 'rgba(255,255,255,0.25)',
              }}
            >
              {loading ? '등록 중...' : '계좌 등록'}
            </button>
          </>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <Icon name="check" size={32} color="#10b981" />
            </div>
            <div className="text-[18px] font-bold text-on">계좌 등록 완료!</div>
            <div className="text-[13px] text-sub">{bankName} 계좌가 등록되었습니다.</div>
            <button onClick={onClose} className="px-8 py-3 rounded-2xl border border-soft text-[14px] text-sub">
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EditProfileModal({ onClose, onSaved }: { onClose: () => void; onSaved: (name: string) => void }) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setLoading(true); setError('');
    const data: { name?: string; password?: string } = {};
    if (name && name !== user?.name) data.name = name;
    if (pw) data.password = pw;
    if (!Object.keys(data).length) { onClose(); return; }
    try {
      await updateMe(data);
      onSaved(name || user?.name || '');
    } catch {
      setError('수정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-3xl p-6 flex flex-col gap-4 animate-slide-in" style={{ background: '#111827' }} onClick={e => e.stopPropagation()}>
        <div className="text-[18px] font-bold text-on text-center">정보 수정</div>
        <input
          type="text" value={name} onChange={e => setName(e.target.value)} placeholder="이름"
          className="w-full px-4 py-4 rounded-2xl text-[15px] text-on bg-white/[0.07] border border-white/15 outline-none focus:border-blue-bright/60 placeholder:text-white/25"
        />
        <input
          type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="새 비밀번호 (변경 시에만 입력)"
          className="w-full px-4 py-4 rounded-2xl text-[15px] text-on bg-white/[0.07] border border-white/15 outline-none focus:border-blue-bright/60 placeholder:text-white/25"
        />
        {error && <div className="text-[12px] text-red-400 text-center">{error}</div>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl border border-soft text-[14px] text-sub">취소</button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-3.5 rounded-2xl text-[14px] font-semibold text-white"
            style={{ background: loading ? 'rgba(59,130,246,0.4)' : '#3b82f6' }}>
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyPageTab() {
  const { user, logout } = useAuth();
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [editingBalanceId, setEditingBalanceId] = useState<number | null>(null);
  const [balanceDraft, setBalanceDraft] = useState('');

  useEffect(() => {
    getMe().catch(() => null);
    getAccounts()
      .then(list => setAccounts([...list.filter(a => a.is_primary), ...list.filter(a => !a.is_primary)]))
      .catch(() => null);
  }, []);

  const handleSetPrimary = async (id: number) => {
    const updated = await setPrimaryAccount(id).catch(() => null);
    if (updated) setAccounts(prev => {
      const next = prev.map(a => ({ ...a, is_primary: a.id === id }));
      return [...next.filter(a => a.is_primary), ...next.filter(a => !a.is_primary)];
    });
  };

  const handleDeleteAccount = async (id: number) => {
    await deleteAccount(id).catch(() => null);
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  const handleUpdateBalance = async (id: number, balance: number) => {
    const updated = await updateBalance(id, balance).catch(() => null);
    if (updated) setAccounts(prev => prev.map(a => a.id === id ? { ...a, balance_cache: balance } : a));
  };

  const handleWithdraw = async () => {
    await deleteMe().catch(() => null);
    logout('');
  };

  const displayName = userName ?? user?.name ?? '—';

  return (
    <>
    {showAdd && (
      <AddAccountModal
        onClose={() => setShowAdd(false)}
        onAdded={(acc) => { setAccounts(prev => [...prev, acc]); setShowAdd(false); }}
      />
    )}
    {showEdit && (
      <EditProfileModal
        onClose={() => setShowEdit(false)}
        onSaved={(name) => { setUserName(name); setShowEdit(false); }}
      />
    )}
    {showWithdraw && (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-8" style={{ background: 'rgba(0,0,0,0.6)' }}>
        <div className="w-full rounded-2xl p-6 flex flex-col gap-4" style={{ background: '#1a2744' }}>
          <div className="text-[16px] font-bold text-on text-center">정말 탈퇴하시겠어요?</div>
          <div className="text-[13px] text-sub text-center">모든 데이터가 삭제되며 복구할 수 없습니다.</div>
          <div className="flex gap-3">
            <button onClick={() => setShowWithdraw(false)} className="flex-1 py-3 rounded-xl border border-soft text-[14px] text-sub">취소</button>
            <button onClick={handleWithdraw} className="flex-1 py-3 rounded-xl text-[14px] font-semibold text-white" style={{ background: '#ef4444' }}>탈퇴</button>
          </div>
        </div>
      </div>
    )}
    <div className="flex flex-col gap-4 px-5 py-4 animate-slide-in overflow-y-auto scrollbar-none">
      {/* 프로필 */}
      <div className="glass-elev rounded-2xl p-5 flex items-center gap-4 border border-soft">
        <div className="w-14 h-14 rounded-2xl bg-blue-bright/20 flex items-center justify-center">
          <Icon name="user" size={28} color="#60a5fa" />
        </div>
        <div className="flex-1">
          <div className="text-[18px] font-bold text-on">{displayName}</div>
          <div className="text-[13px] text-sub">{user?.login_id ?? ''}</div>
        </div>
        <div className="flex flex-col gap-1.5 items-end">
          <button onClick={() => setShowEdit(true)} className="px-3 py-1.5 rounded-xl border border-soft text-[12px] text-sub">수정</button>
          <button onClick={logout} className="px-3 py-1.5 rounded-xl border border-soft text-[12px] text-sub">로그아웃</button>
        </div>
      </div>

      {/* 등록 계좌 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <div className="text-[13px] text-sub">등록 계좌</div>
          {accounts.length > 0 && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-[12px] text-blue-bright border border-blue-bright/30"
              style={{ background: 'rgba(96,165,250,0.08)' }}
            >
              <Icon name="plus" size={12} color="#60a5fa" />
              계좌 추가
            </button>
          )}
        </div>
        {accounts.length === 0 && (
          <button
            onClick={() => setShowAdd(true)}
            className="glass rounded-xl px-4 py-5 flex flex-col items-center gap-2 border border-dashed border-white/15 w-full"
          >
            <Icon name="plus" size={22} color="rgba(255,255,255,0.3)" />
            <span className="text-[13px] text-mute">계좌를 추가해 보세요</span>
          </button>
        )}
        {accounts.map((acc) => (
          <div key={acc.id} className="glass rounded-xl px-4 py-3 flex flex-col gap-2 border border-soft">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/08 flex items-center justify-center shrink-0">
                <Icon name="bank" size={16} color="rgba(255,255,255,0.7)" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-on">{BANK_NAME[acc.bank_code] ?? acc.bank_code}</span>
                  {acc.is_primary ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-bright/20 text-blue-bright">대표</span>
                  ) : (
                    <button onClick={() => handleSetPrimary(acc.id)}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-white/15 text-mute">
                      대표 설정
                    </button>
                  )}
                </div>
                <div className="text-[11px] text-mute">{acc.account_number}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => { setEditingBalanceId(acc.id); setBalanceDraft(String(acc.balance_cache)); }}
                  className="text-[13px] font-semibold text-on"
                >
                  {acc.balance_cache.toLocaleString()}원
                </button>
                <button onClick={() => handleDeleteAccount(acc.id)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(239,68,68,0.12)' }}>
                  <Icon name="x" size={12} color="rgba(239,68,68,0.7)" />
                </button>
              </div>
            </div>
            {editingBalanceId === acc.id && (
              <div className="flex gap-2 pt-1">
                <input
                  type="tel"
                  value={balanceDraft}
                  onChange={e => setBalanceDraft(e.target.value.replace(/\D/g, ''))}
                  placeholder="잔액 입력"
                  className="flex-1 px-3 py-2 rounded-xl text-[14px] text-on bg-white/[0.07] border border-white/15 outline-none focus:border-blue-bright/60 placeholder:text-white/25"
                  autoFocus
                />
                <button
                  onClick={async () => {
                    await handleUpdateBalance(acc.id, Number(balanceDraft));
                    setEditingBalanceId(null);
                  }}
                  className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white"
                  style={{ background: '#3b82f6' }}
                >
                  저장
                </button>
                <button
                  onClick={() => setEditingBalanceId(null)}
                  className="px-3 py-2 rounded-xl text-[13px] text-sub border border-soft"
                >
                  취소
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 설정 메뉴 */}
      <div className="flex flex-col gap-2">
        <div className="text-[13px] text-sub px-1">설정</div>
        {MENUS.map((m) => (
          <button
            key={m.label}
            className="glass rounded-xl px-4 py-3 flex items-center gap-3 border border-soft w-full"
          >
            <div className="w-9 h-9 rounded-xl bg-white/08 flex items-center justify-center shrink-0">
              <Icon name={m.icon} size={16} color="rgba(255,255,255,0.7)" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-[14px] font-semibold text-on">{m.label}</div>
              <div className="text-[11px] text-mute">{m.desc}</div>
            </div>
            <Icon name="chevron-right" size={16} color="rgba(255,255,255,0.3)" />
          </button>
        ))}
      </div>

      {/* 회원 탈퇴 */}
      <button
        onClick={() => setShowWithdraw(true)}
        className="text-[12px] text-center py-3"
        style={{ color: 'rgba(239,68,68,0.5)' }}
      >
        회원 탈퇴
      </button>
    </div>
    </>
  );
}
