import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

export default function Products() {
    const { t } = useLanguage();
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        type: 'frames',
        brand: '',
        model_code: '',
        price: '',
        stock_quantity: '',
        alert_quantity: 5,
        barcode: '',
        material: '',
        epd: '',
        customer_notes: '',
        image: null,
        wholesale_price: ''
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const { data } = await api.get('/products');
        setProducts(data.data);
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            type: product.type || 'frames',
            brand: product.brand || '',
            model_code: product.model_code || '',
            price: product.price || '',
            stock_quantity: product.stock_quantity || '',
            alert_quantity: product.alert_quantity || 5,
            barcode: product.barcode || '',
            material: product.material || '',
            epd: product.epd || '',
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
            if (formData[key] !== null) {
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
                brand: '',
                model_code: '',
                price: '',
                stock_quantity: '',
                alert_quantity: 5,
                barcode: '',
                material: '',
                epd: '',
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">{t.products.inventory}</h1>
                <button
                    onClick={() => { setEditingProduct(null); setShowModal(true); }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium"
                >
                    {t.products.addProduct}
                </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.common.image}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.products.brandModel}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.common.details}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.products.sellPrice}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.products.wholesalePrice}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.common.stock}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.common.actions}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {products.map((product) => (
                            <tr key={product.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {product.image_path ? (
                                        <img src={`http://localhost:8000${product.image_path}`} alt="" className="h-12 w-12 object-cover rounded" />
                                    ) : (
                                        <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                                            {t.products.noImg}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{product.brand}</div>
                                    <div className="text-sm text-gray-500">{product.model_code}</div>
                                    <div className="text-xs text-gray-400">{product.barcode}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900 capitalize">{t.products.types[product.type] || product.type}</div>
                                    <div className="text-xs text-gray-500">
                                        {product.material && <span className="mr-2">Mat: {product.material}</span>}
                                        {product.epd && <span>EPD: {product.epd}</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">${product.price}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.wholesale_price || '0.00'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.stock_quantity <= product.alert_quantity ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                        {product.stock_quantity}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    <button onClick={() => handleEdit(product)} className="text-indigo-600 hover:text-indigo-900">{t.common.edit}</button>
                                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">{t.common.delete}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{editingProduct ? t.products.editProduct : t.products.addNewProduct}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t.products.type}</label>
                                    <select
                                        className="w-full border p-2 rounded mt-1"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="frames">{t.products.types.frames}</option>
                                        <option value="sunglasses">{t.products.types.sunglasses}</option>
                                        <option value="lenses">{t.products.types.lenses}</option>
                                        <option value="others">{t.products.types.others}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t.common.name} (Brand)</label>
                                    <input
                                        className="w-full border p-2 rounded mt-1"
                                        value={formData.brand}
                                        onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t.products.modelCode}</label>
                                    <input
                                        className="w-full border p-2 rounded mt-1"
                                        value={formData.model_code}
                                        onChange={e => setFormData({ ...formData, model_code: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t.products.barcode}</label>
                                    <input
                                        className="w-full border p-2 rounded mt-1"
                                        value={formData.barcode}
                                        onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t.products.material}</label>
                                    <select
                                        className="w-full border p-2 rounded mt-1"
                                        value={formData.material}
                                        onChange={e => setFormData({ ...formData, material: e.target.value })}
                                    >
                                        <option value="">{t.products.materials.select}</option>
                                        <option value="plastic">{t.products.materials.plastic}</option>
                                        <option value="metal">{t.products.materials.metal}</option>
                                        <option value="titanium">{t.products.materials.titanium}</option>
                                        <option value="mixed">{t.products.materials.mixed}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t.products.epd}</label>
                                    <input
                                        className="w-full border p-2 rounded mt-1"
                                        value={formData.epd}
                                        onChange={e => setFormData({ ...formData, epd: e.target.value })}
                                        placeholder="e.g. 50mm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t.products.sellPrice}</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full border p-2 rounded mt-1 font-bold text-indigo-700"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t.products.wholesalePrice}</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full border p-2 rounded mt-1"
                                        value={formData.wholesale_price}
                                        onChange={e => setFormData({ ...formData, wholesale_price: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{editingProduct ? t.common.stock : t.products.initialStock}</label>
                                    <input
                                        type="number"
                                        className="w-full border p-2 rounded mt-1"
                                        value={formData.stock_quantity}
                                        onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t.products.lowStockAlert}</label>
                                    <input
                                        type="number"
                                        className="w-full border p-2 rounded mt-1"
                                        value={formData.alert_quantity}
                                        onChange={e => setFormData({ ...formData, alert_quantity: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t.products.notes}</label>
                                <textarea
                                    className="w-full border p-2 rounded mt-1"
                                    rows="2"
                                    value={formData.customer_notes}
                                    onChange={e => setFormData({ ...formData, customer_notes: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t.products.productImg}</label>
                                <input
                                    type="file"
                                    className="w-full border p-2 rounded mt-1"
                                    onChange={e => setFormData({ ...formData, image: e.target.files[0] })}
                                    accept="image/*"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    {t.common.cancel}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-bold"
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
