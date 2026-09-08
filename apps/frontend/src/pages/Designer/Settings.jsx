import { useState, useEffect, useRef } from "react";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/layout/PageHeader";
import PremiumCard from "../../components/designer/premium/PremiumCard";
import { User, Shield, Bell, Lock, Save, Upload, Link as LinkIcon, Sparkles, Mail, Eye, EyeOff, AlertCircle, Phone } from "lucide-react";
import { useDesignerAuth } from "../../context/useDesignerAuth";
import {
  getDesignerProfile,
  updateDesignerProfile,
  getNotificationPrefs,
  updateNotificationPrefs,
  changeDesignerPassword,
} from "../../features/designer/designer-api";

const tabs = [
  { id: "profile", label: "Designer Profile", desc: "Name, bio, portfolio", icon: User },
  { id: "account", label: "Account", desc: "Role & ID", icon: Shield },
  { id: "notifications", label: "Notifications", desc: "Tasks, revisions, payouts", icon: Bell },
  { id: "security", label: "Password & Security", desc: "Credentials", icon: Lock },
];

const specialtyOptions = ["General Graphics", "Hospitality", "Branding", "Print & Signage", "Social Media", "Image-to-Code"];

const emptyProfile = { fullName: "", email: "", businessName: "", phone: "", bio: "", portfolioUrl: "", avatar: "", specialties: [] };

