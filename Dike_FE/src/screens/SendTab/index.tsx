import { useState, useRef, useEffect } from 'react';
import Icon from '../../components/Icon';
import HoldButton from '../../components/HoldButton';
import BigWriteOverlay from '../../components/BigWriteOverlay';
import NumPad from './NumPad';
import { getAccounts, sendMoney, BANK_CODE, BANK_NAME } from '../../api';
import type { Contact } from '../../types';

type Step = 'contacts' | 'new-account' | 'amount' | 'confirm' | 'done';
type AmountMethod = 'numpad' | 'voice' | 'handwrite';
type AcctMethod   = 'keyboard' | 'voice' | 'handwrite';

const RECENT_CONTACTS: Contact[] = [
  { id: '1', name: '엄마',     bank: '국민은행', account: '123-456-789012', avatar: '👩' },
  { id: '2', name: '친구 민준', bank: '신한은행', account: '110-234-567890', avatar: '👦' },
  { id: '3', name: '카드사',   bank: '삼성카드', account: '4321-0000-0000', avatar: '💳' },
];

const BANKS = [
  '국민은행', '신한은행', '우리은행', '하나은행',
  '농협은행', '카카오뱅크', '토스뱅크', '기업은행',
];

interface SendTabProps {
  onAnnounce: (text: string) => void;
}

