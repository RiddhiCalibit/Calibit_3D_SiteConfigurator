import React, { useState, useEffect } from "react";
import { authFetch } from "../utils/api";
import { Lock, Unlock, RefreshCw, AlertCircle, Check } from "lucide-react";
import { motion } from "motion/react";
import { clsx } from "clsx";

interface LockedAccount {
  id: string;
  user_id: string;
  email: string;
  user_role: string;
  locked_at: string;
  can_unlock_by_roles: string;
}

interface Props {
  userRole: "tenant_admin" | "platform_admin";
  tenantId?: string;
}

export function LockedAccountsPanel({ userRole, tenantId }: Props) {
  const [lockedAccounts, setLockedAccounts] = useState<LockedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchLockedAccounts();
  }, []);

  const fetchLockedAccounts = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/lockable-accounts");
      if (res.ok) {
        const data = await res.json();
        setLockedAccounts(data);
      } else {
        setErrorMessage("Failed to fetch locked accounts");
      }
    } catch (err) {
      setErrorMessage("Error fetching locked accounts");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (userId: string, email: string) => {
    setUnlocking(userId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await authFetch(`/api/locked-accounts/${userId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: `Unlocked by ${userRole}`,
        }),
      });

      if (res.ok) {
        setLockedAccounts((prev) =>
          prev.filter((acc) => acc.user_id !== userId),
        );
        setSuccessMessage(`Account ${email} has been unlocked`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Failed to unlock account");
      }
    } catch (err) {
      setErrorMessage("Error unlocking account");
      console.error(err);
    } finally {
      setUnlocking(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-5 h-5 animate-spin opacity-50" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex gap-3 text-sm text-green-400"
        >
          <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </motion.div>
      )}

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 text-sm text-red-400"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </motion.div>
      )}

      {/* Empty State */}
      {lockedAccounts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Lock className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm">No locked accounts to manage</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lockedAccounts.map((account) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex-shrink-0 p-2 bg-red-500/20 rounded-lg">
                  <Lock className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {account.email}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Role:{" "}
                    <span className="capitalize">{account.user_role}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Locked: {new Date(account.locked_at).toLocaleDateString()}{" "}
                    at {new Date(account.locked_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleUnlock(account.user_id, account.email)}
                disabled={unlocking === account.user_id}
                className="flex-shrink-0 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium rounded-lg border border-emerald-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {unlocking === account.user_id ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Unlock className="w-3.5 h-3.5" />
                )}
                Unlock
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={fetchLockedAccounts}
        className="w-full mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-lg border border-white/10 transition-all flex items-center justify-center gap-2"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Refresh
      </button>
    </div>
  );
}
