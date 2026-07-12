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
  const [customFields, setCustomFields] = useState(['Warranty Period']);
  const [newFieldName, setNewFieldName] = useState('');

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

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    setCustomFields([...customFields, newFieldName.trim()]);
    setNewFieldName('');
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
      <div className="border-b border-[#E1E1DC] pb-5">
        <h1 className="text-3xl font-extrabold text-[#14171C]">Organization Master</h1>
        <p className="text-sm text-[#5B6470] mt-1">Configure company hierarchy settings, category tags, and roles mapping</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E1E1DC] bg-[#F5F6F4] p-1 rounded-md max-w-md">
        <button
          onClick={() => setActiveTab('departments')}
          className={`flex-1 text-center py-2 font-bold text-xs uppercase tracking-wider rounded transition-all cursor-pointer ${
            activeTab === 'departments' ? 'bg-[#12151B] text-white shadow-sm' : 'text-[#5B6470] hover:text-[#14171C]'
          }`}
        >
          Departments
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 text-center py-2 font-bold text-xs uppercase tracking-wider rounded transition-all cursor-pointer ${
            activeTab === 'categories' ? 'bg-[#12151B] text-white shadow-sm' : 'text-[#5B6470] hover:text-[#14171C]'
          }`}
        >
          Asset Categories
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex-1 text-center py-2 font-bold text-xs uppercase tracking-wider rounded transition-all cursor-pointer ${
            activeTab === 'employees' ? 'bg-[#12151B] text-white shadow-sm' : 'text-[#5B6470] hover:text-[#14171C]'
          }`}
        >
          Employees
        </button>
      </div>

      {/* Tab Content A: Departments */}
      {activeTab === 'departments' && (
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-[#14171C]">Active Department Listing</h3>
            <button
              onClick={() => setShowDeptForm(!showDeptForm)}
              className="glow-btn text-xs py-2 uppercase tracking-wider"
            >
              {showDeptForm ? 'Collapse Form' : '+ Register Department'}
            </button>
          </div>

          {showDeptForm && (
            <form onSubmit={handleCreateDept} className="border border-[#E1E1DC] rounded-md bg-white p-6 shadow-sm space-y-4 max-w-xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Department Name</label>
                  <input
                    type="text"
                    value={deptForm.name}
                    onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                    className="w-full rounded border border-[#E1E1DC] px-3 py-2 text-sm focus:border-[#3D6FE0] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Department Code</label>
                  <input
                    type="text"
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                    className="w-full rounded border border-[#E1E1DC] px-3 py-2 text-sm focus:border-[#3D6FE0] focus:outline-none mono-text"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Cost Center Code</label>
                  <input
                    type="text"
                    value={deptForm.costCenterCode}
                    onChange={(e) => setDeptForm({ ...deptForm, costCenterCode: e.target.value })}
                    className="w-full rounded border border-[#E1E1DC] px-3 py-2 text-sm focus:border-[#3D6FE0] focus:outline-none mono-text"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Parent Department</label>
                  <select
                    value={deptForm.parentId}
                    onChange={(e) => setDeptForm({ ...deptForm, parentId: e.target.value })}
                    className="w-full rounded border border-[#E1E1DC] px-3 py-2.5 text-sm focus:border-[#3D6FE0] focus:outline-none"
                  >
                    <option value="">Top-Level Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Department Head</label>
                <select
                  value={deptForm.headUserId}
                  onChange={(e) => setDeptForm({ ...deptForm, headUserId: e.target.value })}
                  className="w-full rounded border border-[#E1E1DC] px-3 py-2.5 text-sm focus:border-[#3D6FE0] focus:outline-none"
                >
                  <option value="">Select Employee Head...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="glow-btn text-xs py-2 uppercase tracking-wider">
                Confirm Registry
              </button>
            </form>
          )}

          <div className="overflow-hidden border border-[#E1E1DC] rounded-md bg-white">
            <table className="table-industrial">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Department Name</th>
                  <th className="px-4 py-3 text-left">Cost Center</th>
                  <th className="px-4 py-3 text-left">Head Assignee</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d) => (
                  <tr key={d.id} className="hover:bg-[#F5F6F4]/50">
                    <td className="px-4 py-3 font-bold mono-text text-[#14171C]">
                      <span className="asset-tag-chip">{d.code}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#14171C]">{d.name}</td>
                    <td className="px-4 py-3 text-[#5B6470] mono-text">{d.costCenterCode || 'N/A'}</td>
                    <td className="px-4 py-3 text-xs text-[#5B6470]">Head Assignee</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content B: Categories */}
      {activeTab === 'categories' && (
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-[#14171C]">Hardware Category Settings</h3>
            <button
              onClick={() => setShowCatForm(!showCatForm)}
              className="glow-btn text-xs py-2 uppercase tracking-wider"
            >
              {showCatForm ? 'Collapse Form' : '+ Create Category'}
            </button>
          </div>

          {showCatForm && (
            <div className="grid gap-6 md:grid-cols-2">
              <form onSubmit={handleCreateCat} className="border border-[#E1E1DC] rounded-md bg-white p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-sm text-[#14171C] uppercase tracking-wider border-b pb-2 mb-2">Category Attributes</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Category Name</label>
                    <input
                      type="text"
                      value={catForm.name}
                      onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                      className="w-full rounded border border-[#E1E1DC] px-3 py-2 text-sm focus:border-[#3D6FE0] focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Category Code</label>
                    <input
                      type="text"
                      value={catForm.code}
                      onChange={(e) => setCatForm({ ...catForm, code: e.target.value })}
                      className="w-full rounded border border-[#E1E1DC] px-3 py-2 text-sm focus:border-[#3D6FE0] focus:outline-none mono-text"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Depreciation (Years)</label>
                    <input
                      type="number"
                      value={catForm.depreciationYears}
                      onChange={(e) => setCatForm({ ...catForm, depreciationYears: e.target.value })}
                      className="w-full rounded border border-[#E1E1DC] px-3 py-2 text-sm focus:border-[#3D6FE0] focus:outline-none mono-text"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Parent Category</label>
                    <select
                      value={catForm.parentId}
                      onChange={(e) => setCatForm({ ...catForm, parentId: e.target.value })}
                      className="w-full rounded border border-[#E1E1DC] px-3 py-2.5 text-sm focus:border-[#3D6FE0] focus:outline-none"
                    >
                      <option value="">None (Top Level)</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="requiresSerial"
                    checked={catForm.requiresSerial}
                    onChange={(e) => setCatForm({ ...catForm, requiresSerial: e.target.checked })}
                    className="rounded border-[#E1E1DC] text-[#3D6FE0] focus:ring-[#3D6FE0]"
                  />
                  <label htmlFor="requiresSerial" className="text-xs font-semibold text-[#14171C]">
                    Mandate unique serial number entry on allocation
                  </label>
                </div>
                <button type="submit" className="glow-btn text-xs py-2 uppercase tracking-wider">
                  Save Category Tag
                </button>
              </form>

              {/* Custom-field builder */}
              <div className="border border-[#E1E1DC] rounded-md bg-white p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-sm text-[#14171C] uppercase tracking-wider border-b pb-2 mb-2">Category Custom Fields Builder</h4>
                <p className="text-xs text-[#5B6470]">Define optional specifications (e.g., Warranty, RAM configuration) to collect for this asset category.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Field name (e.g. Screen Size)"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    className="flex-1 rounded border border-[#E1E1DC] px-3 py-2 text-sm focus:border-[#3D6FE0] focus:outline-none"
                  />
                  <button type="button" onClick={handleAddField} className="glow-btn-secondary text-xs font-bold uppercase tracking-wider">
                    Add Field
                  </button>
                </div>
                <div className="space-y-1.5 pt-2">
                  <p className="text-[10px] font-bold text-[#5B6470] uppercase">Configured Fields List</p>
                  {customFields.map((f, i) => (
                    <div key={i} className="flex justify-between items-center text-xs border border-[#E1E1DC] rounded p-2 bg-[#F5F6F4]/50">
                      <span className="font-semibold text-[#14171C]">{f}</span>
                      <span className="text-[9px] font-bold text-[#3D6FE0] uppercase bg-[#3D6FE0]/10 px-1 rounded">Text Box</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => (
              <div key={c.id} className="industrial-card p-5 relative overflow-hidden border-[#E1E1DC] bg-white">
                <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 w-8 h-8 rounded-full bg-[#E3A72E]/10"></div>
                <span className="asset-tag-chip mb-2">{c.code}</span>
                <h4 className="font-bold text-[#14171C] text-sm mt-1">{c.name}</h4>
                <div className="text-[10px] text-[#5B6470] font-bold uppercase tracking-wider mt-3 space-y-1 border-t pt-3 border-dashed">
                  <p>🗓️ Depreciation: {c.depreciationYears || 3} Years</p>
                  <p>⚙️ Serial Required: {c.requiresSerial ? 'Yes' : 'No'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content C: Employees */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-[#14171C]">System Employee Directory</h3>
            <p className="text-xs text-[#5B6470]">Assign organizational departments and promote system access roles</p>
          </div>

          <div className="overflow-hidden border border-[#E1E1DC] rounded-md bg-white">
            <table className="table-industrial">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email Address</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-left">Access Role</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F5F6F4]/50">
                    <td className="px-4 py-3 font-semibold text-[#14171C] mono-text">{u.employeeCode}</td>
                    <td className="px-4 py-3 font-semibold text-[#14171C]">{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-3 text-[#5B6470] mono-text">{u.email}</td>
                    <td className="px-4 py-3 text-[#5B6470]">{u.department?.name || 'Unassigned'}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-[#12151B] px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider mono-text">
                        {u.roles?.map((r) => r.displayName).join(', ') || 'Employee'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {editingUserId === u.id ? (
                        <form onSubmit={(e) => handleUpdateUser(e, u.id)} className="flex items-center gap-2">
                          <select
                            value={userForm.roleName}
                            onChange={(e) => setUserForm({ ...userForm, roleName: e.target.value })}
                            className="rounded border p-1 text-xs text-[#14171C] font-semibold bg-[#F5F6F4]"
                            required
                          >
                            <option value="">Select Role</option>
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
                            className="rounded border p-1 text-xs text-[#14171C] font-semibold bg-[#F5F6F4]"
                          >
                            <option value="">Select Dept</option>
                            {departments.map((d) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                          <button type="submit" className="rounded bg-[#3D6FE0] px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider cursor-pointer">Save</button>
                          <button type="button" onClick={() => setEditingUserId(null)} className="rounded bg-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-800 uppercase tracking-wider cursor-pointer">Close</button>
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
                          className="text-[#3D6FE0] text-xs font-bold hover:underline"
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