export default function DesignerSettings() {
  const { designer } = useDesignerAuth();
  const [active, setActive] = useState("profile");
  const [profile, setProfile] = useState(emptyProfile);
  const [notif, setNotif] = useState({ tasks: true, submissions: true, revisions: true, payments: true, email: true, digest: "instant" });
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, prefs] = await Promise.all([getDesignerProfile(), getNotificationPrefs()]);
      setProfile({
        fullName: p.fullName || "",
        email: p.email || "",
        businessName: p.businessName || "",
        phone: p.phone || "",
        bio: p.bio || "",
        portfolioUrl: p.portfolioUrl || "",
        avatar: p.avatar || "",
        specialties: p.specialties || [],
      });
      setNotif({
        tasks: prefs.tasks,
        submissions: prefs.submissions,
        revisions: prefs.revisions,
        payments: prefs.payments,
        email: prefs.email,
        digest: prefs.digest,
      });
    } catch (e) {
      setError(e?.response?.data?.message || "Could not load settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
  }, [coverPreview, avatarPreview]);

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(URL.createObjectURL(file));
    e.target.value = "";
    window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: "Cover preview updated for this session.", type: "info" } }));
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(file));
    e.target.value = "";
    window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: "Avatar preview updated — paste an image URL below to save it permanently.", type: "info" } }));
  };

  const handleProfileSave = async () => {
    setSavingProfile(true);
    try {
      const updated = await updateDesignerProfile({
        fullName: profile.fullName.trim(),
        businessName: profile.businessName.trim(),
        phone: profile.phone.trim(),
        bio: profile.bio,
        portfolioUrl: profile.portfolioUrl.trim(),
        avatar: profile.avatar.trim(),
        specialties: profile.specialties,
      });
      setProfile({
        fullName: updated.fullName || "",
        email: updated.email || "",
        businessName: updated.businessName || "",
        phone: updated.phone || "",
        bio: updated.bio || "",
        portfolioUrl: updated.portfolioUrl || "",
        avatar: updated.avatar || "",
        specialties: updated.specialties || [],
      });
      setSaved("Profile");
      setTimeout(() => setSaved(""), 2000);
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: "Profile saved", type: "success" } }));
    } catch (e) {
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: e?.response?.data?.message || "Could not save profile.", type: "error" } }));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePrefsSave = async () => {
    setSavingPrefs(true);
    try {
      const updated = await updateNotificationPrefs({
        tasks: notif.tasks,
        submissions: notif.submissions,
        revisions: notif.revisions,
        payments: notif.payments,
        email: notif.email,
        digest: notif.digest,
      });
      setNotif({
        tasks: updated.tasks,
        submissions: updated.submissions,
        revisions: updated.revisions,
        payments: updated.payments,
        email: updated.email,
        digest: updated.digest,
      });
      setSaved("Notifications");
      setTimeout(() => setSaved(""), 2000);
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: "Notifications saved", type: "success" } }));
    } catch (e) {
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: e?.response?.data?.message || "Could not save preferences.", type: "error" } }));
    } finally {
      setSavingPrefs(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!pwd.current) {
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: "Enter your current password.", type: "error" } }));
      return;
    }
    if (pwd.next.length < 8) {
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: "New password must be at least 8 characters.", type: "error" } }));
      return;
    }
    if (pwd.next !== pwd.confirm) {
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: "Passwords do not match.", type: "error" } }));
      return;
    }
    setChangingPwd(true);
    try {
      await changeDesignerPassword(pwd.current, pwd.next);
      setSaved("Password");
      setTimeout(() => setSaved(""), 2000);
      setPwd({ current: "", next: "", confirm: "" });
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: "Password updated", type: "success" } }));
    } catch (e) {
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: e?.response?.data?.message || "Could not update password.", type: "error" } }));
    } finally {
      setChangingPwd(false);
    }
  };

  const toggleSpecialty = (s) => {
    setProfile((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(s) ? prev.specialties.filter((x) => x !== s) : [...prev.specialties, s],
    }));
  };

  const avatarSrc = avatarPreview || profile.avatar || null;
  const initials = (profile.fullName || "AD").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div className="space-y-6">
        <PremiumCard className="p-5">
          <div className="h-6 w-48 rounded bg-canvas animate-pulse" />
          <div className="h-4 w-96 max-w-full rounded bg-canvas animate-pulse mt-2" />
        </PremiumCard>
        <PremiumCard className="p-6 h-96 animate-pulse bg-canvas/50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PremiumCard className="p-12 text-center space-y-3 border-dashed">
          <span className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-danger">
            <AlertCircle size={20} />
          </span>
          <p className="font-bold text-ink">Could not load settings</p>
          <p className="text-sm text-ink-muted">{error}</p>
          <Button onClick={load} className="rounded-lg text-sm">Try again</Button>
        </PremiumCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        variant="premium"
        eyebrow="Account — Settings"
        title="Settings"
        description="Manage profile, payout connection, notifications and security — all scoped to your designer workspace."
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left nav */}
        <div className="lg:w-[240px] shrink-0">
          <div className="hidden lg:block space-y-1 sticky top-[72px]">
            {tabs.map(({ id, label, desc, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={`w-full text-left flex gap-3 p-3 rounded-xl border transition-all ${active === id ? "bg-ink text-white border-ink shadow-sm" : "bg-white text-ink border-border hover:border-primary-100 hover:bg-primary-50/40"}`}
              >
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${active === id ? "bg-white/10 border-white/10 text-white" : "bg-canvas border-border text-ink-muted"}`}>
                  <Icon size={16} />
                </span>
                <span>
                  <span className="block text-sm font-bold leading-none">{label}</span>
                  <span className={`block text-xs mt-1 ${active === id ? "text-white/60" : "text-ink-muted"}`}>{desc}</span>
                </span>
              </button>
            ))}
            <div className="pt-4 mt-4 border-t border-border">
              <div className="p-3 rounded-xl bg-primary-50 border border-primary-100 flex gap-2.5">
                <Sparkles size={14} className="text-primary shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-primary-700"><span className="font-bold">Tip:</span> Complete profile 80% — add cover image to get prioritized for Hospitality briefs.</p>
              </div>
            </div>
          </div>
          {/* Mobile segmented */}
          <div className="lg:hidden flex gap-1.5 overflow-x-auto dp-scroll pb-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border whitespace-nowrap ${active === id ? "bg-ink text-white border-ink" : "bg-white text-ink-muted border-border"}`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-4">
          {active === "profile" && (
            <PremiumCard className="overflow-hidden">
              {/* Cover + avatar */}
              <div className="h-24 bg-gradient-to-br from-ink via-charcoal to-primary/20 relative bg-cover bg-center" style={coverPreview ? { backgroundImage: `url(${coverPreview})` } : undefined}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,102,0,0.15),transparent_50%)]" />
                <button
                  onClick={() => coverInputRef.current?.click()}
                  className="absolute right-3 bottom-3 h-7 px-3 rounded-full bg-white/90 backdrop-blur border border-white/20 text-xs font-semibold text-ink flex items-center gap-1.5"
                >
                  <Upload size={12} /> Change cover
                </button>
                <input ref={coverInputRef} type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={handleCoverUpload} />
              </div>
              <div className="px-6 pb-6">
                <div className="flex gap-4 -mt-8 relative">
                  <div className="w-16 h-16 rounded-2xl bg-white border-4 border-white shadow-premium flex items-center justify-center text-lg font-extrabold text-ink shrink-0 overflow-hidden">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="mt-8 h-8 px-3 rounded-full bg-ink text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Upload size={12} /> Preview avatar
                  </button>
                  <input ref={avatarInputRef} type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={handleAvatarUpload} />
                  <span className="hidden sm:flex items-center gap-1.5 mt-8 ml-auto text-xs text-ink-muted"><span className="w-2 h-2 rounded-full bg-success" /> {profile.email || "—"}</span>
                </div>

                <div className="grid gap-4 mt-6">
                  <div className="space-y-1.5">
                    <label htmlFor="designer-fullname" className="dp-mono text-ink-muted">Full name</label>
                    <input id="designer-fullname" autoComplete="name" value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="designer-business" className="dp-mono text-ink-muted">Business / studio name</label>
                    <input id="designer-business" value={profile.businessName} onChange={(e) => setProfile({ ...profile, businessName: e.target.value })} placeholder="e.g., Alex Studio" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="designer-email" className="dp-mono text-ink-muted">Email address</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                        <input id="designer-email" value={profile.email} readOnly disabled className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm bg-canvas text-ink-muted cursor-not-allowed" />
                      </div>
                      <p className="text-xs text-ink-muted">Email is managed by the organization and can't be changed here.</p>
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="designer-phone" className="dp-mono text-ink-muted">Phone</label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                        <input id="designer-phone" autoComplete="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="e.g., 08012345678" className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="dp-mono text-ink-muted">Bio</label>
                    <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" />
                    <p className="text-xs text-ink-muted">{(profile.bio || "").length}/160 • Shown on reviewer handoff</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="dp-mono text-ink-muted flex items-center gap-1.5"><LinkIcon size={12} /> Portfolio URL</label>
                    <input value={profile.portfolioUrl} onChange={(e) => setProfile({ ...profile, portfolioUrl: e.target.value })} placeholder="https://" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" />
                    {profile.portfolioUrl && <div className="rounded-xl border border-dashed border-border bg-canvas p-3 text-xs text-ink-muted">Preview: <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">{profile.portfolioUrl}</a></div>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="dp-mono text-ink-muted">Avatar image URL</label>
                    <input value={profile.avatar} onChange={(e) => setProfile({ ...profile, avatar: e.target.value })} placeholder="https://…" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" />
                    <p className="text-xs text-ink-muted">Saved to your profile. The file picker above is preview-only.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="dp-mono text-ink-muted">Specialties</label>
                    <div className="flex flex-wrap gap-2">
                      {specialtyOptions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSpecialty(s)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${profile.specialties.includes(s) ? "bg-ink text-white border-ink" : "bg-white text-ink-muted border-border hover:border-primary-100 hover:bg-primary-50"}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-ink-muted">Helps admins route the right briefs to you.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                  <span className="text-xs text-ink-muted">{saved === "Profile" ? "✓ Saved" : "Unsaved changes"}</span>
                  <Button onClick={handleProfileSave} disabled={savingProfile} className="rounded-lg gap-2 bg-primary hover:bg-primary-700 font-semibold"><Save size={16} /> {savingProfile ? "Saving…" : "Save profile"}</Button>
                </div>
              </div>
            </PremiumCard>
          )}

          {active === "account" && (
            <PremiumCard className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-ink">Account settings</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-canvas border border-border">
                  <p className="dp-mono text-ink-muted">Role</p>
                  <p className="font-bold text-ink capitalize mt-1">{designer?.role || "designer"}</p>
                </div>
                <div className="p-4 rounded-xl bg-canvas border border-border">
                  <p className="dp-mono text-ink-muted">Designer ID</p>
                  <p className="font-mono text-sm font-semibold text-ink mt-1">{designer?.id || "—"}</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-ink-muted bg-amber-50 border border-amber-200 rounded-xl p-3">Account creation and role assignment are managed by the organization. Contact admin for role changes or deactivation. Keep your email verified to receive payout alerts.</p>
            </PremiumCard>
          )}

          {active === "notifications" && (
            <PremiumCard className="p-6 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-ink">Notification preferences</h3>
                <p className="text-sm text-ink-muted mt-1">Control how and when you receive updates. Changes apply instantly.</p>
              </div>
              <div className="space-y-3">
                {[
                  { k: "tasks", label: "New tasks assigned", desc: "When an admin assigns a brief" },
                  { k: "submissions", label: "Submission status updates", desc: "Under review → approved / revision" },
                  { k: "revisions", label: "Revision requests", desc: "Reviewer asks for changes" },
                  { k: "payments", label: "Payment updates", desc: "Pending → processing → paid" },
                  { k: "email", label: "Email notifications", desc: "Mirror inbox alerts to your email" },
                ].map(({ k, label, desc }) => (
                  <label key={k} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-white hover:border-primary-100 transition-colors cursor-pointer">
                    <span>
                      <span className="block text-sm font-semibold text-ink">{label}</span>
                      <span className="block text-xs text-ink-muted">{desc}</span>
                    </span>
                    <input type="checkbox" checked={notif[k]} onChange={(e) => setNotif({ ...notif, [k]: e.target.checked })} className="h-4 w-4 rounded accent-primary" />
                  </label>
                ))}
              </div>
              <div className="space-y-3 pt-2 border-t border-border">
                <p className="dp-mono text-ink-muted">Digest</p>
                <div className="flex gap-2">
                  {[
                    { v: "instant", l: "Instant" },
                    { v: "daily", l: "Daily 9am" },
                    { v: "weekly", l: "Weekly" },
                  ].map((o) => (
                    <button
                      key={o.v}
                      onClick={() => setNotif({ ...notif, digest: o.v })}
                      className={`px-4 py-2 rounded-full text-xs font-bold border ${notif.digest === o.v ? "bg-ink text-white border-ink" : "bg-white text-ink-muted border-border hover:bg-canvas"}`}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end pt-2 border-t border-border">
                <Button onClick={handlePrefsSave} disabled={savingPrefs} className="rounded-lg gap-2 bg-primary hover:bg-primary-700 font-semibold"><Save size={16} /> {savingPrefs ? "Saving…" : "Save preferences"} {saved === "Notifications" && "✓"}</Button>
              </div>
            </PremiumCard>
          )}

          {active === "security" && (
            <PremiumCard className="p-6 space-y-5">
              <h3 className="text-sm font-bold text-ink">Password & security</h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="dp-mono text-ink-muted">Current password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input type={showPwd ? "text" : "password"} placeholder="••••••••" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} className="w-full pl-9 pr-9 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink">{showPwd ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="dp-mono text-ink-muted">New password (min 8 chars)</label>
                  <input type={showPwd ? "text" : "password"} placeholder="New password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" />
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-ink rounded-full transition-all" style={{ width: `${Math.min(100, (pwd.next.length / 12) * 100)}%` }} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="dp-mono text-ink-muted">Confirm new password</label>
                  <input type={showPwd ? "text" : "password"} placeholder="Confirm" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handlePasswordChange} disabled={changingPwd} className="rounded-lg gap-2 bg-ink hover:bg-black font-semibold"><Lock size={16} /> {changingPwd ? "Updating…" : "Update password"} {saved === "Password" && "✓"}</Button>
              </div>
              <p className="text-xs text-ink-muted bg-canvas border border-border rounded-xl p-3">Use a strong unique password. Your designs and payout info are protected by this credential. We'll email you on change.</p>
            </PremiumCard>
          )}
        </div>
      </div>
    </div>
  );
}
