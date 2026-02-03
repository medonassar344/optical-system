import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

export default function Products() {
    const { t } = useLanguage();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        type: 'frames',
        category_id: '',
        brand: '',
        model_code: '',
        price: '',
        stock_quantity: '',
        alert_quantity: 5,
        barcode: '',
        material: '',
        customer_notes: '',
        image: null,
        wholesale_price: ''
    });

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    useEffect(() => {
        setFilteredCategories(categories.filter(c => c.type === formData.type));
    }, [formData.type, categories]);

    const fetchProducts = async () => {
        const { data } = await api.get('/products');
        setProducts(data.data);
    };

    const fetchCategories = async () => {
        const { data } = await api.get('/categories');
        setCategories(data);
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            type: product.type || 'frames',
            category_id: product.category_id || '',
            brand: product.brand || '',
            model_code: product.model_code || '',
            price: product.price || '',
            stock_quantity: product.stock_quantity || '',
            alert_quantity: product.alert_quantity || 5,
            barcode: product.barcode || '',
            material: product.material || '',
            customer_notes: product.customer_notes || '',
            image: null,
            wholesale_price: product.wholesale_price || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm(t.common.areYouSure)) return;
        await api.delete(`/products/${id}`);
        fetchProducts();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== '') {
                data.append(key, formData[key]);
            }
        });

        if (editingProduct) {
            data.append('_method', 'PUT');
        }

        try {
            const config = { headers: { 'Content-Type': 'multipart/form-data' } };

            if (editingProduct) {
                await api.post(`/products/${editingProduct.id}`, data, config);
            } else {
                await api.post('/products', data, config);
            }

            setShowModal(false);
            setEditingProduct(null);
            fetchProducts();
            setFormData({
                type: 'frames',
                category_id: '',
                brand: '',
                model_code: '',
                price: '',
                stock_quantity: '',
                alert_quantity: 5,
                barcode: '',
                material: '',
                customer_notes: '',
                image: null,
                wholesale_price: ''
            });
        } catch (e) {
            console.error(e);
            alert(t.products.failedSave);
        }
    };

    return (
        <div className="space-y-10 pb-20 max-w-7xl mx-auto animate-reveal">
            {/* Header Area */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">{t.products.inventory}</h1>
                    <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">
                        {products.length} {t.products.inventory.toLowerCase()} {t.dashboard.live}
                    </p>
                </div>
                <button
                    onClick={() => { setEditingProduct(null); setShowModal(true); }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 uppercase tracking-widest text-xs"
                >
                    + {t.products.addProduct}
                </button>
            </div>

            {/* Inventory Table */}
            <div className="glass-card overflow-hidden">
                <table className="min-w-full border-collapse">
                    <thead className="bg-white/5 border-b border-white/5">
                        <tr>
                            <th className="px-10 py-6 text-left text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{t.common.image}</th>
                            <th className="px-10 py-6 text-left text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{t.products.brandModel}</th>
                            <th className="px-10 py-6 text-left text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{t.common.details}</th>
                            <th className="px-10 py-6 text-left text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{t.products.sellPrice}</th>
                            <th className="px-10 py-6 text-left text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{t.common.stock}</th>
                            <th className="px-10 py-6 text-right text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{t.common.actions}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {products.map((product, idx) => (
                            <tr key={product.id} className="group hover:bg-white/[0.02] transition-all animate-reveal" style={{ animationDelay: `${idx * 0.05}s` }}>
                                <td className="px-10 py-6">
                                    {product.image_path ? (
                                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-2xl group-hover:scale-110 transition-transform duration-500 border border-white/10">
                                            <img src={`http://localhost:8000${product.image_path}`} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-14 h-14 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-[10px] font-bold text-gray-600 uppercase tracking-tighter">
                                            {t.products.noImg}
                                        </div>
                                    )}
                                </td>
                                <td className="px-10 py-6">
                                    <div className="text-sm font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                                        {product.category?.name || product.brand}
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-[10px] text-gray-600 font-bold uppercase">{product.model_code}</span>
                                        <span className="text-[10px] text-indigo-500/50 font-bold">#{product.id}</span>
                                    </div>
                                </td>
                                <td className="px-10 py-6">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            {t.products.types[product.type] || product.type}
                                        </span>
                                        {product.material && (
                                            <span className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter italic">
                                                Mat: {product.material}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-10 py-6">
                                    <div className="text-lg font-black text-white tracking-tighter">
                                        ${parseFloat(product.price).toFixed(2)}
                                    </div>
                                    <div className="text-[9px] text-gray-600 font-bold uppercase">
                                        Cost: ${parseFloat(product.wholesale_price || 0).toFixed(2)}
                                    </div>
                                </td>
                                <td className="px-10 py-6">
                                    {(() => {
                                        const isLow = (product.category_id && product.stock_quantity <= product.category?.alert_quantity) ||
                                            (!product.category_id && product.stock_quantity <= product.alert_quantity);
                                        return (
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${isLow ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,1)] animate-pulse' : 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]'}`}></div>
                                                    <span className={`text-xl font-black ${isLow ? 'text-red-400' : 'text-emerald-400'} tracking-tighter`}>
                                                        {product.stock_quantity}
                                                    </span>
                                                </div>
                                                {isLow && <span className="text-[8px] font-black text-red-500/40 uppercase tracking-[0.2em]">{t.products.lowStockAlert}</span>}
                                            </div>
                                        );
                                    })()}
                                </td>
                                <td className="px-10 py-6 text-right whitespace-nowrap space-x-6">
                                    <button onClick={() => handleEdit(product)} className="text-[10px] font-bold text-indigo-400 hover:text-white transition-colors uppercase tracking-widest">{t.common.edit}</button>
                                    <button onClick={() => handleDelete(product.id)} className="text-[10px] font-bold text-red-400/60 hover:text-red-400 transition-colors uppercase tracking-widest">{t.common.delete}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Redesigned Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-3xl flex items-center justify-center p-6 z-50 animate-reveal">
                    <div className="bg-[#0f1218] border border-white/10 p-12 rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.6)] w-full max-w-3xl relative overflow-hidden max-h-[90vh]">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 blur-[100px] -mr-40 -mt-40"></div>

                        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[85vh]">
                            <h2 className="text-4xl font-black text-white mb-8 tracking-tight leading-none flex-shrink-0">
                                {editingProduct ? t.products.editProduct : t.products.addNewProduct}
                            </h2>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 -mr-4 space-y-10 pb-10">
                                {/* Type & Category */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white/5 p-8 rounded-[2rem] border border-white/5">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-4">{t.products.type}</label>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm font-bold text-white focus:border-indigo-500/50 outline-none transition-all cursor-pointer hover:bg-white/10"
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value, category_id: '' })}
                                        >
                                            <option value="frames" className="bg-[#0a0c10]">{t.products.types.frames}</option>
                                            <option value="sunglasses" className="bg-[#0a0c10]">{t.products.types.sunglasses}</option>
                                            <option value="lenses" className="bg-[#0a0c10]">{t.products.types.lenses}</option>
                                            <option value="others" className="bg-[#0a0c10]">{t.products.types.others}</option>
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-4">{t.products.category}</label>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm font-bold text-white focus:border-indigo-500/50 outline-none transition-all cursor-pointer hover:bg-white/10"
                                            value={formData.category_id}
                                            onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                            required
                                        >
                                            <option value="" className="bg-[#0a0c10]">{t.categories.newCategory}</option>
                                            {filteredCategories.map(cat => (
                                                <option key={cat.id} value={cat.id} className="bg-[#0a0c10]">{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Main Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-4">{t.products.modelCode}</label>
                                        <input
                                            className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm font-bold text-white focus:border-indigo-500/50 outline-none transition-all"
                                            value={formData.model_code}
                                            onChange={e => setFormData({ ...formData, model_code: e.target.value })}
                                            placeholder="A102-BLUE-..."
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-4">{t.products.brand} (Optional)</label>
                                        <input
                                            className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm font-bold text-white focus:border-indigo-500/50 outline-none transition-all"
                                            value={formData.brand}
                                            onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Extras */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-4">{t.products.barcode}</label>
                                        <input
                                            className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm font-bold text-white focus:border-indigo-500/50 outline-none transition-all"
                                            value={formData.barcode}
                                            onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-4">{t.products.material}</label>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm font-bold text-white focus:border-indigo-500/50 outline-none transition-all cursor-pointer hover:bg-white/10"
                                            value={formData.material}
                                            onChange={e => setFormData({ ...formData, material: e.target.value })}
                                        >
                                            <option value="" className="bg-[#0a0c10]">{t.products.materials.select}</option>
                                            <option value="plastic" className="bg-[#0a0c10]">{t.products.materials.plastic}</option>
                                            <option value="metal" className="bg-[#0a0c10]">{t.products.materials.metal}</option>
                                            <option value="titanium" className="bg-[#0a0c10]">{t.products.materials.titanium}</option>
                                            <option value="mixed" className="bg-[#0a0c10]">{t.products.materials.mixed}</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-indigo-500/5 p-8 rounded-[2rem] border border-indigo-500/10">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest pl-4">{t.products.sellPrice}</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full bg-white/5 border-2 border-white/5 p-6 rounded-2xl text-3xl font-black text-white focus:border-indigo-500/30 outline-none transition-all"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-purple-400 uppercase tracking-widest pl-4">{t.products.wholesalePrice}</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full bg-white/5 border-2 border-white/5 p-6 rounded-2xl text-3xl font-black text-gray-400 focus:border-purple-500/30 outline-none transition-all"
                                            value={formData.wholesale_price}
                                            onChange={e => setFormData({ ...formData, wholesale_price: e.target.value })}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {/* Stock & Notes */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="space-y-4 md:col-span-1">
                                        <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest pl-4">
                                            {editingProduct ? t.common.stock : t.products.initialStock}
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl text-3xl font-black text-white focus:border-emerald-500/30 outline-none transition-all"
                                            value={formData.stock_quantity}
                                            onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-4 md:col-span-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-4">{t.products.notes}</label>
                                        <textarea
                                            className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm font-bold text-white focus:border-indigo-500/50 outline-none transition-all h-24"
                                            rows="2"
                                            value={formData.customer_notes}
                                            onChange={e => setFormData({ ...formData, customer_notes: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Image Upload */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-4">{t.products.productImg}</label>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            onChange={e => setFormData({ ...formData, image: e.target.files[0] })}
                                            accept="image/*"
                                        />
                                        <div className="w-full bg-white/5 border-2 border-dashed border-white/10 p-10 rounded-[2rem] flex flex-col items-center justify-center group-hover:bg-white/10 group-hover:border-indigo-500/50 transition-all">
                                            <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">📸</span>
                                            <p className="text-sm font-bold text-gray-400 group-hover:text-indigo-400">
                                                {formData.image ? formData.image.name : "Select product image"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-8 pt-6 mt-6 border-t border-white/5 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-4 text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest"
                                >
                                    {t.common.cancel}
                                </button>
                                <button
                                    type="submit"
                                    className="px-12 py-5 bg-indigo-600 text-white rounded-3xl font-black text-xs hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-600/30 active:scale-95 uppercase tracking-[0.2em]"
                                >
                                    {t.products.saveProduct}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
