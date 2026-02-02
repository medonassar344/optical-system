import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function CustomerForm({ initialData, onSubmit, onCancel }) {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        medical_info: {
            ipd: '',
            od: { sph: '', cyl: '', axis: '', add: '', pd: '' },
            os: { sph: '', cyl: '', axis: '', add: '', pd: '' }
        }
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                phone: initialData.phone || '',
                address: initialData.address || '',
                medical_info: initialData.medical_info || {
                    ipd: '',
                    od: { sph: '', cyl: '', axis: '', add: '', pd: '' },
                    os: { sph: '', cyl: '', axis: '', add: '', pd: '' }
                }
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMedicalChange = (eye, field, value) => {
        setFormData(prev => ({
            ...prev,
            medical_info: {
                ...prev.medical_info,
                [eye]: {
                    ...prev.medical_info[eye],
                    [field]: value
                }
            }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 border-b pb-2">{t.customers.personalDetails}</h3>
                <div className="grid grid-cols-1 gap-4">
                    <input
                        name="name"
                        placeholder={t.common.name}
                        className="w-full border p-2 rounded"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            name="phone"
                            placeholder={t.common.phone}
                            className="w-full border p-2 rounded"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                        <input
                            name="address"
                            placeholder={t.common.address}
                            className="w-full border p-2 rounded"
                            value={formData.address}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-semibold text-gray-700">{t.customers.medicalInfo}</h3>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-bold text-gray-600">IPD:</label>
                        <input
                            type="text"
                            className="border p-1 rounded text-sm w-20"
                            placeholder="mm"
                            value={formData.medical_info.ipd || ''}
                            onChange={e => setFormData(prev => ({
                                ...prev,
                                medical_info: { ...prev.medical_info, ipd: e.target.value }
                            }))}
                        />
                    </div>
                </div>

                {/* Right Eye */}
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-bold text-blue-800 mb-2">{t.customers.rightEye}</h4>
                    <div className="grid grid-cols-5 gap-2">
                        {['sph', 'cyl', 'axis', 'add', 'pd'].map(field => (
                            <div key={field}>
                                <label className="block text-xs font-bold text-gray-500 uppercase">{t.customers[field] || field}</label>
                                <input
                                    type="text"
                                    className="w-full border p-1 rounded text-sm"
                                    value={formData.medical_info.od[field]}
                                    onChange={e => handleMedicalChange('od', field, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Left Eye */}
                <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-bold text-green-800 mb-2">{t.customers.leftEye}</h4>
                    <div className="grid grid-cols-5 gap-2">
                        {['sph', 'cyl', 'axis', 'add', 'pd'].map(field => (
                            <div key={field}>
                                <label className="block text-xs font-bold text-gray-500 uppercase">{t.customers[field] || field}</label>
                                <input
                                    type="text"
                                    className="w-full border p-1 rounded text-sm"
                                    value={formData.medical_info.os[field]}
                                    onChange={e => handleMedicalChange('os', field, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                    {t.common.cancel}
                </button>
                <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium"
                >
                    {t.customers.saveCustomer}
                </button>
            </div>
        </form>
    );
}