export default function SendTab({ onAnnounce }: SendTabProps) {
  const [step, setStep]             = useState<Step>('contacts');
  const [recipient, setRecipient]   = useState<Contact | null>(null);
  const [amount, setAmount]         = useState('');
  const [amtMethod, setAmtMethod]   = useState<AmountMethod>('numpad');
  const [fromAccountId, setFromAccountId] = useState<number | null>(null);

  useEffect(() => {
    getAccounts()
      .then(list => {
        const primary = list.find(a => a.is_primary) ?? list[0];
        if (primary) setFromAccountId(primary.id);
      })
      .catch(() => null);
  }, []);

  /* 새 계좌 입력 상태 */
  const [newBank, setNewBank]       = useState('');
  const [newAcct, setNewAcct]       = useState('');
  const [newName, setNewName]       = useState('');
  const [acctMethod, setAcctMethod] = useState<AcctMethod>('keyboard');
  const [acctChecked, setAcctChecked] = useState(false); // 예금주 확인 여부
  const [showCanvas, setShowCanvas] = useState(false);
  const [canvasTarget, setCanvasTarget] = useState<'acct' | 'amount'>('acct');

  /* 음성 */
  const [amtRec, setAmtRec]   = useState(false);
  const [acctRec, setAcctRec] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* ── 헬퍼 ── */
  const selectRecipient = (c: Contact) => {
    setRecipient(c);
    setStep('amount');
    onAnnounce(`${c.name}에게 보냅니다. 금액을 입력하세요.`);
  };

  const goToNewAccount = () => {
    setNewBank(''); setNewAcct(''); setNewName('');
    setAcctChecked(false); setAcctMethod('keyboard');
    setStep('new-account');
    onAnnounce('새 계좌를 입력해 주세요.');
  };

  const checkAccount = () => {
    if (!newBank || !newAcct) return;
    setNewName('홍길동'); // mock 예금주
    setAcctChecked(true);
    onAnnounce('예금주가 확인됐습니다. 홍길동.');
  };

  const confirmNewAccount = () => {
    const c: Contact = {
      id: 'new',
      name: newName || '새 계좌',
      bank: BANK_CODE[newBank] ? newBank : newBank,
      account: newAcct,
      avatar: '🏦',
    };
    setRecipient(c);
    setStep('amount');
    onAnnounce(`${newBank} ${newAcct}로 보냅니다. 금액을 입력하세요.`);
  };

  const goConfirm = () => {
    if (!amount) return;
    setStep('confirm');
    onAnnounce(`${Number(amount).toLocaleString()}원을 보냅니다. 길게 눌러 확인하세요.`);
  };

  const finish = async () => {
    if (!fromAccountId || !recipient || !amount) return;
    const acctNum = recipient.account.replace(/-/g, '');
    const bankCode = BANK_CODE[recipient.bank] ?? undefined;
    try {
      await sendMoney(fromAccountId, acctNum, Number(amount), bankCode);
      setStep('done');
      onAnnounce('송금이 완료됐습니다.');
    } catch (e: unknown) {
      const code = (e as { code?: string }).code;
      if (code === 'TX_003') onAnnounce('잔액이 부족합니다.');
      else onAnnounce('송금 중 오류가 발생했습니다.');
    }
  };;

  const reset = () => {
    setStep('contacts'); setRecipient(null); setAmount('');
    setAmtMethod('numpad'); setAmtRec(false);
  };

  const startVoice = (target: 'acct' | 'amount') => {
    onAnnounce(target === 'acct' ? '계좌번호를 말씀해 주세요.' : '금액을 말씀해 주세요.');
    if (target === 'acct') {
      setAcctRec(true);
      timerRef.current = setTimeout(() => {
        setAcctRec(false); setNewAcct('110-234-567890');
      }, 2500);
    } else {
      setAmtRec(true);
      timerRef.current = setTimeout(() => {
        setAmtRec(false); setAmount('54200');
        onAnnounce('54,200원으로 인식됐습니다.');
      }, 2500);
    }
  };
  const stopVoice = (target: 'acct' | 'amount') => {
    clearTimeout(timerRef.current);
    if (target === 'acct') setAcctRec(false);
    else setAmtRec(false);
  };

  const fontSize = amount.length > 7 ? 28 : amount.length > 5 ? 36 : 44;

  /* ══════════════════════════════
     Step: contacts
  ══════════════════════════════ */
  if (step === 'contacts') {
    return (
      <div className="flex flex-col gap-5 px-5 py-4 animate-slide-in overflow-y-auto scrollbar-none h-full">
        <h2 className="text-[20px] font-bold text-on">송금하기</h2>

        {/* 새 계좌 입력 버튼 */}
        <button
          onClick={goToNewAccount}
          className="flex items-center gap-3 w-full px-4 py-4 rounded-2xl border-2 border-dashed border-blue-bright/30 text-left"
          style={{ background: 'rgba(96,165,250,0.06)' }}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-bright/15 flex items-center justify-center shrink-0">
            <Icon name="plus" size={20} color="#60a5fa" />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-blue-bright">새 계좌로 송금</div>
            <div className="text-[11px] text-mute mt-0.5">계좌번호를 직접 입력해요</div>
          </div>
        </button>

        {/* 최근 연락처 */}
        <div className="flex flex-col gap-2">
          <div className="text-[13px] text-sub px-1">최근 받는 분</div>
          {RECENT_CONTACTS.map((c) => (
            <button
              key={c.id}
              onClick={() => selectRecipient(c)}
              className="glass rounded-xl px-4 py-3 flex items-center gap-3 border border-soft w-full"
            >
              <div className="w-10 h-10 rounded-xl glass-elev flex items-center justify-center text-[20px]">
                {c.avatar}
              </div>
              <div className="flex-1 text-left">
                <div className="text-[14px] font-semibold text-on">{c.name}</div>
                <div className="text-[11px] text-mute">{c.bank} · {c.account}</div>
              </div>
              <Icon name="chevron-right" size={16} color="rgba(255,255,255,0.3)" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ══════════════════════════════
     Step: new-account
  ══════════════════════════════ */
  if (step === 'new-account') {
    return (
      <div className="flex flex-col h-full animate-slide-in">
        {showCanvas && (
          <BigWriteOverlay
            onClose={() => setShowCanvas(false)}
            onConfirm={(text) => {
              if (canvasTarget === 'acct') setNewAcct(text);
              else { const d = text.replace(/[^0-9]/g, ''); if (d) setAmount(d); }
              setShowCanvas(false);
            }}
          />
        )}

        {/* 헤더 */}
        <div className="relative flex items-center px-5 py-4 border-b border-soft shrink-0">
          <button onClick={() => setStep('contacts')} className="absolute left-5 text-[13px] text-sub">← 뒤로</button>
          <span className="w-full text-center text-[16px] font-semibold text-on">새 계좌 입력</span>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-none px-5 py-4 flex flex-col gap-5">

          {/* ① 은행 선택 */}
          <div>
            <div className="text-[13px] text-sub mb-2">은행 선택</div>
            <div className="grid grid-cols-4 gap-2">
              {BANKS.map(b => (
                <button
                  key={b}
                  onClick={() => setNewBank(b)}
                  className="py-2.5 rounded-xl text-[11px] font-medium border transition-all"
                  style={{
                    background: newBank === b ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.05)',
                    borderColor: newBank === b ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                    color: newBank === b ? '#93c5fd' : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {b.replace('은행','').replace('뱅크','')}
                </button>
              ))}
            </div>
          </div>

          {/* ② 계좌번호 입력 */}
          <div>
            <div className="text-[13px] text-sub mb-2">계좌번호</div>

            {/* 입력 방법 탭 */}
            <div className="flex gap-2 mb-3">
              {(['keyboard','voice','handwrite'] as AcctMethod[]).map(m => {
                const lbl = { keyboard:'⌨️ 키보드', voice:'🎤 음성', handwrite:'✏️ 손글씨' }[m];
                return (
                  <button key={m} onClick={() => setAcctMethod(m)}
                    className="flex-1 py-1.5 rounded-xl text-[11px] font-medium border transition-all"
                    style={{
                      background: acctMethod === m ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.05)',
                      borderColor: acctMethod === m ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.1)',
                      color: acctMethod === m ? '#60a5fa' : 'rgba(255,255,255,0.5)',
                    }}
                  >{lbl}</button>
                );
              })}
            </div>

            {acctMethod === 'keyboard' && (
              <input
                type="tel"
                value={newAcct}
                onChange={e => { setNewAcct(e.target.value); setAcctChecked(false); }}
                placeholder="예) 110-123-456789"
                className="w-full px-4 py-3.5 rounded-xl text-[15px] font-semibold text-on bg-white/[0.07] border border-white/15 outline-none focus:border-blue-bright/60 placeholder:text-white/25"
              />
            )}

            {acctMethod === 'voice' && (
              <div className="flex flex-col items-center gap-3 py-2">
                <button
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: acctRec ? 'radial-gradient(circle, #60a5fa, #1d4ed8)' : 'rgba(59,130,246,0.15)',
                    boxShadow: acctRec ? '0 0 0 6px rgba(96,165,250,0.2)' : 'none',
                    border: '2px solid rgba(96,165,250,0.4)',
                  }}
                  onMouseDown={() => startVoice('acct')} onMouseUp={() => stopVoice('acct')}
                  onTouchStart={e => { e.preventDefault(); startVoice('acct'); }} onTouchEnd={() => stopVoice('acct')}
                >
                  {acctRec
                    ? <div className="flex items-end gap-[2px]">{[1,2,3,2,1].map((h,i)=><div key={i} className="w-[3px] rounded-full bg-white animate-wave" style={{height:h*5,animationDelay:`${i*0.1}s`}}/>)}</div>
                    : <Icon name="mic" size={24} color="#60a5fa" />
                  }
                </button>
                <p className="text-[12px] text-sub">{acctRec ? '듣고 있어요…' : '길게 눌러 말하기'}</p>
                {newAcct && <div className="glass rounded-xl px-3 py-2 border border-soft text-[13px] text-on">{newAcct}</div>}
              </div>
            )}

            {acctMethod === 'handwrite' && (
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => { setCanvasTarget('acct'); setShowCanvas(true); }}
                  className="w-full py-5 rounded-2xl border-2 border-dashed border-blue-bright/30 flex flex-col items-center gap-1.5"
                  style={{ background: 'rgba(96,165,250,0.05)' }}
                >
                  <Icon name="pen" size={22} color="#60a5fa" />
                  <span className="text-[12px] text-sub">탭해서 손글씨로 쓰기</span>
                </button>
                {newAcct && <div className="glass rounded-xl px-3 py-2 border border-soft text-[13px] text-on w-full text-center">{newAcct}</div>}
              </div>
            )}
          </div>

          {/* ③ 예금주 확인 */}
          {newAcct && !acctChecked && (
            <button
              onClick={checkAccount}
              disabled={!newBank}
              className="w-full py-3 rounded-xl border text-[14px] font-semibold transition-all"
              style={{
                background: newBank ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
                borderColor: newBank ? 'rgba(96,165,250,0.4)' : 'rgba(255,255,255,0.1)',
                color: newBank ? '#93c5fd' : 'rgba(255,255,255,0.3)',
              }}
            >
              예금주 확인하기
            </button>
          )}

          {/* ③-확인됨 */}
          {acctChecked && (
            <div className="glass rounded-xl px-4 py-3 border border-soft flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green shrink-0" />
              <div>
                <div className="text-[11px] text-mute">예금주</div>
                <div className="text-[16px] font-bold text-on">{newName}</div>
              </div>
            </div>
          )}
        </div>

        {/* 다음 버튼 */}
        <div className="px-5 pb-6 pt-3 shrink-0">
          <button
            onClick={confirmNewAccount}
            disabled={!acctChecked}
            className="w-full py-4 rounded-2xl font-semibold text-[16px] transition-all"
            style={{
              background: acctChecked ? '#3b82f6' : 'rgba(255,255,255,0.06)',
              color: acctChecked ? 'white' : 'rgba(255,255,255,0.3)',
            }}
          >
            이 계좌로 송금
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════
     Step: amount
  ══════════════════════════════ */
  if (step === 'amount') {
    return (
      <div className="flex flex-col h-full animate-slide-in">
        {showCanvas && (
          <BigWriteOverlay
            onClose={() => setShowCanvas(false)}
            onConfirm={(text) => {
              const digits = text.replace(/[^0-9]/g, '');
              if (digits) setAmount(digits);
              setShowCanvas(false);
            }}
          />
        )}

        <div className="relative flex items-center px-5 py-4 border-b border-soft shrink-0">
          <button onClick={() => setStep('contacts')} className="absolute left-5 text-[13px] text-sub">← 뒤로</button>
          <span className="w-full text-center text-[16px] font-semibold text-on">{recipient?.name}에게</span>
        </div>

        <div className="flex flex-col items-center justify-center px-8 py-4 gap-1">
          <div className="text-[13px] text-mute">얼마를 보낼까요?</div>
          <div
            className="font-bold text-on transition-all mt-2"
            style={{ fontSize, minHeight: 56, display: 'flex', alignItems: 'center' }}
          >
            {amount
              ? `${Number(amount).toLocaleString()}원`
              : <span style={{ color: 'rgba(255,255,255,0.25)' }}>0원</span>
            }
          </div>
        </div>

        {/* 입력 방법 탭 */}
        <div className="flex gap-2 px-5 mb-3">
          {([
            { key: 'numpad',    icon: '🔢', label: '숫자 패드' },
            { key: 'voice',     icon: '🎤', label: '음성'     },
            { key: 'handwrite', icon: '✏️', label: '손글씨'   },
          ] as { key: AmountMethod; icon: string; label: string }[]).map(m => (
            <button
              key={m.key}
              onClick={() => { setAmtMethod(m.key); setAmtRec(false); }}
              className="flex-1 py-2 rounded-xl text-[12px] font-medium border transition-all"
              style={{
                background: amtMethod === m.key ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.05)',
                borderColor: amtMethod === m.key ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.1)',
                color: amtMethod === m.key ? '#60a5fa' : 'rgba(255,255,255,0.55)',
              }}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        <div className="flex-1 px-5 flex flex-col justify-end">
          {amtMethod === 'numpad' && <NumPad value={amount} onChange={setAmount} />}

          {amtMethod === 'voice' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <button
                className="w-20 h-20 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: amtRec ? 'radial-gradient(circle, #60a5fa, #1d4ed8)' : 'rgba(59,130,246,0.15)',
                  boxShadow: amtRec ? '0 0 0 8px rgba(96,165,250,0.2)' : 'none',
                  border: '2px solid rgba(96,165,250,0.4)',
                }}
                onMouseDown={() => startVoice('amount')} onMouseUp={() => stopVoice('amount')}
                onTouchStart={e => { e.preventDefault(); startVoice('amount'); }} onTouchEnd={() => stopVoice('amount')}
              >
                {amtRec
                  ? <div className="flex items-end gap-[3px]">{[1,2,3,4,3,2,1].map((h,i)=><div key={i} className="w-[3px] rounded-full bg-white animate-wave" style={{height:h*5,animationDelay:`${i*0.1}s`}}/>)}</div>
                  : <Icon name="mic" size={28} color="#60a5fa" />
                }
              </button>
              <p className="text-[13px] text-sub">{amtRec ? '듣고 있어요 — 손 떼면 인식' : '마이크를 길게 누르세요'}</p>
              {amount && (
                <div className="glass rounded-xl px-4 py-2 border border-soft text-[13px] text-sub">
                  인식됨: <span className="text-on font-semibold">{Number(amount).toLocaleString()}원</span>
                </div>
              )}
            </div>
          )}

          {amtMethod === 'handwrite' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <button
                onClick={() => { setCanvasTarget('amount'); setShowCanvas(true); }}
                className="w-full py-6 rounded-2xl border-2 border-dashed border-blue-bright/30 flex flex-col items-center gap-2"
                style={{ background: 'rgba(96,165,250,0.05)' }}
              >
                <Icon name="pen" size={28} color="#60a5fa" />
                <span className="text-[13px] text-sub">탭해서 손글씨로 금액 쓰기</span>
              </button>
              {amount && (
                <div className="glass rounded-xl px-4 py-2 border border-soft text-[13px] text-sub">
                  입력됨: <span className="text-on font-semibold">{Number(amount).toLocaleString()}원</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 pb-6 pt-3 shrink-0">
          <button
            onClick={goConfirm}
            disabled={!amount}
            className="w-full py-4 rounded-2xl font-semibold text-[16px] transition-all"
            style={{
              background: amount ? '#3b82f6' : 'rgba(255,255,255,0.06)',
              color: amount ? 'white' : 'rgba(255,255,255,0.3)',
            }}
          >
            다음
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════
     Step: confirm
  ══════════════════════════════ */
  if (step === 'confirm') {
    return (
      <div className="flex flex-col h-full animate-slide-in">
        <div className="relative flex items-center px-5 py-4 border-b border-soft shrink-0">
          <button onClick={() => setStep('amount')} className="absolute left-5 text-[13px] text-sub">← 뒤로</button>
          <span className="w-full text-center text-[16px] font-semibold text-on">최종 확인</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-5">
          <div className="glass-elev w-full rounded-2xl p-5 border border-soft flex flex-col gap-3">
            <div className="flex justify-between">
              <span className="text-[13px] text-sub">받는 분</span>
              <span className="text-[14px] font-semibold text-on">{recipient?.name}</span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex justify-between">
              <span className="text-[13px] text-sub">은행</span>
              <span className="text-[13px] text-mute">{recipient?.bank}</span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex justify-between">
              <span className="text-[13px] text-sub">계좌</span>
              <span className="text-[13px] text-mute">{recipient?.account}</span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex justify-between">
              <span className="text-[13px] text-sub">금액</span>
              <span className="text-[18px] font-bold text-on">{Number(amount).toLocaleString()}원</span>
            </div>
          </div>
        </div>

        <div className="px-5 pb-6 shrink-0">
          <HoldButton
            label={`${Number(amount).toLocaleString()}원 보내기`}
            sublabel="길게 눌러 최종 확인"
            onConfirm={finish}
          />
        </div>
      </div>
    );
  }

  /* ══════════════════════════════
     Step: done
  ══════════════════════════════ */
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 animate-fade-in px-8">
      <div className="relative">
        <div className="absolute inset-0 rounded-full border-2 border-green/20 animate-pulse-ring" style={{ margin: -12 }} />
        <div className="w-24 h-24 rounded-full bg-green/20 flex items-center justify-center">
          <Icon name="check" size={40} color="#10b981" />
        </div>
      </div>
      <div className="text-center">
        <div className="text-[22px] font-bold text-on mb-1">송금 완료!</div>
        <div className="text-[14px] text-sub">{recipient?.name}에게 {Number(amount).toLocaleString()}원</div>
      </div>
      <button onClick={reset} className="px-8 py-3 rounded-2xl border border-soft text-[15px] text-sub">
        홈으로
      </button>
    </div>
  );
}
