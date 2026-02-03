import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

export default function Categories() {
    const { t } = useLanguage();
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'frames',
        alert_quantity: 5
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/categories');
            setCategories(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            type: category.type,
            alert_quantity: category.alert_quantity || 5
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm(t.categories.deleteConfirm)) return;
        try {
            await api.delete(`/categories/${id}`);
            fetchCategories();
        } catch (error) {
            if (error.response?.status === 422) {
                alert(t.categories.hasProducts);
            } else {
                alert(t.common.failed);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await api.put(`/categories/${editingCategory.id}`, formData);
            } else {
                await api.post('/categories', formData);
            }
            setShowModal(false);
            setEditingCategory(null);
            setFormData({ name: '', type: 'frames', alert_quantity: 5 });
            fetchCategories();
        } catch (error) {
            console.error(error);
            alert(t.categories.failedSave);
        }
    };

    return (
        <div className="space-y-10 animate-reveal max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">{t.categories.title}</h1>
                    <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">{categories.length} {t.categories.title.toLowerCase()} {t.dashboard.live}</p>
                </div>
                <button
                    onClick={() => { setEditingCategory(null); setFormData({ name: '', type: 'frames', alert_quantity: 5 }); setShowModal(true); }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 uppercase tracking-widest text-xs"
                >
                    + {t.categories.addCategory}
                </button>
            </div>

            <div className="glass-card overflow-hidden">
                <table className="min-w-full divide-y divide-white/5">
                    <thead className="bg-white/5">
                        <tr>
                            <th className="px-10 py-5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{t.categories.name}</th>
                            <th className="px-10 py-5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{t.categories.type}</th>
                            <th className="px-10 py-5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Category Champion</th>
                            <th className="px-10 py-5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{t.products.lowStockAlert}</th>
                            <th className="px-10 py-5 text-right text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{t.common.actions}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {categories.map((category, idx) => (
                            <tr key={category.id} className="group hover:bg-white/[0.02] transition-colors animate-reveal" style={{ animationDelay: `${idx * 0.05}s` }}>
                                <td className="px-10 py-6">
                                    <div className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{category.name}</div>
                                </td>
                                <td className="px-10 py-6">
                                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-gray-400 group-hover:text-gray-200 transition-colors uppercase tracking-widest">
                                        {t.products.types[category.type]}
                                    </span>
                                </td>
                                <td className="px-10 py-6">
                                    {category.top_seller ? (
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-lg shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                                                🏆
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-black text-white uppercase tracking-tight leading-none">
                                                    {category.top_seller.brand} {category.top_seller.model_code}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                                                        {category.top_seller.total_sold || 0} units sold
                                                    </span>
                                                    <div className="w-1 h-1 rounded-full bg-indigo-500/30"></div>
                                                    <span className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter italic">Top Performer</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest italic">No sales yet</span>
                                    )}
                                </td>
                                <td className="px-10 py-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)]"></div>
                                        <span className="text-sm font-black text-gray-300">{category.alert_quantity || 0}</span>
                                    </div>
                                </td>
                                <td className="px-10 py-6 whitespace-nowrap text-right space-x-4">
                                    <button onClick={() => handleEdit(category)} className="text-[10px] font-bold text-indigo-400 hover:text-white transition-colors uppercase tracking-widest">{t.common.edit}</button>
                                    <button onClick={() => handleDelete(category.id)} className="text-[10px] font-bold text-red-400/60 hover:text-red-400 transition-colors uppercase tracking-widest">{t.common.delete}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl flex items-center justify-center p-6 z-50 animate-reveal">
                    <div className="bg-[#0f1218] border border-white/10 p-12 rounded-[3rem] shadow-[0_0_80px_rgba(0,0,0,0.6)] w-full max-w-md relative overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/5 blur-[80px] -mr-24 -mt-24"></div>

                        <h2 className="text-3xl font-black text-white mb-10 tracking-tight leading-none flex-shrink-0 relative z-10">
                            {editingCategory ? t.categories.editCategory : t.categories.newCategory}
                        </h2>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden relative z-10">
                            <div className="flex-1 space-y-8 overflow-y-auto custom-scrollbar pr-4 -mr-4 pb-4">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-4">{t.categories.type}</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm font-bold text-white focus:border-indigo-500/50 outline-none transition-all cursor-pointer hover:bg-white/10"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="frames" className="bg-[#0a0c10]">{t.products.types.frames}</option>
                                        <option value="sunglasses" className="bg-[#0a0c10]">{t.products.types.sunglasses}</option>
                                        <option value="lenses" className="bg-[#0a0c10]">{t.products.types.lenses}</option>
                                        <option value="others" className="bg-[#0a0c10]">{t.products.types.others}</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-4">{t.categories.name}</label>
                                    <input
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm font-bold text-white focus:border-indigo-500/50 outline-none transition-all placeholder:text-gray-700"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="e.g. Plastic, Metal..."
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-4">{t.products.lowStockAlert}</label>
                                    <input
                                        type="number"
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm font-bold text-white focus:border-indigo-500/50 outline-none transition-all"
                                        value={formData.alert_quantity}
                                        onChange={e => setFormData({ ...formData, alert_quantity: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-6 pt-6 mt-6 border-t border-white/5 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest"
                                >
                                    {t.common.cancel}
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 uppercase tracking-widest"
                                >
                                    {t.common.save}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
