import { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import CustomerForm from '../components/CustomerForm';
import { useLanguage } from '../context/LanguageContext';

export default function Customers() {
    const { t } = useLanguage();
    const [customers, setCustomers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [viewingHistory, setViewingHistory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        const { data } = await api.get('/customers');
        setCustomers(data.data);
    };

    const filteredCustomers = useMemo(() => {
        return customers.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.phone.includes(searchQuery)
        );
    }, [customers, searchQuery]);

    const handleSave = async (formData) => {
        try {
            if (editingCustomer) {
                await api.put(`/customers/${editingCustomer.id}`, formData);
            } else {
                await api.post('/customers', formData);
            }
            setShowModal(false);
            setEditingCustomer(null);
            fetchCustomers();
        } catch (e) {
            console.error(e);
            alert(t.customers.failedSave);
        }
    };

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm(t.common.areYouSure)) return;
        await api.delete(`/customers/${id}`);
        fetchCustomers();
    };

    const handleViewHistory = async (customer) => {
        try {
            const { data } = await api.get(`/customers/${customer.id}`);
            setViewingHistory(data);
        } catch (e) {
            console.error(e);
            alert(t.customers.failedHistory);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800">{t.customers.customers}</h1>
                <div className="flex w-full sm:w-auto gap-4">
                    <div className="relative flex-1 sm:min-w-[300px]">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder={t.customers.searchPlaceholder}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => { setEditingCustomer(null); setShowModal(true); }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium whitespace-nowrap"
                    >
                        {t.customers.addCustomer}
                    </button>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.common.name}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.common.phone}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.common.actions}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button
                                            onClick={() => handleViewHistory(customer)}
                                            className="text-green-600 hover:text-green-900"
                                        >
                                            {t.customers.profile}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(customer)}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            {t.common.edit}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(customer.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            {t.common.delete}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="px-6 py-10 text-center text-gray-500 italic">
                                    {t.dashboard.table.noDebts}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit/Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">
                            {editingCustomer ? t.customers.editCustomer : t.customers.newCustomer}
                        </h2>
                        <CustomerForm
                            initialData={editingCustomer}
                            onSubmit={handleSave}
                            onCancel={() => setShowModal(false)}
                        />
                    </div>
                </div>
            )}

            {/* History Modal */}
            {viewingHistory && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">{viewingHistory.name}</h2>
                                <p className="text-gray-500">{t.common.profile}</p>
                            </div>
                            <button
                                onClick={() => setViewingHistory(null)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Prescription Section */}
                        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-gray-700">{t.customers.visionPrescription}</h3>
                                <span className="text-sm font-medium text-gray-600 bg-white px-3 py-1 rounded shadow-sm">
                                    IPD: {viewingHistory.medical_info?.ipd || t.common.na}
                                </span>
                            </div>
                            <table className="w-full text-center text-sm bg-white rounded-lg overflow-hidden shadow-sm">
                                <thead className="bg-gray-100 text-gray-600">
                                    <tr>
                                        <th className="py-2">{t.customers.eye}</th>
                                        <th>{t.customers.sph}</th>
                                        <th>{t.customers.cyl}</th>
                                        <th>{t.customers.axis}</th>
                                        <th>{t.customers.add}</th>
                                        <th>{t.customers.pd}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    <tr>
                                        <td className="font-bold text-blue-600 bg-blue-50 py-2">{t.customers.rightEye}</td>
                                        <td>{viewingHistory.medical_info?.od?.sph}</td>
                                        <td>{viewingHistory.medical_info?.od?.cyl}</td>
                                        <td>{viewingHistory.medical_info?.od?.axis}</td>
                                        <td>{viewingHistory.medical_info?.od?.add}</td>
                                        <td>{viewingHistory.medical_info?.od?.pd}</td>
                                    </tr>
                                    <tr>
                                        <td className="font-bold text-green-600 bg-green-50 py-2">{t.customers.leftEye}</td>
                                        <td>{viewingHistory.medical_info?.os?.sph}</td>
                                        <td>{viewingHistory.medical_info?.os?.cyl}</td>
                                        <td>{viewingHistory.medical_info?.os?.axis}</td>
                                        <td>{viewingHistory.medical_info?.os?.add}</td>
                                        <td>{viewingHistory.medical_info?.os?.pd}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <h3 className="font-bold text-xl text-gray-800 mb-4 border-b pb-2">{t.customers.orderHistory}</h3>

                        {viewingHistory.invoices && viewingHistory.invoices.length > 0 ? (
                            <div className="space-y-6">
                                {viewingHistory.invoices.map(invoice => (
                                    <div key={invoice.id} className="border rounded-lg overflow-hidden">
                                        <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b">
                                            <div>
                                                <span className="font-bold text-indigo-600">{t.common.orderNo}{invoice.id}</span>
                                                <span className="text-sm text-gray-500 ml-3">
                                                    {new Date(invoice.created_at).toLocaleDateString()} {new Date(invoice.created_at).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <div className="font-bold text-gray-800">${invoice.total}</div>
                                        </div>
                                        <div className="p-4 bg-white">
                                            <table className="min-w-full text-sm">
                                                <thead className="text-gray-500 border-b">
                                                    <tr>
                                                        <th className="text-left pb-2">{t.common.name}</th>
                                                        <th className="text-center pb-2">{t.common.qty}</th>
                                                        <th className="text-right pb-2">{t.common.price}</th>
                                                        <th className="text-right pb-2">{t.common.subtotal}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {invoice.items.map(item => (
                                                        <tr key={item.id}>
                                                            <td className="py-2">
                                                                <div className="font-medium text-gray-900">
                                                                    {item.product?.brand || 'Unknown'} {item.product?.model_code}
                                                                </div>
                                                                <div className="text-xs text-gray-500 capitalize">{item.product?.type}</div>
                                                            </td>
                                                            <td className="py-2 text-center">{item.quantity}</td>
                                                            <td className="py-2 text-right">${item.price}</td>
                                                            <td className="py-2 text-right">${item.subtotal}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                {t.customers.noOrders}
                            </div>
                        )}

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setViewingHistory(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-medium"
                            >
                                {t.common.close}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
