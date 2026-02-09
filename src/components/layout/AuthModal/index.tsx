import React, { useState, useMemo, useEffect } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate: (payload: AuthPayload) => void | Promise<void>;
  onPasswordReset?: (email: string) => void | Promise<void>;
  error?: string | null;
  lockoutInfo?: { isLocked: boolean; remainingMinutes: number } | null;
}

export interface AuthPayload {
  mode: AuthMode;
  name: string;
  email: string;
  password: string;
  rememberMe?: boolean;
}

type AuthMode = 'login' | 'register' | 'forgot-password';

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  suggestions: string[];
}

const checkPasswordStrength = (password: string): PasswordStrength => {
  const suggestions: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else suggestions.push('至少 8 个字符');

  if (password.length >= 12) score++;

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  else if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    suggestions.push('包含大小写字母');
  }

  if (/\d/.test(password)) score++;
  else suggestions.push('包含数字');

  if (/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(password)) score++;
  else suggestions.push('包含特殊字符');

  const labels = ['非常弱', '弱', '一般', '强', '非常强'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500'];

  return {
    score: Math.min(score, 4),
    label: labels[Math.min(score, 4)],
    color: colors[Math.min(score, 4)],
    suggestions,
  };
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticate,
  onPasswordReset,
  error,
  lockoutInfo,
}) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false,
    name: false,
  });

  // 清理状态当模式切换时
  useEffect(() => {
    setLocalError(null);
    setResetEmailSent(false);
  }, [mode]);

  // 清理状态当模态框关闭时
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setName('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setLocalError(null);
      setResetEmailSent(false);
      setTouched({ email: false, password: false, confirmPassword: false, name: false });
    }
  }, [isOpen]);

  const passwordStrength = useMemo(() => checkPasswordStrength(password), [password]);

  const emailError = useMemo(() => {
    if (!touched.email || !email) return null;
    if (!validateEmail(email)) return '请输入有效的邮箱地址';
    return null;
  }, [email, touched.email]);

  const passwordError = useMemo(() => {
    if (!touched.password || !password) return null;
    if (password.length < 8) return '密码至少需要 8 个字符';
    return null;
  }, [password, touched.password]);

  const confirmPasswordError = useMemo(() => {
    if (!touched.confirmPassword || !confirmPassword) return null;
    if (password !== confirmPassword) return '两次输入的密码不一致';
    return null;
  }, [password, confirmPassword, touched.confirmPassword]);

  const nameError = useMemo(() => {
    if (!touched.name || !name) return null;
    if (name.trim().length < 2) return '用户名至少需要 2 个字符';
    if (name.trim().length > 20) return '用户名不能超过 20 个字符';
    return null;
  }, [name, touched.name]);

  const isFormValid = useMemo(() => {
    if (mode === 'forgot-password') {
      return email && validateEmail(email);
    }
    if (mode === 'login') {
      return email && password && validateEmail(email) && password.length >= 8;
    }
    // register
    return (
      email &&
      password &&
      confirmPassword &&
      name.trim() &&
      validateEmail(email) &&
      password.length >= 8 &&
      password === confirmPassword &&
      name.trim().length >= 2 &&
      name.trim().length <= 20
    );
  }, [mode, email, password, confirmPassword, name]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // 验证
    if (mode === 'forgot-password') {
      if (!email || !validateEmail(email)) {
        setLocalError('请输入有效的邮箱地址');
        return;
      }
      setIsLoading(true);
      try {
        if (onPasswordReset) {
          await Promise.resolve(onPasswordReset(email));
        }
        setResetEmailSent(true);
      } catch {
        setLocalError('发送重置邮件失败，请稍后重试');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!validateEmail(email)) {
      setLocalError('请输入有效的邮箱地址');
      return;
    }

    if (password.length < 8) {
      setLocalError('密码至少需要 8 个字符');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setLocalError('请输入用户名');
        return;
      }
      if (name.trim().length < 2) {
        setLocalError('用户名至少需要 2 个字符');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('两次输入的密码不一致');
        return;
      }
      if (passwordStrength.score < 2) {
        setLocalError('密码强度不足，请设置更强的密码');
        return;
      }
    }

    setIsLoading(true);
    try {
      await Promise.resolve(
        onAuthenticate({
          mode: mode as 'login' | 'register',
          name,
          email,
          password,
          rememberMe,
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSwitch = (newMode: AuthMode) => {
    setMode(newMode);
    setLocalError(null);
    setResetEmailSent(false);
  };

  const displayError = localError || error;

  const renderForgotPassword = () => (
    <>
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-amber-100 dark:shadow-none shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">重置密码</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          输入您的注册邮箱，我们将发送重置链接
        </p>
      </div>

      {resetEmailSent ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
            重置邮件已发送
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            请检查您的邮箱 <span className="font-medium text-slate-700 dark:text-slate-300">{email}</span>
            <br />并按照邮件中的指引重置密码
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            没有收到邮件？请检查垃圾邮件文件夹
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {displayError && (
            <div className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40 rounded-xl px-4 py-3 flex items-start gap-2">
              <XIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              注册邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
              className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all placeholder-slate-400 dark:placeholder-slate-500 ${
                emailError
                  ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-500/50'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-[#2C5F2D]/50'
              }`}
              placeholder="name@example.com"
              required
            />
            {emailError && (
              <p className="mt-1.5 text-xs text-rose-500">{emailError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !isFormValid}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-amber-200 dark:shadow-none hover:shadow-amber-300 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-60 disabled:hover:scale-100"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              '发送重置邮件'
            )}
          </button>
        </form>
      )}

      <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
        <button
          onClick={() => handleModeSwitch('login')}
          className="text-sm font-semibold text-[#2C5F2D] dark:text-[#97BC62] hover:text-[#1E4620] dark:hover:text-[#97BC62] transition-colors"
        >
          返回登录
        </button>
      </div>
    </>
  );

  const renderLoginRegister = () => (
    <>
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-[#F0F7F0] dark:bg-[#2C5F2D]/20 text-[#2C5F2D] dark:text-[#97BC62] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-[#E8F5E8] dark:shadow-none shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 14-14 7 7-14 14-4-4z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          {mode === 'login' ? '欢迎回来' : '加入天道 AI'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          {mode === 'login' ? '登录以继续您的创作之旅' : '注册即可免费体验智能写作助手'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {displayError && (
          <div className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40 rounded-xl px-4 py-3 flex items-start gap-2">
            <XIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{displayError}</span>
          </div>
        )}

        {lockoutInfo?.isLocked && (
          <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 rounded-xl px-4 py-3 flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>账户已被临时锁定，请 {lockoutInfo.remainingMinutes} 分钟后重试</span>
          </div>
        )}

        {mode === 'register' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              用户名
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
              className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all placeholder-slate-400 dark:placeholder-slate-500 ${
                nameError
                  ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-500/50'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-[#2C5F2D]/50'
              }`}
              placeholder="请输入您的昵称"
              required
              maxLength={20}
            />
            {nameError && (
              <p className="mt-1.5 text-xs text-rose-500">{nameError}</p>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            电子邮箱
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
            className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all placeholder-slate-400 dark:placeholder-slate-500 ${
              emailError
                ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-500/50'
                : 'border-slate-200 dark:border-slate-700 focus:ring-[#2C5F2D]/50'
            }`}
            placeholder="name@example.com"
            required
          />
          {emailError && (
            <p className="mt-1.5 text-xs text-rose-500">{emailError}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            密码
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
              className={`w-full px-4 py-3 pr-12 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all placeholder-slate-400 dark:placeholder-slate-500 ${
                passwordError
                  ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-500/50'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-[#2C5F2D]/50'
              }`}
              placeholder={mode === 'register' ? '至少 8 个字符' : '请输入密码'}
              required
              minLength={8}
              maxLength={128}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              {showPassword ? (
                <EyeOffIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>
          {passwordError && (
            <p className="mt-1.5 text-xs text-rose-500">{passwordError}</p>
          )}

          {/* 密码强度指示器 - 仅在注册时显示 */}
          {mode === 'register' && password && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      level <= passwordStrength.score
                        ? passwordStrength.color
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-xs font-medium ${
                  passwordStrength.score <= 1 ? 'text-rose-500' :
                  passwordStrength.score === 2 ? 'text-yellow-500' :
                  'text-emerald-500'
                }`}>
                  密码强度: {passwordStrength.label}
                </span>
              </div>
              {passwordStrength.suggestions.length > 0 && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  建议: {passwordStrength.suggestions.join('、')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 确认密码 - 仅在注册时显示 */}
        {mode === 'register' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              确认密码
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                className={`w-full px-4 py-3 pr-12 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all placeholder-slate-400 dark:placeholder-slate-500 ${
                  confirmPasswordError
                    ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-500/50'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-[#2C5F2D]/50'
                }`}
                placeholder="再次输入密码"
                required
                minLength={8}
                maxLength={128}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOffIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            {confirmPasswordError && (
              <p className="mt-1.5 text-xs text-rose-500">{confirmPasswordError}</p>
            )}
            {!confirmPasswordError && confirmPassword && password === confirmPassword && (
              <p className="mt-1.5 text-xs text-emerald-500 flex items-center gap-1">
                <CheckIcon className="w-3 h-3" />
                密码匹配
              </p>
            )}
          </div>
        )}

        {/* 记住我和忘记密码 - 仅在登录时显示 */}
        {mode === 'login' && (
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded-md peer-checked:bg-[#2C5F2D] peer-checked:border-[#2C5F2D] transition-all group-hover:border-[#97BC62]">
                  {rememberMe && (
                    <CheckIcon className="w-full h-full text-white p-0.5" />
                  )}
                </div>
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-300 transition-colors">
                记住我
              </span>
            </label>
            <button
              type="button"
              onClick={() => handleModeSwitch('forgot-password')}
              className="text-sm font-medium text-[#2C5F2D] dark:text-[#97BC62] hover:text-[#1E4620] dark:hover:text-[#97BC62] transition-colors"
            >
              忘记密码？
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || lockoutInfo?.isLocked || !isFormValid}
          className="w-full py-3.5 bg-gradient-to-r from-[#2C5F2D] to-[#1E4620] text-white font-bold rounded-xl shadow-lg shadow-[#E8F5E8] dark:shadow-none hover:shadow-[#97BC62] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-60 disabled:hover:scale-100"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : mode === 'login' ? (
            '立即登录'
          ) : (
            '创建账号'
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {mode === 'login' ? '还没有账号？' : '已有账号？'}
          <button
            onClick={() => handleModeSwitch(mode === 'login' ? 'register' : 'login')}
            className="ml-2 font-semibold text-[#2C5F2D] dark:text-[#97BC62] hover:text-[#1E4620] dark:hover:text-[#97BC62] transition-colors"
          >
            {mode === 'login' ? '免费注册' : '直接登录'}
          </button>
        </p>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-slate-900/20 dark:shadow-black/50 overflow-hidden transform transition-all scale-100 border border-slate-100 dark:border-slate-800">
        <div className="h-2 bg-gradient-to-r from-[#2C5F2D] via-[#97BC62] to-[#F4A460]" />

        <div className="p-8 max-h-[85vh] overflow-y-auto">
          {mode === 'forgot-password' ? renderForgotPassword() : renderLoginRegister()}
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default AuthModal;
