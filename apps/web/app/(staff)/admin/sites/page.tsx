'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import {
  Building2,
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DistrictManager {
  id: string;
  name: string;
  areaLabel: string;
  sites?: Array<{ id: string; code: string; name: string }>;
}

interface SiteItem {
  id: string;
  code: string;
  name: string;
  type: 'BRANCH' | 'DC' | 'HQ' | 'DROPOFF';
  address?: string;
  districtManagerId?: string;
  districtManager?: DistrictManager;
  jobsCount: number;
  usersCount: number;
}

export default function AdminSitesPage() {
  const [activeTab, setActiveTab] = useState<'sites' | 'managers'>('sites');
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [managers, setManagers] = useState<DistrictManager[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Site Modal State
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteItem | null>(null);
  const [siteCode, setSiteCode] = useState('');
  const [siteName, setSiteName] = useState('');
  const [siteType, setSiteType] = useState<'BRANCH' | 'DC'>('BRANCH');
  const [siteDmId, setSiteDmId] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [siteModalError, setSiteModalError] = useState<string | null>(null);
  const [isSiteSaving, setIsSiteSaving] = useState(false);

  // Archive Confirm Modal
  const [siteToArchive, setSiteToArchive] = useState<SiteItem | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  // DM Modal State
  const [isDmModalOpen, setIsDmModalOpen] = useState(false);
  const [editingDm, setEditingDm] = useState<DistrictManager | null>(null);
  const [dmName, setDmName] = useState('');
  const [dmArea, setDmArea] = useState('');
  const [dmModalError, setDmModalError] = useState<string | null>(null);
  const [isDmSaving, setIsDmSaving] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sitesData, managersData] = await Promise.all([
        fetchApi<SiteItem[]>('/sites'),
        fetchApi<DistrictManager[]>('/district-managers'),
      ]);
      setSites(sitesData);
      setManagers(managersData);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Site Handlers
  const handleOpenAddSite = () => {
    setEditingSite(null);
    setSiteCode('');
    setSiteName('');
    setSiteType('BRANCH');
    setSiteDmId('');
    setSiteAddress('');
    setSiteModalError(null);
    setIsSiteModalOpen(true);
  };

  const handleOpenEditSite = (s: SiteItem) => {
    setEditingSite(s);
    setSiteCode(s.code);
    setSiteName(s.name);
    setSiteType(s.type === 'DC' ? 'DC' : 'BRANCH');
    setSiteDmId(s.districtManagerId || '');
    setSiteAddress(s.address || '');
    setSiteModalError(null);
    setIsSiteModalOpen(true);
  };

  const handleSaveSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteCode.trim() || !siteName.trim()) {
      setSiteModalError('กรุณาระบุรหัสและชื่อสาขา/คลัง');
      return;
    }

    setIsSiteSaving(true);
    try {
      const payload = {
        code: siteCode.trim(),
        name: siteName.trim(),
        type: siteType,
        districtManagerId: siteType === 'DC' ? undefined : siteDmId || undefined,
        address: siteAddress.trim() || undefined,
      };

      if (editingSite) {
        await fetchApi(`/sites/${editingSite.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        showToast(`แก้ไขข้อมูล "${siteName}" เรียบร้อยแล้ว ✓`);
      } else {
        await fetchApi('/sites', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast(`เพิ่มสาขา/คลัง "${siteName}" เรียบร้อยแล้ว ✓`);
      }

      setIsSiteModalOpen(false);
      loadData();
    } catch (err: any) {
      setSiteModalError(err.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSiteSaving(false);
    }
  };

  const handleArchiveSite = async () => {
    if (!siteToArchive) return;
    setIsArchiving(true);
    try {
      const res = await fetchApi<{ success: boolean; archived: boolean }>(
        `/sites/${siteToArchive.id}`,
        { method: 'DELETE' }
      );
      showToast(
        res.archived
          ? `จัดเก็บข้อมูลสาขา "${siteToArchive.name}" (Archive) เรียบร้อยแล้ว ✓`
          : `ลบสาขา "${siteToArchive.name}" เรียบร้อยแล้ว ✓`
      );
      setSiteToArchive(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถลบหรือจัดเก็บได้');
    } finally {
      setIsArchiving(false);
    }
  };

  // DM Handlers
  const handleOpenAddDm = () => {
    setEditingDm(null);
    setDmName('');
    setDmArea('');
    setDmModalError(null);
    setIsDmModalOpen(true);
  };

  const handleOpenEditDm = (dm: DistrictManager) => {
    setEditingDm(dm);
    setDmName(dm.name);
    setDmArea(dm.areaLabel);
    setDmModalError(null);
    setIsDmModalOpen(true);
  };

  const handleSaveDm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dmName.trim() || !dmArea.trim()) {
      setDmModalError('กรุณาระบุชื่อและเขตที่รับผิดชอบ');
      return;
    }

    setIsDmSaving(true);
    try {
      const payload = {
        name: dmName.trim(),
        areaLabel: dmArea.trim(),
      };

      if (editingDm) {
        await fetchApi(`/district-managers/${editingDm.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        showToast(`แก้ไขข้อมูลผู้จัดการเขต "${dmName}" เรียบร้อยแล้ว ✓`);
      } else {
        await fetchApi('/district-managers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast(`เพิ่มผู้จัดการเขต "${dmName}" เรียบร้อยแล้ว ✓`);
      }

      setIsDmModalOpen(false);
      loadData();
    } catch (err: any) {
      setDmModalError(err.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsDmSaving(false);
    }
  };

  const filteredSites = sites.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.districtManager?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.districtManager?.areaLabel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-text text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-text">
            3. สาขาไทวัสดุ & ผู้จัดการเขต (District Manager)
          </h2>
          <p className="text-xs text-text-mute">
            Maintain รายชื่อสาขา คลัง DC และกำหนดผู้จัดการเขตที่กำกับดูแล
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'sites' ? (
            <button
              type="button"
              onClick={handleOpenAddSite}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-input bg-red hover:bg-red-dark text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ เพิ่มสาขา / คลัง</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenAddDm}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-input bg-red hover:bg-red-dark text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ เพิ่มผู้จัดการเขต</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('sites')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all -mb-px',
            activeTab === 'sites'
              ? 'border-red text-red'
              : 'border-transparent text-text-2 hover:text-text'
          )}
        >
          <Building2 className="w-4 h-4" />
          <span>รายชื่อสาขา / คลัง DC ({sites.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('managers')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all -mb-px',
            activeTab === 'managers'
              ? 'border-red text-red'
              : 'border-transparent text-text-2 hover:text-text'
          )}
        >
          <Users className="w-4 h-4" />
          <span>ผู้จัดการเขต ({managers.length})</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-text-mute">กำลังโหลดข้อมูล...</div>
      ) : activeTab === 'sites' ? (
        <div className="space-y-4">
          {/* Search & Info Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-3 rounded-card border border-border">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-mute" />
              <input
                type="text"
                placeholder="ค้นหารหัส, ชื่อสาขา, ผู้จัดการเขต..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-input border border-border-strong bg-surface-2/40 focus:outline-none focus:border-red"
              />
            </div>
            <div className="text-[11px] text-text-mute">
              * คลังประเภท DC จะไม่มีการผูกผู้จัดการเขต (District Manager)
            </div>
          </div>

          {/* Sites Table */}
          <div className="bg-surface rounded-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-2/60 text-text-2">
                    <th className="py-2.5 px-4 font-semibold w-24">รหัส</th>
                    <th className="py-2.5 px-4 font-semibold">ชื่อสาขา / คลัง</th>
                    <th className="py-2.5 px-4 font-semibold w-24">ประเภท</th>
                    <th className="py-2.5 px-4 font-semibold">ผู้จัดการเขต (District Manager)</th>
                    <th className="py-2.5 px-4 font-semibold text-center w-24">งานซ่อมสะสม</th>
                    <th className="py-2.5 px-4 font-semibold text-right w-24">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredSites.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-text-mute">
                        ไม่พบรายการสาขาที่ตรงกับคำค้นหา
                      </td>
                    </tr>
                  ) : (
                    filteredSites.map((s) => (
                      <tr key={s.id} className="hover:bg-surface-2/30 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-medium">{s.code}</td>
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-text">{s.name}</div>
                          {s.address && (
                            <div className="text-[11px] text-text-mute truncate max-w-xs">
                              {s.address}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={cn(
                              'text-[10px] px-2 py-0.5 rounded-full font-semibold',
                              s.type === 'DC'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            )}
                          >
                            {s.type === 'DC' ? 'DC (คลัง)' : 'สาขา'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          {s.type === 'DC' ? (
                            <span className="text-text-mute italic">- (ไม่มี ผจก.เขต)</span>
                          ) : s.districtManager ? (
                            <div>
                              <span className="font-medium text-text">
                                {s.districtManager.name}
                              </span>
                              <span className="text-text-mute text-[11px] ml-1.5">
                                ({s.districtManager.areaLabel})
                              </span>
                            </div>
                          ) : (
                            <span className="text-amber-700 text-[11px] font-medium">
                              ยังไม่ได้กำหนด ผจก.เขต
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono">
                          {s.jobsCount}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditSite(s)}
                              title="แก้ไข"
                              className="p-1 rounded text-text-mute hover:text-text hover:bg-surface-2 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSiteToArchive(s)}
                              title="จัดเก็บ / ลบ"
                              className="p-1 rounded text-text-mute hover:text-red hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Managers Tab */
        <div className="space-y-4">
          <div className="bg-surface rounded-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-2/60 text-text-2">
                    <th className="py-2.5 px-4 font-semibold">ชื่อ-นามสกุล</th>
                    <th className="py-2.5 px-4 font-semibold">เขตที่รับผิดชอบ (Area Label)</th>
                    <th className="py-2.5 px-4 font-semibold">สาขาในกำกับดูแล</th>
                    <th className="py-2.5 px-4 font-semibold text-right w-24">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {managers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-text-mute">
                        ยังไม่มีข้อมูลผู้จัดการเขต
                      </td>
                    </tr>
                  ) : (
                    managers.map((dm) => (
                      <tr key={dm.id} className="hover:bg-surface-2/30 transition-colors">
                        <td className="py-2.5 px-4 font-semibold text-text">{dm.name}</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-surface-2 text-text font-medium text-[11px]">
                            {dm.areaLabel}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          {dm.sites && dm.sites.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {dm.sites.map((st) => (
                                <span
                                  key={st.id}
                                  className="px-2 py-0.5 rounded-full text-[10px] bg-surface-2 text-text-2 border border-border"
                                >
                                  {st.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-text-mute text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenEditDm(dm)}
                            title="แก้ไข"
                            className="p-1 rounded text-text-mute hover:text-text hover:bg-surface-2 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Site Add/Edit Modal */}
      {isSiteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-surface rounded-card border border-border p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-text">
              {editingSite ? 'แก้ไขสาขา / คลัง' : '+ เพิ่มสาขา / คลังใหม่'}
            </h3>

            {siteModalError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-input flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{siteModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSite} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-2 mb-1">
                    รหัสสาขา/คลัง *
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น BNA, DC_BKK"
                    value={siteCode}
                    onChange={(e) => setSiteCode(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-2 mb-1">
                    ประเภท *
                  </label>
                  <select
                    value={siteType}
                    onChange={(e) => {
                      const val = e.target.value as 'BRANCH' | 'DC';
                      setSiteType(val);
                      if (val === 'DC') setSiteDmId('');
                    }}
                    className="w-full text-xs px-3 py-1.5 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red"
                  >
                    <option value="BRANCH">สาขา (Store/Branch)</option>
                    <option value="DC">คลัง DC</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-2 mb-1">
                  ชื่อสาขา / คลัง *
                </label>
                <input
                  type="text"
                  placeholder="เช่น สาขาบางนา, คลัง DC กรุงเทพ"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-2 mb-1">
                  ผู้จัดการเขต (District Manager)
                </label>
                <select
                  value={siteDmId}
                  disabled={siteType === 'DC'}
                  onChange={(e) => setSiteDmId(e.target.value)}
                  className={cn(
                    'w-full text-xs px-3 py-1.5 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red',
                    siteType === 'DC' && 'opacity-50 cursor-not-allowed bg-surface-2'
                  )}
                >
                  <option value="">
                    {siteType === 'DC'
                      ? '— DC ไม่ต้องกำหนดผู้จัดการเขต —'
                      : '— เลือกผู้จัดการเขต —'}
                  </option>
                  {managers.map((dm) => (
                    <option key={dm.id} value={dm.id}>
                      {dm.name} ({dm.areaLabel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-2 mb-1">
                  ที่อยู่ / รายละเอียดสถานที่
                </label>
                <textarea
                  rows={2}
                  placeholder="ที่ตั้งสาขา..."
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsSiteModalOpen(false)}
                  className="px-3 py-1.5 rounded-input text-xs font-medium bg-surface-2 hover:bg-border text-text"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSiteSaving}
                  className="px-4 py-1.5 rounded-input text-xs font-semibold bg-red hover:bg-red-dark text-white disabled:opacity-50"
                >
                  {isSiteSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DM Add/Edit Modal */}
      {isDmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-surface rounded-card border border-border p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-text">
              {editingDm ? 'แก้ไขข้อมูลผู้จัดการเขต' : '+ เพิ่มผู้จัดการเขตใหม่'}
            </h3>

            {dmModalError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-input flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{dmModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveDm} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-2 mb-1">
                  ชื่อ-นามสกุล *
                </label>
                <input
                  type="text"
                  placeholder="เช่น คุณวิชัย ชาญสมร"
                  value={dmName}
                  onChange={(e) => setDmName(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-2 mb-1">
                  เขตที่รับผิดชอบ (Area Label) *
                </label>
                <input
                  type="text"
                  placeholder="เช่น เขตกรุงเทพตะวันออก, เขตภาคเหนือ 1"
                  value={dmArea}
                  onChange={(e) => setDmArea(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsDmModalOpen(false)}
                  className="px-3 py-1.5 rounded-input text-xs font-medium bg-surface-2 hover:bg-border text-text"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isDmSaving}
                  className="px-4 py-1.5 rounded-input text-xs font-semibold bg-red hover:bg-red-dark text-white disabled:opacity-50"
                >
                  {isDmSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive / Delete Confirm Modal */}
      {siteToArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-surface rounded-card border border-border p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold text-text">
                ยืนยันการจัดเก็บ / ลบสาขา
              </h3>
            </div>

            <p className="text-xs text-text-2 leading-relaxed">
              คุณต้องการนำสาขา <strong>&quot;{siteToArchive.name} ({siteToArchive.code})&quot;</strong> ออกจากระบบหรือไม่?
            </p>

            {siteToArchive.jobsCount > 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-input text-xs">
                ⚠️ สาขานี้มีประวัติใบงานซ่อมในระบบจำนวน{' '}
                <strong>{siteToArchive.jobsCount} รายการ</strong>{' '}
                ระบบจะทำการจัดเก็บประวัติ (Archive) โดยข้อมูลประวัติงานซ่อมเดิมจะยังคงอยู่ครบถ้วน
              </div>
            ) : (
              <div className="p-3 bg-surface-2 text-text-2 rounded-input text-xs">
                สาขานี้ยังไม่มีประวัติงานซ่อมในระบบ ระบบจะลบข้อมูลออกอย่างถาวร
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setSiteToArchive(null)}
                className="px-3 py-1.5 rounded-input text-xs font-medium bg-surface-2 hover:bg-border text-text"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleArchiveSite}
                disabled={isArchiving}
                className="px-4 py-1.5 rounded-input text-xs font-semibold bg-red hover:bg-red-dark text-white disabled:opacity-50"
              >
                {isArchiving ? 'กำลังดำเนินการ...' : 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
