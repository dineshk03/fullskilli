import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { FaEdit, FaPlus, FaSave, FaTimes, FaTrash } from "react-icons/fa";
import { MdRefresh } from "react-icons/md";
import { toast } from "react-hot-toast";
import { createTeamMember, deleteTeamMember, getAdminTeamMembers, updateTeamMember } from "../../../services/operations/teamMembersAPI";
const emptyForm = {
  name: "",
  title: "",
  description: "",
  image: "",
  order: 0,
  isActive: true
};
const TeamMembersManagement = () => {
  const {
    token
  } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const imageInputRef = useRef(null);
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      const ao = Number(a.order || 0);
      const bo = Number(b.order || 0);
      if (ao !== bo) return ao - bo;
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    });
  }, [members]);
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminTeamMembers(token);
      setMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      // Keep UI stable even if API is unavailable
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [token]);
  useEffect(() => {
    if (token) {
      fetchMembers();
    }
  }, [fetchMembers, token]);
  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setShowForm(true);
  };
  const startEdit = member => {
    setEditingId(member?._id);
    setForm({
      name: member?.name || "",
      title: member?.title || "",
      description: member?.description || "",
      image: member?.image || "",
      order: Number(member?.order || 0),
      isActive: Boolean(member?.isActive)
    });
    setImageFile(null);
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
  };
  const onSubmit = async e => {
    e.preventDefault();
    if (!editingId && !imageFile) {
      toast.error("Please select an image file");
      return;
    }
    const payload = new FormData();
    payload.append("name", form.name);
    payload.append("title", form.title);
    payload.append("description", form.description);
    payload.append("order", String(Number(form.order || 0)));
    payload.append("isActive", String(Boolean(form.isActive)));
    if (imageFile) {
      payload.append("image", imageFile);
    } else if (editingId && form.image) {
      payload.append("image", form.image);
    }
    if (editingId) {
      await updateTeamMember(editingId, payload, token);
      await fetchMembers();
    } else {
      await createTeamMember(payload, token);
      await fetchMembers();
    }
    closeForm();
  };
  const onDelete = async memberId => {
    await deleteTeamMember(memberId, token);
    setMembers(prev => prev.filter(m => m._id !== memberId));
  };
  return <div className="space-y-6 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-richblack-5">Team Members</h2>
          <p className="text-richblack-300 text-sm">
            Add / edit the people shown in the &quot;Meet Our Expert Team&quot; section
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={fetchMembers} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-richblack-700 hover:bg-richblack-600 rounded-lg transition-colors">
            <MdRefresh size={16} className={loading ? "animate-spin" : ""} />
            <span className="text-sm font-medium">Refresh</span>
          </button>

          <button onClick={startCreate} className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-richblack-900 rounded-lg font-medium hover:bg-yellow-100 transition-colors">
            <FaPlus size={14} />
            <span className="text-sm font-medium">Add Member</span>
          </button>
        </div>
      </div>

      {showForm && <div className="bg-richblack-800 border border-richblack-700 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-semibold text-richblack-5">
              {editingId ? "Edit Member" : "Add Member"}
            </h3>
            <button onClick={closeForm} className="text-richblack-300 hover:text-richblack-50 transition-colors" aria-label="Close">
              <FaTimes />
            </button>
          </div>

          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm text-richblack-300">Name</span>
              <input value={form.name} onChange={e => setForm(p => ({
            ...p,
            name: e.target.value
          }))} className="w-full px-3 py-2 bg-richblack-700 border border-richblack-600 rounded-lg text-richblack-5 focus:outline-none focus:border-yellow-50" required />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-richblack-300">Title</span>
              <input value={form.title} onChange={e => setForm(p => ({
            ...p,
            title: e.target.value
          }))} className="w-full px-3 py-2 bg-richblack-700 border border-richblack-600 rounded-lg text-richblack-5 focus:outline-none focus:border-yellow-50" required />
            </label>

            <label className="flex flex-col gap-2 md:col-span-2">
              <span className="text-sm text-richblack-300">Description</span>
              <textarea rows={3} value={form.description} onChange={e => setForm(p => ({
            ...p,
            description: e.target.value
          }))} className="w-full px-3 py-2 bg-richblack-700 border border-richblack-600 rounded-lg text-richblack-5 focus:outline-none focus:border-yellow-50" required />
            </label>

            <div className="flex flex-col gap-2 md:col-span-2">
              <span className="text-sm text-richblack-300">Image</span>
              <input ref={imageInputRef} type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="hidden" />
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <button type="button" onClick={() => imageInputRef.current?.click()} className="inline-flex items-center justify-center px-4 py-2 bg-richblack-700 hover:bg-richblack-600 border border-richblack-600 rounded-lg transition-colors text-sm font-medium text-richblack-5">
                  Choose image
                </button>
                <span className="text-sm text-richblack-300 truncate">
                  {imageFile?.name || (form.image ? "Current image selected" : "No file chosen")}
                </span>
              </div>
              {(imageFile || form.image) && <div className="pt-2">
                  <img src={imageFile ? URL.createObjectURL(imageFile) : form.image} alt="preview" className="w-16 h-16 rounded-full object-cover border border-richblack-600" />
                </div>}
              <p className="text-xs text-richblack-400">
                {editingId ? "Choose a new image only if you want to replace it." : "Please select an image to upload to S3."}
              </p>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-richblack-300">Order</span>
              <input type="number" value={form.order} onChange={e => setForm(p => ({
            ...p,
            order: e.target.value
          }))} className="w-full px-3 py-2 bg-richblack-700 border border-richblack-600 rounded-lg text-richblack-5 focus:outline-none focus:border-yellow-50" />
            </label>

            <label className="flex items-center gap-3 mt-7">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({
            ...p,
            isActive: e.target.checked
          }))} className="h-4 w-4" />
              <span className="text-sm text-richblack-200">Active (visible on website)</span>
            </label>

            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <button type="button" onClick={closeForm} className="flex items-center gap-2 px-4 py-2 bg-richblack-700 hover:bg-richblack-600 rounded-lg transition-colors">
                <FaTimes size={14} /> Cancel
              </button>
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-caribbeangreen-400 hover:bg-caribbeangreen-500 text-richblack-900 rounded-lg font-medium transition-colors">
                <FaSave size={14} /> Save
              </button>
            </div>
          </form>
        </div>}

      <div className="bg-richblack-800 border border-richblack-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-richblack-700">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-richblack-300">Order</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-richblack-300">Member</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-richblack-300">Title</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-richblack-300">Active</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-richblack-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr>
                  <td colSpan={5} className="text-center py-10 text-richblack-300">
                    Loading...
                  </td>
                </tr> : sortedMembers.length === 0 ? <tr>
                  <td colSpan={5} className="text-center py-10 text-richblack-400">
                    No team members yet. Click &quot;Add Member&quot;.
                  </td>
                </tr> : sortedMembers.map(m => <tr key={m._id} className="border-t border-richblack-700 hover:bg-richblack-700/40">
                    <td className="py-3 px-4 text-sm text-richblack-200">{m.order ?? 0}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img src={m.image} alt={m.name} className="w-10 h-10 rounded-full object-cover border border-richblack-600" loading="lazy" />
                        <div>
                          <p className="text-sm font-semibold text-richblack-5">{m.name}</p>
                          <p className="text-xs text-richblack-300 line-clamp-1 max-w-[420px]">
                            {m.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-richblack-200">{m.title}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${m.isActive ? "bg-caribbeangreen-400/10 text-caribbeangreen-300" : "bg-pink-400/10 text-pink-300"}`}>
                        {m.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => startEdit(m)} className="p-2 bg-blue-400/10 hover:bg-blue-400/20 text-blue-400 rounded-lg transition-colors" title="Edit">
                          <FaEdit size={14} />
                        </button>
                        <button onClick={() => onDelete(m._id)} className="p-2 bg-pink-400/10 hover:bg-pink-400/20 text-pink-400 rounded-lg transition-colors" title="Delete">
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>;
};
export default TeamMembersManagement;
