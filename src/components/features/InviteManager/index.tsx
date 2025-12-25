import React, { useState } from 'react';
import { InviteRecord, User } from '../../../types';
import { createInviteId } from '../../../utils/id';

interface InviteManagerProps {
  user: User | null;
  invites: InviteRecord[];
  onInvitesChange: React.Dispatch<React.SetStateAction<InviteRecord[]>>;
}

const InviteManager: React.FC<InviteManagerProps> = ({ user, invites, onInvitesChange }) => {
  const [inviteeName, setInviteeName] = useState('');
  const [inviteeEmail, setInviteeEmail] = useState('');
  const [note, setNote] = useState('');

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-160px)] bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
        <p className="text-sm text-slate-500 dark:text-slate-400">请登录后管理邀请与分成记录。</p>
      </div>
    );
  }

  const handleAddInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteeEmail.trim()) return;
    const record: InviteRecord = {
      id: createInviteId(),
      inviteeName: inviteeName || '未填写',
      inviteeEmail,
      status: 'pending',
      note,
      createdAt: new Date().toISOString(),
    };
    onInvitesChange(prev => [record, ...prev]);
    setInviteeName('');
    setInviteeEmail('');
    setNote('');
  };

  const updateStatus = (id: string, status: InviteRecord['status']) => {
    onInvitesChange(prev => prev.map(item => item.id === id ? { ...item, status, registeredAt: status !== 'pending' ? new Date().toISOString() : item.registeredAt } : item));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">我的邀请码</h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800">
            <span className="text-sm text-slate-500 dark:text-slate-400">邀请码</span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{user.inviteCode || '未分配'}</span>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(user.inviteCode || '')}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            复制链接
          </button>
        </div>
      </div>

      <form onSubmit={handleAddInvite} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-100">手动记录邀请</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <input
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            placeholder="被邀请人姓名"
            value={inviteeName}
            onChange={(e) => setInviteeName(e.target.value)}
          />
          <input
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            placeholder="被邀请人邮箱"
            value={inviteeEmail}
            onChange={(e) => setInviteeEmail(e.target.value)}
            required
          />
        </div>
        <textarea
          className="w-full min-h-[80px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          placeholder="备注"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold">添加记录</button>
      </form>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-700 dark:text-slate-200">邀请记录</h3>
          <span className="text-sm text-slate-500 dark:text-slate-400">共 {invites.length} 条</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {invites.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">暂无邀请记录</div>
          ) : (
            invites.map(record => (
              <div key={record.id} className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{record.inviteeName}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{record.inviteeEmail}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">创建于 {new Date(record.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={record.status}
                    onChange={(e) => updateStatus(record.id, e.target.value as InviteRecord['status'])}
                    className="text-xs px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="pending">待注册</option>
                    <option value="registered">已注册</option>
                    <option value="paid">已付费</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteManager;
