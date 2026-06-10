'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Modal } from '@/components/Modal';
import { SuperAdminGuard } from '@/components/SuperAdminGuard';
import { useToast } from '@/contexts/ToastContext';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import type { SubscriptionPlan } from '@/lib/types';

interface PlanForm {
  name: string;
  nameHi: string;
  durationDays: string;
  priceInr: string;
}

const emptyForm: PlanForm = { name: '', nameHi: '', durationDays: '', priceInr: '' };

export default function PlansPage() {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadPlans = async () => {
    const res = await apiRequest<SubscriptionPlan[]>('/admin/plans');
    setPlans(res.data);
  };

  useEffect(() => {
    loadPlans()
      .catch((err) => showToast(err instanceof Error ? err.message : 'Failed to load plans', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (plan: SubscriptionPlan) => {
    setEditing(plan);
    setForm({
      name: plan.name,
      nameHi: plan.nameHi,
      durationDays: String(plan.durationDays),
      priceInr: String(plan.priceInr),
    });
    setModalOpen(true);
  };

  const toggleActive = async (plan: SubscriptionPlan) => {
    try {
      await apiRequest(`/admin/plans/${plan.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !plan.isActive }),
      });
      showToast(`Plan ${plan.isActive ? 'deactivated' : 'activated'}`, 'success');
      await loadPlans();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      nameHi: form.nameHi.trim(),
      durationDays: parseInt(form.durationDays, 10),
      priceInr: parseInt(form.priceInr, 10),
    };
    try {
      if (editing) {
        await apiRequest(`/admin/plans/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        showToast('Plan updated', 'success');
      } else {
        await apiRequest('/admin/plans', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('Plan created', 'success');
      }
      setModalOpen(false);
      await loadPlans();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <SuperAdminGuard>
    <>
      <div className="page-header flex-between">
        <div>
          <h2>Subscription Plans</h2>
          <p>Manage pricing tiers for member subscriptions</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={openCreate}>
          + Add New Plan
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="empty-state">
          <h3>No plans yet</h3>
          <p>Create your first subscription plan</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Hindi Name</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Active</th>
                <th>Subscribers</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id}>
                  <td><strong>{plan.name}</strong></td>
                  <td>{plan.nameHi}</td>
                  <td>{plan.durationDays} days</td>
                  <td>{formatCurrency(plan.priceInr)}</td>
                  <td>
                    <span className={`badge ${plan.isActive ? 'badge--green' : 'badge--gray'}`}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{plan._count?.subscriptions ?? 0}</td>
                  <td>{formatDate(plan.createdAt)}</td>
                  <td>
                    <div className="btn-group">
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => openEdit(plan)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn--secondary btn--sm" onClick={() => toggleActive(plan)}>
                        {plan.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <Modal
          title={editing ? 'Edit Plan' : 'Add New Plan'}
          onClose={() => !saving && setModalOpen(false)}
          footer={
            <>
              <button type="button" className="btn btn--ghost" onClick={() => setModalOpen(false)} disabled={saving}>
                Cancel
              </button>
              <button type="submit" form="plan-form" className="btn btn--primary" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update Plan' : 'Create Plan'}
              </button>
            </>
          }
        >
          <form id="plan-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Name (English)</label>
              <input id="name" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="nameHi">Name (Hindi)</label>
              <input id="nameHi" className="form-input" value={form.nameHi} onChange={(e) => setForm({ ...form, nameHi: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="duration">Duration (days)</label>
              <input id="duration" type="number" className="form-input" min={1} value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="price">Price (₹)</label>
              <input id="price" type="number" className="form-input" min={1} value={form.priceInr} onChange={(e) => setForm({ ...form, priceInr: e.target.value })} required />
            </div>
          </form>
        </Modal>
      )}
    </>
    </SuperAdminGuard>
  );
}
