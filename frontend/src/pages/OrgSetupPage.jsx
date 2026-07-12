import { useEffect, useState } from 'react';
import { masterApi } from '../services';

export default function OrgSetupPage() {
  const [activeTab, setActiveTab] = useState('departments');
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);

  // Forms states
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', code: '', costCenterCode: '', parentId: '', headUserId: '', isActive: true });

  const [showCatForm, setShowCatForm] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', code: '', parentId: '', depreciationYears: 3, requiresSerial: true });

  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState({ roleName: '', departmentId: '' });

  const loadData = () => {
    masterApi.departments().then(({ data }) => setDepartments(data.data));
    masterApi.categories().then(({ data }) => setCategories(data.data));
    masterApi.listUsers().then(({ data }) => setUsers(data.data));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      await masterApi.createDepartment({
        ...deptForm,
        parentId: deptForm.parentId ? Number(deptForm.parentId) : null,
        headUserId: deptForm.headUserId ? Number(deptForm.headUserId) : null,
      });
      setShowDeptForm(false);
      setDeptForm({ name: '', code: '', costCenterCode: '', parentId: '', headUserId: '', isActive: true });
      loadData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to create department');
    }
  };

  const handleCreateCat = async (e) => {
    e.preventDefault();
    try {
      await masterApi.createCategory({
        ...catForm,
        parentId: catForm.parentId ? Number(catForm.parentId) : null,
        depreciationYears: Number(catForm.depreciationYears),
      });
      setShowCatForm(false);
      setCatForm({ name: '', code: '', parentId: '', depreciationYears: 3, requiresSerial: true });
      loadData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to create category');
    }
  };

  const handleUpdateUser = async (e, userId) => {
    e.preventDefault();
    try {
      await masterApi.updateUserRole(userId, {
        roleName: userForm.roleName,
        departmentId: userForm.departmentId ? Number(userForm.departmentId) : null,
      });
      setEditingUserId(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update employee profile');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Organization Setup</h1>
        <p className="text-slate-500">Configure master data and manage employee roles</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            activeTab === 'departments' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Departments
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            activeTab === 'categories' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Asset Categories
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            activeTab === 'employees' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Employee Directory
        </button>
      </div>

      {/* Departments Tab */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-950">Departments List</h3>
            <button
              onClick={() => setShowDeptForm(!showDeptForm)}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700"
            >
              {showDeptForm ? 'Cancel' : '+ New Department'}
            </button>
          </div>

          {showDeptForm && (
            <form onSubmit={handleCreateDept} className="rounded-xl border bg-white p-6 shadow-sm space-y-4 max-w-xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Department Name</label>
                  <input
                    type="text"
                    value={deptForm.name}
                    onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Department Code</label>
                  <input
                    type="text"
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Cost Center Code</label>
                  <input
                    type="text"
                    value={deptForm.costCenterCode}
                    onChange={(e) => setDeptForm({ ...deptForm, costCenterCode: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Parent Department</label>
                  <select
                    value={deptForm.parentId}
                    onChange={(e) => setDeptForm({ ...deptForm, parentId: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    <option value="">None (Top Level)</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Department Head</label>
                <select
                  value={deptForm.headUserId}
                  onChange={(e) => setDeptForm({ ...deptForm, headUserId: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="">Select Head User (Optional)</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700">
                Save Department
              </button>
            </form>
          )}

          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <table className="min-w-full divide-y text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Department Name</th>
                  <th className="px-4 py-3 text-left">Cost Center</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {departments.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{d.code}</td>
                    <td className="px-4 py-3 text-slate-700">{d.name}</td>
                    <td className="px-4 py-3 text-slate-500">{d.costCenterCode || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${d.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                        {d.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-950">Asset Categories List</h3>
            <button
              onClick={() => setShowCatForm(!showCatForm)}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700"
            >
              {showCatForm ? 'Cancel' : '+ New Category'}
            </button>
          </div>

          {showCatForm && (
            <form onSubmit={handleCreateCat} className="rounded-xl border bg-white p-6 shadow-sm space-y-4 max-w-xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Category Name</label>
                  <input
                    type="text"
                    value={catForm.name}
                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Category Code</label>
                  <input
                    type="text"
                    value={catForm.code}
                    onChange={(e) => setCatForm({ ...catForm, code: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Depreciation (Years)</label>
                  <input
                    type="number"
                    value={catForm.depreciationYears}
                    onChange={(e) => setCatForm({ ...catForm, depreciationYears: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    min={1}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Parent Category</label>
                  <select
                    value={catForm.parentId}
                    onChange={(e) => setCatForm({ ...catForm, parentId: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    <option value="">None (Top Level)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requiresSerial"
                  checked={catForm.requiresSerial}
                  onChange={(e) => setCatForm({ ...catForm, requiresSerial: e.target.checked })}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="requiresSerial" className="text-sm font-medium text-slate-700">
                  Requires serial number registration
                </label>
              </div>
              <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700">
                Save Category
              </button>
            </form>
          )}

          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <table className="min-w-full divide-y text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Category Name</th>
                  <th className="px-4 py-3 text-left">Depreciation Period</th>
                  <th className="px-4 py-3 text-left">Requires Serial</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{c.code}</td>
                    <td className="px-4 py-3 text-slate-700">{c.name}</td>
                    <td className="px-4 py-3 text-slate-500">{c.depreciationYears ? `${c.depreciationYears} Years` : 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-500">{c.requiresSerial ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employees Directory Tab */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-950">Employee Roster</h3>
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <table className="min-w-full divide-y text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-left">System Role</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{u.employeeCode}</td>
                    <td className="px-4 py-3 text-slate-700">{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3 text-slate-600">{u.department?.name || 'Unassigned'}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 uppercase">
                        {u.roles?.map((r) => r.displayName).join(', ') || 'Employee'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {editingUserId === u.id ? (
                        <form onSubmit={(e) => handleUpdateUser(e, u.id)} className="flex items-center gap-2">
                          <select
                            value={userForm.roleName}
                            onChange={(e) => setUserForm({ ...userForm, roleName: e.target.value })}
                            className="rounded border p-1 text-xs"
                            required
                          >
                            <option value="">Change Role</option>
                            <option value="super_admin">Super Admin</option>
                            <option value="asset_manager">Asset Manager</option>
                            <option value="department_head">Department Head</option>
                            <option value="employee">Employee</option>
                            <option value="auditor">Auditor</option>
                            <option value="maintenance_technician">Maintenance Technician</option>
                          </select>
                          <select
                            value={userForm.departmentId}
                            onChange={(e) => setUserForm({ ...userForm, departmentId: e.target.value })}
                            className="rounded border p-1 text-xs"
                          >
                            <option value="">Select Dept</option>
                            {departments.map((d) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                          <button type="submit" className="rounded bg-brand-600 px-2 py-1 text-xs text-white">Save</button>
                          <button type="button" onClick={() => setEditingUserId(null)} className="rounded bg-slate-200 px-2 py-1 text-xs text-slate-800">Cancel</button>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUserId(u.id);
                            setUserForm({
                              roleName: u.roles?.[0]?.name || 'employee',
                              departmentId: u.departmentId || '',
                            });
                          }}
                          className="text-brand-600 text-xs font-medium hover:underline"
                        >
                          Promote / Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
