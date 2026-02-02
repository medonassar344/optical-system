import { useState, useEffect } from 'react';
import api from '../api/axios';
import CustomerForm from '../components/CustomerForm';
import { useLanguage } from '../context/LanguageContext';

export default function Sales() {
    const { t } = useLanguage();
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [search, setSearch] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [amountPaid, setAmountPaid] = useState('');

    useEffect(() => {
        fetchProducts();
        fetchCustomers();
    }, []);

    const fetchProducts = async () => {
        const { data } = await api.get('/products');
        setProducts(data.data);
    };

    const fetchCustomers = async () => {
        const { data } = await api.get('/customers');
        setCustomers(data.data);
    };

    // Deep fetch selected customer to get invoices
    const selectCustomer = async (customer) => {
        setCustomerSearch(customer.name);
        setShowResults(false);
        const { data } = await api.get(`/customers/${customer.id}`);
        setSelectedCustomer(data);
    };

    const addToCart = (product, quantity = 1) => {
        const existing = cart.find(item => item.product_id === product.id);
        if (existing) {
            setCart(cart.map(item =>
                item.product_id === product.id
                    ? { ...item, quantity: item.quantity + quantity, subtotal: (item.quantity + quantity) * item.price }
                    : item
            ));
        } else {
            setCart([...cart, {
                product_id: product.id,
                brand: product.brand,
                model: product.model_code,
                price: parseFloat(product.price),
                quantity: quantity,
                subtotal: parseFloat(product.price) * quantity
            }]);
        }
    };

    const addInvoiceToCart = (invoice) => {
        invoice.items.forEach(item => {
            if (item.product) {
                addToCart(item.product, item.quantity);
            }
        });
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.product_id !== productId));
    };

    const updateQuantity = (productId, qty) => {
        if (qty < 1) return;
        setCart(cart.map(item =>
            item.product_id === productId
                ? { ...item, quantity: qty, subtotal: qty * item.price }
                : item
        ));
    };

    const updatePrice = (productId, price) => {
        const newPrice = parseFloat(price) || 0;
        setCart(cart.map(item =>
            item.product_id === productId
                ? { ...item, price: newPrice, subtotal: item.quantity * newPrice }
                : item
        ));
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + item.subtotal, 0);
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setLoading(true);
        try {
            await api.post('/invoices', {
                customer_id: selectedCustomer?.id || null,
                items: cart.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.price
                })),
                amount_paid: amountPaid !== '' ? parseFloat(amountPaid) : calculateTotal(),
                payment_method: 'cash'
            });
            alert(t.sales.saleSuccess);
            setCart([]);
            setSelectedCustomer(null);
            setCustomerSearch('');
            setAmountPaid('');
            fetchProducts(); // Refresh stock
        } catch (e) {
            console.error(e);
            alert(t.sales.saleFailed + ': ' + (e.response?.data?.message || t.dashboard.noData));
        } finally {
            setLoading(false);
        }
    };

    const handleNewCustomer = async (formData) => {
        try {
            const { data } = await api.post('/customers', formData);
            setCustomers([...customers, data]);
            selectCustomer(data); // Auto select new customer
            setShowCustomerModal(false);
        } catch (e) {
            console.error(e);
            alert(t.customers.failedSave);
        }
    };

    const filteredProducts = products.filter(p =>
        p.brand.toLowerCase().includes(search.toLowerCase()) ||
        p.model_code?.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode?.includes(search)
    );

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone?.includes(customerSearch)
    );

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6">
            {/* Left: Product List */}
            <div className="flex-1 flex flex-col gap-4">
                <div className="bg-white p-4 rounded shadow">
                    <input
                        type="text"
                        placeholder={t.sales.searchProducts}
                        className="w-full border p-2 rounded"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex-1 overflow-auto grid grid-cols-3 gap-4 pb-4">
                    {filteredProducts.map(product => (
                        <div key={product.id}
                            className="bg-white p-4 rounded shadow flex flex-col justify-between cursor-pointer hover:ring-2 ring-indigo-500 relative"
                            onClick={() => addToCart(product)}
                        >
                            <div className="absolute top-2 right-2">
                                {product.image_path && <img src={`http://localhost:8000${product.image_path}`} className="w-10 h-10 rounded object-cover" />}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{product.brand}</h3>
                                <p className="text-gray-500">{product.model_code}</p>
                                <p className="text-sm text-gray-400 capitalize">{t.products.types[product.type] || product.type}</p>
                            </div>
                            <div className="mt-4 flex justify-between items-end">
                                <span className="font-bold text-indigo-600">${product.price}</span>
                                <span className={`text-xs px-2 py-1 rounded ${product.stock_quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {t.common.stock}: {product.stock_quantity}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Cart & Customer Panel */}
            <div className="w-96 flex flex-col gap-4">
                {/* Customer Selection */}
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="font-bold mb-2">{t.common.customer}</h2>
                    <div className="flex gap-2 relative">
                        <input
                            className="w-full border p-2 rounded"
                            placeholder={t.sales.searchCustomer}
                            value={customerSearch}
                            onChange={(e) => {
                                setCustomerSearch(e.target.value);
                                setShowResults(true);
                                if (e.target.value === '') setSelectedCustomer(null);
                            }}
                            onFocus={() => setShowResults(true)}
                        />
                        <button
                            onClick={() => setShowCustomerModal(true)}
                            className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                            title={t.sales.newCustomerBtn}
                        >
                            +
                        </button>

                        {showResults && customerSearch && (
                            <div className="absolute top-12 left-0 w-full bg-white shadow-xl border rounded z-10 max-h-60 overflow-y-auto">
                                {filteredCustomers.map(c => (
                                    <div
                                        key={c.id}
                                        className="p-2 hover:bg-gray-100 cursor-pointer border-b"
                                        onClick={() => selectCustomer(c)}
                                    >
                                        <div className="font-bold">{c.name}</div>
                                        <div className="text-xs text-gray-500">{c.phone}</div>
                                    </div>
                                ))}
                                {filteredCustomers.length === 0 && (
                                    <div className="p-2 text-gray-500 text-sm">{t.sales.noMatches}</div>
                                )}
                            </div>
                        )}
                    </div>
                    {/* Selected Customer Valid Details */}
                    {selectedCustomer && (
                        <div className="mt-4 text-sm bg-blue-50 p-3 rounded">
                            <div className="flex justify-between">
                                <p><strong>{t.common.phone}:</strong> {selectedCustomer.phone || t.common.na}</p>
                                <p><strong>IPD:</strong> {selectedCustomer.medical_info?.ipd || t.common.na}</p>
                            </div>

                            {/* Prescription Table */}
                            {selectedCustomer.medical_info && (
                                <div className="mt-2 bg-white rounded border overflow-hidden">
                                    <table className="w-full text-center text-xs">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="py-1">{t.customers.eye}</th>
                                                <th>{t.customers.sph}</th>
                                                <th>{t.customers.cyl}</th>
                                                <th>{t.customers.axis}</th>
                                                <th>{t.customers.add}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            <tr>
                                                <td className="font-bold text-blue-600 bg-blue-50">{t.customers.rightEye}</td>
                                                <td>{selectedCustomer.medical_info.od?.sph}</td>
                                                <td>{selectedCustomer.medical_info.od?.cyl}</td>
                                                <td>{selectedCustomer.medical_info.od?.axis}</td>
                                                <td>{selectedCustomer.medical_info.od?.add}</td>
                                            </tr>
                                            <tr>
                                                <td className="font-bold text-green-600 bg-green-50">{t.customers.leftEye}</td>
                                                <td>{selectedCustomer.medical_info.os?.sph}</td>
                                                <td>{selectedCustomer.medical_info.os?.cyl}</td>
                                                <td>{selectedCustomer.medical_info.os?.axis}</td>
                                                <td>{selectedCustomer.medical_info.os?.add}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Order History */}
                            {selectedCustomer.invoices && selectedCustomer.invoices.length > 0 && (
                                <div className="mt-3 border-t pt-2">
                                    <h4 className="font-bold text-gray-600 mb-2">{t.customers.orderHistory}</h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {selectedCustomer.invoices.map(inv => (
                                            <div key={inv.id} className="bg-white p-2 rounded border flex flex-col gap-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-indigo-700">#{inv.id}</span>
                                                    <span className="text-xs text-gray-500">{new Date(inv.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium">${inv.total}</span>
                                                    <button
                                                        onClick={() => addInvoiceToCart(inv)}
                                                        className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
                                                    >
                                                        {t.sales.copyItems}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Cart */}
                <div className="bg-white rounded shadow flex flex-col flex-1 h-96">
                    <div className="p-4 border-b">
                        <h2 className="text-xl font-bold">{t.sales.currentSale}</h2>
                    </div>

                    <div className="flex-1 overflow-auto p-4 space-y-4">
                        {cart.map(item => (
                            <div key={item.product_id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                                <div>
                                    <h4 className="font-medium">{item.brand} {item.model}</h4>
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                        <span>$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-16 border-b border-transparent hover:border-gray-300 focus:border-indigo-500 outline-none bg-transparent"
                                            value={item.price}
                                            onChange={(e) => updatePrice(item.product_id, e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="px-2 bg-gray-200 rounded">-</button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="px-2 bg-gray-200 rounded">+</button>
                                    <button onClick={() => removeFromCart(item.product_id)} className="text-red-500 ml-2">&times;</button>
                                </div>
                            </div>
                        ))}
                        {cart.length === 0 && <div className="text-center text-gray-400 mt-10">{t.sales.cartEmpty}</div>}
                    </div>

                    <div className="p-4 border-t bg-gray-50">
                        <div className="flex justify-between text-lg mb-2">
                            <span className="font-bold text-gray-700">{t.common.total}:</span>
                            <span className="font-bold text-indigo-600">${calculateTotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-bold text-gray-500 uppercase">{t.sales.amountPaid}</span>
                            <div className="flex items-center gap-1">
                                <span className="text-gray-400">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-24 border-b border-gray-300 focus:border-indigo-500 outline-none text-right font-bold text-green-600 bg-transparent"
                                    placeholder={calculateTotal().toFixed(2)}
                                    value={amountPaid}
                                    onChange={(e) => setAmountPaid(e.target.value)}
                                />
                            </div>
                        </div>
                        {amountPaid !== '' && parseFloat(amountPaid) < calculateTotal() && (
                            <div className="flex justify-between text-xs text-red-500 font-bold mb-4 bg-red-50 p-2 rounded">
                                <span>{t.sales.remainingBalance}</span>
                                <span>${(calculateTotal() - parseFloat(amountPaid)).toFixed(2)}</span>
                            </div>
                        )}
                        <button
                            onClick={handleCheckout}
                            disabled={loading || cart.length === 0}
                            className="w-full bg-indigo-600 text-white py-3 rounded font-bold hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? t.sales.processing : t.sales.completeSale}
                        </button>
                    </div>
                </div>
            </div>

            {/* New Customer Modal */}
            {showCustomerModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{t.customers.newCustomer}</h2>
                        <CustomerForm
                            onSubmit={handleNewCustomer}
                            onCancel={() => setShowCustomerModal(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
