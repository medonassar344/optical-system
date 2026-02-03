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
    const [selectedType, setSelectedType] = useState('all');
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
            fetchProducts();
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
            selectCustomer(data);
            setShowCustomerModal(false);
        } catch (e) {
            console.error(e);
            alert(t.customers.failedSave);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.brand.toLowerCase().includes(search.toLowerCase()) ||
            p.model_code?.toLowerCase().includes(search.toLowerCase()) ||
            p.barcode?.includes(search);

        const matchesType = selectedType === 'all' || p.type === selectedType;

        return matchesSearch && matchesType;
    });

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone?.includes(customerSearch)
    );

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-8 animate-reveal">
            {/* Left: Product Selection */}
            <div className="flex-1 flex flex-col gap-8 min-w-0">
                {/* Refined Search & Filter Arrangement */}
                <div className="glass-card p-4 flex flex-col lg:flex-row items-center gap-4 flex-shrink-0">
                    <div className="relative flex-1 w-full">
                        <input
                            type="text"
                            placeholder={t.sales.searchProducts}
                            className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl text-sm font-bold text-white focus:border-indigo-500/50 outline-none transition-all placeholder:text-gray-700"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <span className="absolute left-5 top-4 opacity-30 text-lg">🔎</span>
                    </div>

                    <div className="flex gap-1.5 bg-white/5 p-1.5 rounded-2xl border border-white/10 w-full lg:w-auto overflow-x-auto no-scrollbar">
                        {['all', 'frames', 'lenses', 'sunglasses', 'others'].map(type => (
                            <button
                                key={type}
                                onClick={() => setSelectedType(type)}
                                className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedType === type ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                            >
                                {t.nav[type] || t.products.types?.[type] || type}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 pb-10 content-start">
                    {filteredProducts.map((product, idx) => (
                        <div key={product.id}
                            className="glass-card p-6 flex flex-col justify-between cursor-pointer border-white/5 hover:border-indigo-500/40 hover:bg-white/[0.04] transition-all group relative overflow-hidden active:scale-[0.98] animate-reveal"
                            onClick={() => addToCart(product)}
                            style={{ animationDelay: `${idx * 0.03}s` }}
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-[40px] -mr-12 -mt-12 group-hover:bg-indigo-500/10 transition-colors"></div>

                            <div className="flex justify-between items-start mb-6">
                                <div className="z-10 min-w-0">
                                    <h3 className="font-extrabold text-white text-lg group-hover:text-indigo-400 transition-colors uppercase tracking-tight leading-none mb-2 truncate">
                                        {product.brand}
                                    </h3>
                                    <p className="text-[10px] text-indigo-500/60 font-black uppercase tracking-[0.2em] mb-1">{product.category?.name}</p>
                                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{product.model_code}</p>
                                </div>
                                {product.image_path ? (
                                    <img
                                        src={`http://localhost:8000${product.image_path}`}
                                        className="w-16 h-16 rounded-2xl object-cover border border-white/10 shadow-2xl group-hover:scale-110 transition-transform duration-500 flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl opacity-20 group-hover:opacity-40 transition-opacity">
                                        👓
                                    </div>
                                )}
                            </div>

                            <div className="z-10 flex justify-between items-end mt-4">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">{t.products.price}</span>
                                    <span className="text-2xl font-black text-white group-hover:text-glow transition-all">${parseFloat(product.price).toFixed(2)}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className={`flex items-center gap-1.5 mb-1`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${product.stock_quantity > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${product.stock_quantity > 0 ? 'text-gray-400' : 'text-red-400'}`}>
                                            {product.stock_quantity}
                                        </span>
                                    </div>
                                    <span className="text-[8px] font-bold text-gray-600 uppercase tracking-tighter">{t.common.stock}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredProducts.length === 0 && (
                        <div className="col-span-full py-20 text-center glass-card border-dashed">
                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] mb-2">{t.dashboard.noData}</p>
                            <p className="text-gray-500 font-bold italic">{t.invoices.noMatches}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Checkout Sidebar */}
            <aside className="w-full lg:w-[450px] flex flex-col gap-6 flex-shrink-0">
                {/* Customer Section */}
                <div className="glass-card p-8 flex flex-col gap-6 relative overflow-hidden flex-shrink-0">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 blur-[60px] -ml-16 -mt-16"></div>
                    <div className="flex justify-between items-center relative z-10">
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.3em]">{t.common.customer}</h2>
                        <button
                            onClick={() => setShowCustomerModal(true)}
                            className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 text-indigo-400 rounded-xl hover:bg-white/10 active:scale-95 transition-all text-xl"
                        >
                            +
                        </button>
                    </div>

                    <div className="relative z-10">
                        <input
                            className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl text-sm font-bold text-white focus:border-indigo-500/50 outline-none transition-all placeholder:text-gray-700"
                            placeholder={t.sales.searchCustomer}
                            value={customerSearch}
                            onChange={(e) => {
                                setCustomerSearch(e.target.value);
                                setShowResults(true);
                                if (e.target.value === '') setSelectedCustomer(null);
                            }}
                            onFocus={() => setShowResults(true)}
                        />
                        <span className="absolute left-5 top-4.5 opacity-20">🔎</span>

                        {showResults && customerSearch && (
                            <div className="absolute top-16 left-0 w-full glass-pane shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 rounded-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar animate-reveal">
                                {filteredCustomers.map(c => (
                                    <div
                                        key={c.id}
                                        className="p-5 hover:bg-white/5 cursor-pointer border-b border-white/5 group transition-colors"
                                        onClick={() => selectCustomer(c)}
                                    >
                                        <div className="font-bold text-white group-hover:text-indigo-400">{c.name}</div>
                                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{c.phone}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedCustomer && (
                        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl animate-reveal relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-xl font-black text-white tracking-tight">{selectedCustomer.name}</p>
                                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">{selectedCustomer.phone}</p>
                                </div>
                                <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                                    <span className="text-[9px] font-black text-indigo-400 uppercase">IPD: {selectedCustomer.medical_info?.ipd || 'N/A'}</span>
                                </div>
                            </div>

                            {selectedCustomer.medical_info && (
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <EyeStat label="OD (Right)" data={selectedCustomer.medical_info.od} color="indigo" />
                                    <EyeStat label="OS (Left)" data={selectedCustomer.medical_info.os} color="purple" />
                                </div>
                            )}

                            {selectedCustomer.invoices?.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{t.customers.orderHistory}</p>
                                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                                        {selectedCustomer.invoices.slice(0, 3).map(inv => (
                                            <button
                                                key={inv.id}
                                                onClick={() => addInvoiceToCart(inv)}
                                                className="flex-shrink-0 bg-white/5 hover:bg-indigo-600 border border-white/5 p-3 rounded-2xl transition-all group/inv"
                                            >
                                                <p className="text-[10px] font-black text-white group-hover/inv:text-white uppercase">#{inv.id}</p>
                                                <p className="text-[11px] font-black text-indigo-400 group-hover/inv:text-white mt-1">${inv.total}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Cart Control */}
                <div className="glass-card flex-1 flex flex-col relative overflow-hidden min-h-0">
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-600/5 blur-[80px] -mr-24 -mb-24"></div>

                    <div className="p-8 border-b border-white/5 flex justify-between items-center flex-shrink-0">
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.3em]">{t.sales.currentSale}</h2>
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                            {cart.length} {t.common.items}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                        {cart.map(item => (
                            <div key={item.product_id} className="flex justify-between items-center group animate-reveal">
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-bold text-white text-sm truncate uppercase tracking-tight">{item.brand} {item.model}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input
                                            type="number"
                                            className="w-16 bg-white/5 border-b border-white/10 py-1 text-xs font-black text-indigo-400 focus:border-indigo-500 outline-none"
                                            value={item.price}
                                            onChange={(e) => updatePrice(item.product_id, e.target.value)}
                                        />
                                        <span className="text-[10px] font-bold text-gray-600 uppercase">x {item.quantity}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 pl-4">
                                    <div className="flex bg-white/5 rounded-xl border border-white/5 p-1">
                                        <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-white transition-colors">-</button>
                                        <span className="w-8 h-7 flex items-center justify-center text-[10px] font-black text-white">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-white transition-colors">+</button>
                                    </div>
                                    <button onClick={() => removeFromCart(item.product_id)} className="text-gray-600 hover:text-red-500 transition-colors text-xl font-light">&times;</button>
                                </div>
                            </div>
                        ))}
                        {cart.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-30">
                                <span className="text-4xl mb-4">🛒</span>
                                <p className="text-xs font-black uppercase tracking-[0.2em]">{t.sales.cartEmpty}</p>
                            </div>
                        )}
                    </div>

                    <div className="p-8 border-t border-white/5 bg-white/[0.01] space-y-6 relative z-10 flex-shrink-0">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{t.common.total}</span>
                                <span className="text-3xl font-black text-white tracking-tighter text-glow">${calculateTotal().toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{t.sales.amountPaid}</span>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className="w-32 bg-white/5 border-b-2 border-indigo-500/30 p-2 text-right text-2xl font-black text-indigo-400 outline-none focus:border-indigo-500 transition-all placeholder:text-gray-800"
                                        placeholder={calculateTotal().toFixed(2)}
                                        value={amountPaid}
                                        onChange={(e) => setAmountPaid(e.target.value)}
                                    />
                                    <span className="absolute -left-4 top-2 text-gray-700 font-black">$</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={loading || cart.length === 0}
                            className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 disabled:grayscale"
                        >
                            {loading ? t.sales.processing : t.sales.completeSale}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Redesigned Customer Modal */}
            {showCustomerModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-3xl flex items-center justify-center p-6 z-[100] animate-reveal">
                    <div className="bg-[#0f1218] border border-white/10 p-12 rounded-[3.5rem] shadow-2xl w-full max-w-2xl max-h-[85vh] relative overflow-hidden flex flex-col">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -mr-32 -mt-32"></div>
                        <h2 className="text-3xl font-black text-white mb-10 tracking-tight leading-none uppercase">{t.customers.newCustomer}</h2>
                        <CustomerForm
                            onSubmit={handleNewCustomer}
                            onCancel={() => setShowCustomerModal(false)}
                            darkTheme={true}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function EyeStat({ label, data, color }) {
    const colors = {
        indigo: 'text-indigo-400 bg-indigo-500/5 border-indigo-500/10',
        purple: 'text-purple-400 bg-purple-500/5 border-purple-500/10'
    };
    return (
        <div className={`p-4 rounded-2xl border ${colors[color]}`}>
            <p className="text-[9px] font-black uppercase tracking-widest mb-3 opacity-60">{label}</p>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                <div className="flex justify-between">
                    <span className="text-[8px] font-bold uppercase opacity-40">SPH</span>
                    <span className="text-xs font-black">{data?.sph || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-[8px] font-bold uppercase opacity-40">CYL</span>
                    <span className="text-xs font-black">{data?.cyl || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-[8px] font-bold uppercase opacity-40">AXIS</span>
                    <span className="text-xs font-black">{data?.axis || '0'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-[8px] font-bold uppercase opacity-40">ADD</span>
                    <span className="text-xs font-black">{data?.add || '0.00'}</span>
                </div>
            </div>
        </div>
    );
}
